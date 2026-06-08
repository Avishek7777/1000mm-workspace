import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { ApplicantListPdf } from "@/lib/exports/ApplicantListPdf";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { homeMission: true },
  });
  if (
    !user ||
    !["LOCAL_DIRECTOR", "MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role)
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (user.role === "MAIN_DIRECTOR") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_EXPORT_APPLICANTS);
    if (!allowed) return new NextResponse("Not permitted.", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  // Scope by mission for LMD
  const isLmd = user.role === "LOCAL_DIRECTOR";
  const lmdMission = isLmd
    ? await prisma.localMission.findFirst({ where: { directorId: user.id } })
    : null;

  const applications = await prisma.application.findMany({
    where: {
      deletedAt: null,
      status: { not: "DRAFT" },
      ...(isLmd && lmdMission ? { submittedFromMissionId: lmdMission.id } : {}),
      ...(programId ? { window: { programId } } : {}),
      ...(status ? { status: status as any } : {}),
    },
    orderBy: [
      { submittedFromMission: { code: "asc" } },
      { referenceNumber: "asc" },
    ],
    include: {
      applicant: { select: { email: true } },
      submittedFromMission: { select: { code: true, name: true } },
      window: {
        include: { program: { select: { code: true, title: true } } },
      },
    },
  });

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const buffer = await renderToBuffer(
    ApplicantListPdf({
      applications: applications.map((a) => ({
        referenceNumber: a.referenceNumber ?? "—",
        fullName: a.applicantFullName,
        gender: a.applicantGender,
        mission: a.submittedFromMission.code,
        program: a.window.program.code,
        status: a.status,
        submittedAt: a.submittedAt
          ? new Date(a.submittedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
        email: a.applicant.email,
        mobileNo: a.applicantMobileNo ?? "—",
        district: a.presentAddressDistrict ?? "—",
      })),
      generatedAt,
      filterLabel: isLmd
        ? `Mission: ${lmdMission?.code ?? ""}`
        : programId || status
          ? `Filtered`
          : "All Missions",
      totalCount: applications.length,
    }),
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="applicants-${Date.now()}.pdf"`,
    },
  });
}
