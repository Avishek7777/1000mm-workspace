import type { DistrictStat, MissionaryStat } from "./LmdDistrictStats";

type RankRow = { name: string; value: number };

function RankCard({
  title, rows, unit, accent,
}: {
  title: string;
  rows: RankRow[];
  unit: string;
  accent: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="px-4 py-2.5 border-b border-gray-100" style={{ backgroundColor: `${accent}18` }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: accent }}>
          {title}
        </p>
      </div>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
              <td className="px-3 py-2 text-[10px] font-bold text-gray-300 w-7 text-center">{i + 1}</td>
              <td className="px-2 py-2 text-xs font-medium text-gray-900">{row.name}</td>
              <td className="px-3 py-2 text-xs font-semibold tabular-nums text-right" style={{ color: accent }}>
                {row.value.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">{unit}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function topMiss(stats: MissionaryStat[], key: keyof MissionaryStat, n = 5): RankRow[] {
  return [...stats]
    .sort((a, b) => (b[key] as number) - (a[key] as number))
    .filter((m) => (m[key] as number) > 0)
    .slice(0, n)
    .map((m) => ({ name: m.fullName, value: m[key] as number }));
}

function topDist(stats: DistrictStat[], key: keyof DistrictStat, n = 5): RankRow[] {
  return [...stats]
    .sort((a, b) => (b[key] as number) - (a[key] as number))
    .filter((d) => (d[key] as number) > 0)
    .slice(0, n)
    .map((d) => ({ name: d.district, value: d[key] as number }));
}

type Props = {
  missionaryStats: MissionaryStat[];
  districtStats: DistrictStat[];
};

export function LmdTopRankings({ missionaryStats, districtStats }: Props) {
  const hasData = missionaryStats.length > 0 || districtStats.length > 0;
  if (!hasData) return null;

  const rankings = [
    { title: "Top Baptisms — Missionaries",        rows: topMiss(missionaryStats, "baptisms"),          unit: "bap.",    accent: "#0F6E56" },
    { title: "Top Visits — Missionaries",           rows: topMiss(missionaryStats, "visits"),            unit: "visits",  accent: "#7c3aed" },
    { title: "Top People Reached — Missionaries",   rows: topMiss(missionaryStats, "peopleReached"),     unit: "reached", accent: "#2563eb" },
    { title: "Top Bap. Candidates — Missionaries",  rows: topMiss(missionaryStats, "baptismCandidates"), unit: "cand.",   accent: "#b45309" },
    { title: "Top Baptisms — Districts",            rows: topDist(districtStats,   "baptisms"),          unit: "bap.",    accent: "#0F6E56" },
    { title: "Top Visits — Districts",              rows: topDist(districtStats,   "visits"),            unit: "visits",  accent: "#7c3aed" },
  ].filter((r) => r.rows.length > 0);

  if (rankings.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 border-b border-gray-100 pb-2">
        Top Rankings
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rankings.map((r) => (
          <RankCard key={r.title} title={r.title} rows={r.rows} unit={r.unit} accent={r.accent} />
        ))}
      </div>
    </div>
  );
}
