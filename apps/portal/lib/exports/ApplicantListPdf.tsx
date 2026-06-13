import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_LMD_REVIEW: "LMD Review",
  RETURNED_TO_APPLICANT: "Returned",
  RECOMMENDED: "Recommended",
  UNDER_MAIN_DIRECTOR_REVIEW: "Director Review",
  RETURNED_TO_LMD: "Ret. to LMD",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
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
  headerSub: {
    fontSize: 7.5,
    color: "#6b7280",
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

// Column widths (must sum to ~100%)
const COL = {
  no: "3%",
  ref: "10%",
  name: "18%",
  gender: "5%",
  mission: "6%",
  district: "10%",
  email: "17%",
  mobile: "10%",
  program: "8%",
  status: "9%",
  submitted: "9%",
};

type Applicant = {
  referenceNumber: string;
  fullName: string;
  gender: string;
  mission: string;
  program: string;
  status: string;
  submittedAt: string;
  email: string;
  mobileNo: string;
  district: string;
};

export function ApplicantListPdf({
  applications,
  generatedAt,
  filterLabel,
  totalCount,
}: {
  applications: Applicant[];
  generatedAt: string;
  filterLabel: string;
  totalCount: number;
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <Text style={styles.headerTitle}>
            1000 Missionary Movement Bangladesh — Applicant List
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {filterLabel} · {totalCount} applicants
            </Text>
            <Text style={styles.meta}>Generated: {generatedAt}</Text>
          </View>
        </View>

        {/* Table header */}
        <View style={styles.tableHeader} fixed>
          {[
            { label: "#", w: COL.no },
            { label: "Ref. No.", w: COL.ref },
            { label: "Full Name", w: COL.name },
            { label: "G", w: COL.gender },
            { label: "Mission", w: COL.mission },
            { label: "District", w: COL.district },
            { label: "Email", w: COL.email },
            { label: "Mobile", w: COL.mobile },
            { label: "Program", w: COL.program },
            { label: "Status", w: COL.status },
            { label: "Submitted", w: COL.submitted },
          ].map((col) => (
            <Text key={col.label} style={[styles.cellHeader, { width: col.w }]}>
              {col.label}
            </Text>
          ))}
        </View>

        {/* Rows */}
        {applications.map((a, i) => (
          <View
            key={i}
            style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.cell, { width: COL.no, color: "#9ca3af" }]}>
              {i + 1}
            </Text>
            <Text
              style={[
                styles.cell,
                { width: COL.ref, fontFamily: "Helvetica-Bold" },
              ]}
            >
              {a.referenceNumber}
            </Text>
            <Text style={[styles.cell, { width: COL.name }]}>{a.fullName}</Text>
            <Text
              style={[styles.cell, { width: COL.gender, color: "#6b7280" }]}
            >
              {a.gender === "MALE" ? "M" : "F"}
            </Text>
            <Text
              style={[
                styles.cell,
                {
                  width: COL.mission,
                  color: "#7c3aed",
                  fontFamily: "Helvetica-Bold",
                },
              ]}
            >
              {a.mission}
            </Text>
            <Text style={[styles.cell, { width: COL.district }]}>
              {a.district}
            </Text>
            <Text
              style={[
                styles.cell,
                { width: COL.email, color: "#6b7280", fontSize: 6.5 },
              ]}
            >
              {a.email}
            </Text>
            <Text style={[styles.cell, { width: COL.mobile }]}>
              {a.mobileNo}
            </Text>
            <Text
              style={[
                styles.cell,
                { width: COL.program, fontFamily: "Helvetica-Bold" },
              ]}
            >
              {a.program}
            </Text>
            <Text
              style={[
                styles.cell,
                {
                  width: COL.status,
                  color:
                    a.status === "ACCEPTED"
                      ? "#065f46"
                      : a.status === "REJECTED"
                        ? "#991b1b"
                        : "#374151",
                },
              ]}
            >
              {STATUS_LABELS[a.status] ?? a.status}
            </Text>
            <Text
              style={[styles.cell, { width: COL.submitted, color: "#6b7280" }]}
            >
              {a.submittedAt}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            1000MM Bangladesh · BAUM · Confidential
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
