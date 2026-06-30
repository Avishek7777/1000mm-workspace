import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import path from "path";
import { readFileSync } from "fs";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TEAL = "#0d7a6e";

const styles = StyleSheet.create({
  page:     { padding: 32, fontSize: 8, fontFamily: "Helvetica", color: "#1a1a1a", orientation: "landscape" },
  header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 10, marginBottom: 14 },
  logo:     { width: 38, height: 38 },
  hCenter:  { alignItems: "center" },
  title:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111" },
  subtitle: { fontSize: 8, color: TEAL, marginTop: 2 },
  meta:     { fontSize: 7, color: "#666", marginTop: 2 },
  thead:    { flexDirection: "row", backgroundColor: TEAL, padding: "4 6", borderRadius: 3, marginTop: 4 },
  thTxt:    { color: "#fff", fontFamily: "Helvetica-Bold" },
  row:      { flexDirection: "row", padding: "3 6", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  rowAlt:   { flexDirection: "row", padding: "3 6", backgroundColor: "#f9fafb", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  cell:     { color: "#374151" },
  cellBold: { fontFamily: "Helvetica-Bold", color: "#111" },
  footer:   { marginTop: 12, fontSize: 7, color: "#9ca3af", textAlign: "right" },
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"].includes(user.role))
    return new NextResponse("Forbidden", { status: 403 });

  const sp = new URL(req.url).searchParams;
  const yearParam   = sp.get("year");
  const monthParam  = sp.get("month");
  const dayParam    = sp.get("day");
  const missionId   = sp.get("mission") || undefined;
  const programId   = sp.get("program") || undefined;

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
          homeMission: { select: { code: true } },
          applications: {
            where: { status: "ACCEPTED" },
            select: { applicantGender: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      program:   { select: { code: true } },
      scannedBy: { select: { fullName: true } },
    },
    orderBy: { scannedAt: "asc" },
    take: 5000,
  });

  // Logo
  let logoSrc: string | undefined;
  let sdaSrc: string | undefined;
  try {
    logoSrc = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png")).toString("base64")}`;
    sdaSrc  = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "sda-logo.png")).toString("base64")}`;
  } catch {}

  const generatedAt = new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const filterLabel = [
    `Year ${yearNum}`,
    monthNum ? MONTHS[monthNum - 1] : null,
    dayNum ? `Day ${dayNum}` : null,
  ].filter(Boolean).join(" · ");

  const COL = { no: "4%", name: "22%", mission: "8%", gender: "7%", program: "10%", date: "14%", time: "10%", by: "18%" };

  const doc = createElement(Document, {},
    createElement(Page, { size: "A4", orientation: "landscape", style: styles.page },
      // Header
      createElement(View, { style: styles.header },
        logoSrc ? createElement(Image, { src: logoSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
        createElement(View, { style: styles.hCenter },
          createElement(Text, { style: styles.title }, "1000 Missionary Movement Bangladesh"),
          createElement(Text, { style: styles.subtitle }, "Attendance Record"),
          createElement(Text, { style: styles.meta }, `${filterLabel} · ${scans.length} record${scans.length !== 1 ? "s" : ""}`),
          createElement(Text, { style: styles.meta }, `Generated: ${generatedAt}`),
        ),
        sdaSrc ? createElement(Image, { src: sdaSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
      ),
      // Table header
      createElement(View, { style: styles.thead },
        createElement(Text, { style: { ...styles.thTxt, width: COL.no } }, "#"),
        createElement(Text, { style: { ...styles.thTxt, width: COL.name } }, "Name"),
        createElement(Text, { style: { ...styles.thTxt, width: COL.mission } }, "Mission"),
        createElement(Text, { style: { ...styles.thTxt, width: COL.gender } }, "Gender"),
        createElement(Text, { style: { ...styles.thTxt, width: COL.program } }, "Program"),
        createElement(Text, { style: { ...styles.thTxt, width: COL.date } }, "Date"),
        createElement(Text, { style: { ...styles.thTxt, width: COL.time } }, "Time"),
        createElement(Text, { style: { ...styles.thTxt, width: COL.by } }, "Scanned By"),
      ),
      // Rows
      ...scans.map((s, i) => {
        const gender = s.trainee.applications[0]?.applicantGender === "MALE" ? "M"
          : s.trainee.applications[0]?.applicantGender === "FEMALE" ? "F" : "—";
        const dateStr = new Date(s.scannedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        const timeStr = new Date(s.scannedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        return createElement(View, { key: s.id, style: i % 2 === 0 ? styles.row : styles.rowAlt },
          createElement(Text, { style: { ...styles.cell, width: COL.no, color: "#9ca3af" } }, String(i + 1)),
          createElement(Text, { style: { ...styles.cellBold, width: COL.name } }, s.trainee.fullName),
          createElement(Text, { style: { ...styles.cell, width: COL.mission, color: "#7c3aed", fontFamily: "Helvetica-Bold" } }, s.trainee.homeMission?.code ?? "—"),
          createElement(Text, { style: { ...styles.cell, width: COL.gender } }, gender),
          createElement(Text, { style: { ...styles.cell, width: COL.program } }, s.program.code),
          createElement(Text, { style: { ...styles.cell, width: COL.date } }, dateStr),
          createElement(Text, { style: { ...styles.cell, width: COL.time } }, timeStr),
          createElement(Text, { style: { ...styles.cell, width: COL.by, color: "#6b7280" } }, s.scannedBy.fullName),
        );
      }),
      createElement(Text, { style: styles.footer }, `Generated by ${user.fullName} · ${generatedAt}`),
    ),
  );

  const buffer = await renderToBuffer(doc as any);
  const filename = `attendance-${yearNum}${monthNum ? `-${String(monthNum).padStart(2, "0")}` : ""}${dayNum ? `-${String(dayNum).padStart(2, "0")}` : ""}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
