import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  Line,
  Circle,
} from "@react-pdf/renderer";

// ─── Card dimensions (mm converted to pt at 72dpi) ───────────────────────────
// A4: 595 x 842 pt, margins 20pt each side
// 2 columns × 3 rows = 6 cards per page
// Card: ~269 x 160 pt each

const TEAL = "#0F6E56";
const TEAL_LIGHT = "#E8F5F1";
const GRAY = "#6B7280";
const DARK = "#111827";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: "#F3F4F6",
    fontFamily: "Helvetica",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: "48.5%",
    height: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    backgroundColor: TEAL,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orgName: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  orgSub: {
    fontSize: 5.5,
    color: "#A7F3D0",
    marginTop: 1,
  },
  logoBox: {
    width: 22,
    height: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: TEAL,
  },
  cardBody: {
    flex: 1,
    padding: 10,
    flexDirection: "row",
    gap: 8,
  },
  photoBox: {
    width: 56,
    height: 72,
    backgroundColor: TEAL_LIGHT,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  photoLabel: {
    fontSize: 6,
    color: TEAL,
    marginTop: 4,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 3,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
    backgroundColor: TEAL_LIGHT,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  refLabel: {
    fontSize: 5.5,
    color: TEAL,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  refValue: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: TEAL,
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2.5,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 5.5,
    color: GRAY,
    width: 50,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 7,
    color: DARK,
    flex: 1,
  },
  cardFooter: {
    backgroundColor: "#F9FAFB",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 5.5,
    color: GRAY,
  },
  footerRight: {
    fontSize: 5.5,
    color: GRAY,
    fontFamily: "Helvetica-Bold",
  },
  barcodeArea: {
    width: 40,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // Placeholder barcode lines
  barcodeLine: {
    height: "100%",
    backgroundColor: DARK,
  },
});

// Simple barcode placeholder (vertical lines)
function BarcodePlaceholder({ value }: { value: string }) {
  const lines = value.split("").map((c) => c.charCodeAt(0) % 3);
  return (
    <Svg width="40" height="20" viewBox="0 0 40 20">
      {lines.slice(0, 20).map((w, i) => (
        <Rect
          key={i}
          x={i * 2}
          y={0}
          width={w === 0 ? 1 : w === 1 ? 1.5 : 2}
          height={20}
          fill="#111827"
        />
      ))}
    </Svg>
  );
}

// Person silhouette SVG
function PersonIcon() {
  return (
    <Svg width="24" height="28" viewBox="0 0 24 28">
      <Circle cx="12" cy="8" r="6" fill="#0F6E56" opacity="0.3" />
      <Rect
        x="3"
        y="16"
        width="18"
        height="12"
        rx="4"
        fill="#0F6E56"
        opacity="0.3"
      />
    </Svg>
  );
}

export type IdCardData = {
  enrollmentId: string;
  referenceNumber: string;
  fullName: string;
  missionCode: string;
  programCode: string;
  programTitle: string;
  deploymentLocation: string | null;
  enrolledAt: string;
  validUntil: string;
};

export function IdCardPdf({
  cards,
  generatedAt,
}: {
  cards: IdCardData[];
  generatedAt: string;
}) {
  // Split into pages of 6
  const pages: IdCardData[][] = [];
  for (let i = 0; i < cards.length; i += 6) {
    pages.push(cards.slice(i, i + 6));
  }

  return (
    <Document>
      {pages.map((pageCards, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <View style={styles.grid}>
            {pageCards.map((card) => (
              <View key={card.enrollmentId} style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orgName}>1000MM Bangladesh</Text>
                    <Text style={styles.orgSub}>
                      Missionary Training Programme
                    </Text>
                  </View>
                  <View style={styles.logoBox}>
                    <Text style={styles.logoText}>M</Text>
                  </View>
                </View>

                {/* Body */}
                <View style={styles.cardBody}>
                  {/* Photo placeholder */}
                  <View style={styles.photoBox}>
                    <PersonIcon />
                    <Text style={styles.photoLabel}>PHOTO</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={2}>
                      {card.fullName}
                    </Text>

                    <View style={styles.refRow}>
                      <Text style={styles.refLabel}>ID:</Text>
                      <Text style={styles.refValue}>
                        {card.referenceNumber}
                      </Text>
                    </View>

                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Mission</Text>
                      <Text
                        style={[
                          styles.fieldValue,
                          { fontFamily: "Helvetica-Bold", color: TEAL },
                        ]}
                      >
                        {card.missionCode}
                      </Text>
                    </View>

                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Program</Text>
                      <Text style={styles.fieldValue}>{card.programCode}</Text>
                    </View>

                    {card.deploymentLocation && (
                      <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Deployed</Text>
                        <Text style={styles.fieldValue} numberOfLines={1}>
                          {card.deploymentLocation}
                        </Text>
                      </View>
                    )}

                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Valid</Text>
                      <Text style={styles.fieldValue}>{card.validUntil}</Text>
                    </View>
                  </View>

                  {/* Barcode */}
                  <View style={styles.barcodeArea}>
                    <BarcodePlaceholder value={card.referenceNumber} />
                    <Text style={{ fontSize: 4.5, color: GRAY, marginTop: 2 }}>
                      {card.referenceNumber}
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.footerLeft}>
                    Enrolled: {card.enrolledAt}
                  </Text>
                  <Text style={styles.footerRight}>BAUM · Bangladesh</Text>
                </View>
              </View>
            ))}

            {/* Fill empty slots on last page to keep grid even */}
            {pageCards.length % 2 !== 0 && (
              <View
                style={[
                  styles.card,
                  { backgroundColor: "transparent", borderWidth: 0 },
                ]}
              />
            )}
          </View>

          {/* Page footer */}
          <View style={{ marginTop: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 5.5, color: "#9CA3AF" }}>
              Generated: {generatedAt} · Page {pageIndex + 1} of {pages.length}{" "}
              · CONFIDENTIAL
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
