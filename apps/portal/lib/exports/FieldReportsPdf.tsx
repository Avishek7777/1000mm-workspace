import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const TEAL = "#0F6E56";
const GRAY = "#6b7280";

const styles = StyleSheet.create({
  page: {
    fontSize: 7,
    fontFamily: "Helvetica",
    paddingTop: 32,
    paddingBottom: 44,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: TEAL,
    paddingBottom: 7,
  },
  headerTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: TEAL, marginBottom: 2 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  meta: { fontSize: 6.5, color: GRAY },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: TEAL,
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 2.5,
    paddingHorizontal: 2,
    backgroundColor: "#FFFFFF",
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 2.5,
    paddingHorizontal: 2,
    backgroundColor: "#f9fafb",
  },
  cellHeader: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#FFFFFF", paddingHorizontal: 2 },
  cell: { fontSize: 6.5, color: "#374151", paddingHorizontal: 2 },
  totalsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: TEAL,
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginTop: 2,
    backgroundColor: "#f0fdf4",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 4,
  },
  footerText: { fontSize: 6, color: "#9ca3af" },
});

const COL = {
  no:        "3%",
  name:      "15%",
  mission:   "6%",
  program:   "7%",
  period:    "8%",
  acts:      "5%",
  days:      "4%",
  hours:     "4%",
  visits:    "5%",
  bible:     "5%",
  medical:   "5%",
  worship:   "5%",
  groups:    "5%",
  cands:     "6%",
  baptisms:  "6%",
  reached:   "6%",
  submitted: "10%",
};

export type FieldReportRow = {
  fullName: string;
  missionCode: string;
  programCode: string;
  reportMonth: number;
  reportYear: number;
  totalActivities: number;
  daysOfWork: number;
  hoursOfWork: number;
  nonSdaHomeVisits: number;
  bibleStudies: number;
  medicalVisits: number;
  worshipSessions: number;
  newGroups: number;
  baptismCandidates: number;
  baptisms: number;
  peopleReached: number;
  submittedAt: string;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function FieldReportsPdf({
  reports,
  generatedAt,
  filterLabel,
  generatedBy,
}: {
  reports: FieldReportRow[];
  generatedAt: string;
  filterLabel: string;
  generatedBy: string;
}) {
  const totals = reports.reduce(
    (s, r) => ({
      acts: s.acts + r.totalActivities,
      days: s.days + r.daysOfWork,
      hours: s.hours + r.hoursOfWork,
      visits: s.visits + r.nonSdaHomeVisits,
      bible: s.bible + r.bibleStudies,
      medical: s.medical + r.medicalVisits,
      worship: s.worship + r.worshipSessions,
      groups: s.groups + r.newGroups,
      cands: s.cands + r.baptismCandidates,
      baptisms: s.baptisms + r.baptisms,
      reached: s.reached + r.peopleReached,
    }),
    { acts:0, days:0, hours:0, visits:0, bible:0, medical:0, worship:0, groups:0, cands:0, baptisms:0, reached:0 },
  );

  const cols = [
    { label: "#",           w: COL.no },
    { label: "Missionary",  w: COL.name },
    { label: "Mission",     w: COL.mission },
    { label: "Program",     w: COL.program },
    { label: "Period",      w: COL.period },
    { label: "Activities",  w: COL.acts },
    { label: "Days",        w: COL.days },
    { label: "Hours",       w: COL.hours },
    { label: "Visits",      w: COL.visits },
    { label: "Bible St.",   w: COL.bible },
    { label: "Medical",     w: COL.medical },
    { label: "Worship",     w: COL.worship },
    { label: "Groups",      w: COL.groups },
    { label: "Candidates",  w: COL.cands },
    { label: "Baptisms",    w: COL.baptisms },
    { label: "Reached",     w: COL.reached },
    { label: "Submitted",   w: COL.submitted },
  ];

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <Text style={styles.headerTitle}>1000 Missionary Movement Bangladesh — Field Reports</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{filterLabel} · {reports.length} report{reports.length !== 1 ? "s" : ""}</Text>
            <Text style={styles.meta}>Generated: {generatedAt} · {generatedBy}</Text>
          </View>
        </View>

        {/* Table header */}
        <View style={styles.tableHeader} fixed>
          {cols.map((c) => (
            <Text key={c.label} style={[styles.cellHeader, { width: c.w }]}>{c.label}</Text>
          ))}
        </View>

        {/* Rows */}
        {reports.map((r, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.cell, { width: COL.no, color: "#9ca3af" }]}>{i + 1}</Text>
            <Text style={[styles.cell, { width: COL.name, fontFamily: "Helvetica-Bold" }]}>{r.fullName}</Text>
            <Text style={[styles.cell, { width: COL.mission, color: "#7c3aed", fontFamily: "Helvetica-Bold" }]}>{r.missionCode}</Text>
            <Text style={[styles.cell, { width: COL.program, color: GRAY, fontFamily: "Helvetica-Bold" }]}>{r.programCode}</Text>
            <Text style={[styles.cell, { width: COL.period, color: GRAY }]}>{MONTHS[r.reportMonth - 1]} {r.reportYear}</Text>
            <Text style={[styles.cell, { width: COL.acts }]}>{r.totalActivities}</Text>
            <Text style={[styles.cell, { width: COL.days }]}>{r.daysOfWork}</Text>
            <Text style={[styles.cell, { width: COL.hours }]}>{r.hoursOfWork}</Text>
            <Text style={[styles.cell, { width: COL.visits }]}>{r.nonSdaHomeVisits}</Text>
            <Text style={[styles.cell, { width: COL.bible }]}>{r.bibleStudies}</Text>
            <Text style={[styles.cell, { width: COL.medical }]}>{r.medicalVisits}</Text>
            <Text style={[styles.cell, { width: COL.worship }]}>{r.worshipSessions}</Text>
            <Text style={[styles.cell, { width: COL.groups }]}>{r.newGroups}</Text>
            <Text style={[styles.cell, { width: COL.cands }]}>{r.baptismCandidates}</Text>
            <Text style={[styles.cell, { width: COL.baptisms, color: TEAL, fontFamily: "Helvetica-Bold" }]}>{r.baptisms}</Text>
            <Text style={[styles.cell, { width: COL.reached }]}>{r.peopleReached}</Text>
            <Text style={[styles.cell, { width: COL.submitted, color: GRAY }]}>{r.submittedAt}</Text>
          </View>
        ))}

        {/* Totals */}
        {reports.length > 0 && (
          <View style={styles.totalsRow}>
            <Text style={[styles.cellHeader, { width: COL.no, color: TEAL }]} />
            <Text style={[styles.cellHeader, { width: COL.name, color: TEAL }]}>TOTALS</Text>
            <Text style={[styles.cell,       { width: COL.mission }]} />
            <Text style={[styles.cell,       { width: COL.program }]} />
            <Text style={[styles.cell,       { width: COL.period }]} />
            <Text style={[styles.cellHeader, { width: COL.acts, color: TEAL }]}>{totals.acts}</Text>
            <Text style={[styles.cellHeader, { width: COL.days, color: TEAL }]}>{totals.days}</Text>
            <Text style={[styles.cellHeader, { width: COL.hours, color: TEAL }]}>{totals.hours}</Text>
            <Text style={[styles.cellHeader, { width: COL.visits, color: TEAL }]}>{totals.visits}</Text>
            <Text style={[styles.cellHeader, { width: COL.bible, color: TEAL }]}>{totals.bible}</Text>
            <Text style={[styles.cellHeader, { width: COL.medical, color: TEAL }]}>{totals.medical}</Text>
            <Text style={[styles.cellHeader, { width: COL.worship, color: TEAL }]}>{totals.worship}</Text>
            <Text style={[styles.cellHeader, { width: COL.groups, color: TEAL }]}>{totals.groups}</Text>
            <Text style={[styles.cellHeader, { width: COL.cands, color: TEAL }]}>{totals.cands}</Text>
            <Text style={[styles.cellHeader, { width: COL.baptisms, color: TEAL }]}>{totals.baptisms}</Text>
            <Text style={[styles.cellHeader, { width: COL.reached, color: TEAL }]}>{totals.reached}</Text>
            <Text style={[styles.cell,       { width: COL.submitted }]} />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>1000MM Bangladesh · BAUM · Confidential · Generated by {generatedBy}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
