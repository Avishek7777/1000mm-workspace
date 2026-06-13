"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { AiInsightsPanel, PdfExportButton } from "./ReportWidgets";

// ── Types ─────────────────────────────────────────────────────────────────────

type Program = { id: string; title: string; code: string; startDate: string };

type ReportType = "pipeline" | "demographics" | "decisions" | "growth";

const REPORT_CARDS: {
  type: ReportType;
  title: string;
  desc: string;
  icon: string;
}[] = [
  {
    type: "pipeline",
    title: "Application Pipeline",
    desc: "Funnel, LMD bottlenecks, avg days per stage",
    icon: "📊",
  },
  {
    type: "demographics",
    title: "Applicant Demographics",
    desc: "Gender, age, denomination, geography",
    icon: "👥",
  },
  {
    type: "decisions",
    title: "Decision Quality",
    desc: "Acceptance rates, LMD quality, rejection patterns",
    icon: "⚖️",
  },
  {
    type: "growth",
    title: "Year-on-Year Growth",
    desc: "Multi-year trends, mission contribution",
    icon: "📈",
  },
];

const MISSION_COLORS: Record<string, string> = {
  EBM: "#2980b9",
  NBM: "#27ae60",
  SBM: "#8e44ad",
  WBM: "#f39c12",
};

const CHART_COLORS = [
  "#2980b9",
  "#27ae60",
  "#8e44ad",
  "#f39c12",
  "#c0392b",
  "#16a085",
  "#d35400",
  "#7f8c8d",
];

// ── Main component ────────────────────────────────────────────────────────────

export function ReportsClient({ programs }: { programs: Program[] }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [programId, setProgramId] = useState<string>("");
  const [year, setYear] = useState<string>(String(currentYear));
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState("");

  async function handleGenerate() {
    if (!selectedReport) return;
    setLoading(true);
    setError(null);
    setReportData(null);
    setAiInsights("");

    const params = new URLSearchParams({ type: selectedReport });
    if (programId) params.set("programId", programId);
    if (year) params.set("year", year);

    try {
      const res = await fetch(`/api/reports/data?${params}`);
      if (!res.ok) throw new Error("Failed to fetch report data.");
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message ?? "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  const filterLabel = [
    programId ? programs.find((p) => p.id === programId)?.code : null,
    year,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      {/* Report selector */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {REPORT_CARDS.map((r) => (
          <button
            key={r.type}
            onClick={() => {
              setSelectedReport(r.type);
              setReportData(null);
              setAiInsights("");
            }}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
              selectedReport === r.type
                ? "border-teal-400 bg-teal-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-teal-300"
            }`}
          >
            <div className="mb-2 text-xl">{r.icon}</div>
            <p className="text-xs font-semibold text-gray-900">{r.title}</p>
            <p className="mt-0.5 text-[10px] text-gray-500">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Filters + generate */}
      {selectedReport && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
          {selectedReport !== "growth" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Program Cycle
                </label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
                >
                  <option value="">All Programs</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
                >
                  <option value="">All Years</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {loading ? "Generating…" : "Generate Report"}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Report charts ── */}
      {reportData && selectedReport === "pipeline" && (
        <PipelineCharts data={reportData as any} />
      )}
      {reportData && selectedReport === "demographics" && (
        <DemographicsCharts data={reportData as any} />
      )}
      {reportData && selectedReport === "decisions" && (
        <DecisionsCharts data={reportData as any} />
      )}
      {reportData && selectedReport === "growth" && (
        <GrowthCharts data={reportData as any} />
      )}

      {/* ── AI Insights + PDF ── */}
      {reportData && selectedReport && (
        <div className="space-y-4">
          <AiInsightsPanel
            reportType={selectedReport}
            reportData={reportData}
            onInsightsReady={setAiInsights}
          />
          <div className="flex justify-end">
            <PdfExportButton
              reportType={selectedReport}
              reportData={reportData}
              aiInsights={aiInsights}
              filters={filterLabel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Report 1: Pipeline charts ─────────────────────────────────────────────────

function PipelineCharts({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <ChartCard title="Pipeline Funnel">
        <div className="grid grid-cols-5 gap-2">
          {data.funnelStages.map((s: any, i: number) => (
            <div
              key={i}
              className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center"
            >
              <p className="text-xs text-gray-500">{s.stage}</p>
              <p className="text-xl font-bold text-blue-700">{s.count}</p>
              {i > 0 && data.funnelStages[0].count > 0 && (
                <p className="text-[10px] text-gray-400">
                  {Math.round((s.count / data.funnelStages[0].count) * 100)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Applications by Mission">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.byMission}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mission" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="submitted"
              name="Submitted"
              fill="#2980b9"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="recommended"
              name="Recommended"
              fill="#27ae60"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="accepted"
              name="Accepted"
              fill="#16a085"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="rejected"
              name="Rejected"
              fill="#c0392b"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Average Days per Stage">
          <table className="w-full text-sm">
            <tbody>
              {data.avgDaysPerStage.map((s: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 text-xs text-gray-600">{s.stage}</td>
                  <td className="py-2 text-right text-xs font-semibold text-gray-900">
                    {s.avgDays != null ? `${s.avgDays} days` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>

        <ChartCard title="LMD Bottlenecks">
          {data.lmdBottlenecks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No active bottlenecks.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-1.5 text-left text-xs font-medium text-gray-500">
                    LMD
                  </th>
                  <th className="py-1.5 text-right text-xs font-medium text-gray-500">
                    Pending
                  </th>
                  <th className="py-1.5 text-right text-xs font-medium text-gray-500">
                    Avg Days
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.lmdBottlenecks.map((l: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 text-xs text-gray-700">
                      {l.lmdName}{" "}
                      <span className="text-gray-400">({l.mission})</span>
                    </td>
                    <td className="py-2 text-right text-xs font-semibold text-amber-700">
                      {l.pendingCount}
                    </td>
                    <td className="py-2 text-right text-xs text-gray-600">
                      {l.avgDaysInReview ?? "—"}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ── Report 2: Demographics charts ─────────────────────────────────────────────

function DemographicsCharts({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title={`Gender (${data.total} total)`}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data.genderBreakdown}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={65}
                label={({
                  name,
                  percent,
                }: {
                  name?: string;
                  percent?: number;
                }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.genderBreakdown.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any, n: any) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mission Representation">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data.missionRepresentation}
                dataKey="count"
                nameKey="mission"
                cx="50%"
                cy="50%"
                outerRadius={65}
                label={({
                  name,
                  percent,
                }: {
                  name?: string;
                  percent?: number;
                }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.missionRepresentation.map((d: any) => (
                  <Cell
                    key={d.mission}
                    fill={MISSION_COLORS[d.mission] ?? "#888"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Marital Status">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data.maritalStatus}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={65}
              >
                {data.maritalStatus.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Age Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.ageGroups}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar
              dataKey="count"
              name="Applicants"
              fill="#16a085"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top 10 Districts">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topDistricts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                dataKey="district"
                type="category"
                tick={{ fontSize: 10 }}
                width={80}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#2980b9" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Denomination">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.denomination.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ fontSize: 9 }}
                width={120}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#8e44ad" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ── Report 3: Decisions charts ────────────────────────────────────────────────

function DecisionsCharts({ data }: { data: any }) {
  const o = data.overallRates;
  const decisionData = [
    { name: "Accepted", value: o.accepted, fill: "#27ae60" },
    { name: "Rejected", value: o.rejected, fill: "#c0392b" },
    { name: "Ret. Applicant", value: o.returnedToApplicant, fill: "#f39c12" },
    { name: "Ret. LMD", value: o.returnedToLmd, fill: "#e67e22" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total",
            value: o.total,
            color: "text-gray-900",
            bg: "bg-gray-50",
            border: "border-gray-200",
          },
          {
            label: "Accepted",
            value: `${o.accepted} (${o.acceptedPct}%)`,
            color: "text-green-700",
            bg: "bg-green-50",
            border: "border-green-200",
          },
          {
            label: "Rejected",
            value: `${o.rejected} (${o.rejectedPct}%)`,
            color: "text-red-700",
            bg: "bg-red-50",
            border: "border-red-200",
          },
          {
            label: "Returned to LMD",
            value: `${o.returnedToLmd} (${o.returnedToLmdPct}%)`,
            color: "text-orange-700",
            bg: "bg-orange-50",
            border: "border-orange-200",
          },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Overall Decision Breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={decisionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({
                  name,
                  percent,
                }: {
                  name?: string;
                  percent?: number;
                }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {decisionData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Acceptance Rate by Mission">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.byMission}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mission" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v: any) => [`${v}%`]} />
              <Bar
                dataKey="acceptedPct"
                name="Accept %"
                fill="#27ae60"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="LMD Recommender Performance">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  LMD
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Mission
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                  Recommended
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                  Accepted
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                  Accept %
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                  Ret. to LMD
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.byLmd.map((l: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs font-medium text-gray-900">
                    {l.lmdName}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {l.mission}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-gray-700">
                    {l.recommended}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-green-700 font-medium">
                    {l.accepted}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-gray-900">
                    {l.acceptedPct}%
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-orange-600">
                    {l.returnedToLmd}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {data.rejectionReasons.length > 0 && (
        <ChartCard title="Top Rejection Reasons">
          <div className="space-y-2">
            {data.rejectionReasons.map((r: any, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-red-100 bg-red-50 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-red-800">
                    {i + 1}. {r.count}× occurrence{r.count > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-gray-700">{r.reason}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

// ── Report 6: Growth charts ───────────────────────────────────────────────────

function GrowthCharts({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <ChartCard title="Applicants vs Accepted — Year over Year">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.byYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="applicants"
              name="Total Applicants"
              stroke="#2980b9"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="accepted"
              name="Accepted"
              stroke="#27ae60"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Conversion Rate Trend (%)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.byYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip formatter={(v: any) => [`${v}%`]} />
            <Line
              type="monotone"
              dataKey="conversionRate"
              name="Conversion %"
              stroke="#8e44ad"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Applications per Mission by Year">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data.byYear.map((y: any) => {
              const row: Record<string, any> = { year: y.year };
              data.byMissionByYear.forEach((m: any) => {
                row[m.mission] =
                  m.data.find((d: any) => d.year === y.year)?.count ?? 0;
              });
              return row;
            })}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {["EBM", "NBM", "SBM", "WBM"].map((m) => (
              <Bar
                key={m}
                dataKey={m}
                fill={MISSION_COLORS[m]}
                stackId="a"
                radius={m === "WBM" ? [3, 3, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Annual Summary Table">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Year
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                Applicants
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                Accepted
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                Programs
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                Conv. %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.byYear.map((y: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs font-semibold text-gray-900">
                  {y.year}
                </td>
                <td className="px-3 py-2 text-right text-xs text-gray-700">
                  {y.applicants}
                </td>
                <td className="px-3 py-2 text-right text-xs text-green-700 font-medium">
                  {y.accepted}
                </td>
                <td className="px-3 py-2 text-right text-xs text-gray-600">
                  {y.programs}
                </td>
                <td className="px-3 py-2 text-right text-xs font-bold text-purple-700">
                  {y.conversionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartCard>
    </div>
  );
}

// ── Shared chart card wrapper ─────────────────────────────────────────────────

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}
