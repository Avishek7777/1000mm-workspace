"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

export type DistrictStat = {
  district: string;
  baptisms: number;
  peopleReached: number;
  visits: number;
  baptismCandidates: number;
  reportCount: number;
};

export type MissionaryStat = {
  fullName: string;
  baptisms: number;
  peopleReached: number;
  visits: number;
  baptismCandidates: number;
};

const PIE_COLORS = [
  "#0F6E56","#2980b9","#8e44ad","#BA7517","#c0392b",
  "#16a085","#e67e22","#1abc9c","#e74c3c","#3498db",
];

type LeaderboardProps = {
  title: string;
  data: { name: string; value: number }[];
  color: string;
  unit: string;
};

function Leaderboard({ title, data, color, unit }: LeaderboardProps) {
  if (data.length === 0) return null;
  const max = data[0].value || 1;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (item.value / max) * 100)}%`, backgroundColor: color }} />
              </div>
            </div>
            <span className="flex-shrink-0 text-xs font-semibold" style={{ color }}>{item.value} {unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  districtStats: DistrictStat[];
  missionaryStats: MissionaryStat[];
};

export function LmdDistrictStats({ districtStats, missionaryStats }: Props) {
  if (districtStats.length === 0 && missionaryStats.length === 0) return null;

  const topN = (arr: DistrictStat[], key: keyof DistrictStat, n = 5) =>
    [...arr].sort((a, b) => (b[key] as number) - (a[key] as number))
      .filter((d) => (d[key] as number) > 0).slice(0, n)
      .map((d) => ({ name: d.district, value: d[key] as number }));

  const topMiss = (arr: MissionaryStat[], key: keyof MissionaryStat, n = 5) =>
    [...arr].sort((a, b) => (b[key] as number) - (a[key] as number))
      .filter((m) => (m[key] as number) > 0).slice(0, n)
      .map((m) => ({ name: m.fullName, value: m[key] as number }));

  const pieDistricts = districtStats.slice(0, 10);

  return (
    <div className="space-y-6">

      {/* ── Top Missionaries ─────────────────────────────────────── */}
      {missionaryStats.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 border-b border-gray-100 pb-2">
            Top Missionaries
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Leaderboard title="Top Baptisms — Missionary"         data={topMiss(missionaryStats, "baptisms")}          color="#0F6E56" unit="bap." />
            <Leaderboard title="Top People Reached — Missionary"   data={topMiss(missionaryStats, "peopleReached")}     color="#2980b9" unit="reached" />
            <Leaderboard title="Top Visits — Missionary"           data={topMiss(missionaryStats, "visits")}            color="#8e44ad" unit="visits" />
            <Leaderboard title="Top Bap. Candidates — Missionary"  data={topMiss(missionaryStats, "baptismCandidates")} color="#BA7517" unit="cand." />
          </div>

          {/* Missionary bar chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Missionary Performance Overview (Top 10 by Baptisms)</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[...missionaryStats].sort((a, b) => b.baptisms - a.baptisms).slice(0, 10).map((m) => ({
                  name: m.fullName.split(" ")[0],
                  Baptisms: m.baptisms,
                  "People Reached": m.peopleReached,
                  Visits: m.visits,
                  Candidates: m.baptismCandidates,
                }))}
                margin={{ top: 4, right: 16, left: 0, bottom: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Baptisms"       fill="#0F6E56" radius={[3,3,0,0]} />
                <Bar dataKey="People Reached" fill="#2980b9" radius={[3,3,0,0]} />
                <Bar dataKey="Visits"         fill="#8e44ad" radius={[3,3,0,0]} />
                <Bar dataKey="Candidates"     fill="#BA7517" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ── Top Districts ────────────────────────────────────────── */}
      {districtStats.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 border-b border-gray-100 pb-2">
            Top Districts
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Leaderboard title="Top Baptisms — District"          data={topN(districtStats, "baptisms")}          color="#0F6E56" unit="bap." />
            <Leaderboard title="Top People Reached — District"    data={topN(districtStats, "peopleReached")}     color="#2980b9" unit="reached" />
            <Leaderboard title="Top Visits — District"            data={topN(districtStats, "visits")}            color="#8e44ad" unit="visits" />
            <Leaderboard title="Top Bap. Candidates — District"   data={topN(districtStats, "baptismCandidates")} color="#BA7517" unit="cand." />
          </div>

          {/* District horizontal bar chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">District Activity Comparison</p>
            <ResponsiveContainer width="100%" height={Math.max(200, pieDistricts.length * 36)}>
              <BarChart
                layout="vertical"
                data={[...districtStats].sort((a, b) => b.baptisms - a.baptisms).slice(0, 10).map((d) => ({
                  name: d.district,
                  Baptisms: d.baptisms,
                  "People Reached": d.peopleReached,
                  Visits: d.visits,
                  Candidates: d.baptismCandidates,
                }))}
                margin={{ top: 4, right: 16, left: 80, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={76} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Baptisms"       fill="#0F6E56" radius={[0,3,3,0]} />
                <Bar dataKey="People Reached" fill="#2980b9" radius={[0,3,3,0]} />
                <Bar dataKey="Visits"         fill="#8e44ad" radius={[0,3,3,0]} />
                <Bar dataKey="Candidates"     fill="#BA7517" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* District pie charts */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              { key: "baptisms"          as const, label: "Baptisms by District" },
              { key: "peopleReached"     as const, label: "People Reached by District" },
              { key: "visits"            as const, label: "Visits by District" },
              { key: "baptismCandidates" as const, label: "Bap. Candidates by District" },
            ].map(({ key, label }) => {
              const pieData = pieDistricts
                .filter((d) => d[key] > 0)
                .map((d) => ({ name: d.district, value: d[key] }));
              if (pieData.length === 0) return null;
              return (
                <div key={key} className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${(name ?? "").slice(0, 8)} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => (typeof v === "number" ? v.toLocaleString() : String(v ?? ""))} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
