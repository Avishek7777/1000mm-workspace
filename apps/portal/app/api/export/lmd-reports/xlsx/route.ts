import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import * as XLSX from "xlsx";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, fullName: true },
  });
  if (!user || user.role !== "LOCAL_DIRECTOR")
    return new NextResponse("Forbidden", { status: 403 });

  const mission = await prisma.localMission.findFirst({ where: { directorId: user.id } });
  if (!mission) return new NextResponse("No mission assigned", { status: 400 });

  const { searchParams } = new URL(req.url);
  const yearParam  = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const yearNum    = yearParam  ? parseInt(yearParam,  10) : undefined;
  const monthNum   = monthParam ? parseInt(monthParam, 10) : undefined;

  const [fieldReports, missionaries] = await Promise.all([
    prisma.fieldReport.findMany({
      where: {
        trainee: { homeMissionId: mission.id },
        ...(yearNum  ? { reportYear:  yearNum  } : {}),
        ...(monthNum ? { reportMonth: monthNum } : {}),
      },
      orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }, { submittedAt: "desc" }],
      include: {
        trainee:  { select: { fullName: true } },
        program:  { select: { code: true } },
      },
    }),
    prisma.user.findMany({
      where: { homeMissionId: mission.id, isMissionary: true, isActive: true },
      orderBy: { fullName: "asc" },
      include: {
        applications: {
          where: { status: "ACCEPTED" },
          select: { applicantGender: true, presentAddressDistrict: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Individual Field Reports
  const reportRows = fieldReports.map((r, i) => ({
    "#":                    i + 1,
    "Missionary":           r.trainee.fullName,
    "Program":              r.program.code,
    "Month":                MONTHS[r.reportMonth - 1],
    "Year":                 r.reportYear,
    "Total Activities":     r.totalActivities,
    "Days of Work":         r.daysOfWork,
    "Hours of Work":        r.hoursOfWork,
    "Home Visits":          r.nonSdaHomeVisits,
    "Bible Studies":        r.bibleStudiesConducted,
    "Medical Visits":       r.medicalVisits,
    "Worship Sessions":     r.worshipSessionsTaken,
    "New Groups":           r.newGroupsMade,
    "Baptism Candidates":   r.baptismCandidatesPrepared,
    "Baptisms":             r.numberOfBaptisms,
    "People Reached":       r.peopleReached ?? 0,
    "Submitted At":         new Date(r.submittedAt).toLocaleDateString("en-GB"),
  }));

  const ws1 = XLSX.utils.json_to_sheet(
    reportRows.length > 0 ? reportRows : [{ "#": "", "Missionary": "No reports found" }]
  );
  if (reportRows.length > 0) {
    const keys = Object.keys(reportRows[0]);
    ws1["!cols"] = keys.map((k) => ({
      wch: Math.max(k.length, ...reportRows.map((r) => String(r[k as keyof typeof r] ?? "").length)) + 2,
    }));
  }
  XLSX.utils.book_append_sheet(wb, ws1, "Field Reports");

  // Sheet 2: Missionaries
  const missRows = missionaries.map((m, i) => ({
    "#":        i + 1,
    "Name":     m.fullName,
    "Email":    m.email,
    "Phone":    m.phone ?? "—",
    "Gender":   m.applications[0]?.applicantGender === "MALE" ? "Male"
              : m.applications[0]?.applicantGender === "FEMALE" ? "Female" : "—",
    "District": m.applications[0]?.presentAddressDistrict ?? "—",
  }));
  const ws2 = XLSX.utils.json_to_sheet(
    missRows.length > 0 ? missRows : [{ "#": "", "Name": "No missionaries found" }]
  );
  ws2["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 30 }, { wch: 18 }, { wch: 10 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Missionaries");

  // Sheet 3: Summary
  const totalBaptisms   = fieldReports.reduce((s, r) => s + r.numberOfBaptisms,   0);
  const totalActivities = fieldReports.reduce((s, r) => s + r.totalActivities,    0);
  const totalVisits     = fieldReports.reduce((s, r) => s + r.nonSdaHomeVisits,   0);
  const totalReached    = fieldReports.reduce((s, r) => s + (r.peopleReached ?? 0), 0);

  const summaryRows = [
    { Summary: "1000 Missionary Movement Bangladesh", Value: "" },
    { Summary: "Mission",            Value: mission.name },
    { Summary: "Year Filter",        Value: yearNum  ? String(yearNum)         : "All" },
    { Summary: "Month Filter",       Value: monthNum ? MONTHS[monthNum - 1]    : "All" },
    { Summary: "",                   Value: "" },
    { Summary: "Total Reports",      Value: fieldReports.length },
    { Summary: "Total Missionaries", Value: missionaries.length },
    { Summary: "Total Activities",   Value: totalActivities },
    { Summary: "Total Baptisms",     Value: totalBaptisms },
    { Summary: "Total Home Visits",  Value: totalVisits },
    { Summary: "Total People Reached", Value: totalReached },
    { Summary: "",                   Value: "" },
    { Summary: "Generated At",       Value: new Date().toLocaleString("en-GB") },
    { Summary: "Generated By",       Value: user.fullName },
  ];
  const ws3 = XLSX.utils.json_to_sheet(summaryRows);
  ws3["!cols"] = [{ wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Summary");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="lmd-field-reports-${mission.name.replace(/\s+/g, "-")}.xlsx"`,
    },
  });
}
