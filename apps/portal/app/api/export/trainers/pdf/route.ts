// ─────────────────────────────────────────────────────────────────────────────
// FILE 2: apps/portal/app/api/export/trainers/pdf/route.ts
// GET /api/export/trainers/pdf          → all trainers as .pdf
// GET /api/export/trainers/pdf?id=xxx   → single trainer profile as .pdf
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import React from "react";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");

  const users = await prisma.user.findMany({
    where: {
      role: "TRAINER",
      deletedAt: null,
      ...(id ? { id } : {}),
    },
    include: { homeMission: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (id && users.length === 0) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  const applications = await prisma.trainerApplication.findMany({
    where: {
      status: "APPROVED",
      ...(id ? { createdUser: { id } } : { createdUserId: { not: null } }),
    },
    select: {
      createdUserId: true,
      fullAddress: true,
      specialization: true,
      phone: true,
      acceptsSelfFunding: true,
      requestsInvitationLetter: true,
    },
  });

  const appByUserId = Object.fromEntries(
    applications.map((a) => [a.createdUserId, a]),
  );

  // ── Styles ────────────────────────────────────────────────────────────────
  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 9,
      paddingTop: 40,
      paddingBottom: 50,
      paddingHorizontal: 40,
      color: "#1c1917",
    },
    // Header / branding
    pageHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: "#007f98",
    },
    brandTitle: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: "#007f98",
    },
    brandSub: { fontSize: 8, color: "#78716c", marginTop: 2 },
    exportMeta: { fontSize: 7, color: "#a8a29e", textAlign: "right" },

    // Section heading
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#007f98",
      marginTop: 14,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },

    // Table
    table: { width: "100%" },
    tableHead: {
      flexDirection: "row",
      backgroundColor: "#007f98",
      borderRadius: 3,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#f3f4f6",
    },
    tableRowAlt: {
      flexDirection: "row",
      backgroundColor: "#f0fafa",
      borderBottomWidth: 1,
      borderBottomColor: "#f3f4f6",
    },
    th: {
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
      fontSize: 8,
      padding: "5 4",
      flex: 1,
    },
    td: { fontSize: 8, padding: "4 4", flex: 1, color: "#292524" },

    // Column widths for all-trainers table
    col_num: { flex: 0.3 },
    col_name: { flex: 1.8 },
    col_email: { flex: 2.2 },
    col_mission: { flex: 1 },
    col_active: { flex: 0.6 },
    col_spec: { flex: 2.5 },

    // Single profile card
    profileCard: {
      backgroundColor: "#f8fafc",
      borderRadius: 6,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
    profileName: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: "#1c1917",
    },
    profileRole: {
      fontSize: 9,
      color: "#007f98",
      marginTop: 2,
      marginBottom: 10,
    },
    row2col: { flexDirection: "row", gap: 16 },
    halfCol: { flex: 1 },
    fieldLabel: {
      fontSize: 7,
      color: "#78716c",
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      marginBottom: 2,
      letterSpacing: 0.5,
    },
    fieldValue: { fontSize: 9, color: "#1c1917", marginBottom: 10 },

    // Badges
    badgeGreen: {
      backgroundColor: "#dcfce7",
      color: "#15803d",
      borderRadius: 3,
      paddingHorizontal: 5,
      paddingVertical: 1,
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
    },
    badgeGray: {
      backgroundColor: "#f3f4f6",
      color: "#6b7280",
      borderRadius: 3,
      paddingHorizontal: 5,
      paddingVertical: 1,
      fontSize: 7,
    },

    footer: {
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 6,
    },
    footerText: { fontSize: 7, color: "#a8a29e" },
  });

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ── Single trainer profile PDF ────────────────────────────────────────────
  if (id) {
    const user = users[0];
    const app = appByUserId[user.id];

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A4", style: styles.page },
        React.createElement(
          View,
          { style: styles.pageHeader },
          React.createElement(
            View,
            null,
            React.createElement(
              Text,
              { style: styles.brandTitle },
              "1000MM Bangladesh",
            ),
            React.createElement(
              Text,
              { style: styles.brandSub },
              "Training Platform — Trainer Profile",
            ),
          ),
          React.createElement(
            Text,
            { style: styles.exportMeta },
            "Generated: ",
            today,
          ),
        ),
        React.createElement(
          View,
          { style: styles.profileCard },
          React.createElement(
            Text,
            { style: styles.profileName },
            user.fullName,
          ),
          React.createElement(
            Text,
            { style: styles.profileRole },
            "TRAINER · ",
            user.homeMission.name,
            " (",
            user.homeMission.code,
            ")",
          ),
          React.createElement(
            View,
            { style: styles.row2col },
            React.createElement(
              View,
              { style: styles.halfCol },
              React.createElement(Text, { style: styles.fieldLabel }, "Email"),
              React.createElement(
                Text,
                { style: styles.fieldValue },
                user.email,
              ),
              React.createElement(Text, { style: styles.fieldLabel }, "Phone"),
              React.createElement(
                Text,
                { style: styles.fieldValue },
                app?.phone ?? user.phone ?? "—",
              ),
              React.createElement(
                Text,
                { style: styles.fieldLabel },
                "Account Status",
              ),
              React.createElement(
                View,
                { style: { marginBottom: 10 } },
                React.createElement(
                  Text,
                  {
                    style: user.isActive ? styles.badgeGreen : styles.badgeGray,
                  },
                  user.isActive ? "Active" : "Inactive",
                ),
              ),
              React.createElement(
                Text,
                { style: styles.fieldLabel },
                "Last Login",
              ),
              React.createElement(
                Text,
                { style: styles.fieldValue },
                user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString("en-GB")
                  : "Never",
              ),
            ),
            React.createElement(
              View,
              { style: styles.halfCol },
              React.createElement(
                Text,
                { style: styles.fieldLabel },
                "Full Address",
              ),
              React.createElement(
                Text,
                { style: styles.fieldValue },
                app?.fullAddress ?? "—",
              ),
              React.createElement(
                Text,
                { style: styles.fieldLabel },
                "Self-Funding Accepted",
              ),
              React.createElement(
                Text,
                { style: styles.fieldValue },
                app?.acceptsSelfFunding ? "Yes" : "—",
              ),
              React.createElement(
                Text,
                { style: styles.fieldLabel },
                "Invitation Letter Required",
              ),
              React.createElement(
                Text,
                { style: styles.fieldValue },
                app?.requestsInvitationLetter ? "Yes" : "No",
              ),
              React.createElement(
                Text,
                { style: styles.fieldLabel },
                "Account Created",
              ),
              React.createElement(
                Text,
                { style: styles.fieldValue },
                new Date(user.createdAt).toLocaleDateString("en-GB"),
              ),
            ),
          ),
        ),
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          "Area of Specialization",
        ),
        React.createElement(
          Text,
          { style: { ...styles.fieldValue, lineHeight: 1.5 } },
          app?.specialization ?? "Not provided",
        ),
        React.createElement(
          View,
          { style: styles.footer, fixed: true },
          React.createElement(
            Text,
            { style: styles.footerText },
            "1000MM Bangladesh Training Platform — Confidential",
          ),
          React.createElement(
            Text,
            { style: styles.footerText },
            user.fullName,
            " · Exported ",
            today,
          ),
        ),
      ),
    );

    const buffer = await renderToBuffer(doc);
    const filename = `trainer-${user.fullName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // ── All trainers PDF ──────────────────────────────────────────────────────
  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      React.createElement(
        View,
        { style: styles.pageHeader, fixed: true },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: styles.brandTitle },
            "1000MM Bangladesh",
          ),
          React.createElement(
            Text,
            { style: styles.brandSub },
            "Training Platform — All Trainers",
          ),
        ),
        React.createElement(
          View,
          { style: { alignItems: "flex-end" } },
          React.createElement(
            Text,
            { style: styles.exportMeta },
            `Generated: ${today}`,
          ),
          React.createElement(
            Text,
            { style: styles.exportMeta },
            `${users.length} trainer(s)`,
          ),
        ),
      ),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHead },
          React.createElement(
            Text,
            { style: [styles.th, styles.col_num] },
            "#",
          ),
          React.createElement(
            Text,
            { style: [styles.th, styles.col_name] },
            "Full Name",
          ),
          React.createElement(
            Text,
            { style: [styles.th, styles.col_email] },
            "Email",
          ),
          React.createElement(
            Text,
            { style: [styles.th, styles.col_mission] },
            "Mission",
          ),
          React.createElement(
            Text,
            { style: [styles.th, styles.col_active] },
            "Active",
          ),
          React.createElement(
            Text,
            { style: [styles.th, styles.col_spec] },
            "Specialization",
          ),
        ),
        users.map((user, i) => {
          const app = appByUserId[user.id];
          const rowStyle = i % 2 === 1 ? styles.tableRowAlt : styles.tableRow;
          return React.createElement(
            View,
            { key: user.id, style: rowStyle, wrap: false },
            React.createElement(
              Text,
              { style: [styles.td, styles.col_num] },
              `${i + 1}`,
            ),
            React.createElement(
              Text,
              { style: [styles.td, styles.col_name] },
              user.fullName,
            ),
            React.createElement(
              Text,
              { style: [styles.td, styles.col_email] },
              user.email,
            ),
            React.createElement(
              Text,
              { style: [styles.td, styles.col_mission] },
              user.homeMission.code,
            ),
            React.createElement(
              Text,
              { style: [styles.td, styles.col_active] },
              user.isActive ? "Yes" : "No",
            ),
            React.createElement(
              Text,
              { style: [styles.td, styles.col_spec] },
              app?.specialization ?? "—",
            ),
          );
        }),
      ),
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(
          Text,
          { style: styles.footerText },
          "1000MM Bangladesh Training Platform — Confidential",
        ),
        React.createElement(Text, {
          style: styles.footerText,
          render: ({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`,
        }),
      ),
    ),
  );

  const buffer = await renderToBuffer(doc);
  const filename = `all-trainers-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
