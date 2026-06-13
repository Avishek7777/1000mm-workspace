"use client";

import {
  Document,
  Page,
  Text,
  View,
  Svg,
  Rect,
  Line,
  G,
  Path,
} from "@react-pdf/renderer";
import type { PipelineData } from "@/lib/reports/queries";
import {
  sharedStyles,
  PdfReportHeader,
  PdfReportFooter,
  AiInsightsPage,
  MISSION_COLORS,
  CHART_COLORS,
} from "./ReportPdfShell";

// ── SVG Funnel / Bar Chart ────────────────────────────────────────────────────

function HorizontalBarChart({
  data,
  width = 480,
  height,
  color = "#2980b9",
}: {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barHeight = 14;
  const gap = 6;
  const labelWidth = 160;
  const chartWidth = width - labelWidth - 40;
  const totalHeight = height ?? data.length * (barHeight + gap) + 10;

  return (
    <Svg width={width} height={totalHeight}>
      {data.map((d, i) => {
        const barW = Math.max((d.value / maxVal) * chartWidth, 2);
        const y = i * (barHeight + gap);
        return (
          <G key={i}>
            <Text
              style={{ fontSize: 7, fill: "#333" }}
              x={0}
              y={y + barHeight - 3}
            >
              {d.label}
            </Text>
            <Rect
              x={labelWidth}
              y={y}
              width={barW}
              height={barHeight}
              fill={color}
              rx={2}
            />
            <Text
              style={{ fontSize: 7, fill: "#111" }}
              x={labelWidth + barW + 4}
              y={y + barHeight - 3}
            >
              {d.value}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}

function GroupedBarChart({
  data,
  groups,
  colors,
  width = 480,
}: {
  data: { mission: string; values: number[] }[];
  groups: string[];
  colors: string[];
  width?: number;
}) {
  const maxVal = Math.max(...data.flatMap((d) => d.values), 1);
  const chartH = 120;
  const barW = 10;
  const groupW = groups.length * (barW + 2) + 8;
  const chartW = width - 40;
  const xStep = chartW / data.length;

  return (
    <Svg width={width} height={chartH + 30}>
      {/* Y axis line */}
      <Line
        x1={30}
        y1={0}
        x2={30}
        y2={chartH}
        stroke="#ddd"
        strokeWidth={0.5}
      />
      {/* Bars */}
      {data.map((d, gi) => {
        const baseX = 30 + gi * xStep + (xStep - groupW) / 2;
        return (
          <G key={gi}>
            {d.values.map((val, vi) => {
              const barH = (val / maxVal) * chartH;
              const x = baseX + vi * (barW + 2);
              const y = chartH - barH;
              return (
                <G key={vi}>
                  <Rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    fill={colors[vi]}
                    rx={1}
                  />
                </G>
              );
            })}
            <Text
              style={{ fontSize: 6.5, fill: "#555" }}
              x={baseX + groupW / 2 - 6}
              y={chartH + 8}
            >
              {d.mission}
            </Text>
          </G>
        );
      })}
      {/* Legend */}
      {groups.map((g, i) => (
        <G key={i}>
          <Rect
            x={30 + i * 90}
            y={chartH + 18}
            width={8}
            height={6}
            fill={colors[i]}
          />
          <Text
            style={{ fontSize: 6.5, fill: "#333" }}
            x={42 + i * 90}
            y={chartH + 24}
          >
            {g}
          </Text>
        </G>
      ))}
    </Svg>
  );
}

// ─── Report 1 PDF ─────────────────────────────────────────────────────────────

export function Report1PipelinePdf({
  data,
  filters,
  aiInsights,
}: {
  data: PipelineData;
  filters?: string;
  aiInsights?: string;
}) {
  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const missionGrouped = data.byMission.map((m) => ({
    mission: m.mission,
    values: [m.submitted, m.recommended, m.accepted, m.rejected],
  }));

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        <PdfReportHeader
          title="Report 1 — Application Pipeline"
          subtitle="1000 Missionary Movement Bangladesh · BAUM"
          generatedAt={generatedAt}
          filters={filters}
        />

        {/* Summary stat cards */}
        <Text style={sharedStyles.sectionTitle}>PIPELINE SUMMARY</Text>
        <View style={sharedStyles.row}>
          {[
            { label: "Total Submitted", value: data.totals.submitted, sub: "" },
            { label: "Recommended", value: data.totals.recommended, sub: "" },
            {
              label: "Accepted",
              value: data.totals.accepted,
              sub: `${data.totals.conversionRate}% rate`,
            },
            { label: "Rejected", value: data.totals.rejected, sub: "" },
          ].map((s, i) => (
            <View
              key={i}
              style={[sharedStyles.statCard, i === 3 ? { marginRight: 0 } : {}]}
            >
              <Text style={sharedStyles.statLabel}>{s.label}</Text>
              <Text style={sharedStyles.statValue}>{s.value}</Text>
              {s.sub ? <Text style={sharedStyles.statSub}>{s.sub}</Text> : null}
            </View>
          ))}
        </View>

        {/* Funnel chart */}
        <Text style={sharedStyles.sectionTitle}>PIPELINE FUNNEL</Text>
        <HorizontalBarChart
          data={data.funnelStages.map((s) => ({
            label: s.stage,
            value: s.count,
          }))}
          color="#2980b9"
        />

        {/* By mission grouped bar */}
        <Text style={sharedStyles.sectionTitle}>BY MISSION</Text>
        <GroupedBarChart
          data={missionGrouped}
          groups={["Submitted", "Recommended", "Accepted", "Rejected"]}
          colors={["#2980b9", "#27ae60", "#16a085", "#c0392b"]}
        />

        {/* Avg days table */}
        <Text style={sharedStyles.sectionTitle}>AVERAGE DAYS PER STAGE</Text>
        <View style={sharedStyles.tableHeader}>
          <Text style={[sharedStyles.tableCellHeader, { flex: 3 }]}>Stage</Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Avg Days
          </Text>
        </View>
        {data.avgDaysPerStage.map((s, i) => (
          <View key={i} style={sharedStyles.tableRow}>
            <Text style={[sharedStyles.tableCell, { flex: 3 }]}>{s.stage}</Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {s.avgDays != null ? `${s.avgDays}d` : "—"}
            </Text>
          </View>
        ))}

        {/* LMD bottlenecks */}
        {data.lmdBottlenecks.length > 0 && (
          <>
            <Text style={sharedStyles.sectionTitle}>
              LMD BOTTLENECKS (Currently in Review)
            </Text>
            <View style={sharedStyles.tableHeader}>
              <Text style={[sharedStyles.tableCellHeader, { flex: 3 }]}>
                LMD
              </Text>
              <Text style={[sharedStyles.tableCellHeader, { flex: 1 }]}>
                Mission
              </Text>
              <Text
                style={[
                  sharedStyles.tableCellHeader,
                  { flex: 1, textAlign: "right" },
                ]}
              >
                Pending
              </Text>
              <Text
                style={[
                  sharedStyles.tableCellHeader,
                  { flex: 1, textAlign: "right" },
                ]}
              >
                Avg Days
              </Text>
            </View>
            {data.lmdBottlenecks.map((l, i) => (
              <View key={i} style={sharedStyles.tableRow}>
                <Text style={[sharedStyles.tableCell, { flex: 3 }]}>
                  {l.lmdName}
                </Text>
                <Text style={[sharedStyles.tableCell, { flex: 1 }]}>
                  {l.mission}
                </Text>
                <Text
                  style={[
                    sharedStyles.tableCell,
                    { flex: 1, textAlign: "right" },
                  ]}
                >
                  {l.pendingCount}
                </Text>
                <Text
                  style={[
                    sharedStyles.tableCell,
                    { flex: 1, textAlign: "right" },
                  ]}
                >
                  {l.avgDaysInReview != null ? `${l.avgDaysInReview}d` : "—"}
                </Text>
              </View>
            ))}
          </>
        )}

        <PdfReportFooter reportName="Application Pipeline Report" />
      </Page>

      {aiInsights && (
        <AiInsightsPage
          insights={aiInsights}
          reportName="Application Pipeline Report"
          generatedAt={generatedAt}
        />
      )}
    </Document>
  );
}
