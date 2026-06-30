import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    fontFamily: "Helvetica",
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    backgroundColor: "#FFFFFF",
  },
  header: { marginBottom: 32, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 16 },
  orgName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 2 },
  orgSub: { fontSize: 9, color: "#6b7280" },
  letterRef: { fontSize: 9, color: "#6b7280", marginBottom: 24 },
  date: { fontSize: 11, color: "#374151", marginBottom: 20 },
  subject: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 16 },
  salutation: { fontSize: 11, color: "#374151", marginBottom: 12 },
  body: { fontSize: 11, color: "#374151", lineHeight: 1.6, marginBottom: 12 },
  signatureSection: { marginTop: 36 },
  signatureLine: { fontSize: 11, color: "#374151", marginBottom: 4 },
  signatureName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 2 },
  signatureTitle: { fontSize: 9, color: "#6b7280" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 60,
    right: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
  footerText: { fontSize: 7.5, color: "#9ca3af" },
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, fullName: true },
  });
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get("id");
  const letterType = searchParams.get("type") ?? "invitation"; // "invitation" | "recommendation"

  if (!applicationId) {
    return new NextResponse("Missing id", { status: 400 });
  }

  const application = await prisma.trainerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) {
    return new NextResponse("Not found", { status: 404 });
  }

  const isInvitation = letterType === "invitation";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const refNo = `1000MM/BD/${isInvitation ? "INV" : "REC"}/${new Date().getFullYear()}/${applicationId.slice(-6).toUpperCase()}`;

  const defaultInvitationBody = `We are pleased to invite you to serve as a Trainer with the 1000 Missionary Movement Bangladesh (1000MM BD) programme. Your application has been reviewed and we would like to formally extend an invitation for you to participate in our upcoming training sessions.

The 1000 Missionary Movement Bangladesh is a national mission initiative aimed at training and deploying missionaries across Bangladesh. As a Trainer, you will play a vital role in equipping participants with the spiritual and practical tools necessary for effective missionary work.

Your area of specialisation — ${application.specialization} — aligns well with the needs of our programme. We look forward to welcoming you to our team.

Please present this letter along with a valid form of identification upon your arrival. For any queries regarding logistics or programme details, do not hesitate to contact our office.`;

  const defaultRecommendationBody = `This letter serves as a formal recommendation for ${application.fullName} as a prospective Trainer with the 1000 Missionary Movement Bangladesh (1000MM BD) programme.

${application.fullName} has applied to serve as a Trainer within our organisation and their application has been thoroughly reviewed. Based on their stated expertise in ${application.specialization} and their background as presented in their application, we find them to be a suitable candidate for the Trainer role.

We commend ${application.fullName} to any institution or organisation that may require confirmation of their participation and standing with the 1000 Missionary Movement Bangladesh.`;

  const invitationBody = application.invitationLetterBody ?? defaultInvitationBody;
  const recommendationBody = application.recommendationLetterBody ?? defaultRecommendationBody;

  // Build required docs section for invitation letters
  const requiredDocs = [
    application.requiredDoc1,
    application.requiredDoc2,
    application.requiredDoc3,
    application.requiredDoc4,
  ].filter(Boolean) as string[];

  const buffer = await renderToBuffer(
    React.createElement(
      Document,
      {},
      React.createElement(
        Page,
        { size: "A4", style: styles.page },

        // Header
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(Text, { style: styles.orgName }, "1000 Missionary Movement Bangladesh"),
          React.createElement(Text, { style: styles.orgSub }, "BAUM — Bangladesh Adventist Union Mission"),
        ),

        // Ref + Date
        React.createElement(Text, { style: styles.letterRef }, `Ref: ${refNo}`),
        React.createElement(Text, { style: styles.date }, dateStr),

        // Addressee
        React.createElement(Text, { style: styles.body }, `To`),
        React.createElement(Text, { style: styles.body }, `${application.fullName}`),
        ...(application.country ? [React.createElement(Text, { style: styles.body }, application.country)] : []),

        // Subject
        React.createElement(
          Text,
          { style: styles.subject },
          `Re: ${isInvitation ? "Invitation Letter — Trainer Programme" : "Letter of Recommendation — Trainer Applicant"}`
        ),

        // Salutation
        React.createElement(Text, { style: styles.salutation }, `Dear ${application.fullName.split(" ")[0]},`),

        // Body
        React.createElement(Text, { style: styles.body }, isInvitation ? invitationBody : recommendationBody),

        // Required documents section (invitation only)
        ...(isInvitation && requiredDocs.length > 0 ? [
          React.createElement(Text, { style: { ...styles.body, fontFamily: "Helvetica-Bold", marginTop: 12 } }, "Necessary Documents:"),
          ...requiredDocs.map((doc, i) =>
            React.createElement(Text, { key: i, style: { ...styles.body, marginBottom: 2 } }, `${i + 1}. ${doc}`)
          ) as any,
        ] : []),

        // Closing
        React.createElement(Text, { style: { ...styles.body, marginTop: 12 } }, "Yours sincerely,"),

        // Signature
        React.createElement(
          View,
          { style: styles.signatureSection },
          React.createElement(Text, { style: styles.signatureName }, user.fullName),
          React.createElement(Text, { style: styles.signatureTitle }, "System Administrator, 1000 Missionary Movement Bangladesh"),
        ),

        // Footer
        React.createElement(
          View,
          { style: styles.footer, fixed: true },
          React.createElement(Text, { style: styles.footerText }, "1000 Missionary Movement Bangladesh · BAUM · Confidential"),
          React.createElement(Text, { style: styles.footerText }, `Generated: ${dateStr}`),
        ),
      ),
    )
  );

  const filename = `${isInvitation ? "invitation" : "recommendation"}-${application.fullName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
