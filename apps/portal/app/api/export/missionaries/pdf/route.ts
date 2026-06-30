import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { MissionaryListPdf } from "@/lib/exports/MissionaryListPdf";
import {
  parseMissionariesExportFilters,
  buildMissionariesExportWhere,
  describeMissionariesFilters,
} from "@/lib/exports/missionariesQuery";

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

  const { searchParams } = new URL(req.url);
  const filters = parseMissionariesExportFilters(searchParams);

  const isLmd = user.role === "LOCAL_DIRECTOR";
  const lmdMission = isLmd
    ? await prisma.localMission.findFirst({ where: { directorId: user.id } })
    : null;
  if (isLmd) filters.mission = undefined;

  const where = buildMissionariesExportWhere(filters, {
    lmdMissionId: isLmd ? (lmdMission?.id ?? null) : null,
  });

  const deployments = await prisma.missionaryDeployment.findMany({
    where,
    orderBy: [
      { mission: { code: "asc" } },
      { status: "asc" },
      { startDate: "asc" },
    ],
    include: {
      missionary: {
        select: {
          fullName: true,
          phone: true,
          homeMission: { select: { code: true } },
        },
      },
      mission: { select: { code: true } },
      requestedBy: { select: { fullName: true } },
      reviewedBy: { select: { fullName: true } },
    },
  });

  const fmt = (d: Date | null | undefined) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const filterLabel = describeMissionariesFilters(filters, {
    lmdMissionCode: isLmd ? (lmdMission?.code ?? null) : null,
  });

  const buffer = await renderToBuffer(
    MissionaryListPdf({
      missionaries: deployments.map((d) => ({
        fullName: d.missionary.fullName,
        gender: "",
        phone: d.missionary.phone ?? "—",
        missionCode: d.mission.code,
        location: d.location ?? "—",
        startDate: fmt(d.startDate),
        endDate: d.endDate ? fmt(d.endDate) : "Open",
        status: d.status,
        requestedBy: d.requestedBy.fullName,
        approvedBy: d.reviewedBy?.fullName ?? "—",
      })),
      generatedAt,
      filterLabel,
      totalCount: deployments.length,
      generatedBy: user.fullName,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="missionaries-${Date.now()}.pdf"`,
    },
  });
}
