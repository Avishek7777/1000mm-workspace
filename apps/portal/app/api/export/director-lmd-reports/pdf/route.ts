import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import path from "path";
import { readFileSync } from "fs";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TEAL = "#0d7a6e";
const ALLOWED = ["MAIN_DIRECTOR", "SYSTEM_ADMIN", "SECRETARY", "ASSOCIATE_DIRECTOR"] as const;

const styles = StyleSheet.create({
  page:       { padding: 24, fontSize: 7, fontFamily: "Helvetica", color: "#1a1a1a" },
  hdr:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 8, marginBottom: 12 },
  logo:       { width: 34, height: 34 },
  hCenter:    { alignItems: "center" },
  hTitle:     { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111" },
  hSub:       { fontSize: 7.5, color: TEAL, marginTop: 2 },
  hMeta:      { fontSize: 6.5, color: "#666", marginTop: 1.5 },
  sectionHdr: { backgroundColor: TEAL, color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 7.5, padding: "3 6", marginBottom: 2 },
  thead:      { flexDirection: "row", backgroundColor: "#e5e7eb", padding: "3 4" },
  th:         { fontFamily: "Helvetica-Bold", color: "#374151", fontSize: 6.5 },
  row:        { flexDirection: "row", padding: "2.5 4", borderBottomWidth: 0.4, borderBottomColor: "#e5e7eb" },
  rowAlt:     { flexDirection: "row", padding: "2.5 4", backgroundColor: "#f9fafb", borderBottomWidth: 0.4, borderBottomColor: "#e5e7eb" },
  cell:       { color: "#374151", fontSize: 6.5 },
  cellBold:   { fontFamily: "Helvetica-Bold", color: "#111", fontSize: 6.5 },
  totRow:     { flexDirection: "row", padding: "3 4", backgroundColor: "#d1fae5", borderTopWidth: 1, borderTopColor: TEAL },
  totCell:    { fontFamily: "Helvetica-Bold", color: TEAL, fontSize: 6.5 },
  narrBlock:  { marginTop: 8 },
  narrTitle:  { fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#111", marginBottom: 4 },
  narrRow:    { flexDirection: "row", marginBottom: 10, borderBottomWidth: 0.4, borderBottomColor: "#e5e7eb", paddingBottom: 8 },
  narrMeta:   { width: 90, flexShrink: 0 },
  narrLabel:  { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: TEAL },
  narrLmd:    { fontSize: 6, color: "#666", marginTop: 1 },
  narrRight:  { flex: 1, paddingLeft: 8 },
  narrField:  { marginBottom: 4 },
  narrKey:    { fontFamily: "Helvetica-Bold", fontSize: 6, color: "#9ca3af", marginBottom: 1 },
  narrVal:    { fontSize: 6.5, color: "#374151" },
  footer:     { marginTop: 10, fontSize: 6, color: "#9ca3af", textAlign: "right" },
});

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
      ...(yearNum    ? { reportYear: yearNum }                : {}),
      ...(missionParam ? { mission: { code: missionParam } } : {}),
    },
    orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }, { mission: { code: "asc" } }],
    include: {
      lmd:     { select: { fullName: true } },
      mission: { select: { name: true, code: true } },
    },
  });

  let logoSrc: string | undefined;
  let sdaSrc:  string | undefined;
  try {
    logoSrc = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png")).toString("base64")}`;
    sdaSrc  = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "sda-logo.png")).toString("base64")}`;
  } catch {}

  const generatedAt = new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const filterLabel = [missionParam ?? "All missions", yearNum ? String(yearNum) : null].filter(Boolean).join(" · ");

  // Group by period
  const periodMap = new Map<string, { label: string; rows: typeof reports }>();
  for (const r of reports) {
    const key = `${r.reportYear}-${String(r.reportMonth).padStart(2, "0")}`;
    if (!periodMap.has(key)) periodMap.set(key, { label: `${MONTHS[r.reportMonth - 1]} ${r.reportYear}`, rows: [] });
    periodMap.get(key)!.rows.push(r);
  }
  const periods = Array.from(periodMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  const numCols: { key: keyof typeof reports[0]; label: string; flex: number }[] = [
    { key: "totalTrainees",         label: "Trainees",   flex: 0.7 },
    { key: "totalActivities",       label: "Activities", flex: 0.7 },
    { key: "totalDaysOfWork",       label: "Days",       flex: 0.55 },
    { key: "totalHoursOfWork",      label: "Hours",      flex: 0.55 },
    { key: "totalNonSdaHomeVisits", label: "Visits",     flex: 0.65 },
    { key: "totalBibleStudies",     label: "Bible St.",  flex: 0.65 },
    { key: "totalMedicalVisits",    label: "Medical",    flex: 0.65 },
    { key: "totalWorshipSessions",  label: "Worship",    flex: 0.65 },
    { key: "totalNewGroups",        label: "Groups",     flex: 0.6 },
    { key: "totalBaptismCandidates",label: "Bap.Cand.",  flex: 0.7 },
    { key: "totalBaptisms",         label: "Baptisms",   flex: 0.7 },
    { key: "totalPeopleReached",    label: "Reached",    flex: 0.7 },
  ];

  const hasNarrative = reports.some((r) => r.overallSummary || r.challengesAndNeeds || r.recommendationsToDirector || r.prayerRequests);

  const doc = createElement(Document, {},
    createElement(Page, { size: "A4", orientation: "landscape", style: styles.page },
      // Header
      createElement(View, { style: styles.hdr },
        logoSrc ? createElement(Image, { src: logoSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
        createElement(View, { style: styles.hCenter },
          createElement(Text, { style: styles.hTitle }, "1000 Missionary Movement Bangladesh"),
          createElement(Text, { style: styles.hSub },   "LMD Reports — Individual Data"),
          createElement(Text, { style: styles.hMeta },  filterLabel),
          createElement(Text, { style: styles.hMeta },  `${reports.length} report${reports.length !== 1 ? "s" : ""} · Generated: ${generatedAt}`),
        ),
        sdaSrc ? createElement(Image, { src: sdaSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
      ),

      // Periods
      ...periods.flatMap(([, { label, rows }]) => {
        const totals = numCols.reduce((acc, col) => {
          acc[col.key] = rows.reduce((s, r) => s + ((r[col.key] as number) || 0), 0);
          return acc;
        }, {} as Record<string, number>);

        return [
          createElement(Text, { style: styles.sectionHdr }, label),
          createElement(View, { style: styles.thead },
            createElement(Text, { style: { ...styles.th, flex: 0.7 } }, "#"),
            createElement(Text, { style: { ...styles.th, flex: 1.6 } }, "Mission"),
            createElement(Text, { style: { ...styles.th, flex: 2 } },   "LMD"),
            ...numCols.map((col) => createElement(Text, { key: col.key, style: { ...styles.th, flex: col.flex, textAlign: "right" } }, col.label)),
          ),
          ...rows.map((r, i) =>
            createElement(View, { key: r.id, style: i % 2 === 0 ? styles.row : styles.rowAlt },
              createElement(Text, { style: { ...styles.cell, flex: 0.7 } }, String(i + 1)),
              createElement(Text, { style: { ...styles.cellBold, flex: 1.6 } }, r.mission.code),
              createElement(Text, { style: { ...styles.cell, flex: 2 } },   r.lmd.fullName),
              ...numCols.map((col) => createElement(Text, { key: col.key, style: { ...styles.cell, flex: col.flex, textAlign: "right" } }, String((r[col.key] as number) || 0))),
            )
          ),
          createElement(View, { style: styles.totRow },
            createElement(Text, { style: { ...styles.totCell, flex: 0.7 } }, ""),
            createElement(Text, { style: { ...styles.totCell, flex: 1.6 } }, "Total"),
            createElement(Text, { style: { ...styles.totCell, flex: 2 } },   `${rows.length} LMD${rows.length !== 1 ? "s" : ""}`),
            ...numCols.map((col) => createElement(Text, { key: col.key, style: { ...styles.totCell, flex: col.flex, textAlign: "right" } }, String(totals[col.key] || 0))),
          ),
        ];
      }),

      // Narrative section
      ...(hasNarrative ? [
        createElement(View, { style: styles.narrBlock },
          createElement(Text, { style: styles.narrTitle }, "Narratives & Summaries"),
          ...reports
            .filter((r) => r.overallSummary || r.challengesAndNeeds || r.recommendationsToDirector || r.prayerRequests)
            .map((r) =>
              createElement(View, { key: `narr-${r.id}`, style: styles.narrRow },
                createElement(View, { style: styles.narrMeta },
                  createElement(Text, { style: styles.narrLabel }, `${r.mission.code} · ${MONTHS[r.reportMonth - 1]} ${r.reportYear}`),
                  createElement(Text, { style: styles.narrLmd }, r.lmd.fullName),
                ),
                createElement(View, { style: styles.narrRight },
                  ...[
                    { key: "overallSummary",            label: "Summary" },
                    { key: "challengesAndNeeds",         label: "Challenges & Needs" },
                    { key: "recommendationsToDirector",  label: "Recommendations" },
                    { key: "prayerRequests",             label: "Prayer Requests" },
                  ].filter(({ key }) => r[key as keyof typeof r]).map(({ key, label }) =>
                    createElement(View, { key, style: styles.narrField },
                      createElement(Text, { style: styles.narrKey }, label.toUpperCase()),
                      createElement(Text, { style: styles.narrVal }, String(r[key as keyof typeof r] ?? "")),
                    )
                  ),
                ),
              )
            ),
        ),
      ] : []),

      createElement(Text, { style: styles.footer }, `Generated by ${user.fullName} · ${generatedAt}`),
    ),
  );

  const buffer = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lmd-reports.pdf"`,
    },
  });
}
