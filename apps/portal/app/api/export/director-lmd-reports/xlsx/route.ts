import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import * as XLSX from "xlsx";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ALLOWED = ["MAIN_DIRECTOR", "SYSTEM_ADMIN", "SECRETARY", "ASSOCIATE_DIRECTOR"] as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, fullName: true },
  });
  if (!user || !ALLOWED.includes(user.role as typeof ALLOWED[number]))
    return new NextResponse("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const yearParam    = searchParams.get("year")    ?? undefined;
  const missionParam = searchParams.get("mission") ?? undefined;
  const yearNum      = yearParam ? parseInt(yearParam, 10) : undefined;

  const reports = await prisma.lmdReport.findMany({
    where: {
      ...(yearNum      ? { reportYear: yearNum }                : {}),
      ...(missionParam ? { mission: { code: missionParam } }   : {}),
    },
    orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }, { mission: { code: "asc" } }],
    include: {
      lmd:     { select: { fullName: true } },
      mission: { select: { name: true, code: true } },
    },
  });

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Individual Reports ──────────────────────────────────────────
  const rows = reports.map((r, i) => ({
    "#":                       i + 1,
    "Period":                  `${MONTHS[r.reportMonth - 1]} ${r.reportYear}`,
    "Year":                    r.reportYear,
    "Month":                   r.reportMonth,
    "Mission Code":            r.mission.code,
    "Mission Name":            r.mission.name,
    "LMD Name":                r.lmd.fullName,
    "Trainees":                r.totalTrainees,
    "Activities":              r.totalActivities,
    "Days of Work":            r.totalDaysOfWork,
    "Hours of Work":           r.totalHoursOfWork,
    "Home Visits":             r.totalNonSdaHomeVisits,
    "Bible Studies":           r.totalBibleStudies,
    "Medical Visits":          r.totalMedicalVisits,
    "Worship Sessions":        r.totalWorshipSessions,
    "New Groups":              r.totalNewGroups,
    "Baptism Candidates":      r.totalBaptismCandidates,
    "Baptisms":                r.totalBaptisms,
    "People Reached":          r.totalPeopleReached,
    "Overall Summary":         r.overallSummary ?? "",
    "Challenges & Needs":      r.challengesAndNeeds ?? "",
    "Recommendations":         r.recommendationsToDirector ?? "",
    "Prayer Requests":         r.prayerRequests ?? "",
    "Submitted At":            new Date(r.submittedAt).toLocaleDateString("en-GB"),
  }));

  const ws1 = XLSX.utils.json_to_sheet(rows);
  ws1["!cols"] = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length).slice(0, 200)) + 2,
  }));
  ws1["!cols"][19] = { wch: 60 }; // Overall Summary
  ws1["!cols"][20] = { wch: 50 }; // Challenges
  ws1["!cols"][21] = { wch: 50 }; // Recommendations
  ws1["!cols"][22] = { wch: 50 }; // Prayer Requests
  XLSX.utils.book_append_sheet(wb, ws1, "LMD Reports");

  // ── Sheet 2: Mission Totals ───────────────────────────────────────────────
  const missionMap = new Map<string, {
    code: string; name: string; lmd: string; count: number;
    trainees: number; activities: number; days: number; hours: number;
    visits: number; bible: number; medical: number; worship: number;
    groups: number; candidates: number; baptisms: number; reached: number;
  }>();
  for (const r of reports) {
    const key = r.mission.code;
    if (!missionMap.has(key)) {
      missionMap.set(key, { code: key, name: r.mission.name, lmd: r.lmd.fullName, count: 0, trainees: 0, activities: 0, days: 0, hours: 0, visits: 0, bible: 0, medical: 0, worship: 0, groups: 0, candidates: 0, baptisms: 0, reached: 0 });
    }
    const m = missionMap.get(key)!;
    m.count++;
    m.trainees   += r.totalTrainees;
    m.activities += r.totalActivities;
    m.days       += r.totalDaysOfWork;
    m.hours      += r.totalHoursOfWork;
    m.visits     += r.totalNonSdaHomeVisits;
    m.bible      += r.totalBibleStudies;
    m.medical    += r.totalMedicalVisits;
    m.worship    += r.totalWorshipSessions;
    m.groups     += r.totalNewGroups;
    m.candidates += r.totalBaptismCandidates;
    m.baptisms   += r.totalBaptisms;
    m.reached    += r.totalPeopleReached;
  }
  const missionRows = [...missionMap.values()].sort((a, b) => a.code.localeCompare(b.code)).map((m) => ({
    "Mission Code":       m.code,
    "Mission Name":       m.name,
    "LMD":               m.lmd,
    "Reports":           m.count,
    "Trainees":          m.trainees,
    "Activities":        m.activities,
    "Days of Work":      m.days,
    "Hours of Work":     m.hours,
    "Home Visits":       m.visits,
    "Bible Studies":     m.bible,
    "Medical Visits":    m.medical,
    "Worship Sessions":  m.worship,
    "New Groups":        m.groups,
    "Bap. Candidates":   m.candidates,
    "Baptisms":          m.baptisms,
    "People Reached":    m.reached,
  }));
  const ws2 = XLSX.utils.json_to_sheet(missionRows);
  ws2["!cols"] = Object.keys(missionRows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...missionRows.map((r) => String(r[key as keyof typeof r] ?? "").length)) + 2,
  }));
  XLSX.utils.book_append_sheet(wb, ws2, "Mission Totals");

  // ── Sheet 3: Summary ─────────────────────────────────────────────────────
  const totals = reports.reduce((acc, r) => ({
    trainees: acc.trainees + r.totalTrainees,
    activities: acc.activities + r.totalActivities,
    days: acc.days + r.totalDaysOfWork,
    hours: acc.hours + r.totalHoursOfWork,
    visits: acc.visits + r.totalNonSdaHomeVisits,
    bible: acc.bible + r.totalBibleStudies,
    medical: acc.medical + r.totalMedicalVisits,
    worship: acc.worship + r.totalWorshipSessions,
    groups: acc.groups + r.totalNewGroups,
    candidates: acc.candidates + r.totalBaptismCandidates,
    baptisms: acc.baptisms + r.totalBaptisms,
    reached: acc.reached + r.totalPeopleReached,
  }), { trainees: 0, activities: 0, days: 0, hours: 0, visits: 0, bible: 0, medical: 0, worship: 0, groups: 0, candidates: 0, baptisms: 0, reached: 0 });

  const summaryRows = [
    { Summary: "1000 Missionary Movement Bangladesh",  Value: "" },
    { Summary: "Filter",            Value: [missionParam ?? "All missions", yearNum ? String(yearNum) : null].filter(Boolean).join(" · ") },
    { Summary: "",                  Value: "" },
    { Summary: "Total Reports",     Value: reports.length },
    { Summary: "",                  Value: "" },
    { Summary: "Total Trainees",    Value: totals.trainees },
    { Summary: "Total Activities",  Value: totals.activities },
    { Summary: "Total Days",        Value: totals.days },
    { Summary: "Total Hours",       Value: totals.hours },
    { Summary: "Total Home Visits", Value: totals.visits },
    { Summary: "Total Bible Studies",Value: totals.bible },
    { Summary: "Total Medical Visits",Value: totals.medical },
    { Summary: "Total Worship Sessions",Value: totals.worship },
    { Summary: "Total New Groups",  Value: totals.groups },
    { Summary: "Total Bap. Candidates",Value: totals.candidates },
    { Summary: "Total Baptisms",    Value: totals.baptisms },
    { Summary: "Total People Reached",Value: totals.reached },
    { Summary: "",                  Value: "" },
    { Summary: "Generated At",      Value: new Date().toLocaleString("en-GB") },
    { Summary: "Generated By",      Value: user.fullName },
  ];
  const ws3 = XLSX.utils.json_to_sheet(summaryRows);
  ws3["!cols"] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Summary");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="lmd-reports.xlsx"`,
    },
  });
}
