import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#92400e",
  ACTIVE: "#065f46",
  COMPLETED: "#374151",
  REJECTED: "#991b1b",
};

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
  headerTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  meta: { fontSize: 7, color: "#6b7280" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 4,
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
  cellHeader: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    paddingHorizontal: 3,
  },
  cell: {
    fontSize: 7,
    color: "#374151",
    paddingHorizontal: 3,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 4,
  },
  footerText: { fontSize: 6.5, color: "#9ca3af" },
});

const COL = {
  no: "3%",
  name: "19%",
  gender: "4%",
  phone: "9%",
  mission: "6%",
  location: "14%",
  startDate: "9%",
  endDate: "9%",
  status: "8%",
  requestedBy: "11%",
  approvedBy: "8%",
};

export type MissionaryRow = {
  fullName: string;
  gender: string;
  phone: string;
  missionCode: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  requestedBy: string;
  approvedBy: string;
};

export function MissionaryListPdf({
  missionaries,
  generatedAt,
  filterLabel,
  totalCount,
  generatedBy,
}: {
  missionaries: MissionaryRow[];
  generatedAt: string;
  filterLabel: string;
  totalCount: number;
  generatedBy: string;
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <Text style={styles.headerTitle}>
            1000 Missionary Movement Bangladesh — Missionary Deployment List
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {filterLabel} · {totalCount} record{totalCount !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.meta}>Generated: {generatedAt}</Text>
          </View>
        </View>

        {/* Table header */}
        <View style={styles.tableHeader} fixed>
          {[
            { label: "#", w: COL.no },
            { label: "Full Name", w: COL.name },
            { label: "G", w: COL.gender },
            { label: "Phone", w: COL.phone },
            { label: "Mission", w: COL.mission },
            { label: "Field Location", w: COL.location },
            { label: "Start", w: COL.startDate },
            { label: "End", w: COL.endDate },
            { label: "Status", w: COL.status },
            { label: "Requested By", w: COL.requestedBy },
            { label: "Approved By", w: COL.approvedBy },
          ].map((col) => (
            <Text key={col.label} style={[styles.cellHeader, { width: col.w }]}>
              {col.label}
            </Text>
          ))}
        </View>

        {/* Rows */}
        {missionaries.map((m, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.cell, { width: COL.no, color: "#9ca3af" }]}>{i + 1}</Text>
            <Text style={[styles.cell, { width: COL.name, fontFamily: "Helvetica-Bold" }]}>{m.fullName}</Text>
            <Text style={[styles.cell, { width: COL.gender, color: "#6b7280" }]}>
              {m.gender === "MALE" ? "M" : m.gender === "FEMALE" ? "F" : "—"}
            </Text>
            <Text style={[styles.cell, { width: COL.phone, color: "#6b7280" }]}>{m.phone}</Text>
            <Text style={[styles.cell, { width: COL.mission, fontFamily: "Helvetica-Bold", color: "#7c3aed" }]}>
              {m.missionCode}
            </Text>
            <Text style={[styles.cell, { width: COL.location }]}>{m.location}</Text>
            <Text style={[styles.cell, { width: COL.startDate, color: "#6b7280" }]}>{m.startDate}</Text>
            <Text style={[styles.cell, { width: COL.endDate, color: "#6b7280" }]}>{m.endDate}</Text>
            <Text style={[styles.cell, { width: COL.status, color: STATUS_COLOR[m.status] ?? "#374151" }]}>
              {STATUS_LABELS[m.status] ?? m.status}
            </Text>
            <Text style={[styles.cell, { width: COL.requestedBy, color: "#6b7280" }]}>{m.requestedBy}</Text>
            <Text style={[styles.cell, { width: COL.approvedBy, color: "#6b7280" }]}>{m.approvedBy}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            1000MM Bangladesh · BAUM · Confidential · Generated by {generatedBy}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
