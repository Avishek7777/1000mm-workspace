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
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 10, marginBottom: 12 },
  logo:      { width: 38, height: 38 },
  hCenter:   { alignItems: "center" },
  title:     { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111" },
  subtitle:  { fontSize: 7.5, color: TEAL, marginTop: 2 },
  meta:      { fontSize: 6.5, color: "#666", marginTop: 2 },
  section:   { marginTop: 12 },
  sTitle:    { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: TEAL, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  thead:     { flexDirection: "row", backgroundColor: TEAL, padding: "3 5" },
  thText:    { color: "#fff", fontFamily: "Helvetica-Bold", flex: 1 },
  thRight:   { color: "#fff", fontFamily: "Helvetica-Bold", flex: 1, textAlign: "right" },
  row:       { flexDirection: "row", padding: "2.5 5", borderBottomWidth: 0.4, borderBottomColor: "#e5e7eb" },
  rowAlt:    { flexDirection: "row", padding: "2.5 5", backgroundColor: "#f9fafb", borderBottomWidth: 0.4, borderBottomColor: "#e5e7eb" },
  cell:      { flex: 1, color: "#374151" },
  cellBold:  { flex: 1, fontFamily: "Helvetica-Bold", color: "#111" },
  cellRight: { flex: 1, textAlign: "right", color: "#374151" },
  tfoot:     { flexDirection: "row", backgroundColor: "#e5e7eb", padding: "3 5", marginTop: 1 },
  tfCell:    { flex: 1, fontFamily: "Helvetica-Bold", color: "#111" },
  tfRight:   { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold", color: TEAL },
  footer:    { marginTop: 14, fontSize: 6.5, color: "#9ca3af", textAlign: "right" },
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
        trainee: { select: { fullName: true } },
        program: { select: { code: true } },
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

  let logoSrc: string | undefined;
  let sdaSrc: string | undefined;
  try {
    logoSrc = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png")).toString("base64")}`;
    sdaSrc  = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "sda-logo.png")).toString("base64")}`;
  } catch {}

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const filterLabel = [
    yearNum  ? String(yearNum)      : "All years",
    monthNum ? MONTHS[monthNum - 1] : null,
  ].filter(Boolean).join(" · ");

  const totalBaptisms   = fieldReports.reduce((s, r) => s + r.numberOfBaptisms,     0);
  const totalActivities = fieldReports.reduce((s, r) => s + r.totalActivities,      0);
  const totalVisits     = fieldReports.reduce((s, r) => s + r.nonSdaHomeVisits,     0);
  const totalReached    = fieldReports.reduce((s, r) => s + (r.peopleReached ?? 0), 0);
  const totalDays       = fieldReports.reduce((s, r) => s + r.daysOfWork,           0);

  const doc = createElement(Document, {},
    createElement(Page, { size: "A4", orientation: "landscape", style: styles.page },

      // Header
      createElement(View, { style: styles.header },
        logoSrc ? createElement(Image, { src: logoSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
        createElement(View, { style: styles.hCenter },
          createElement(Text, { style: styles.title }, "1000 Missionary Movement Bangladesh"),
          createElement(Text, { style: styles.subtitle }, "Individual Missionary Field Reports"),
          createElement(Text, { style: styles.meta }, `${mission.name} · ${filterLabel}`),
          createElement(Text, { style: styles.meta }, `Generated: ${generatedAt}`),
        ),
        sdaSrc ? createElement(Image, { src: sdaSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
      ),

      // Section 1 — Individual field reports
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sTitle }, `Field Reports (${fieldReports.length})`),
        createElement(View, { style: styles.thead },
          createElement(Text, { style: { ...styles.thText, flex: 0.35 } }, "#"),
          createElement(Text, { style: { ...styles.thText, flex: 2.2 } }, "Missionary"),
          createElement(Text, { style: { ...styles.thText, flex: 0.9 } }, "Program"),
          createElement(Text, { style: { ...styles.thText, flex: 1.2 } }, "Period"),
          createElement(Text, { style: styles.thRight }, "Acts"),
          createElement(Text, { style: styles.thRight }, "Days"),
          createElement(Text, { style: styles.thRight }, "Visits"),
          createElement(Text, { style: styles.thRight }, "Bib."),
          createElement(Text, { style: styles.thRight }, "Cand."),
          createElement(Text, { style: styles.thRight }, "Bap."),
          createElement(Text, { style: styles.thRight }, "Reached"),
        ),
        ...fieldReports.map((r, i) =>
          createElement(View, { key: r.id, style: i % 2 === 0 ? styles.row : styles.rowAlt },
            createElement(Text, { style: { ...styles.cell, flex: 0.35 } }, String(i + 1)),
            createElement(Text, { style: { ...styles.cellBold, flex: 2.2 } }, r.trainee.fullName),
            createElement(Text, { style: { ...styles.cell, flex: 0.9 } }, r.program.code),
            createElement(Text, { style: { ...styles.cell, flex: 1.2 } }, `${MONTHS[r.reportMonth - 1]} ${r.reportYear}`),
            createElement(Text, { style: styles.cellRight }, String(r.totalActivities)),
            createElement(Text, { style: styles.cellRight }, String(r.daysOfWork)),
            createElement(Text, { style: styles.cellRight }, String(r.nonSdaHomeVisits)),
            createElement(Text, { style: styles.cellRight }, String(r.bibleStudiesConducted)),
            createElement(Text, { style: styles.cellRight }, String(r.baptismCandidatesPrepared)),
            createElement(Text, { style: styles.cellRight }, String(r.numberOfBaptisms)),
            createElement(Text, { style: styles.cellRight }, String(r.peopleReached ?? 0)),
          )
        ),
        fieldReports.length === 0
          ? createElement(View, { style: styles.row },
              createElement(Text, { style: { ...styles.cell, flex: 10, color: "#9ca3af" } }, "No field reports found for the selected period."),
            )
          : createElement(View, { style: styles.tfoot },
              createElement(Text, { style: { ...styles.tfCell, flex: 0.35 } }, ""),
              createElement(Text, { style: { ...styles.tfCell, flex: 2.2 } }, `Total (${fieldReports.length} reports)`),
              createElement(Text, { style: { ...styles.tfCell, flex: 0.9 } }, ""),
              createElement(Text, { style: { ...styles.tfCell, flex: 1.2 } }, ""),
              createElement(Text, { style: styles.tfRight }, String(totalActivities)),
              createElement(Text, { style: styles.tfRight }, String(totalDays)),
              createElement(Text, { style: styles.tfRight }, String(totalVisits)),
              createElement(Text, { style: styles.tfRight }, ""),
              createElement(Text, { style: styles.tfRight }, ""),
              createElement(Text, { style: styles.tfRight }, String(totalBaptisms)),
              createElement(Text, { style: styles.tfRight }, String(totalReached)),
            ),
      ),

      // Section 2 — Missionaries list
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sTitle }, `Active Missionaries (${missionaries.length})`),
        createElement(View, { style: styles.thead },
          createElement(Text, { style: { ...styles.thText, flex: 0.35 } }, "#"),
          createElement(Text, { style: { ...styles.thText, flex: 2.5 } }, "Name"),
          createElement(Text, { style: styles.thText }, "Gender"),
          createElement(Text, { style: { ...styles.thText, flex: 1.5 } }, "District"),
          createElement(Text, { style: { ...styles.thText, flex: 1.5 } }, "Phone"),
        ),
        ...missionaries.map((m, i) => {
          const app = m.applications[0];
          return createElement(View, { key: m.id, style: i % 2 === 0 ? styles.row : styles.rowAlt },
            createElement(Text, { style: { ...styles.cell, flex: 0.35 } }, String(i + 1)),
            createElement(Text, { style: { ...styles.cellBold, flex: 2.5 } }, m.fullName),
            createElement(Text, { style: styles.cell }, app?.applicantGender === "MALE" ? "M" : app?.applicantGender === "FEMALE" ? "F" : "—"),
            createElement(Text, { style: { ...styles.cell, flex: 1.5 } }, app?.presentAddressDistrict ?? "—"),
            createElement(Text, { style: { ...styles.cell, flex: 1.5 } }, m.phone ?? "—"),
          );
        }),
      ),

      createElement(Text, { style: styles.footer }, `Generated: ${generatedAt} · ${user.fullName}`),
    ),
  );

  const buffer = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lmd-field-reports-${mission.name.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
