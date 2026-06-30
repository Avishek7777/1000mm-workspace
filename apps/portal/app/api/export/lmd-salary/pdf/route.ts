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
  page:      { padding: 32, fontSize: 8, fontFamily: "Helvetica", color: "#1a1a1a" },
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 10, marginBottom: 14 },
  logo:      { width: 40, height: 40 },
  hCenter:   { alignItems: "center" },
  title:     { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111" },
  subtitle:  { fontSize: 8, color: TEAL, marginTop: 2 },
  meta:      { fontSize: 7, color: "#666", marginTop: 2 },
  table:     { marginTop: 4 },
  thead:     { flexDirection: "row", backgroundColor: TEAL, padding: "4 6", borderRadius: 3 },
  thText:    { color: "#fff", fontFamily: "Helvetica-Bold", flex: 1 },
  thRight:   { color: "#fff", fontFamily: "Helvetica-Bold", flex: 1, textAlign: "right" },
  row:       { flexDirection: "row", padding: "3 6", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  rowAlt:    { flexDirection: "row", padding: "3 6", backgroundColor: "#f9fafb", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  cell:      { flex: 1, color: "#374151" },
  cellRight: { flex: 1, textAlign: "right", color: "#374151" },
  cellBold:  { flex: 1, fontFamily: "Helvetica-Bold", color: "#111" },
  tfoot:     { flexDirection: "row", backgroundColor: "#e5e7eb", padding: "4 6", marginTop: 1 },
  tfCell:    { flex: 1, fontFamily: "Helvetica-Bold", color: "#111" },
  tfRight:   { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold", color: TEAL },
  footer:    { marginTop: 16, fontSize: 7, color: "#9ca3af", textAlign: "right" },
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

  const thisYear = new Date().getFullYear();
  const yearNum  = yearParam  ? parseInt(yearParam,  10) : thisYear;
  const monthNum = monthParam ? parseInt(monthParam, 10) : undefined;

  const appFilter: Record<string, unknown> = { status: "ACCEPTED" };
  if (genderParam === "MALE" || genderParam === "FEMALE") appFilter.applicantGender = genderParam;
  if (districtParam) appFilter.presentAddressDistrict = districtParam;
  const hasAppFilter = !!(genderParam || districtParam);

  let createdAtFilter: Record<string, Date> | undefined;
  if (monthNum) {
    createdAtFilter = {
      gte: new Date(yearNum, monthNum - 1, 1),
      lt:  new Date(yearNum, monthNum,     1),
    };
  }

  const [missionaries, assignments] = await Promise.all([
    prisma.user.findMany({
      where: {
        homeMissionId: mission.id,
        isMissionary: true,
        isActive: true,
        ...(hasAppFilter ? { applications: { some: appFilter } } : {}),
        ...(monthNum ? { salaryAssignments: { some: { missionId: mission.id, cycle: yearNum, createdAt: createdAtFilter } } } : {}),
      },
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
    prisma.salaryAssignment.findMany({
      where: {
        missionId: mission.id,
        cycle: yearNum,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    }),
  ]);

  const assignmentMap = new Map(assignments.map((a) => [a.missionaryId, a]));
  const totalAssigned = missionaries.reduce((s, m) => s + (assignmentMap.get(m.id)?.amount ?? 0), 0);

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

  const filterLabel = [
    `Cycle ${yearNum}`,
    monthNum ? MONTHS[monthNum - 1] : null,
    genderParam === "MALE" ? "Male" : genderParam === "FEMALE" ? "Female" : null,
    districtParam ?? null,
  ].filter(Boolean).join(" · ");

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      createElement(View, { style: styles.header },
        logoSrc ? createElement(Image, { src: logoSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
        createElement(View, { style: styles.hCenter },
          createElement(Text, { style: styles.title }, "1000 Missionary Movement Bangladesh"),
          createElement(Text, { style: styles.subtitle }, "Missionary Deployment & Salary List"),
          createElement(Text, { style: styles.meta }, `${mission.name} · ${filterLabel}`),
          createElement(Text, { style: styles.meta }, `Generated: ${generatedAt}`),
        ),
        sdaSrc ? createElement(Image, { src: sdaSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
      ),
      // Table header
      createElement(View, { style: styles.thead },
        createElement(Text, { style: { ...styles.thText, flex: 0.4 } }, "#"),
        createElement(Text, { style: { ...styles.thText, flex: 2.5 } }, "Name"),
        createElement(Text, { style: styles.thText }, "Gender"),
        createElement(Text, { style: { ...styles.thText, flex: 1.5 } }, "District"),
        createElement(Text, { style: { ...styles.thText, flex: 1.8 } }, "Deployment"),
        createElement(Text, { style: styles.thRight }, "Amount (Tk.)"),
        createElement(Text, { style: styles.thText }, "Status"),
      ),
      // Rows
      ...missionaries.map((m, i) => {
        const a   = assignmentMap.get(m.id);
        const app = m.applications[0];
        const rowStyle = i % 2 === 0 ? styles.row : styles.rowAlt;
        return createElement(View, { key: m.id, style: rowStyle },
          createElement(Text, { style: { ...styles.cell, flex: 0.4 } }, String(i + 1)),
          createElement(Text, { style: { ...styles.cellBold, flex: 2.5 } }, m.fullName),
          createElement(Text, { style: styles.cell }, app?.applicantGender === "MALE" ? "M" : app?.applicantGender === "FEMALE" ? "F" : "—"),
          createElement(Text, { style: { ...styles.cell, flex: 1.5 } }, app?.presentAddressDistrict ?? "—"),
          createElement(Text, { style: { ...styles.cell, flex: 1.8 } }, a?.deploymentLocation ?? "—"),
          createElement(Text, { style: styles.cellRight }, a ? a.amount.toLocaleString() : "—"),
          createElement(Text, { style: styles.cell }, a ? "Assigned" : "Pending"),
        );
      }),
      // Footer totals
      createElement(View, { style: styles.tfoot },
        createElement(Text, { style: { ...styles.tfCell, flex: 0.4 } }, ""),
        createElement(Text, { style: { ...styles.tfCell, flex: 2.5 } }, `Total: ${missionaries.length} missionaries`),
        createElement(Text, { style: styles.tfCell }, ""),
        createElement(Text, { style: { ...styles.tfCell, flex: 1.5 } }, ""),
        createElement(Text, { style: { ...styles.tfCell, flex: 1.8 } }, ""),
        createElement(Text, { style: styles.tfRight }, `Tk. ${totalAssigned.toLocaleString()}`),
        createElement(Text, { style: styles.tfCell }, ""),
      ),
      createElement(Text, { style: styles.footer }, `Generated: ${generatedAt} · ${user.fullName}`),
    ),
  );

  const buffer = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lmd-salary-${yearNum}.pdf"`,
    },
  });
}
