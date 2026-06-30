import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 30,
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
  },
  org: { fontSize: 7, color: "#6b7280", marginBottom: 3 },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 2 },
  subtitle: { fontSize: 8, color: "#4b5563" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  meta: { fontSize: 7, color: "#6b7280" },
  topicBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ede9fe",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  topicText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#5b21b6" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 4,
    marginTop: 10,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 3,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 3,
    backgroundColor: "#f9fafb",
  },
  colNo: { width: "5%", paddingHorizontal: 3 },
  colName: { width: "30%", paddingHorizontal: 3 },
  colMission: { width: "15%", paddingHorizontal: 3 },
  colEmail: { width: "25%", paddingHorizontal: 3 },
  colEnrolled: { width: "13%", paddingHorizontal: 3 },
  colConfirmed: { width: "12%", paddingHorizontal: 3 },
  cellHeader: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#374151" },
  cell: { fontSize: 7, color: "#374151" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 30,
    right: 30,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 6, color: "#9ca3af" },
});

export type TrainerRosterRow = {
  fullName: string;
  email: string;
  missionCode: string;
  enrolledAt: string;
  attendanceConfirmed: boolean;
};

type Props = {
  programTitle: string;
  programCode: string;
  topicTitle: string;
  trainerName: string;
  rows: TrainerRosterRow[];
  generatedAt: string;
  generatedBy: string;
};

export function TrainerRosterPdf({ programTitle, programCode, topicTitle, trainerName, rows, generatedAt, generatedBy }: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.org}>1000 Missionary Movement Bangladesh — Trainer Report</Text>
          <Text style={styles.title}>Trainee Roster</Text>
          <Text style={styles.subtitle}>{programCode} — {programTitle}</Text>
          <View style={styles.topicBadge}>
            <Text style={styles.topicText}>Topic: {topicTitle}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>Trainer: {trainerName}</Text>
            <Text style={styles.meta}>Total Trainees: {rows.length} · Confirmed: {rows.filter(r => r.attendanceConfirmed).length}</Text>
            <Text style={styles.meta}>Generated: {generatedAt} · By: {generatedBy}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.cellHeader, styles.colNo]}>#</Text>
          <Text style={[styles.cellHeader, styles.colName]}>Full Name</Text>
          <Text style={[styles.cellHeader, styles.colMission]}>Mission</Text>
          <Text style={[styles.cellHeader, styles.colEmail]}>Email</Text>
          <Text style={[styles.cellHeader, styles.colEnrolled]}>Enrolled</Text>
          <Text style={[styles.cellHeader, styles.colConfirmed]}>Attendance</Text>
        </View>

        {rows.map((r, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.cell, styles.colNo]}>{i + 1}</Text>
            <Text style={[styles.cell, styles.colName]}>{r.fullName}</Text>
            <Text style={[styles.cell, styles.colMission]}>{r.missionCode}</Text>
            <Text style={[styles.cell, styles.colEmail]}>{r.email}</Text>
            <Text style={[styles.cell, styles.colEnrolled]}>{r.enrolledAt}</Text>
            <Text style={[styles.cell, styles.colConfirmed]}>{r.attendanceConfirmed ? "Confirmed" : "Pending"}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>1000MMBD Portal — Confidential</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
