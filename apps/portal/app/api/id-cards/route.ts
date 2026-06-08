import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { IdCardPdf } from "@/lib/exports/IdCardPdf";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const isSA = user.role === "SYSTEM_ADMIN";
  const isUD = user.role === "MAIN_DIRECTOR";

  if (!isSA && !isUD) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Check if ID card printing is enabled (UD must have SA permission)
  if (isUD) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "idcards.printing_enabled" },
    });
    const enabled = (setting?.value as boolean | null) ?? false;
    if (!enabled) {
      return new NextResponse(
        "ID card printing is not currently enabled by the System Admin.",
        { status: 403 },
      );
    }
  }

  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId") ?? undefined;
  // Selective: comma-separated enrollment IDs
  const enrollmentIdsParam = searchParams.get("enrollmentIds") ?? undefined;
  const enrollmentIds = enrollmentIdsParam
    ? enrollmentIdsParam.split(",").filter(Boolean)
    : undefined;

  if (!programId && !enrollmentIds?.length) {
    return new NextResponse("Provide programId or enrollmentIds.", {
      status: 400,
    });
  }

  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      application: { status: "ACCEPTED" },
      ...(programId ? { programId } : {}),
      ...(enrollmentIds?.length ? { id: { in: enrollmentIds } } : {}),
    },
    include: {
      trainee: {
        select: {
          fullName: true,
          homeMission: { select: { code: true } },
        },
      },
      program: {
        select: {
          code: true,
          title: true,
          endDate: true,
        },
      },
      application: {
        select: {
          referenceNumber: true,
        },
      },
    },
    orderBy: [
      { trainee: { homeMission: { code: "asc" } } },
      { trainee: { fullName: "asc" } },
    ],
  });

  if (enrollments.length === 0) {
    return new NextResponse("No accepted enrollments found.", { status: 404 });
  }

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const cards = enrollments.map((e) => ({
    enrollmentId: e.id,
    referenceNumber:
      e.application?.referenceNumber ?? e.id.slice(-8).toUpperCase(),
    fullName: e.trainee.fullName,
    missionCode: e.trainee.homeMission?.code ?? "—",
    programCode: e.program.code,
    programTitle: e.program.title,
    deploymentLocation: e.deploymentLocation ?? null,
    enrolledAt: new Date(e.enrolledAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    validUntil: new Date(e.program.endDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  }));

  // Log audit
  await prisma.auditLog.create({
    data: {
      action: "ID_CARDS_GENERATED",
      actorId: user.id,
      actorRole: user.role,
      targetType: "ProgramEnrollment",
      details: {
        count: cards.length,
        programId: programId ?? null,
        selective: !!enrollmentIds?.length,
      },
    },
  });

  const buffer = await renderToBuffer(IdCardPdf({ cards, generatedAt }));

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="id-cards-${Date.now()}.pdf"`,
    },
  });
}
