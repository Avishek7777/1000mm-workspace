import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import * as XLSX from "xlsx";

const ALLOWED_ROLES = ["MAIN_DIRECTOR", "SYSTEM_ADMIN", "LOCAL_DIRECTOR", "TRAINER"] as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, fullName: true, homeMissionId: true },
  });
  if (!user || !ALLOWED_ROLES.includes(user.role as typeof ALLOWED_ROLES[number]))
    return new NextResponse("Forbidden", { status: 403 });

  const isStaff = ["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role);

  const lmdMission = !isStaff
    ? await prisma.localMission.findFirst({ where: { directorId: user.id } })
    : null;

  const { searchParams } = new URL(req.url);
  const programParam = searchParams.get("program") ?? undefined;
  const missionParam = searchParams.get("mission") ?? undefined;
  const genderParam  = searchParams.get("gender")  ?? undefined;
  const qParam       = searchParams.get("q")       ?? undefined;

  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      status: "ENROLLED",
      ...(programParam ? { programId: programParam } : {}),
      ...(genderParam ? { application: { applicantGender: genderParam as "MALE" | "FEMALE" } } : {}),
      trainee: {
        ...(!isStaff ? { homeMissionId: lmdMission?.id ?? user.homeMissionId } : {}),
        ...(isStaff && missionParam ? { homeMission: { code: missionParam } } : {}),
        ...(qParam ? { fullName: { contains: qParam, mode: "insensitive" as const } } : {}),
      },
    },
    include: {
      trainee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          homeMission: { select: { code: true, name: true } },
        },
      },
      program: { select: { code: true, title: true } },
      application: { select: { referenceNumber: true, applicantGender: true, presentAddressDistrict: true } },
      deploymentAssignedBy: { select: { fullName: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Report counts
  const traineeIds = enrollments.map((e) => e.traineeId);
  const reportCounts = await prisma.fieldReport.groupBy({
    by: ["traineeId"],
    where: { traineeId: { in: traineeIds } },
    _count: true,
  });
  const reportCountMap = new Map(reportCounts.map((r) => [r.traineeId, r._count]));

  const fmt = (d: Date) => new Date(d).toLocaleDateString("en-GB");

  const rows = enrollments.map((e, i) => ({
    "#":                i + 1,
    "Name":             e.trainee.fullName,
    "Email":            e.trainee.email ?? "",
    "Reference No":     e.application?.referenceNumber ?? "",
    "Mission":          e.trainee.homeMission?.code ?? "",
    "Mission Name":     e.trainee.homeMission?.name ?? "",
    "Program":          e.program.code,
    "Program Title":    e.program.title,
    "Enrolled Date":    fmt(e.enrolledAt),
    "Gender":           e.application?.applicantGender === "MALE" ? "Male" : e.application?.applicantGender === "FEMALE" ? "Female" : "",
    "District":         e.application?.presentAddressDistrict ?? "",
    "Deployment":       e.deploymentLocation ?? "",
    "Deployment By":    e.deploymentAssignedBy?.fullName ?? "",
    "Field Reports":    reportCountMap.get(e.traineeId) ?? 0,
    "Attendance":       e.attendanceConfirmed ? "Yes" : "No",
    "Certificate":      e.certificateIssued  ? "Yes" : "No",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)) + 2,
  }));
  ws["!cols"] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, "Trainees");

  const filterParts = [
    programParam ?? null,
    missionParam ?? (!isStaff && lmdMission ? lmdMission.name : null),
    genderParam === "MALE" ? "Male" : genderParam === "FEMALE" ? "Female" : null,
    qParam ? `Search: ${qParam}` : null,
  ].filter(Boolean);

  const summaryRows = [
    { Summary: "1000 Missionary Movement Bangladesh", Value: "" },
    { Summary: "Report",        Value: "Trainees Roster" },
    { Summary: "Filter",        Value: filterParts.length ? filterParts.join(" · ") : "All" },
    { Summary: "",              Value: "" },
    { Summary: "Total Trainees",Value: enrollments.length },
    { Summary: "Male",          Value: enrollments.filter((e) => e.application?.applicantGender === "MALE").length },
    { Summary: "Female",        Value: enrollments.filter((e) => e.application?.applicantGender === "FEMALE").length },
    { Summary: "Attendance Confirmed", Value: enrollments.filter((e) => e.attendanceConfirmed).length },
    { Summary: "Certificate Issued",   Value: enrollments.filter((e) => e.certificateIssued).length },
    { Summary: "",              Value: "" },
    { Summary: "Generated At",  Value: new Date().toLocaleString("en-GB") },
    { Summary: "Generated By",  Value: user.fullName },
  ];
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  ws2["!cols"] = [{ wch: 30 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="trainees-roster.xlsx"`,
    },
  });
}
