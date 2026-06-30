import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import path from "path";
import { readFileSync } from "fs";

const TEAL = "#0d7a6e";

const styles = StyleSheet.create({
  page:      { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  hdr:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 10, marginBottom: 18 },
  logo:      { width: 38, height: 38 },
  hCenter:   { alignItems: "center" },
  hTitle:    { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#111" },
  hSub:      { fontSize: 8.5, color: TEAL, marginTop: 2 },
  hMeta:     { fontSize: 7, color: "#666", marginTop: 1.5 },
  name:      { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#111", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  badge:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, fontSize: 8, fontFamily: "Helvetica-Bold" },
  section:   { marginBottom: 14 },
  secTitle:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: TEAL, textTransform: "uppercase", letterSpacing: 1, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingBottom: 3, marginBottom: 8 },
  row:       { flexDirection: "row", marginBottom: 5 },
  label:     { width: 120, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  value:     { flex: 1, fontSize: 8.5, color: "#1a1a1a" },
  ackRow:    { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  ackDot:    { width: 8, height: 8, marginRight: 6, marginTop: 0.5 },
  ackText:   { flex: 1, fontSize: 8, color: "#374151" },
  docRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 0.4, borderColor: "#e5e7eb", borderRadius: 4, padding: "4 8", marginBottom: 3 },
  docLabel:  { fontSize: 8, color: "#374151" },
  docStatus: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  footer:    { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: "#e5e7eb", paddingTop: 5 },
  footerTxt: { fontSize: 6.5, color: "#9ca3af" },
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, fullName: true } });
  if (!user || user.role !== "SYSTEM_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const app = await prisma.trainerApplication.findUnique({
    where: { id },
    include: {
      reviewedBy: { select: { fullName: true } },
      attachments: { include: { uploadedBy: { select: { fullName: true } } }, orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!app) return new NextResponse("Not found", { status: 404 });

  let logoSrc: string | undefined;
  let sdaSrc:  string | undefined;
  try {
    logoSrc = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png")).toString("base64")}`;
    sdaSrc  = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "sda-logo.png")).toString("base64")}`;
  } catch {}

  const generatedAt = new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const appliedAt   = new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING:  { bg: "#fef3c7", text: "#92400e" },
    APPROVED: { bg: "#d1fae5", text: "#065f46" },
    REJECTED: { bg: "#fee2e2", text: "#991b1b" },
  };
  const sc = statusColors[app.status] ?? { bg: "#f3f4f6", text: "#374151" };

  const doc = createElement(Document, {},
    createElement(Page, { size: "A4", style: styles.page },
      // Header
      createElement(View, { style: styles.hdr },
        logoSrc ? createElement(Image, { src: logoSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
        createElement(View, { style: styles.hCenter },
          createElement(Text, { style: styles.hTitle }, "1000 Missionary Movement Bangladesh"),
          createElement(Text, { style: styles.hSub },   "Trainer Application — Bio-data"),
          createElement(Text, { style: styles.hMeta },  `Generated: ${generatedAt} by ${user.fullName}`),
        ),
        sdaSrc ? createElement(Image, { src: sdaSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
      ),

      // Name + status
      createElement(Text, { style: styles.name }, app.fullName),
      createElement(View, { style: styles.statusRow },
        createElement(View, { style: { ...styles.badge, backgroundColor: sc.bg } },
          createElement(Text, { style: { color: sc.text } }, app.status.charAt(0) + app.status.slice(1).toLowerCase()),
        ),
        createElement(Text, { style: { fontSize: 7.5, color: "#9ca3af" } }, `Applied: ${appliedAt}`),
      ),

      // Personal Info
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.secTitle }, "Personal Information"),
        createElement(View, { style: styles.row }, createElement(Text, { style: styles.label }, "Email"),         createElement(Text, { style: styles.value }, app.email)),
        createElement(View, { style: styles.row }, createElement(Text, { style: styles.label }, "Phone"),         createElement(Text, { style: styles.value }, app.phone ?? "Not provided")),
        ...(app.country ? [createElement(View, { key: "country", style: styles.row }, createElement(Text, { style: styles.label }, "Country"), createElement(Text, { style: styles.value }, app.country))] : []),
        createElement(View, { style: styles.row }, createElement(Text, { style: styles.label }, "Full Address"),  createElement(Text, { style: styles.value }, app.fullAddress)),
        createElement(View, { style: styles.row }, createElement(Text, { style: styles.label }, "Specialization"),createElement(Text, { style: styles.value }, app.specialization)),
      ),

      // Acknowledgements
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.secTitle }, "Acknowledgements"),
        createElement(View, { style: styles.ackRow },
          createElement(View, { style: { ...styles.ackDot, backgroundColor: app.acceptsSelfFunding ? "#10b981" : "#d1d5db", borderRadius: 4 } }),
          createElement(Text, { style: styles.ackText }, "Accepts responsibility for own expenses (airfare, hotel, meals, personal costs)"),
        ),
        createElement(View, { style: styles.ackRow },
          createElement(View, { style: { ...styles.ackDot, backgroundColor: app.requestsInvitationLetter ? "#10b981" : "#d1d5db", borderRadius: 4 } }),
          createElement(Text, { style: styles.ackText }, "Requests an official invitation letter from 1000MM"),
        ),
      ),

      // Documents
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.secTitle }, "Submitted Documents"),
        ...[
          { label: "Curriculum Vitae (CV)", key: app.cvStorageKey },
          { label: "Passport",              key: app.passportStorageKey },
          { label: "Passport-sized Photo",  key: app.photoStorageKey },
        ].map(({ label, key }) =>
          createElement(View, { key: label, style: styles.docRow },
            createElement(Text, { style: styles.docLabel }, label),
            createElement(Text, { style: { ...styles.docStatus, color: key ? TEAL : "#9ca3af" } }, key ? "Uploaded" : "Not uploaded"),
          )
        ),
      ),

      // Admin attachments
      ...(app.attachments.length > 0 ? [
        createElement(View, { style: styles.section },
          createElement(Text, { style: styles.secTitle }, "Admin Attachments"),
          ...app.attachments.map((a) =>
            createElement(View, { key: a.id, style: styles.docRow },
              createElement(Text, { style: styles.docLabel }, a.label ? `${a.label} — ${a.fileName}` : a.fileName),
              createElement(Text, { style: { ...styles.docStatus, color: "#6b7280" } }, new Date(a.uploadedAt).toLocaleDateString("en-GB")),
            )
          ),
        ),
      ] : []),

      // Review info
      ...(!["PENDING"].includes(app.status) ? [
        createElement(View, { style: styles.section },
          createElement(Text, { style: styles.secTitle }, "Review"),
          createElement(View, { style: styles.row }, createElement(Text, { style: styles.label }, "Decision"),    createElement(Text, { style: styles.value }, app.status)),
          createElement(View, { style: styles.row }, createElement(Text, { style: styles.label }, "Reviewed By"), createElement(Text, { style: styles.value }, app.reviewedBy?.fullName ?? "—")),
          createElement(View, { style: styles.row }, createElement(Text, { style: styles.label }, "Reviewed At"), createElement(Text, { style: styles.value }, app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—")),
          ...(app.reviewNote ? [createElement(View, { key: "note", style: styles.row }, createElement(Text, { style: styles.label }, "Note"), createElement(Text, { style: styles.value }, app.reviewNote))] : []),
        ),
      ] : []),

      // Footer
      createElement(View, { style: styles.footer, fixed: true },
        createElement(Text, { style: styles.footerTxt }, "1000 Missionary Movement Bangladesh · Confidential"),
        createElement(Text, { style: styles.footerTxt }, `Generated: ${generatedAt}`),
      ),
    ),
  );

  const buffer = await renderToBuffer(doc);
  const slug = app.fullName.replace(/\s+/g, "-").toLowerCase();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="trainer-application-${slug}.pdf"`,
    },
  });
}
