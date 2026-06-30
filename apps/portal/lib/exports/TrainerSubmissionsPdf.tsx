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
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTopic: { backgroundColor: "#ede9fe" },
  badgeTopicText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#5b21b6" },
  badgeDue: { backgroundColor: "#fef3c7" },
  badgeDueText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#92400e" },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    marginBottom: 2,
  },
  stat: { fontSize: 7, color: "#374151" },
  statNum: { fontFamily: "Helvetica-Bold" },
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
  colNo: { width: "4%", paddingHorizontal: 2 },
  colName: { width: "22%", paddingHorizontal: 2 },
  colMission: { width: "10%", paddingHorizontal: 2 },
  colStatus: { width: "10%", paddingHorizontal: 2 },
  colSubmitted: { width: "13%", paddingHorizontal: 2 },
  colNotes: { width: "25%", paddingHorizontal: 2 },
  colFeedback: { width: "16%", paddingHorizontal: 2 },
  cellHeader: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#374151" },
  cell: { fontSize: 6.5, color: "#374151" },
  cellGreen: { fontSize: 6.5, color: "#065f46", fontFamily: "Helvetica-Bold" },
  cellAmber: { fontSize: 6.5, color: "#92400e" },
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

export type SubmissionRow = {
  fullName: string;
  missionCode: string;
  submitted: boolean;
  submittedAt: string | null;
  notes: string | null;
  hasFile: boolean;
  feedback: string | null;
  feedbackAt: string | null;
};

type Props = {
  programTitle: string;
  programCode: string;
  topicTitle: string;
  assignmentTitle: string;
  dueDate: string | null;
  trainerName: string;
  rows: SubmissionRow[];
  generatedAt: string;
  generatedBy: string;
};

export function TrainerSubmissionsPdf({
  programTitle, programCode, topicTitle, assignmentTitle, dueDate,
  trainerName, rows, generatedAt, generatedBy,
}: Props) {
  const submitted = rows.filter((r) => r.submitted).length;
  const pending = rows.length - submitted;
  const feedbackGiven = rows.filter((r) => r.feedback).length;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.org}>1000 Missionary Movement Bangladesh — Assignment Submissions</Text>
          <Text style={styles.title}>{assignmentTitle}</Text>
          <Text style={styles.subtitle}>{programCode} — {programTitle}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgeTopic]}>
              <Text style={styles.badgeTopicText}>Topic: {topicTitle}</Text>
            </View>
            {dueDate && (
              <View style={[styles.badge, styles.badgeDue]}>
                <Text style={styles.badgeDueText}>Due: {dueDate}</Text>
              </View>
            )}
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.stat}><Text style={styles.statNum}>{submitted}</Text> submitted</Text>
            <Text style={styles.stat}><Text style={styles.statNum}>{pending}</Text> pending</Text>
            <Text style={styles.stat}><Text style={styles.statNum}>{feedbackGiven}</Text> feedback given</Text>
            <Text style={styles.stat}><Text style={styles.statNum}>{rows.length}</Text> total enrolled</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>Trainer: {trainerName}</Text>
            <Text style={styles.meta}>Generated: {generatedAt} · By: {generatedBy}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.cellHeader, styles.colNo]}>#</Text>
          <Text style={[styles.cellHeader, styles.colName]}>Trainee</Text>
          <Text style={[styles.cellHeader, styles.colMission]}>Mission</Text>
          <Text style={[styles.cellHeader, styles.colStatus]}>Status</Text>
          <Text style={[styles.cellHeader, styles.colSubmitted]}>Submitted At</Text>
          <Text style={[styles.cellHeader, styles.colNotes]}>Response Notes</Text>
          <Text style={[styles.cellHeader, styles.colFeedback]}>Feedback</Text>
        </View>

        {rows.map((r, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.cell, styles.colNo]}>{i + 1}</Text>
            <Text style={[styles.cell, styles.colName]}>{r.fullName}</Text>
            <Text style={[styles.cell, styles.colMission]}>{r.missionCode}</Text>
            <Text style={[r.submitted ? styles.cellGreen : styles.cellAmber, styles.colStatus]}>
              {r.submitted ? (r.hasFile ? "Submitted (file)" : "Submitted") : "Pending"}
            </Text>
            <Text style={[styles.cell, styles.colSubmitted]}>{r.submittedAt ?? "—"}</Text>
            <Text style={[styles.cell, styles.colNotes]}>{r.notes ?? (r.hasFile ? "[File attached]" : "—")}</Text>
            <Text style={[styles.cell, styles.colFeedback]}>{r.feedback ?? "—"}</Text>
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
