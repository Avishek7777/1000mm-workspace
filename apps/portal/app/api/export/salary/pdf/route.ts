import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { SalaryRequestsPdf } from "@/lib/exports/SalaryRequestsPdf";
import React from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, fullName: true },
  });
  if (!user || !["SYSTEM_ADMIN", "MAIN_DIRECTOR"].includes(user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const missionCode = searchParams.get("mission") ?? undefined;
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const statusParam = searchParams.get("status") ?? undefined;

  const yearNum = yearParam ? parseInt(yearParam, 10) : undefined;
  const monthNum = monthParam ? parseInt(monthParam, 10) : undefined;

  const missions = await prisma.localMission.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true },
  });
  const missionId = missionCode ? missions.find((m) => m.code === missionCode)?.id : undefined;

  const requests = await prisma.salaryRequest.findMany({
    where: {
      ...(missionId ? { missionId } : {}),
      ...(yearNum ? { year: yearNum } : {}),
      ...(monthNum ? { month: monthNum } : {}),
      ...(statusParam ? { status: statusParam as any } : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    include: {
      missionary: { select: { fullName: true } },
      mission: { select: { code: true } },
      reviewedBy: { select: { fullName: true } },
    },
  });

  const rows = requests.map((r) => ({
    fullName: r.missionary.fullName,
    email: "",
    missionCode: r.mission.code,
    period: `${MONTHS[r.month - 1]} ${r.year}`,
    amount: r.amount,
    status: r.status,
    notes: r.notes ?? "",
    reviewedBy: r.reviewedBy?.fullName ?? "",
  }));

  const approvedTotal = requests.filter((r) => r.status === "APPROVED").reduce((s, r) => s + r.amount, 0);

  const filterParts: string[] = [];
  if (missionCode) filterParts.push(`Mission: ${missionCode}`);
  if (yearNum) filterParts.push(`Year: ${yearNum}`);
  if (monthNum) filterParts.push(`Month: ${MONTHS[monthNum - 1]}`);
  if (statusParam) filterParts.push(`Status: ${statusParam}`);
  const filterLabel = filterParts.length > 0 ? filterParts.join(" · ") : "All Records";

  const buffer = await renderToBuffer(
    React.createElement(SalaryRequestsPdf, {
      requests: rows,
      generatedAt: new Date().toLocaleString("en-GB"),
      filterLabel,
      approvedTotal,
      generatedBy: user.fullName,
    }) as any
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="salary-requests-${Date.now()}.pdf"`,
    },
  });
}
