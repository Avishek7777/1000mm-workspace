"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ── Encrypted reference number ────────────────────────────────────────────────
// Short, on-the-fly encoding of the reference number for the applicant-facing
// copy. Not cryptographically secure — just obscures the sequential nature.
// Format: base64url of "1000MM:" + referenceNumber, trimmed to 16 chars.
function encodeRef(ref: string): string {
  try {
    const encoded = btoa("1000MM:" + ref)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    return encoded.slice(0, 16).toUpperCase();
  } catch {
    return ref;
  }
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 32,
    paddingBottom: 72, // extra bottom padding for footer
    paddingHorizontal: 36,
    backgroundColor: "#ffffff",
  },
  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1a5276",
    paddingBottom: 10,
    marginBottom: 14,
  },
  headerLogo: { width: 52, height: 52, objectFit: "contain" },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1a5276",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 8,
    color: "#555",
    textAlign: "center",
    marginTop: 2,
  },
  // ── Reference badge ──
  refBadge: {
    backgroundColor: "#1a5276",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "center",
    marginBottom: 14,
  },
  refText: {
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  refTokenText: {
    color: "#a8c4d8",
    fontSize: 7,
    textAlign: "center",
    marginTop: 2,
    letterSpacing: 1,
  },
  // ── Sections ──
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a5276",
    backgroundColor: "#eaf2f8",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#1a5276",
  },
  // ── Grid rows ──
  row: { flexDirection: "row", marginBottom: 3 },
  col2: { flex: 1 },
  col3: { flex: 1 },
  label: { fontSize: 7.5, color: "#888", marginBottom: 1 },
  value: { fontSize: 9, color: "#111", fontFamily: "Helvetica-Bold" },
  valueNormal: { fontSize: 9, color: "#111" },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    marginVertical: 6,
  },
  // ── Photo box ──
  photoBox: {
    width: 70,
    height: 84,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 2,
    overflow: "hidden",
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  photoImg: { width: 70, height: 84, objectFit: "cover" },
  photoPlaceholder: { fontSize: 7, color: "#aaa", textAlign: "center" },
  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 28,
    left: 36,
    right: 36,
  },
  footerSignatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  footerCol: { flex: 1, alignItems: "center" },
  footerLabel: { fontSize: 7.5, color: "#555", marginBottom: 20 },
  footerMeta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  footerMetaText: {
    fontSize: 6.5,
    color: "#aaa",
    textAlign: "right",
  },
  pageNumber: {
    position: "absolute",
    bottom: 10,
    left: 36,
    fontSize: 7,
    color: "#aaa",
  },
});

export type BioDataPDFProps = {
  referenceNumber: string;
  submittedAt: string;
  ipAddress?: string;
  logoUrl?: string;
  sdaLogoUrl?: string;
  profilePhotoUrl?: string;
  // Page 1
  applicantFullName: string;
  applicantFullNameBangla?: string;
  applicantDateOfBirth: string;
  applicantGender: string;
  applicantBloodType?: string;
  applicantMaritalStatus?: string;
  applicantDenomination?: string;
  applicantChurchName?: string;
  applicantDateOfBaptism?: string;
  applicantPlaceOfBirth?: string;
  applicantHeight?: string;
  applicantWeight?: string;
  applicantWorkplace?: string;
  applicantMobileNo?: string;
  applicantEmail?: string;
  presentAddress?: string;
  permanentAddress?: string;
  // Page 2
  fatherName?: string;
  fatherAge?: string;
  fatherReligion?: string;
  fatherChurchName?: string;
  motherName?: string;
  motherAge?: string;
  motherReligion?: string;
  motherChurchName?: string;
  familyMobileNo?: string;
  familyEmail?: string;
  // Page 3
  educationEntries?: Array<{
    degree: string;
    institutionName: string;
    gpa: string;
    passingYear: string;
  }>;
  // Page 4
  missionaryDesire?: string;
  courtRecord?: boolean;
  healthCondition?: boolean;
  badHabits?: boolean;
  // Mission
  missionName?: string;
  programTitle?: string;
};

function LabelValue({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

function Row2({ items }: { items: Array<{ label: string; value?: string }> }) {
  return (
    <View style={styles.row}>
      {items.map((item, i) => (
        <View key={i} style={styles.col2}>
          <LabelValue label={item.label} value={item.value} />
        </View>
      ))}
    </View>
  );
}

function Row3({ items }: { items: Array<{ label: string; value?: string }> }) {
  return (
    <View style={styles.row}>
      {items.map((item, i) => (
        <View key={i} style={styles.col3}>
          <LabelValue label={item.label} value={item.value} />
        </View>
      ))}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export function BioDataPDF({
  referenceNumber,
  submittedAt,
  ipAddress,
  logoUrl,
  sdaLogoUrl,
  profilePhotoUrl,
  applicantFullName,
  applicantFullNameBangla,
  applicantDateOfBirth,
  applicantGender,
  applicantBloodType,
  applicantMaritalStatus,
  applicantDenomination,
  applicantChurchName,
  applicantDateOfBaptism,
  applicantPlaceOfBirth,
  applicantHeight,
  applicantWeight,
  applicantWorkplace,
  applicantMobileNo,
  applicantEmail,
  presentAddress,
  permanentAddress,
  fatherName,
  fatherAge,
  fatherReligion,
  fatherChurchName,
  motherName,
  motherAge,
  motherReligion,
  motherChurchName,
  familyMobileNo,
  familyEmail,
  educationEntries,
  missionaryDesire,
  courtRecord,
  healthCondition,
  badHabits,
  missionName,
  programTitle,
}: BioDataPDFProps) {
  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

  const formatEnum = (v?: string) =>
    v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

  const yesNo = (v?: boolean) =>
    v === true ? "Yes" : v === false ? "No" : "—";

  // Format submission datetime
  const submittedFormatted = submittedAt
    ? new Date(submittedAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "—";

  const encodedRef = encodeRef(referenceNumber);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          {logoUrl ? (
            <Image src={logoUrl} style={styles.headerLogo} />
          ) : (
            <View
              style={[
                styles.headerLogo,
                { backgroundColor: "#eaf2f8", borderRadius: 4 },
              ]}
            >
              <Text
                style={{
                  fontSize: 7,
                  color: "#1a5276",
                  textAlign: "center",
                  marginTop: 18,
                }}
              >
                1000MM
              </Text>
            </View>
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              1000 Missionary Movement Bangladesh
            </Text>
            <Text style={styles.headerSubtitle}>
              Bangladesh Adventist Union Mission (BAUM)
            </Text>
            <Text style={styles.headerSubtitle}>
              Missionary Training Application — Bio Data Form
            </Text>
            {programTitle && (
              <Text
                style={[
                  styles.headerSubtitle,
                  { marginTop: 2, color: "#1a5276" },
                ]}
              >
                {programTitle}
              </Text>
            )}
          </View>
          {sdaLogoUrl ? (
            <Image src={sdaLogoUrl} style={styles.headerLogo} />
          ) : (
            <View
              style={[
                styles.headerLogo,
                { backgroundColor: "#eaf2f8", borderRadius: 4 },
              ]}
            >
              <Text
                style={{
                  fontSize: 7,
                  color: "#1a5276",
                  textAlign: "center",
                  marginTop: 18,
                }}
              >
                SDA
              </Text>
            </View>
          )}
        </View>

        {/* ── Reference badge ── */}
        <View style={styles.refBadge}>
          {/* <Text style={styles.refText}>{referenceNumber}</Text> */}
          <Text style={styles.refTokenText}>TOKEN: {encodedRef}</Text>
        </View>

        {/* ── Personal Details ── */}
        <View style={styles.section}>
          <SectionTitle title="1. PERSONAL DETAILS" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Row2
                items={[
                  { label: "Full Name (English)", value: applicantFullName },
                  {
                    label: "Full Name (Bangla)",
                    value: applicantFullNameBangla,
                  },
                ]}
              />
              <Row3
                items={[
                  {
                    label: "Date of Birth",
                    value: formatDate(applicantDateOfBirth),
                  },
                  { label: "Gender", value: formatEnum(applicantGender) },
                  {
                    label: "Blood Type",
                    value: applicantBloodType
                      ?.replace("_", " ")
                      .replace("POS", "+")
                      .replace("NEG", "-"),
                  },
                ]}
              />
              <Row3
                items={[
                  {
                    label: "Marital Status",
                    value: formatEnum(applicantMaritalStatus),
                  },
                  {
                    label: "Denomination",
                    value: formatEnum(applicantDenomination),
                  },
                  { label: "Place of Birth", value: applicantPlaceOfBirth },
                ]}
              />
              <Row2
                items={[
                  { label: "Church Name", value: applicantChurchName },
                  {
                    label: "Date of Baptism",
                    value: formatDate(applicantDateOfBaptism),
                  },
                ]}
              />
              <Row3
                items={[
                  { label: "Height (cm)", value: applicantHeight },
                  { label: "Weight (kg)", value: applicantWeight },
                  {
                    label: "Workplace / Occupation",
                    value: applicantWorkplace,
                  },
                ]}
              />
              <Row2
                items={[
                  { label: "Mobile No", value: applicantMobileNo },
                  { label: "Email", value: applicantEmail },
                ]}
              />
            </View>
            <View style={styles.photoBox}>
              {profilePhotoUrl ? (
                <Image src={profilePhotoUrl} style={styles.photoImg} />
              ) : (
                <Text style={styles.photoPlaceholder}>
                  {"Applicant\nPhoto"}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.divider} />
          <Row2
            items={[
              { label: "Present Address", value: presentAddress },
              { label: "Permanent Address", value: permanentAddress },
            ]}
          />
        </View>

        {/* ── Family Details ── */}
        <View style={styles.section}>
          <SectionTitle title="2. FAMILY DETAILS" />
          <Row3
            items={[
              { label: "Father's Name", value: fatherName },
              { label: "Father's Age", value: fatherAge },
              { label: "Father's Religion", value: formatEnum(fatherReligion) },
            ]}
          />
          {fatherChurchName && (
            <Row2
              items={[
                { label: "Father's Church", value: fatherChurchName },
                { label: "", value: "" },
              ]}
            />
          )}
          <Row3
            items={[
              { label: "Mother's Name", value: motherName },
              { label: "Mother's Age", value: motherAge },
              { label: "Mother's Religion", value: formatEnum(motherReligion) },
            ]}
          />
          {motherChurchName && (
            <Row2
              items={[
                { label: "Mother's Church", value: motherChurchName },
                { label: "", value: "" },
              ]}
            />
          )}
          <Row2
            items={[
              { label: "Family Mobile No", value: familyMobileNo },
              { label: "Family Email", value: familyEmail },
            ]}
          />
        </View>

        {/* ── Education ── */}
        <View style={styles.section}>
          <SectionTitle title="3. EDUCATIONAL BACKGROUND" />
          {educationEntries && educationEntries.length > 0 ? (
            educationEntries.map((e, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <Row3
                  items={[
                    { label: "Degree", value: e.degree },
                    { label: "Institution", value: e.institutionName },
                    { label: "GPA", value: e.gpa },
                  ]}
                />
                <Row2
                  items={[
                    { label: "Passing Year", value: e.passingYear },
                    { label: "", value: "" },
                  ]}
                />
                {i < educationEntries.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))
          ) : (
            <Text style={styles.valueNormal}>
              No education entries recorded.
            </Text>
          )}
        </View>

        {/* ── Application Section ── */}
        <View style={styles.section}>
          <SectionTitle title="4. APPLICATION DETAILS" />
          <LabelValue label="Missionary Desire" value={missionaryDesire} />
          <Row3
            items={[
              { label: "Criminal / Court Record", value: yesNo(courtRecord) },
              { label: "Health Condition", value: yesNo(healthCondition) },
              { label: "Harmful Habits", value: yesNo(badHabits) },
            ]}
          />
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          {/* Signature row */}
          <View style={styles.footerSignatures}>
            <View style={styles.footerCol}>
              <View
                style={{
                  borderTopWidth: 0.5,
                  borderTopColor: "#333",
                  width: "70%",
                  marginBottom: 4,
                }}
              />
              <Text style={styles.footerLabel}>Applicant Signature & Date</Text>
            </View>
            <View style={styles.footerCol}>
              <View
                style={{
                  borderTopWidth: 0.5,
                  borderTopColor: "#333",
                  width: "70%",
                  marginBottom: 4,
                }}
              />
              <Text style={styles.footerLabel}>LMD Signature & Date</Text>
            </View>
            <View style={styles.footerCol}>
              <View
                style={{
                  borderTopWidth: 0.5,
                  borderTopColor: "#333",
                  width: "70%",
                  marginBottom: 4,
                }}
              />
              <Text style={styles.footerLabel}>Office Stamp</Text>
            </View>
          </View>

          {/* Metadata row — bottom right */}
          <View style={styles.footerMeta}>
            <Text style={styles.footerMetaText}>
              {submittedFormatted}
              {ipAddress ? `  ·  ${ipAddress}` : ""}
              {`  ·  ${encodedRef}`}
            </Text>
          </View>
        </View>

        {/* Page number — bottom left */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
