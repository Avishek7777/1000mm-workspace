"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#1a5276",
    paddingBottom: 10,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1a5276",
  },
  headerSubtitle: {
    fontSize: 8,
    color: "#555",
    marginTop: 2,
  },
  refBadge: {
    backgroundColor: "#1a5276",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  refText: {
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    letterSpacing: 1.2,
  },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a5276",
    backgroundColor: "#eaf2f8",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#1a5276",
  },
  row: { flexDirection: "row", marginBottom: 5 },
  col: { flex: 1 },
  label: { fontSize: 7.5, color: "#888", marginBottom: 1 },
  value: { fontSize: 9, color: "#111", fontFamily: "Helvetica-Bold" },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    marginVertical: 6,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  docCheck: { fontSize: 9, color: "#27ae60", width: 10 },
  docMiss: { fontSize: 9, color: "#aaa", width: 10 },
  docLabel: { fontSize: 9, color: "#111" },
  docFile: { fontSize: 8, color: "#555" },
  commentBox: {
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderRadius: 3,
    padding: 6,
    marginTop: 4,
  },
  commentText: { fontSize: 9, color: "#333", lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: "#aaa" },
});

export type LmdRecommendationPDFProps = {
  referenceNumber: string;
  applicantFullName: string;
  missionName: string;
  programTitle: string;
  recommendedAt: string;
  lmdFullName: string;
  writtenComment?: string | null;
  documents: Array<{
    kind: string;
    fileName: string;
    uploaded: boolean;
  }>;
};

const DOC_LABELS: Record<string, string> = {
  RECOMMENDATION_LETTER: "Recommendation Letter",
  SWORN_STATEMENT: "Sworn Statement",
  EXCOM_VOTE_COPY: "Ex-Com Vote Copy",
};

function LV({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.col}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

export function LmdRecommendationPDF({
  referenceNumber,
  applicantFullName,
  missionName,
  programTitle,
  recommendedAt,
  lmdFullName,
  writtenComment,
  documents,
}: LmdRecommendationPDFProps) {
  const formattedDate = new Date(recommendedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            1000 Missionary Movement Bangladesh
          </Text>
          <Text style={styles.headerSubtitle}>
            Bangladesh Adventist Union Mission (BAUM)
          </Text>
          <Text style={styles.headerSubtitle}>
            LMD Recommendation Summary — {missionName}
          </Text>
        </View>

        {/* Reference badge */}
        <View style={styles.refBadge}>
          <Text style={styles.refText}>{referenceNumber}</Text>
        </View>

        {/* Applicant info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPLICANT</Text>
          <View style={styles.row}>
            <LV label="Full Name" value={applicantFullName} />
            <LV label="Reference Number" value={referenceNumber} />
          </View>
          <View style={styles.row}>
            <LV label="Program" value={programTitle} />
            <LV label="Mission" value={missionName} />
          </View>
        </View>

        {/* Recommendation details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECOMMENDATION</Text>
          <View style={styles.row}>
            <LV label="Recommended By" value={lmdFullName} />
            <LV label="Recommended At" value={formattedDate} />
          </View>
        </View>

        {/* Documents submitted */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DOCUMENTS SUBMITTED</Text>
          {["RECOMMENDATION_LETTER", "SWORN_STATEMENT", "EXCOM_VOTE_COPY"].map(
            (kind) => {
              const doc = documents.find((d) => d.kind === kind);
              return (
                <View key={kind} style={styles.docRow}>
                  <Text
                    style={doc?.uploaded ? styles.docCheck : styles.docMiss}
                  >
                    {doc?.uploaded ? "✓" : "✗"}
                  </Text>
                  <View>
                    <Text style={styles.docLabel}>
                      {DOC_LABELS[kind] ?? kind}
                    </Text>
                    {doc?.uploaded && doc.fileName && (
                      <Text style={styles.docFile}>{doc.fileName}</Text>
                    )}
                  </View>
                </View>
              );
            },
          )}
        </View>

        {/* Written comment */}
        {writtenComment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECOMMENDATION COMMENT</Text>
            <View style={styles.commentBox}>
              <Text style={styles.commentText}>{writtenComment}</Text>
            </View>
          </View>
        )}

        {/* Signature area */}
        <View
          style={{
            marginTop: 24,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View style={{ alignItems: "center", flex: 1 }}>
            <View
              style={{
                borderTopWidth: 0.5,
                borderTopColor: "#333",
                width: "70%",
                marginBottom: 4,
              }}
            />
            <Text style={{ fontSize: 7.5, color: "#555" }}>
              LMD Signature & Date
            </Text>
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <View
              style={{
                borderTopWidth: 0.5,
                borderTopColor: "#333",
                width: "70%",
                marginBottom: 4,
              }}
            />
            <Text style={{ fontSize: 7.5, color: "#555" }}>Office Stamp</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated: {formattedDate}</Text>
          <Text style={styles.footerText}>
            1000MM Bangladesh · {missionName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
