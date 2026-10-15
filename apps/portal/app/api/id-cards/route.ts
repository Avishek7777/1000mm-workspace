import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { IdCardPdf } from "@/lib/exports/IdCardPdf";
import QRCode from "qrcode";
import {
  loadEnrollmentPhoto,
  pickApplicationPhotoKey,
  verifyUrlFor,
} from "@/lib/verification";
import fs from "fs";
import path from "path";

function loadLogoDataUrl(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "logos", "1000mm-logo.png");
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const isSA = user.role === "SYSTEM_ADMIN";
  const isUD = user.role === "MAIN_DIRECTOR" || user.role === "SECRETARY" || user.role === "ASSOCIATE_DIRECTOR";

  if (!isSA && !isUD) {
    return new NextResponse("Forbidden", { status: 403 });
  }

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
  const enrollmentIdsParam = searchParams.get("enrollmentIds") ?? undefined;
  const enrollmentIds = enrollmentIdsParam
    ? enrollmentIdsParam.split(",").filter(Boolean)
    : undefined;

  if (!programId && !enrollmentIds?.length) {
    return new NextResponse("Provide programId or enrollmentIds.", { status: 400 });
  }

  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      // On the roster — not "has an accepted application". Trainees placed
      // manually may have no application row linked to their enrollment.
      status: "ENROLLED",
      ...(programId ? { programId } : {}),
      ...(enrollmentIds?.length ? { id: { in: enrollmentIds } } : {}),
    },
    include: {
      trainee: {
        select: {
          id: true,
          fullName: true,
          profilePicture: true,
          homeMission: { select: { code: true } },
        },
      },
      program: {
        select: {
          code: true,
          title: true,
          endDate: true,
          batch: true,
        },
      },
      application: {
        select: {
          referenceNumber: true,
          // The name that was reviewed and accepted. The User account's
          // fullName is NOT interchangeable with it — see below.
          applicantFullName: true,
          profilePhotoDocumentId: true,
          documents: {
            where: { kind: "PROFILE_PHOTO", deletedAt: null },
            orderBy: { createdAt: "asc" },
            select: { id: true, storageKey: true },
          },
        },
      },
    },
    orderBy: [
      { trainee: { homeMission: { code: "asc" } } },
      { trainee: { fullName: "asc" } },
    ],
  });

  if (enrollments.length === 0) {
    return new NextResponse("No enrolled trainees found.", { status: 404 });
  }

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const logoUrl = loadLogoDataUrl();

  const cards = await Promise.all(
    enrollments.map(async (e) => {
      const refNum = e.application?.referenceNumber ?? e.id.slice(-8).toUpperCase();
      // The QR carries an unguessable token rather than the reference number,
      // which is sequential and so enumerable. See lib/verification.ts.
      const qrDataUrl = await QRCode.toDataURL(await verifyUrlFor(e.id), {
        width: 80,
        margin: 1,
        color: { dark: "#0F6E56", light: "#FAFAF8" },
      });
      const photoDataUrl = await loadEnrollmentPhoto(
        pickApplicationPhotoKey(e.application),
        !!e.application,
        e.trainee.profilePicture,
      );

      // The card must carry the identity that was reviewed and accepted, not
      // the portal account's display name. The two are separate fields and do
      // drift: an account may be shared, registered under a relative's name, or
      // simply never corrected, and printing trainee.fullName beside the
      // application's reference number put one person's name on another
      // person's ID.
      const cardName = e.application?.applicantFullName ?? e.trainee.fullName;

      return {
        enrollmentId: e.id,
        referenceNumber: refNum,
        photoDataUrl,
        fullName: cardName,
        missionCode: e.trainee.homeMission?.code ?? "—",
        programCode: e.program.code,
        programTitle: e.program.title,
        batch: e.program.batch ?? null,
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
        qrDataUrl,
      };
    }),
  );

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

  const buffer = await renderToBuffer(IdCardPdf({ cards, generatedAt, logoUrl }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="id-cards-${Date.now()}.pdf"`,
    },
  });
}
