import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { SETTING_KEYS } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["SYSTEM_ADMIN", "MAIN_DIRECTOR"].includes(user.role))
    return new NextResponse("Forbidden", { status: 403 });

  const apiKeySetting = await prisma.systemSetting.findUnique({
    where: { key: SETTING_KEYS.AI_API_KEY },
  });
  const apiKey = typeof apiKeySetting?.value === "string" ? apiKeySetting.value : null;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI API key not configured. Please set it in Settings." },
      { status: 503 },
    );
  }

  const now = new Date();
  const year = now.getFullYear();
  const yearStart = new Date(`${year}-01-01`);
  const yearEnd = new Date(`${year + 1}-01-01`);
  const monthStart = new Date(year, now.getMonth(), 1);
  const monthEnd = new Date(year, now.getMonth() + 1, 1);

  const [
    totalTrainees,
    totalMissions,
    pendingApplications,
    acceptedThisYear,
    rejectedThisYear,
    activePrograms,
    fieldReportsThisYear,
    baptismsThisYear,
    activitiesThisYear,
    openComplaints,
    recentUrgentReports,
    attendanceThisMonth,
    certificatesIssued,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TRAINEE", deletedAt: null } }),
    prisma.localMission.count({ where: { deletedAt: null } }),
    prisma.application.count({
      where: { deletedAt: null, status: { in: ["RECOMMENDED", "UNDER_MAIN_DIRECTOR_REVIEW"] } },
    }),
    prisma.application.count({
      where: { deletedAt: null, status: "ACCEPTED", lastTransitionAt: { gte: yearStart, lt: yearEnd } },
    }),
    prisma.application.count({
      where: { deletedAt: null, status: "REJECTED", lastTransitionAt: { gte: yearStart, lt: yearEnd } },
    }),
    prisma.trainingProgram.findMany({
      where: { deletedAt: null, status: "PUBLISHED" } as any,
      select: { code: true, title: true, startDate: true, endDate: true },
      take: 5,
    }),
    prisma.fieldReport.count({
      where: { reportYear: year },
    }),
    prisma.fieldReport.aggregate({
      where: { reportYear: year },
      _sum: { numberOfBaptisms: true },
    }),
    prisma.fieldReport.aggregate({
      where: { reportYear: year },
      _sum: { totalActivities: true },
    }),
    prisma.complaint.count({
      where: { deletedAt: null, isResolved: false } as any,
    }),
    prisma.urgentReport.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { title: true, severity: true, createdAt: true } as any,
    }),
    prisma.attendanceScan.count({
      where: { scannedAt: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.programEnrollment.count({
      where: { deletedAt: null, certificateIssued: true },
    }),
  ]);

  const metrics = {
    date: now.toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" }),
    totalTrainees,
    totalMissions,
    pendingApplications,
    acceptedThisYear,
    rejectedThisYear,
    activePrograms: activePrograms.map(
      (p) => `${p.code} — ${p.title} (${new Date(p.startDate).toLocaleDateString("en-GB")} to ${new Date(p.endDate).toLocaleDateString("en-GB")})`,
    ),
    fieldReportsThisYear,
    baptismsThisYear: baptismsThisYear._sum.numberOfBaptisms ?? 0,
    activitiesThisYear: activitiesThisYear._sum.totalActivities ?? 0,
    openComplaints,
    recentUrgentReports: recentUrgentReports.map(
      (r: any) => `[${r.severity}] ${r.title} (${new Date(r.createdAt).toLocaleDateString("en-GB")})`,
    ),
    attendanceScansThisMonth: attendanceThisMonth,
    certificatesIssued,
  };

  const prompt = `You are an executive assistant for 1000 Missionaries Movement Bangladesh (1000MMBD), a Seventh-day Adventist missionary training organization.

Today is ${metrics.date}. Here are the current operational metrics:

TRAINEES & MISSIONS
- Total registered trainees: ${metrics.totalTrainees}
- Total local missions: ${metrics.totalMissions}
- Certificates issued (all time): ${metrics.certificatesIssued}

APPLICATIONS (${year})
- Accepted this year: ${metrics.acceptedThisYear}
- Rejected this year: ${metrics.rejectedThisYear}
- Currently pending director decision: ${metrics.pendingApplications}

ACTIVE TRAINING PROGRAMS
${metrics.activePrograms.length > 0 ? metrics.activePrograms.join("\n") : "None currently active"}

FIELD REPORTS (${year} year-to-date)
- Reports submitted: ${metrics.fieldReportsThisYear}
- Total baptisms recorded: ${metrics.baptismsThisYear}
- Total ministry activities: ${metrics.activitiesThisYear}

ATTENDANCE
- Attendance scans this month: ${metrics.attendanceScansThisMonth}

OPEN ISSUES
- Unresolved complaints: ${metrics.openComplaints}
${metrics.recentUrgentReports.length > 0 ? `- Recent urgent reports:\n  ${metrics.recentUrgentReports.join("\n  ")}` : "- No recent urgent reports"}

Write a concise executive summary (4–6 sentences) for the Union Director. Cover: (1) overall operational health, (2) any concerns that need attention, (3) one specific encouraging insight from the numbers. Be direct and factual — no fluff.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    if (response.status === 401)
      return NextResponse.json({ error: "Invalid API key. Please update it in Settings." }, { status: 502 });
    return NextResponse.json({ error: `AI API error (${response.status}): ${err}` }, { status: 502 });
  }

  const json = await response.json();
  const text: string = json?.content?.[0]?.text ?? "";

  return NextResponse.json({ summary: text, generatedAt: now.toISOString(), metrics });
}
