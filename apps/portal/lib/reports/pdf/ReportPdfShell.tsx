"use client";

/**
 * lib/reports/pdf/ReportPdfShell.tsx
 * Shared PDF header, footer, and SVG chart primitives for all report PDFs.
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ─── Shared styles ────────────────────────────────────────────────────────────

export const sharedStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 36,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#1a5276",
    paddingBottom: 8,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerLeft: {},
  headerTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1a5276" },
  headerSubtitle: { fontSize: 7.5, color: "#555", marginTop: 2 },
  headerMeta: { fontSize: 7, color: "#888", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    paddingTop: 6,
  },
  footerText: { fontSize: 6.5, color: "#aaa" },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a5276",
    backgroundColor: "#eaf2f8",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 6,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#1a5276",
  },
  row: { flexDirection: "row", marginBottom: 4 },
  statCard: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 6,
    marginRight: 6,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 7,
    color: "#888",
    textAlign: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1a5276",
    textAlign: "center",
  },
  statSub: { fontSize: 7, color: "#555", textAlign: "center" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eaf2f8",
    borderBottomWidth: 0.5,
    borderBottomColor: "#1a5276",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableCell: { fontSize: 8, color: "#111" },
  tableCellHeader: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#1a5276",
  },
  aiSection: {
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: "#a8d1f0",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#f0f8ff",
  },
  aiTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1a5276",
    marginBottom: 4,
  },
  aiText: { fontSize: 8, color: "#333", lineHeight: 1.5 },
  pageNumber: {
    position: "absolute",
    bottom: 10,
    right: 36,
    fontSize: 7,
    color: "#aaa",
  },
});

// ─── SVG Chart helpers ────────────────────────────────────────────────────────
// @react-pdf/renderer supports SVG via <Svg>, <Rect>, <Line>, <Text> etc.
// We import them from @react-pdf/renderer in the actual PDF components.

export type BarChartData = { label: string; value: number; color?: string }[];
export type LineChartData = { year: number; value: number }[];
export type PieChartData = { label: string; value: number; color: string }[];

export const MISSION_COLORS: Record<string, string> = {
  EBM: "#2980b9",
  NBM: "#27ae60",
  SBM: "#8e44ad",
  WBM: "#f39c12",
};

export const CHART_COLORS = [
  "#2980b9",
  "#27ae60",
  "#8e44ad",
  "#f39c12",
  "#c0392b",
  "#16a085",
  "#d35400",
  "#7f8c8d",
];

// ─── Report header component ──────────────────────────────────────────────────

export function PdfReportHeader({
  title,
  subtitle,
  generatedAt,
  filters,
}: {
  title: string;
  subtitle?: string;
  generatedAt: string;
  filters?: string;
}) {
  return (
    <View style={sharedStyles.header}>
      <View style={sharedStyles.headerLeft}>
        <Text style={sharedStyles.headerTitle}>{title}</Text>
        {subtitle && (
          <Text style={sharedStyles.headerSubtitle}>{subtitle}</Text>
        )}
        {filters && (
          <Text style={sharedStyles.headerSubtitle}>Filters: {filters}</Text>
        )}
      </View>
      <View>
        <Text style={sharedStyles.headerMeta}>
          1000 Missionary Movement Bangladesh
        </Text>
        <Text style={sharedStyles.headerMeta}>Generated: {generatedAt}</Text>
      </View>
    </View>
  );
}

export function PdfReportFooter({ reportName }: { reportName: string }) {
  return (
    <View style={sharedStyles.footer} fixed>
      <Text style={sharedStyles.footerText}>
        1000MM Bangladesh · BAUM · {reportName}
      </Text>
      <Text
        style={sharedStyles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

export function AiInsightsPage({
  insights,
  reportName,
  generatedAt,
}: {
  insights: string;
  reportName: string;
  generatedAt: string;
}) {
  return (
    <Page size="A4" style={sharedStyles.page}>
      <PdfReportHeader
        title="AI-Generated Executive Summary"
        subtitle={`Based on ${reportName}`}
        generatedAt={generatedAt}
      />
      <View style={sharedStyles.aiSection}>
        <Text style={sharedStyles.aiTitle}>
          AI Executive Summary — Powered by Google Gemini
        </Text>
        <Text style={sharedStyles.aiText}>{insights}</Text>
      </View>
      <Text
        style={[
          sharedStyles.aiText,
          { marginTop: 8, color: "#aaa", fontSize: 7 },
        ]}
      >
        This summary was AI-generated and may not reflect all nuances of the
        data. Please verify key figures against the report.
      </Text>
      <PdfReportFooter reportName={reportName} />
    </Page>
  );
}
