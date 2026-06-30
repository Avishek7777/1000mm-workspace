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
  page:      { padding: 28, fontSize: 7.5, fontFamily: "Helvetica", color: "#1a1a1a" },
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 10, marginBottom: 14 },
  logo:      { width: 38, height: 38 },
  hCenter:   { alignItems: "center" },
  title:     { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111" },
  subtitle:  { fontSize: 8, color: TEAL, marginTop: 2 },
  meta:      { fontSize: 7, color: "#666", marginTop: 2 },
  thead:     { flexDirection: "row", backgroundColor: TEAL, padding: "4 6", borderRadius: 3 },
  thText:    { color: "#fff", fontFamily: "Helvetica-Bold", flex: 1 },
  thRight:   { color: "#fff", fontFamily: "Helvetica-Bold", flex: 1, textAlign: "right" },
  row:       { flexDirection: "row", padding: "3 6", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  rowAlt:    { flexDirection: "row", padding: "3 6", backgroundColor: "#f9fafb", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  cell:      { flex: 1, color: "#374151" },
  cellBold:  { flex: 1, fontFamily: "Helvetica-Bold", color: "#111" },
  tfoot:     { flexDirection: "row", backgroundColor: "#e5e7eb", padding: "4 6", marginTop: 1 },
  tfCell:    { flex: 1, fontFamily: "Helvetica-Bold", color: "#111" },
  footer:    { marginTop: 14, fontSize: 7, color: "#9ca3af", textAlign: "right" },
});

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
  const yearParam     = searchParams.get("year");
  const monthParam    = searchParams.get("month");
  const genderParam   = searchParams.get("gender");
  const districtParam = searchParams.get("district");
  const programIdParam = searchParams.get("programId");

  const yearNum  = yearParam  ? parseInt(yearParam,  10) : undefined;
  const monthNum = monthParam ? parseInt(monthParam, 10) : undefined;

  let enrolledAtFilter: { gte: Date; lt: Date } | undefined;
  if (yearNum && monthNum) {
    enrolledAtFilter = { gte: new Date(yearNum, monthNum - 1, 1), lt: new Date(yearNum, monthNum, 1) };
  } else if (yearNum) {
    enrolledAtFilter = { gte: new Date(yearNum, 0, 1), lt: new Date(yearNum + 1, 0, 1) };
  } else if (monthNum) {
    const cy = new Date().getFullYear();
    enrolledAtFilter = { gte: new Date(cy, monthNum - 1, 1), lt: new Date(cy, monthNum, 1) };
  }

  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      application: {
        status: "ACCEPTED",
        submittedFromMissionId: mission.id,
        ...(genderParam === "MALE" || genderParam === "FEMALE" ? { applicantGender: genderParam } : {}),
        ...(districtParam ? { presentAddressDistrict: { contains: districtParam, mode: "insensitive" } } : {}),
      },
      ...(programIdParam ? { programId: programIdParam } : {}),
      ...(enrolledAtFilter ? { enrolledAt: enrolledAtFilter } : {}),
    },
    orderBy: { enrolledAt: "desc" },
    include: {
      trainee: { select: { fullName: true, fullNameBangla: true, phone: true } },
      application: { select: { applicantGender: true, presentAddressDistrict: true, referenceNumber: true } },
      program: { select: { code: true } },
    },
  });

  let logoSrc: string | undefined;
  let sdaSrc: string | undefined;
  try {
    const logoBuf = readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png"));
    logoSrc = `data:image/png;base64,${logoBuf.toString("base64")}`;
    const sdaBuf = readFileSync(path.join(process.cwd(), "public", "logos", "sda-logo.png"));
    sdaSrc = `data:image/png;base64,${sdaBuf.toString("base64")}`;
  } catch {}

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const filterParts = [
    yearNum  ? String(yearNum)                    : null,
    monthNum ? MONTHS[monthNum - 1]               : null,
    genderParam === "MALE" ? "Male" : genderParam === "FEMALE" ? "Female" : null,
    districtParam ?? null,
  ].filter(Boolean);
  const filterLabel = filterParts.length ? filterParts.join(" · ") : "All missionaries";

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      // Header
      createElement(View, { style: styles.header },
        logoSrc ? createElement(Image, { src: logoSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
        createElement(View, { style: styles.hCenter },
          createElement(Text, { style: styles.title }, "1000 Missionary Movement Bangladesh"),
          createElement(Text, { style: styles.subtitle }, "Missionaries List"),
          createElement(Text, { style: styles.meta }, `${mission.name} · ${filterLabel}`),
          createElement(Text, { style: styles.meta }, `Generated: ${generatedAt}`),
        ),
        sdaSrc ? createElement(Image, { src: sdaSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
      ),
      // Table head
      createElement(View, { style: styles.thead },
        createElement(Text, { style: { ...styles.thText, flex: 0.35 } }, "#"),
        createElement(Text, { style: { ...styles.thText, flex: 2.2 } }, "Name (English)"),
        createElement(Text, { style: { ...styles.thText, flex: 2 } }, "Name (Bangla)"),
        createElement(Text, { style: { ...styles.thText, flex: 1.2 } }, "Ref No"),
        createElement(Text, { style: { ...styles.thText, flex: 0.8 } }, "Program"),
        createElement(Text, { style: { ...styles.thText, flex: 1.2 } }, "Enrolled"),
        createElement(Text, { style: { ...styles.thText, flex: 0.6 } }, "Gender"),
        createElement(Text, { style: { ...styles.thText, flex: 1.4 } }, "District"),
        createElement(Text, { style: { ...styles.thText, flex: 1.2 } }, "Phone"),
      ),
      // Rows
      ...enrollments.map((e, i) => {
        const rowStyle = i % 2 === 0 ? styles.row : styles.rowAlt;
        return createElement(View, { key: e.id, style: rowStyle },
          createElement(Text, { style: { ...styles.cell, flex: 0.35 } }, String(i + 1)),
          createElement(Text, { style: { ...styles.cellBold, flex: 2.2 } }, e.trainee.fullName),
          createElement(Text, { style: { ...styles.cell, flex: 2 } }, e.trainee.fullNameBangla ?? "—"),
          createElement(Text, { style: { ...styles.cell, flex: 1.2 } }, e.application?.referenceNumber ?? "—"),
          createElement(Text, { style: { ...styles.cell, flex: 0.8 } }, e.program.code),
          createElement(Text, { style: { ...styles.cell, flex: 1.2 } }, fmt(e.enrolledAt)),
          createElement(Text, { style: { ...styles.cell, flex: 0.6 } }, e.application?.applicantGender === "MALE" ? "M" : "F"),
          createElement(Text, { style: { ...styles.cell, flex: 1.4 } }, e.application?.presentAddressDistrict ?? "—"),
          createElement(Text, { style: { ...styles.cell, flex: 1.2 } }, e.trainee.phone ?? "—"),
        );
      }),
      // Footer row
      createElement(View, { style: styles.tfoot },
        createElement(Text, { style: { ...styles.tfCell, flex: 0.35 } }, ""),
        createElement(Text, { style: { ...styles.tfCell, flex: 10.65 } }, `Total: ${enrollments.length} ${enrollments.length !== 1 ? "Missionaries" : "Missionary"}`),
      ),
      createElement(Text, { style: styles.footer }, `Generated: ${generatedAt} · ${user.fullName}`),
    ),
  );

  const buffer = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lmd-missionaries.pdf"`,
    },
  });
}
