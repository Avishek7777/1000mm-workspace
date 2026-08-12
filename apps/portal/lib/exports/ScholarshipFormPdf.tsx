import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, paddingTop: 24, paddingBottom: 40, paddingHorizontal: 36 },
  header: { borderBottomWidth: 1.5, borderBottomColor: "#1a5276", paddingBottom: 6, marginBottom: 8 },
  org: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#1a5276", textAlign: "center" },
  orgSub: { fontSize: 8, color: "#555", textAlign: "center", marginTop: 2 },
  formTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "center", marginTop: 6 },
  refBadge: { backgroundColor: "#1a5276", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "center", marginBottom: 10 },
  refText: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 1.2 },
  sectionTitle: {
    fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1a5276", backgroundColor: "#eaf2f8",
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 8, marginBottom: 3,
    borderLeftWidth: 3, borderLeftColor: "#1a5276",
  },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eee", paddingVertical: 2.5 },
  label: { width: "38%", fontSize: 8, color: "#666" },
  value: { width: "62%", fontSize: 8.5, color: "#111", fontFamily: "Helvetica-Bold" },
  narrativeLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#333", marginTop: 6, marginBottom: 2 },
  narrative: { fontSize: 8.5, color: "#222", lineHeight: 1.4, textAlign: "justify" },
  checkRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
  checkItem: { flexDirection: "row", alignItems: "center", width: "50%", marginBottom: 2 },
  checkbox: { width: 7, height: 7, borderWidth: 0.7, borderColor: "#555", marginRight: 4, alignItems: "center", justifyContent: "center" },
  checkFill: { width: 3.5, height: 3.5, backgroundColor: "#1a5276" },
  checkLabel: { fontSize: 7.5, color: "#222" },
  checkLabelMuted: { fontSize: 7.5, color: "#999" },
  decisionBox: { borderWidth: 0.5, borderColor: "#bbb", backgroundColor: "#fbfbfb", padding: 6, marginTop: 4 },
  decisionHead: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1a5276" },
  decisionText: { fontSize: 8, color: "#222", marginTop: 2, lineHeight: 1.4 },
  funded: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#1a7a3c", marginTop: 3 },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  signCol: { width: "45%" },
  signLine: { borderTopWidth: 0.5, borderTopColor: "#333", marginBottom: 3 },
  signLabel: { fontSize: 7.5, color: "#555" },
  pageNum: { position: "absolute", bottom: 14, left: 36, fontSize: 7, color: "#aaa" },
});

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

function Check({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={styles.checkItem}>
      <View style={styles.checkbox}>{checked ? <View style={styles.checkFill} /> : null}</View>
      <Text style={checked ? styles.checkLabel : styles.checkLabelMuted}>{label}</Text>
    </View>
  );
}

export type ScholarshipFormPdfProps = {
  referenceNumber: string;
  status: string;
  missionaryName: string;
  missionName: string;
  submittedAt: string;
  submittedByName: string;
  fields: Array<{ label: string; value?: string | null }>;
  experience: string;
  desireToStudy: string;
  familyBackground: string;
  attachments: Array<{ label: string; present: boolean }>;
  lmd?: { name: string; date: string; note: string; outcome: string } | null;
  ud?: { name: string; date: string; note: string; outcome: string; amount?: string } | null;
};

export function ScholarshipFormPdf(p: ScholarshipFormPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.org}>1000 MISSIONARY MOVEMENT BANGLADESH</Text>
          <Text style={styles.orgSub}>Bangladesh Adventist Union Mission of SDA</Text>
          <Text style={styles.orgSub}>149 Shah Ali Bagh, Mirpur-1, Dhaka-1216</Text>
          <Text style={styles.formTitle}>SCHOLARSHIP APPLICATION FORM</Text>
        </View>

        <View style={styles.refBadge}>
          <Text style={styles.refText}>{p.referenceNumber}</Text>
        </View>

        <Text style={styles.sectionTitle}>1. APPLICANT DETAILS</Text>
        <Field label="Name of Missionary" value={p.missionaryName} />
        <Field label="Local Mission" value={p.missionName} />
        {p.fields.map((f) => (
          <Field key={f.label} label={f.label} value={f.value} />
        ))}

        <Text style={styles.sectionTitle}>2. STATEMENT</Text>
        <Text style={styles.narrativeLabel}>Experience of Missionary</Text>
        <Text style={styles.narrative}>{p.experience}</Text>
        <Text style={styles.narrativeLabel}>Desire to Study &amp; Why a Scholarship is Needed</Text>
        <Text style={styles.narrative}>{p.desireToStudy}</Text>
        <Text style={styles.narrativeLabel}>Family Background of the Missionary</Text>
        <Text style={styles.narrative}>{p.familyBackground}</Text>

        <Text style={styles.sectionTitle}>3. ATTACHMENTS</Text>
        <View style={styles.checkRow}>
          {p.attachments.map((a) => (
            <Check key={a.label} label={a.label} checked={a.present} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>4. REVIEW</Text>
        {p.lmd ? (
          <View style={styles.decisionBox}>
            <Text style={styles.decisionHead}>
              Local Mission Director — {p.lmd.outcome}
            </Text>
            <Text style={styles.decisionText}>
              {p.lmd.name}, {p.lmd.date}
            </Text>
            {p.lmd.note ? <Text style={styles.decisionText}>{p.lmd.note}</Text> : null}
          </View>
        ) : (
          <Text style={styles.decisionText}>Awaiting Local Mission Director review.</Text>
        )}

        {p.ud ? (
          <View style={styles.decisionBox}>
            <Text style={styles.decisionHead}>Union Director — {p.ud.outcome}</Text>
            <Text style={styles.decisionText}>
              {p.ud.name}, {p.ud.date}
            </Text>
            {p.ud.note ? <Text style={styles.decisionText}>{p.ud.note}</Text> : null}
            {p.ud.amount ? <Text style={styles.funded}>Amount funded: {p.ud.amount}</Text> : null}
          </View>
        ) : null}

        <View style={styles.signRow}>
          <View style={styles.signCol}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>
              Submitted by: {p.submittedByName} · {p.submittedAt}
            </Text>
          </View>
          <View style={styles.signCol}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>Office Stamp</Text>
          </View>
        </View>

        <Text
          style={styles.pageNum}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
