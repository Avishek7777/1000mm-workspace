import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#92400e",
  APPROVED: "#065f46",
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
  headerTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 2 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
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
  cellHeader: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#374151", paddingHorizontal: 3 },
  cell: { fontSize: 7, color: "#374151", paddingHorizontal: 3 },
  totalsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingVertical: 4,
    marginTop: 2,
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

const COL = { no: "4%", name: "24%", mission: "8%", period: "10%", amount: "12%", status: "10%", notes: "20%", reviewedBy: "12%" };

export type SalaryRequestRow = {
  fullName: string;
  email: string;
  missionCode: string;
  period: string;
  amount: number;
  status: string;
  notes: string;
  reviewedBy: string;
};

export function SalaryRequestsPdf({
  requests,
  generatedAt,
  filterLabel,
  approvedTotal,
  generatedBy,
}: {
  requests: SalaryRequestRow[];
  generatedAt: string;
  filterLabel: string;
  approvedTotal: number;
  generatedBy: string;
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.headerTitle}>1000 Missionary Movement Bangladesh — Salary Requests</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{filterLabel} · {requests.length} record{requests.length !== 1 ? "s" : ""}</Text>
            <Text style={styles.meta}>Generated: {generatedAt}</Text>
          </View>
        </View>

        <View style={styles.tableHeader} fixed>
          {[
            { label: "#", w: COL.no },
            { label: "Missionary", w: COL.name },
            { label: "Mission", w: COL.mission },
            { label: "Period", w: COL.period },
            { label: "Amount (Tk.)", w: COL.amount },
            { label: "Status", w: COL.status },
            { label: "Notes", w: COL.notes },
            { label: "Reviewed By", w: COL.reviewedBy },
          ].map((col) => (
            <Text key={col.label} style={[styles.cellHeader, { width: col.w }]}>{col.label}</Text>
          ))}
        </View>

        {requests.map((r, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.cell, { width: COL.no, color: "#9ca3af" }]}>{i + 1}</Text>
            <Text style={[styles.cell, { width: COL.name, fontFamily: "Helvetica-Bold" }]}>{r.fullName}</Text>
            <Text style={[styles.cell, { width: COL.mission, color: "#7c3aed", fontFamily: "Helvetica-Bold" }]}>{r.missionCode}</Text>
            <Text style={[styles.cell, { width: COL.period, color: "#6b7280" }]}>{r.period}</Text>
            <Text style={[styles.cell, { width: COL.amount, fontFamily: "Helvetica-Bold" }]}>{r.amount.toLocaleString()}</Text>
            <Text style={[styles.cell, { width: COL.status, color: STATUS_COLOR[r.status] ?? "#374151" }]}>{r.status}</Text>
            <Text style={[styles.cell, { width: COL.notes, color: "#6b7280" }]}>{r.notes}</Text>
            <Text style={[styles.cell, { width: COL.reviewedBy, color: "#6b7280" }]}>{r.reviewedBy}</Text>
          </View>
        ))}

        <View style={styles.totalsRow}>
          <Text style={[styles.cellHeader, { width: "56%", textAlign: "right" }]}>Approved Total:</Text>
          <Text style={[styles.cell, { width: COL.amount, color: "#065f46", fontFamily: "Helvetica-Bold" }]}>{approvedTotal.toLocaleString()}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>1000MM Bangladesh · BAUM · Confidential · Generated by {generatedBy}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
