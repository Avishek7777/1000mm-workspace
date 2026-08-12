import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, paddingTop: 24, paddingBottom: 36, paddingHorizontal: 36 },
  header: { borderBottomWidth: 1.5, borderBottomColor: "#1a5276", paddingBottom: 6, marginBottom: 8 },
  org: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#1a5276", textAlign: "center" },
  orgSub: { fontSize: 8, color: "#555", textAlign: "center", marginTop: 2 },
  formTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "center", marginTop: 6 },
  period: { fontSize: 9, color: "#1a5276", textAlign: "center", marginTop: 2, marginBottom: 8 },
  sectionTitle: {
    fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1a5276", backgroundColor: "#eaf2f8",
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 8, marginBottom: 3,
    borderLeftWidth: 3, borderLeftColor: "#1a5276",
  },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eee", paddingVertical: 2.5 },
  label: { width: "35%", fontSize: 8, color: "#666" },
  value: { width: "65%", fontSize: 8.5, color: "#111", fontFamily: "Helvetica-Bold" },
  metricGrid: { flexDirection: "row", flexWrap: "wrap" },
  metric: {
    width: "25%", paddingVertical: 3, paddingRight: 6,
  },
  metricValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1a5276" },
  metricLabel: { fontSize: 7, color: "#777" },
  narrativeLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#333", marginTop: 6, marginBottom: 2 },
  narrative: { fontSize: 8.5, color: "#222", lineHeight: 1.4, textAlign: "justify" },
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

export type FieldReportPdfProps = {
  traineeName: string;
  traineeEmail: string;
  missionName: string;
  programTitle: string;
  period: string;
  submittedAt: string;
  workplace: string;
  lmdName: string;
  projectName: string | null;
  projectRole: string | null;
  projectProgress: string | null;
  metrics: Array<{ label: string; value: number }>;
  narratives: Array<{ label: string; value: string | null }>;
};

export function FieldReportPdf(p: FieldReportPdfProps) {
  const narratives = p.narratives.filter((n) => n.value && n.value.trim().length > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.org}>1000 MISSIONARY MOVEMENT BANGLADESH</Text>
          <Text style={styles.orgSub}>Bangladesh Adventist Union Mission of SDA</Text>
          <Text style={styles.formTitle}>MONTHLY FIELD REPORT</Text>
        </View>
        <Text style={styles.period}>{p.period}</Text>

        <Text style={styles.sectionTitle}>1. MISSIONARY</Text>
        <Field label="Name" value={p.traineeName} />
        <Field label="Email" value={p.traineeEmail} />
        <Field label="Mission" value={p.missionName} />
        <Field label="Local Director" value={p.lmdName} />
        <Field label="Programme" value={p.programTitle} />
        <Field label="Workplace" value={p.workplace} />
        <Field label="Submitted" value={p.submittedAt} />

        {/* Only printed when the report is tied to a project — reports
            predating field projects simply omit the section. */}
        {p.projectName && (
          <>
            <Text style={styles.sectionTitle}>2. FIELD PROJECT</Text>
            <Field label="Project" value={p.projectName} />
            <Field label="Role" value={p.projectRole} />
            <Field label="Project Progress" value={p.projectProgress} />
          </>
        )}

        <Text style={styles.sectionTitle}>
          {p.projectName ? "3" : "2"}. ACTIVITY METRICS
        </Text>
        <View style={styles.metricGrid}>
          {p.metrics.map((m) => (
            <View key={m.label} style={styles.metric}>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          {p.projectName ? "4" : "3"}. NARRATIVE
        </Text>
        {narratives.map((n) => (
          <View key={n.label} wrap={false}>
            <Text style={styles.narrativeLabel}>{n.label}</Text>
            <Text style={styles.narrative}>{n.value}</Text>
          </View>
        ))}

        <Text
          style={styles.pageNum}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
