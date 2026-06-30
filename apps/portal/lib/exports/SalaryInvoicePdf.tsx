import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const TEAL = "#0F6E56";
const GRAY = "#6B7280";
const DARK = "#111827";
const LIGHT = "#F9FAFB";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logoImg: { width: 44, height: 44, marginRight: 10 },
  orgName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: TEAL },
  orgSub: { fontSize: 8, color: GRAY, marginTop: 2 },
  invoiceTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: TEAL, textAlign: "right" },
  invoiceNumber: { fontSize: 8, color: GRAY, textAlign: "right", marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  billRow: { flexDirection: "row", justifyContent: "space-between" },
  billBlock: { flex: 1 },
  label: { fontSize: 8, color: GRAY, marginBottom: 2 },
  value: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  valueSub: { fontSize: 8, color: GRAY },
  table: {
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: TEAL,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tableHeadText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  tableRowAlt: { backgroundColor: LIGHT },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: LIGHT,
    borderTopWidth: 1.5,
    borderTopColor: TEAL,
    marginTop: 2,
  },
  totalLabel: { flex: 3, fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK },
  totalAmount: { flex: 1, fontSize: 13, fontFamily: "Helvetica-Bold", color: TEAL, textAlign: "right" },
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#D1FAE5",
    borderRadius: 4,
    alignSelf: "flex-end",
  },
  statusText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#065F46" },
  signatureSection: {
    marginTop: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
  },
  signatureBlock: { flex: 1 },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    marginBottom: 4,
    paddingBottom: 32,
  },
  signatureLabel: { fontSize: 7.5, color: GRAY },
  signatureName: { fontSize: 8, fontFamily: "Helvetica-Bold", color: DARK },
  signatureRole: { fontSize: 7, color: TEAL, marginTop: 1 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: "#9CA3AF" },
});

export type SalaryInvoiceData = {
  invoiceNumber: string;
  generatedAt: string;
  generatedTime: string;
  generatedBy: string;
  approvedBy: string;
  approvedByRole: string;
  logoPath?: string;
  missionaryName: string;
  missionaryEmail: string;
  missionCode: string;
  missionName: string;
  month: number;
  year: number;
  amount: number;
  notes?: string | null;
  requestId: string;
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function SalaryInvoicePdf({ data }: { data: SalaryInvoiceData }) {
  const period = `${MONTHS[data.month - 1]} ${data.year}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {data.logoPath && (
              <Image src={data.logoPath} style={styles.logoImg} />
            )}
            <View>
              <Text style={styles.orgName}>1000MM Bangladesh</Text>
              <Text style={styles.orgSub}>1000 Missionary Movement</Text>
              <Text style={styles.orgSub}>Bangladesh Adventist Union Mission</Text>
            </View>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill-to / from */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.billRow}>
            <View style={styles.billBlock}>
              <Text style={styles.label}>Payee</Text>
              <Text style={styles.value}>{data.missionaryName}</Text>
              <Text style={styles.valueSub}>{data.missionaryEmail}</Text>
              <Text style={[styles.valueSub, { marginTop: 2 }]}>{data.missionCode} — {data.missionName}</Text>
            </View>
            <View style={[styles.billBlock, { alignItems: "flex-end" }]}>
              <Text style={styles.label}>Invoice Date</Text>
              <Text style={styles.value}>{data.generatedAt}</Text>
              <Text style={[styles.label, { marginTop: 8 }]}>Payment Period</Text>
              <Text style={styles.value}>{period}</Text>
            </View>
          </View>
        </View>

        {/* Line items */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadText, styles.col1]}>Description</Text>
            <Text style={[styles.tableHeadText, styles.col2]}>Amount (BDT)</Text>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.col1}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>Missionary Salary — {period}</Text>
              <Text style={{ fontSize: 8, color: GRAY, marginTop: 2 }}>{data.missionCode} Mission · {data.missionaryName}</Text>
            </View>
            <Text style={[styles.col2, { fontSize: 10, fontFamily: "Helvetica-Bold" }]}>Tk. {data.amount.toLocaleString()}</Text>
          </View>
          {data.notes && (
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <View style={styles.col1}>
                <Text style={{ fontSize: 8, color: GRAY }}>Notes: {data.notes}</Text>
              </View>
              <Text style={styles.col2} />
            </View>
          )}
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Due</Text>
          <Text style={styles.totalAmount}>Tk. {data.amount.toLocaleString()}</Text>
        </View>

        {/* Approved stamp */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>✓ APPROVED — Ready for Bank Transfer</Text>
        </View>

        {/* Signature section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{data.approvedBy}</Text>
            <Text style={styles.signatureRole}>{data.approvedByRole}</Text>
            <Text style={styles.signatureLabel}>Approved By</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Received By (Payee Signature)</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Accounts Officer</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Ref: {data.requestId}</Text>
          <Text style={styles.footerText}>Generated: {data.generatedAt} {data.generatedTime} · {data.generatedBy}</Text>
          <Text style={styles.footerText}>1000 Missionary Movement Bangladesh · BAUM</Text>
        </View>
      </Page>
    </Document>
  );
}
