import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import ExcelJS from "exceljs";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"].includes(user.role))
    return new NextResponse("Forbidden", { status: 403 });

  const sp = new URL(req.url).searchParams;
  const yearParam  = sp.get("year");
  const monthParam = sp.get("month");
  const dayParam   = sp.get("day");
  const missionId  = sp.get("mission") || undefined;
  const programId  = sp.get("program") || undefined;

  const thisYear = new Date().getFullYear();
  const yearNum  = yearParam  ? parseInt(yearParam,  10) : thisYear;
  const monthNum = monthParam ? parseInt(monthParam, 10) : undefined;
  const dayNum   = dayParam   ? parseInt(dayParam,   10) : undefined;

  let dateFrom: Date;
  let dateTo: Date;
  if (dayNum && monthNum) {
    dateFrom = new Date(yearNum, monthNum - 1, dayNum);
    dateTo   = new Date(yearNum, monthNum - 1, dayNum + 1);
  } else if (monthNum) {
    dateFrom = new Date(yearNum, monthNum - 1, 1);
    dateTo   = new Date(yearNum, monthNum,     1);
  } else {
    dateFrom = new Date(yearNum, 0, 1);
    dateTo   = new Date(yearNum + 1, 0, 1);
  }

  const scans = await prisma.attendanceScan.findMany({
    where: {
      scannedAt: { gte: dateFrom, lt: dateTo },
      ...(missionId ? { missionId } : {}),
      ...(programId ? { programId } : {}),
    },
    include: {
      trainee: {
        select: {
          fullName: true,
          email: true,
          homeMission: { select: { code: true, name: true } },
          applications: {
            where: { status: "ACCEPTED" },
            select: { applicantGender: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      program:   { select: { code: true, title: true } },
      scannedBy: { select: { fullName: true } },
    },
    orderBy: { scannedAt: "asc" },
    take: 5000,
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = user.fullName;
  wb.created = new Date();

  const filterLabel = [
    `Year ${yearNum}`,
    monthNum ? MONTHS[monthNum - 1] : null,
    dayNum ? `Day ${dayNum}` : null,
  ].filter(Boolean).join(" / ");

  // Sheet 1: Attendance Records
  const ws = wb.addWorksheet("Attendance Records");
  ws.columns = [
    { header: "#",          key: "no",        width: 5  },
    { header: "Name",       key: "name",      width: 28 },
    { header: "Email",      key: "email",     width: 28 },
    { header: "Mission",    key: "mission",   width: 10 },
    { header: "Gender",     key: "gender",    width: 8  },
    { header: "Program",    key: "program",   width: 14 },
    { header: "Date",       key: "date",      width: 14 },
    { header: "Time",       key: "time",      width: 10 },
    { header: "Scanned By", key: "scannedBy", width: 22 },
  ];

  // Title row
  ws.spliceRows(1, 0, [`1000MM Bangladesh — Attendance: ${filterLabel}`]);
  ws.getRow(1).font = { bold: true, size: 13 };
  ws.getRow(1).height = 22;

  // Header row style
  const headerRow = ws.getRow(2);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0d7a6e" } };
  headerRow.height = 18;

  scans.forEach((s, i) => {
    const gender = s.trainee.applications[0]?.applicantGender === "MALE" ? "Male"
      : s.trainee.applications[0]?.applicantGender === "FEMALE" ? "Female" : "—";
    const dt = new Date(s.scannedAt);
    ws.addRow({
      no:        i + 1,
      name:      s.trainee.fullName,
      email:     s.trainee.email,
      mission:   s.trainee.homeMission?.code ?? "—",
      gender,
      program:   s.program.code,
      date:      dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      time:      dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      scannedBy: s.scannedBy.fullName,
    });
  });

  // Sheet 2: Summary by Mission
  const ws2 = wb.addWorksheet("Summary by Mission");
  ws2.columns = [
    { header: "Mission Code", key: "code",  width: 14 },
    { header: "Mission Name", key: "name",  width: 28 },
    { header: "Total Scans",  key: "count", width: 14 },
  ];
  ws2.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws2.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0d7a6e" } };

  const missionMap = new Map<string, { code: string; name: string; count: number }>();
  for (const s of scans) {
    const code = s.trainee.homeMission?.code ?? "Unknown";
    const name = s.trainee.homeMission ? `${s.trainee.homeMission.code}` : "Unknown";
    const existing = missionMap.get(code);
    if (existing) existing.count++;
    else missionMap.set(code, { code, name, count: 1 });
  }
  for (const m of missionMap.values()) {
    ws2.addRow({ code: m.code, name: m.name, count: m.count });
  }

  const buf = await wb.xlsx.writeBuffer();
  const filename = `attendance-${yearNum}${monthNum ? `-${String(monthNum).padStart(2, "0")}` : ""}${dayNum ? `-${String(dayNum).padStart(2, "0")}` : ""}.xlsx`;

  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
