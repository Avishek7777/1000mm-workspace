import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { FieldReportsPdf } from "@/lib/exports/FieldReportsPdf";
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
  if (!user || !["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"].includes(user.role))
    return new NextResponse("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const missionCode = searchParams.get("mission") ?? undefined;
  const yearParam   = searchParams.get("year");
  const monthParam  = searchParams.get("month");

  const yearNum  = yearParam  ? parseInt(yearParam,  10) : undefined;
  const monthNum = monthParam ? parseInt(monthParam, 10) : undefined;

  const reports = await prisma.fieldReport.findMany({
    where: {
      ...(missionCode ? { trainee: { homeMission: { code: missionCode } } } : {}),
      ...(yearNum     ? { reportYear: yearNum }   : {}),
      ...(monthNum    ? { reportMonth: monthNum } : {}),
    },
    orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }, { submittedAt: "desc" }],
    include: {
      trainee: { select: { fullName: true, homeMission: { select: { code: true } } } },
      program: { select: { code: true } },
    },
  });

  const rows = reports.map((r) => ({
    fullName:          r.trainee.fullName,
    missionCode:       r.trainee.homeMission?.code ?? "—",
    programCode:       r.program.code,
    reportMonth:       r.reportMonth,
    reportYear:        r.reportYear,
    totalActivities:   r.totalActivities,
    daysOfWork:        r.daysOfWork,
    hoursOfWork:       r.hoursOfWork,
    nonSdaHomeVisits:  r.nonSdaHomeVisits,
    bibleStudies:      r.bibleStudiesConducted,
    medicalVisits:     r.medicalVisits,
    worshipSessions:   r.worshipSessionsTaken,
    newGroups:         r.newGroupsMade,
    baptismCandidates: r.baptismCandidatesPrepared,
    baptisms:          r.numberOfBaptisms,
    peopleReached:     r.peopleReached ?? 0,
    submittedAt:       new Date(r.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
  }));

  const filterParts: string[] = [];
  if (missionCode) filterParts.push(`Mission: ${missionCode}`);
  if (yearNum)     filterParts.push(`Year: ${yearNum}`);
  if (monthNum)    filterParts.push(`Month: ${MONTHS[monthNum - 1]}`);
  const filterLabel = filterParts.length > 0 ? filterParts.join(" · ") : "All Records";

  const buffer = await renderToBuffer(
    React.createElement(FieldReportsPdf, {
      reports: rows,
      generatedAt: new Date().toLocaleString("en-GB"),
      filterLabel,
      generatedBy: user.fullName,
    }) as any,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="field-reports-${Date.now()}.pdf"`,
    },
  });
}
