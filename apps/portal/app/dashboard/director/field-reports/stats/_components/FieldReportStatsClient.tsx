"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  StatRow,
  MissionStat,
  TopTrainee,
  SummaryTotals,
  PeriodMode,
} from "@/lib/fieldReportStats";

const COLORS = [
  "#0F6E56",
  "#2980b9",
  "#8e44ad",
  "#BA7517",
  "#c0392b",
  "#16a085",
];
const MISSION_COLORS: Record<string, string> = {
  EBM: "#2980b9",
  NBM: "#8e44ad",
  SBM: "#BA7517",
  WBM: "#0F6E56",
};

type Props = {
  initialMode: PeriodMode;
  monthlyData: StatRow[];
  quarterlyData: StatRow[];
  yearlyData: StatRow[];
  missionStats?: MissionStat[];
  topTrainees: TopTrainee[];
  totals: SummaryTotals;
  isStaff: boolean; // UD/SA — shows mission breakdown
};

export function FieldReportStatsClient({
  initialMode,
  monthlyData,
  quarterlyData,
  yearlyData,
  missionStats,
  topTrainees,
  totals,
  isStaff,
}: Props) {
  const [mode, setMode] = useState<PeriodMode>(initialMode);

  const data =
    mode === "monthly"
      ? monthlyData
      : mode === "quarterly"
        ? quarterlyData
        : yearlyData;

  const SUMMARY_CARDS = [
    {
      label: "Total Reports",
      value: totals.totalReports,
      color: "text-gray-900",
    },
    {
      label: "Active Trainees",
      value: totals.activeTrainees,
      color: "text-teal-700",
    },
    {
      label: "Total Baptisms",
      value: totals.totalBaptisms,
      color: "text-teal-700",
    },
    {
      label: "People Reached",
      value: totals.totalPeopleReached,
      color: "text-blue-700",
    },
    {
      label: "Total Activities",
      value: totals.totalActivities,
      color: "text-gray-900",
    },
    {
      label: "Bible Studies",
      value: totals.totalBibleStudies,
      color: "text-purple-700",
    },
    {
      label: "Worship Sessions",
      value: totals.totalWorshipSessions,
      color: "text-amber-700",
    },
    {
      label: "New Groups",
      value: totals.totalNewGroups,
      color: "text-green-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period mode tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit">
        {(["monthly", "quarterly", "yearly"] as PeriodMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
              mode === m
                ? "bg-teal-700 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUMMARY_CARDS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 bg-white p-4 text-center"
          >
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>
              {s.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            No field reports found for this period.
          </p>
        </div>
      ) : (
        <>
          {/* Chart 1 — Baptisms + People Reached over time */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Baptisms &amp; People Reached
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="baptisms"
                  name="Baptisms"
                  fill="#0F6E56"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="peopleReached"
                  name="People Reached"
                  fill="#2980b9"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2 — Activities trend (line) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Activity Trends
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={data}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="totalActivities"
                  name="Total Activities"
                  stroke="#0F6E56"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="bibleStudies"
                  name="Bible Studies"
                  stroke="#8e44ad"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="worshipSessions"
                  name="Worship Sessions"
                  stroke="#BA7517"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3 — Stacked activity breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Activity Breakdown
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="nonSdaHomeVisits"
                  name="Non-SDA Visits"
                  stackId="a"
                  fill="#0F6E56"
                />
                <Bar
                  dataKey="bibleStudies"
                  name="Bible Studies"
                  stackId="a"
                  fill="#2980b9"
                />
                <Bar
                  dataKey="medicalVisits"
                  name="Medical Visits"
                  stackId="a"
                  fill="#c0392b"
                />
                <Bar
                  dataKey="worshipSessions"
                  name="Worship Sessions"
                  stackId="a"
                  fill="#BA7517"
                />
                <Bar
                  dataKey="newGroups"
                  name="New Groups"
                  stackId="a"
                  fill="#8e44ad"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4 — Reports + Active trainees */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Reports Submitted &amp; Active Trainees
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={data}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="reportCount"
                  name="Reports"
                  stroke="#0F6E56"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="activeTrainees"
                  name="Active Trainees"
                  stroke="#2980b9"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Mission pie — UD/SA only */}
          {isStaff && missionStats && missionStats.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Baptisms by Mission
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={missionStats}
                      dataKey="baptisms"
                      nameKey="missionCode"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ missionCode, percent }) =>
                        `${missionCode} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {missionStats.map((m) => (
                        <Cell
                          key={m.missionCode}
                          fill={MISSION_COLORS[m.missionCode] ?? "#888"}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  People Reached by Mission
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={missionStats}
                      dataKey="peopleReached"
                      nameKey="missionCode"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ missionCode, percent }) =>
                        `${missionCode} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {missionStats.map((m) => (
                        <Cell
                          key={m.missionCode}
                          fill={MISSION_COLORS[m.missionCode] ?? "#888"}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Data table */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Data Table
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {[
                      "Period",
                      "Reports",
                      "Trainees",
                      "Activities",
                      "Days",
                      "Hours",
                      "Non-SDA Visits",
                      "Bible Studies",
                      "Medical",
                      "Worship",
                      "New Groups",
                      "Bap. Candidates",
                      "Baptisms",
                      "People Reached",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((row, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                        {row.periodLabel}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.reportCount}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.activeTrainees}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.totalActivities}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.totalDaysOfWork}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.totalHoursOfWork}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.nonSdaHomeVisits}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.bibleStudies}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.medicalVisits}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.worshipSessions}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.newGroups}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.baptismCandidates}
                      </td>
                      <td className="px-3 py-2 font-semibold text-teal-700">
                        {row.baptisms}
                      </td>
                      <td className="px-3 py-2 font-semibold text-blue-700">
                        {row.peopleReached}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Top trainees */}
      {topTrainees.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Top Missionaries by Baptisms
          </p>
          <div className="space-y-2">
            {topTrainees.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t.fullName}
                    </p>
                    {isStaff && (
                      <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 flex-shrink-0">
                        {t.missionCode}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{
                        width: `${Math.min(100, (t.baptisms / (topTrainees[0]?.baptisms || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-teal-700">
                    {t.baptisms} bap.
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {t.peopleReached} reached
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
