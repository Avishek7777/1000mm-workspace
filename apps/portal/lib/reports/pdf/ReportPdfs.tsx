"use client";

import {
  Document,
  Page,
  Text,
  View,
  Svg,
  Rect,
  Circle,
  G,
  Line,
  Path,
} from "@react-pdf/renderer";
import type {
  DemographicsData,
  DecisionsData,
  GrowthData,
} from "@/lib/reports/queries";
import {
  sharedStyles,
  PdfReportHeader,
  PdfReportFooter,
  AiInsightsPage,
  MISSION_COLORS,
  CHART_COLORS,
} from "./ReportPdfShell";

// ── Shared SVG primitives ─────────────────────────────────────────────────────

function HorizBar({
  data,
  width = 480,
  color = "#2980b9",
}: {
  data: { label: string; value: number; pct?: number }[];
  width?: number;
  color?: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barH = 13;
  const gap = 5;
  const labelW = 140;
  const chartW = width - labelW - 50;
  const totalH = data.length * (barH + gap) + 4;

  return (
    <Svg width={width} height={totalH}>
      {data.map((d, i) => {
        const bw = Math.max((d.value / maxVal) * chartW, 2);
        const y = i * (barH + gap);
        return (
          <G key={i}>
            <Text style={{ fontSize: 7, fill: "#444" }} x={0} y={y + barH - 2}>
              {d.label}
            </Text>
            <Rect
              x={labelW}
              y={y}
              width={bw}
              height={barH}
              fill={color}
              rx={2}
            />
            <Text
              style={{ fontSize: 6.5, fill: "#111" }}
              x={labelW + bw + 4}
              y={y + barH - 2}
            >
              {d.value}
              {d.pct != null ? ` (${d.pct}%)` : ""}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}

function PieChart({
  data,
  size = 90,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  let startAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    startAngle += angle;
    const x2 = cx + r * Math.cos(startAngle);
    const y2 = cy + r * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...d, x1, y1, x2, y2, large };
  });

  return (
    <Svg width={size} height={size}>
      {slices.map((s, i) => (
        <Path
          key={i}
          d={`M${cx},${cy} L${s.x1},${s.y1} A${r},${r} 0 ${s.large},1 ${s.x2},${s.y2} Z`}
          fill={s.color}
        />
      ))}
    </Svg>
  );
}

function LineChart({
  data,
  width = 480,
  height = 100,
  color = "#2980b9",
  label = "",
}: {
  data: { x: number; y: number }[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}) {
  if (data.length < 2) return null;
  const minX = data[0].x;
  const maxX = data[data.length - 1].x;
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const padL = 30;
  const padB = 20;
  const padT = 8;
  const padR = 10;
  const chartW = width - padL - padR;
  const chartH = height - padB - padT;

  function px(x: number) {
    return padL + ((x - minX) / (maxX - minX || 1)) * chartW;
  }
  function py(y: number) {
    return padT + chartH - (y / maxY) * chartH;
  }

  const points = data.map((d) => `${px(d.x)},${py(d.y)}`).join(" ");

  return (
    <Svg width={width} height={height}>
      <Line
        x1={padL}
        y1={padT}
        x2={padL}
        y2={padT + chartH}
        stroke="#ddd"
        strokeWidth={0.5}
      />
      <Line
        x1={padL}
        y1={padT + chartH}
        x2={padL + chartW}
        y2={padT + chartH}
        stroke="#ddd"
        strokeWidth={0.5}
      />
      <Path d={`M ${points}`} fill="none" stroke={color} strokeWidth={1.5} />
      {data.map((d, i) => (
        <G key={i}>
          <Circle cx={px(d.x)} cy={py(d.y)} r={2.5} fill={color} />
          <Text
            style={{ fontSize: 6, fill: "#666" }}
            x={px(d.x) - 6}
            y={padT + chartH + 10}
          >
            {d.x}
          </Text>
        </G>
      ))}
      {label && (
        <Text style={{ fontSize: 6.5, fill: "#555" }} x={padL} y={padT - 2}>
          {label}
        </Text>
      )}
    </Svg>
  );
}

// ─── Report 2: Demographics PDF ───────────────────────────────────────────────

export function Report2DemographicsPdf({
  data,
  filters,
  aiInsights,
}: {
  data: DemographicsData;
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

  const genderPie = data.genderBreakdown.map((d, i) => ({
    ...d,
    color: CHART_COLORS[i],
  }));
  const missionPie = data.missionRepresentation.map((d) => ({
    label: d.mission,
    value: d.count,
    color: MISSION_COLORS[d.mission] ?? "#888",
  }));

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        <PdfReportHeader
          title="Report 2 — Applicant Demographics"
          subtitle="1000 Missionary Movement Bangladesh · BAUM"
          generatedAt={generatedAt}
          filters={filters}
        />

        <View style={sharedStyles.row}>
          <View style={[sharedStyles.statCard, { flex: 1 }]}>
            <Text style={sharedStyles.statLabel}>Total Applicants</Text>
            <Text style={sharedStyles.statValue}>{data.total}</Text>
          </View>
          <View style={[sharedStyles.statCard, { flex: 1 }]}>
            <Text style={sharedStyles.statLabel}>Missions</Text>
            <Text style={sharedStyles.statValue}>
              {data.missionRepresentation.length}
            </Text>
          </View>
          <View style={[sharedStyles.statCard, { flex: 1, marginRight: 0 }]}>
            <Text style={sharedStyles.statLabel}>Districts Represented</Text>
            <Text style={sharedStyles.statValue}>
              {data.topDistricts.length}+
            </Text>
          </View>
        </View>

        {/* Gender + Mission side by side */}
        <Text style={sharedStyles.sectionTitle}>GENDER BREAKDOWN</Text>
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
        >
          <PieChart data={genderPie} size={80} />
          <View style={{ flex: 1 }}>
            {data.genderBreakdown.map((d, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 3,
                }}
              >
                <Rect
                  width={8}
                  height={8}
                  fill={CHART_COLORS[i]}
                  style={{ marginRight: 4 }}
                />
                <Text style={{ fontSize: 7.5, color: "#333" }}>
                  {d.label}: {d.count} ({d.pct}%)
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={sharedStyles.sectionTitle}>AGE DISTRIBUTION</Text>
        <HorizBar data={data.ageGroups} color="#16a085" />

        <Text style={sharedStyles.sectionTitle}>MISSION REPRESENTATION</Text>
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
        >
          <PieChart data={missionPie} size={80} />
          <View style={{ flex: 1 }}>
            {data.missionRepresentation.map((d, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 3,
                }}
              >
                <Rect
                  width={8}
                  height={8}
                  fill={MISSION_COLORS[d.mission] ?? "#888"}
                  style={{ marginRight: 4 }}
                />
                <Text style={{ fontSize: 7.5, color: "#333" }}>
                  {d.mission}: {d.count} ({d.pct}%)
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={sharedStyles.sectionTitle}>DENOMINATION</Text>
        <HorizBar data={data.denomination.slice(0, 8)} color="#8e44ad" />

        <Text style={sharedStyles.sectionTitle}>TOP 10 DISTRICTS</Text>
        <View style={sharedStyles.tableHeader}>
          <Text style={[sharedStyles.tableCellHeader, { flex: 3 }]}>
            District
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Count
          </Text>
        </View>
        {data.topDistricts.map((d, i) => (
          <View key={i} style={sharedStyles.tableRow}>
            <Text style={[sharedStyles.tableCell, { flex: 3 }]}>
              {d.district}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {d.count}
            </Text>
          </View>
        ))}

        <PdfReportFooter reportName="Applicant Demographics Report" />
      </Page>

      <Page size="A4" style={sharedStyles.page}>
        <PdfReportHeader
          title="Report 2 — Demographics (cont.)"
          generatedAt={generatedAt}
        />
        <Text style={sharedStyles.sectionTitle}>MARITAL STATUS</Text>
        <HorizBar data={data.maritalStatus} color="#2980b9" />
        <Text style={sharedStyles.sectionTitle}>BLOOD TYPE DISTRIBUTION</Text>
        <HorizBar data={data.bloodType} color="#c0392b" />
        <PdfReportFooter reportName="Applicant Demographics Report" />
      </Page>

      {aiInsights && (
        <AiInsightsPage
          insights={aiInsights}
          reportName="Applicant Demographics Report"
          generatedAt={generatedAt}
        />
      )}
    </Document>
  );
}

// ─── Report 3: Decision Quality PDF ──────────────────────────────────────────

export function Report3DecisionsPdf({
  data,
  filters,
  aiInsights,
}: {
  data: DecisionsData;
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
  const o = data.overallRates;

  const decisionPie = [
    { label: "Accepted", value: o.accepted, color: "#27ae60" },
    { label: "Rejected", value: o.rejected, color: "#c0392b" },
    {
      label: "Returned to Applicant",
      value: o.returnedToApplicant,
      color: "#f39c12",
    },
    { label: "Returned to LMD", value: o.returnedToLmd, color: "#e67e22" },
  ].filter((d) => d.value > 0);

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        <PdfReportHeader
          title="Report 3 — Decision Quality"
          subtitle="1000 Missionary Movement Bangladesh · BAUM"
          generatedAt={generatedAt}
          filters={filters}
        />

        <View style={sharedStyles.row}>
          {[
            { label: "Total", value: o.total, sub: "" },
            { label: "Accepted", value: o.accepted, sub: `${o.acceptedPct}%` },
            { label: "Rejected", value: o.rejected, sub: `${o.rejectedPct}%` },
            {
              label: "Returned to LMD",
              value: o.returnedToLmd,
              sub: `${o.returnedToLmdPct}%`,
            },
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

        <Text style={sharedStyles.sectionTitle}>DECISION BREAKDOWN</Text>
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
        >
          <PieChart data={decisionPie} size={90} />
          <View style={{ flex: 1 }}>
            {decisionPie.map((d, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Rect
                  width={8}
                  height={8}
                  fill={d.color}
                  style={{ marginRight: 4 }}
                />
                <Text style={{ fontSize: 7.5, color: "#333" }}>
                  {d.label}: {d.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={sharedStyles.sectionTitle}>BY MISSION</Text>
        <View style={sharedStyles.tableHeader}>
          <Text style={[sharedStyles.tableCellHeader, { flex: 1 }]}>
            Mission
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Total
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Accepted
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Accept %
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Rejected
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Ret. LMD
          </Text>
        </View>
        {data.byMission.map((m, i) => (
          <View key={i} style={sharedStyles.tableRow}>
            <Text style={[sharedStyles.tableCell, { flex: 1 }]}>
              {m.mission}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {m.total}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {m.accepted}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {m.acceptedPct}%
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {m.rejected}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {m.returnedToLmd}
            </Text>
          </View>
        ))}

        <Text style={sharedStyles.sectionTitle}>BY LMD RECOMMENDER</Text>
        <View style={sharedStyles.tableHeader}>
          <Text style={[sharedStyles.tableCellHeader, { flex: 3 }]}>LMD</Text>
          <Text style={[sharedStyles.tableCellHeader, { flex: 1 }]}>
            Mission
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Rec.
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Acc.
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Acc%
          </Text>
        </View>
        {data.byLmd.map((l, i) => (
          <View key={i} style={sharedStyles.tableRow}>
            <Text style={[sharedStyles.tableCell, { flex: 3 }]}>
              {l.lmdName}
            </Text>
            <Text style={[sharedStyles.tableCell, { flex: 1 }]}>
              {l.mission}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {l.recommended}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {l.accepted}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {l.acceptedPct}%
            </Text>
          </View>
        ))}

        {data.rejectionReasons.length > 0 && (
          <>
            <Text style={sharedStyles.sectionTitle}>TOP REJECTION REASONS</Text>
            {data.rejectionReasons.map((r, i) => (
              <View
                key={i}
                style={[sharedStyles.tableRow, { flexDirection: "column" }]}
              >
                <Text
                  style={[
                    sharedStyles.tableCell,
                    { fontFamily: "Helvetica-Bold" },
                  ]}
                >
                  {i + 1}. ({r.count}×)
                </Text>
                <Text
                  style={[
                    sharedStyles.tableCell,
                    { color: "#555", marginTop: 1 },
                  ]}
                >
                  {r.reason}
                </Text>
              </View>
            ))}
          </>
        )}

        <PdfReportFooter reportName="Decision Quality Report" />
      </Page>

      {aiInsights && (
        <AiInsightsPage
          insights={aiInsights}
          reportName="Decision Quality Report"
          generatedAt={generatedAt}
        />
      )}
    </Document>
  );
}

// ─── Report 6: Growth PDF ─────────────────────────────────────────────────────

export function Report6GrowthPdf({
  data,
  aiInsights,
}: {
  data: GrowthData;
  aiInsights?: string;
}) {
  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const applicantLine = data.byYear.map((d) => ({
    x: d.year,
    y: d.applicants,
  }));
  const acceptedLine = data.byYear.map((d) => ({ x: d.year, y: d.accepted }));

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        <PdfReportHeader
          title="Report 6 — Year-on-Year Growth"
          subtitle="1000 Missionary Movement Bangladesh · BAUM"
          generatedAt={generatedAt}
        />

        {/* Summary table */}
        <Text style={sharedStyles.sectionTitle}>ANNUAL SUMMARY</Text>
        <View style={sharedStyles.tableHeader}>
          <Text style={[sharedStyles.tableCellHeader, { flex: 1 }]}>Year</Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Applicants
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Accepted
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Programs
          </Text>
          <Text
            style={[
              sharedStyles.tableCellHeader,
              { flex: 1, textAlign: "right" },
            ]}
          >
            Conv. %
          </Text>
        </View>
        {data.byYear.map((y, i) => (
          <View key={i} style={sharedStyles.tableRow}>
            <Text style={[sharedStyles.tableCell, { flex: 1 }]}>{y.year}</Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {y.applicants}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {y.accepted}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {y.programs}
            </Text>
            <Text
              style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}
            >
              {y.conversionRate}%
            </Text>
          </View>
        ))}

        {/* Applicants trend */}
        <Text style={sharedStyles.sectionTitle}>APPLICANT GROWTH TREND</Text>
        <LineChart
          data={applicantLine}
          color="#2980b9"
          label="Total Applicants"
          height={110}
        />

        {/* Accepted trend */}
        <Text style={sharedStyles.sectionTitle}>ACCEPTANCE TREND</Text>
        <LineChart
          data={acceptedLine}
          color="#27ae60"
          label="Accepted"
          height={110}
        />

        {/* Per-mission table */}
        <Text style={sharedStyles.sectionTitle}>BY MISSION BY YEAR</Text>
        <View style={sharedStyles.tableHeader}>
          <Text style={[sharedStyles.tableCellHeader, { flex: 1 }]}>
            Mission
          </Text>
          {data.years.map((y) => (
            <Text
              key={y}
              style={[
                sharedStyles.tableCellHeader,
                { flex: 1, textAlign: "right" },
              ]}
            >
              {y}
            </Text>
          ))}
        </View>
        {data.byMissionByYear.map((m, i) => (
          <View key={i} style={sharedStyles.tableRow}>
            <Text style={[sharedStyles.tableCell, { flex: 1 }]}>
              {m.mission}
            </Text>
            {m.data.map((d, j) => (
              <Text
                key={j}
                style={[
                  sharedStyles.tableCell,
                  { flex: 1, textAlign: "right" },
                ]}
              >
                {d.count}
              </Text>
            ))}
          </View>
        ))}

        <PdfReportFooter reportName="Year-on-Year Growth Report" />
      </Page>

      {aiInsights && (
        <AiInsightsPage
          insights={aiInsights}
          reportName="Year-on-Year Growth Report"
          generatedAt={generatedAt}
        />
      )}
    </Document>
  );
}
