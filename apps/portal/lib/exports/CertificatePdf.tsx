import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const TEAL = "#0F6E56";
const GOLD = "#B8860B";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#FAFAF8",
    padding: 0,
  },
  border: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 3,
    borderColor: TEAL,
    borderStyle: "solid",
  },
  innerBorder: {
    position: "absolute",
    top: 17,
    left: 17,
    right: 17,
    bottom: 17,
    borderWidth: 1,
    borderColor: GOLD,
    borderStyle: "solid",
  },
  content: {
    paddingHorizontal: 60,
    paddingTop: 40,
    paddingBottom: 36,
    alignItems: "center",
  },
  logos: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  logo: { width: 52, height: 52 },
  orgName: {
    fontSize: 10,
    color: TEAL,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  orgSub: {
    fontSize: 7.5,
    color: "#555",
    textAlign: "center",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  divider: {
    width: "80%",
    height: 1.5,
    backgroundColor: GOLD,
    marginVertical: 12,
  },
  certTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: TEAL,
    textAlign: "center",
    letterSpacing: 2,
  },
  certSub: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 1,
  },
  bodyText: {
    fontSize: 10,
    color: "#444",
    textAlign: "center",
    marginTop: 18,
    lineHeight: 1.6,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: TEAL,
    paddingBottom: 6,
    width: "70%",
  },
  programText: {
    fontSize: 10,
    color: "#444",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 1.6,
  },
  programName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: TEAL,
    textAlign: "center",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginTop: 16,
  },
  metaBox: { alignItems: "center" },
  metaLabel: { fontSize: 7, color: "#999", letterSpacing: 0.5, textTransform: "uppercase" },
  metaValue: { fontSize: 9, color: "#333", fontFamily: "Helvetica-Bold", marginTop: 2 },
  sigRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 32,
  },
  sigBox: { alignItems: "center", width: 130 },
  sigLine: { width: 110, height: 0.5, backgroundColor: "#333", marginBottom: 4 },
  sigName: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#111", textAlign: "center" },
  sigRole: { fontSize: 7, color: "#666", textAlign: "center", marginTop: 1 },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
    marginTop: 20,
  },
  refText: { fontSize: 7, color: "#aaa" },
  qrBox: { alignItems: "center" },
  qrLabel: { fontSize: 6, color: "#aaa", marginTop: 2 },
});

export type CertificateData = {
  referenceNumber: string;
  traineeName: string;
  missionName: string;
  programCode: string;
  programTitle: string;
  issuedAt: string;
  programStart: string;
  programEnd: string;
  deploymentLocation?: string | null;
  directorName: string;
  logoUrl?: string;
  sdaLogoUrl?: string;
  qrDataUrl?: string;
  verifyUrl: string;
};

export function CertificatePdf({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        <View style={styles.content}>
          {/* Logos + Org name */}
          <View style={styles.logos}>
            {data.logoUrl
              ? <Image src={data.logoUrl} style={styles.logo} />
              : <View style={styles.logo} />}
            <View style={{ alignItems: "center", flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.orgName}>1000 Missionary Movement Bangladesh</Text>
              <Text style={styles.orgSub}>Bangladesh Adventist Union Mission (BAUM)</Text>
            </View>
            {data.sdaLogoUrl
              ? <Image src={data.sdaLogoUrl} style={styles.logo} />
              : <View style={styles.logo} />}
          </View>

          <View style={styles.divider} />

          {/* Certificate heading */}
          <Text style={styles.certTitle}>CERTIFICATE</Text>
          <Text style={styles.certSub}>OF COMPLETION</Text>

          <Text style={styles.bodyText}>This is to certify that</Text>
          <Text style={styles.name}>{data.traineeName}</Text>
          <Text style={styles.bodyText}>
            of {data.missionName} has successfully completed the
          </Text>
          <Text style={styles.programName}>{data.programTitle}</Text>
          <Text style={[styles.bodyText, { marginTop: 4 }]}>
            ({data.programCode}) · {data.programStart} — {data.programEnd}
          </Text>
          {data.deploymentLocation && (
            <Text style={[styles.bodyText, { marginTop: 4, color: TEAL }]}>
              Deployed at: {data.deploymentLocation}
            </Text>
          )}

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Reference No.</Text>
              <Text style={styles.metaValue}>{data.referenceNumber}</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Issue Date</Text>
              <Text style={styles.metaValue}>{data.issuedAt}</Text>
            </View>
          </View>

          {/* Signatures */}
          <View style={styles.sigRow}>
            <View style={styles.sigBox}>
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>{data.directorName}</Text>
              <Text style={styles.sigRole}>Union Director · 1000MM Bangladesh</Text>
            </View>
            <View style={styles.sigBox}>
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>Local Mission Director</Text>
              <Text style={styles.sigRole}>{data.missionName}</Text>
            </View>
          </View>

          {/* Footer: ref + QR */}
          <View style={styles.refRow}>
            <Text style={styles.refText}>
              Verify at: {data.verifyUrl}
            </Text>
            {data.qrDataUrl && (
              <View style={styles.qrBox}>
                <Image src={data.qrDataUrl} style={{ width: 44, height: 44 }} />
                <Text style={styles.qrLabel}>Scan to verify</Text>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
