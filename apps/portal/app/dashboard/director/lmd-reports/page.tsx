import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { WindowControls } from "./_components/WindowControls";
import { PrintButton } from "@/components/PrintButton";
import { DirectorLmdReportsExportButton } from "./_components/DirectorLmdReportsExportButton";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function DirectorLmdReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; period?: string; mission?: string; sort?: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const { year, month, period, mission, sort } = await searchParams;
  const yearNum = year ? parseInt(year, 10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;

  const [windows, allReports, missionRows, yearRows, topMissionaries] = await Promise.all([
    prisma.lmdReportWindow.findMany({
      where: {
        ...(yearNum ? { reportYear: yearNum } : {}),
        ...(monthNum ? { reportMonth: monthNum } : {}),
      },
      orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
      include: {
        _count: { select: { reports: true } },
        createdBy: { select: { fullName: true } },
      },
    }),
    prisma.lmdReport.findMany({
      where: {
        ...(yearNum ? { reportYear: yearNum } : {}),
        ...(monthNum ? { reportMonth: monthNum } : {}),
        ...(mission ? { mission: { code: mission } } : {}),
      },
      orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
      include: {
        lmd: { select: { fullName: true } },
        mission: { select: { name: true, code: true } },
      },
    }),
    prisma.localMission.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { code: true, name: true },
    }),
    prisma.lmdReport.findMany({
      select: { reportYear: true },
      distinct: ["reportYear"],
      orderBy: { reportYear: "desc" },
    }),
    // Top missionaries from individual field reports for the filtered period
    prisma.fieldReport.findMany({
      where: {
        ...(yearNum ? { reportYear: yearNum } : {}),
        ...(mission
          ? { trainee: { homeMission: { code: mission } } }
          : {}),
      },
      include: {
        trainee: {
          select: {
            fullName: true,
            homeMission: { select: { code: true } },
          },
        },
      },
    }),
  ]);

  const missions = missionRows.map((m) => m.code);
  const availableYears = yearRows.map((r) => r.reportYear);
  const openWindow = windows.find((w) => w.state === "OPEN");

  // Top performers from filtered period (by mission aggregate)
  const reportsByMission: Record<string, {
    code: string; lmdName: string; baptisms: number; visitations: number; peopleReached: number;
  }> = {};
  for (const r of allReports) {
    const code = r.mission.code;
    if (!reportsByMission[code]) {
      reportsByMission[code] = { code, lmdName: r.lmd.fullName, baptisms: 0, visitations: 0, peopleReached: 0 };
    }
    reportsByMission[code].baptisms += r.totalBaptisms;
    reportsByMission[code].visitations += r.totalNonSdaHomeVisits;
    reportsByMission[code].peopleReached += r.totalPeopleReached;
  }
  const missionStats = Object.values(reportsByMission);
  const topBaptismMission = [...missionStats].sort((a, b) => b.baptisms - a.baptisms)[0];
  const topVisitationMission = [...missionStats].sort((a, b) => b.visitations - a.visitations)[0];

  // Top missionaries from individual field reports
  const missionaryStats: Record<string, { name: string; missionCode: string; baptisms: number; visits: number }> = {};
  for (const r of topMissionaries) {
    const key = r.traineeId;
    if (!missionaryStats[key]) {
      missionaryStats[key] = {
        name: r.trainee.fullName,
        missionCode: r.trainee.homeMission?.code ?? "—",
        baptisms: 0,
        visits: 0,
      };
    }
    missionaryStats[key].baptisms += r.numberOfBaptisms;
    missionaryStats[key].visits += r.nonSdaHomeVisits;
  }
  const allMissionaryStats = Object.values(missionaryStats);
  const topBaptismMissionary = [...allMissionaryStats].sort((a, b) => b.baptisms - a.baptisms)[0];
  const topVisitsMissionary = [...allMissionaryStats].sort((a, b) => b.visits - a.visits)[0];

  // Group reports by period based on selected mode
  const periodMode = period === "quarterly" ? "quarterly" : period === "yearly" ? "yearly" : "monthly";

  type PeriodGroup = {
    label: string;
    sortKey: string;
    reports: typeof allReports;
    missionCount: number;
  };

  const periodGroups: PeriodGroup[] = [];
  if (periodMode === "monthly") {
    for (const w of windows) {
      const windowReports = allReports.filter(
        (r) => r.reportMonth === w.reportMonth && r.reportYear === w.reportYear,
      );
      periodGroups.push({
        label: `${MONTHS[w.reportMonth - 1]} ${w.reportYear}`,
        sortKey: `${w.reportYear}-${String(w.reportMonth).padStart(2, "0")}`,
        reports: windowReports,
        missionCount: missions.length,
      });
    }
  } else if (periodMode === "quarterly") {
    const qMap = new Map<string, PeriodGroup>();
    for (const r of allReports) {
      const q = Math.ceil(r.reportMonth / 3);
      const key = `${r.reportYear}-Q${q}`;
      if (!qMap.has(key)) {
        qMap.set(key, { label: `Q${q} ${r.reportYear}`, sortKey: key, reports: [], missionCount: missions.length });
      }
      qMap.get(key)!.reports.push(r);
    }
    periodGroups.push(...Array.from(qMap.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey)));
  } else {
    const yMap = new Map<string, PeriodGroup>();
    for (const r of allReports) {
      const key = `${r.reportYear}`;
      if (!yMap.has(key)) {
        yMap.set(key, { label: key, sortKey: key, reports: [], missionCount: missions.length });
      }
      yMap.get(key)!.reports.push(r);
    }
    periodGroups.push(...Array.from(yMap.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey)));
  }

  // Sort reports within each period group if a sort is selected
  if (sort) {
    const [field, dir] = sort.split("_");
    const sortFn = (a: (typeof allReports)[0], b: (typeof allReports)[0]) => {
      let aVal = 0, bVal = 0;
      if (field === "baptisms") { aVal = a.totalBaptisms; bVal = b.totalBaptisms; }
      else if (field === "reached") { aVal = a.totalPeopleReached; bVal = b.totalPeopleReached; }
      else if (field === "visits") { aVal = a.totalNonSdaHomeVisits; bVal = b.totalNonSdaHomeVisits; }
      return dir === "asc" ? aVal - bVal : bVal - aVal;
    };
    for (const group of periodGroups) {
      group.reports = [...group.reports].sort(sortFn);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">LMD Reports</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Monthly mission reports from Local Directors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DirectorLmdReportsExportButton year={year} month={month} mission={mission} />
          <PrintButton label="Print Summary" />
          <WindowControls
            openWindow={
              openWindow
                ? {
                    id: openWindow.id,
                    reportMonth: openWindow.reportMonth,
                    reportYear: openWindow.reportYear,
                  }
                : null
            }
          />
        </div>
      </div>

      {/* Top performers */}
      {(missionStats.length > 0 || allMissionaryStats.length > 0) && (
        <div className="print:hidden grid grid-cols-2 gap-3 sm:grid-cols-4">
          {topBaptismMission && topBaptismMission.baptisms > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-amber-600">
                Top Baptism Mission{yearNum ? ` (${yearNum})` : ""}
              </p>
              <p className="mt-1 text-base font-bold text-amber-800">{topBaptismMission.code}</p>
              <p className="text-xs text-amber-700">{topBaptismMission.baptisms} baptism{topBaptismMission.baptisms !== 1 ? "s" : ""}</p>
            </div>
          )}
          {topVisitationMission && topVisitationMission.visitations > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-blue-600">
                Top Visitation Mission{yearNum ? ` (${yearNum})` : ""}
              </p>
              <p className="mt-1 text-base font-bold text-blue-800">{topVisitationMission.code}</p>
              <p className="text-xs text-blue-700">{topVisitationMission.visitations} visit{topVisitationMission.visitations !== 1 ? "s" : ""}</p>
            </div>
          )}
          {topBaptismMissionary && topBaptismMissionary.baptisms > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-green-600">
                Top Baptism Missionary{yearNum ? ` (${yearNum})` : ""}
              </p>
              <p className="mt-1 text-base font-bold text-green-800 truncate">{topBaptismMissionary.name}</p>
              <p className="text-xs text-green-700">{topBaptismMissionary.baptisms} baptism{topBaptismMissionary.baptisms !== 1 ? "s" : ""} · {topBaptismMissionary.missionCode}</p>
            </div>
          )}
          {topVisitsMissionary && topVisitsMissionary.visits > 0 && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-purple-600">
                Top Visits Missionary{yearNum ? ` (${yearNum})` : ""}
              </p>
              <p className="mt-1 text-base font-bold text-purple-800 truncate">{topVisitsMissionary.name}</p>
              <p className="text-xs text-purple-700">{topVisitsMissionary.visits} visit{topVisitsMissionary.visits !== 1 ? "s" : ""} · {topVisitsMissionary.missionCode}</p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <form method="GET" className="print:hidden flex flex-wrap items-center gap-2">
        <select
          name="mission"
          defaultValue={mission ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All missions</option>
          {missionRows.map((m) => (
            <option key={m.code} value={m.code}>{m.code} — {m.name}</option>
          ))}
        </select>
        <select
          name="year"
          defaultValue={year ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All years</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          name="month"
          defaultValue={month ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All months</option>
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          name="period"
          defaultValue={period ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
        <select
          name="sort"
          defaultValue={sort ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">Sort: Mission</option>
          <option value="baptisms_desc">Baptisms ↓</option>
          <option value="baptisms_asc">Baptisms ↑</option>
          <option value="reached_desc">Reached ↓</option>
          <option value="reached_asc">Reached ↑</option>
          <option value="visits_desc">Visits ↓</option>
          <option value="visits_asc">Visits ↑</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {(mission || year || month || period || sort) && (
          <Link
            href="/dashboard/director/lmd-reports"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Open window status */}
      {openWindow && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-sm font-medium text-teal-800">
                {MONTHS[openWindow.reportMonth - 1]} {openWindow.reportYear}{" "}
                window is open
              </p>
              <span className="text-xs text-teal-600">
                · {openWindow._count.reports} of {missions.length} LMDs
                submitted
              </span>
            </div>
            <div className="flex gap-2 text-xs text-teal-600">
              {missions.map((m) => {
                const submitted = allReports.some(
                  (r) =>
                    r.reportMonth === openWindow.reportMonth &&
                    r.reportYear === openWindow.reportYear &&
                    r.mission.code === m,
                );
                return (
                  <span
                    key={m}
                    className={`rounded-full px-2 py-0.5 ${submitted ? "bg-teal-200 text-teal-800 font-medium" : "bg-teal-100 text-teal-500"}`}
                  >
                    {m} {submitted ? "✓" : "·"}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Print-only summary */}
      {allReports.length > 0 && (
        <div className="hidden print:block">
          <p className="text-xs text-gray-500 mb-3">
            1000 Missionary Movement Bangladesh — LMD Mission Reports Summary{yearNum ? ` · ${yearNum}` : ""}{monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""}{mission ? ` · ${mission}` : ""} ·{" "}
            {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          {windows.filter((w) => allReports.some((r) => r.reportMonth === w.reportMonth && r.reportYear === w.reportYear)).map((w) => {
            const wr = allReports.filter((r) => r.reportMonth === w.reportMonth && r.reportYear === w.reportYear);
            return (
              <div key={w.id} className="mb-6">
                <p className="font-semibold text-sm text-gray-900 mb-1">
                  {MONTHS[w.reportMonth - 1]} {w.reportYear}
                </p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="py-1 pr-2 text-left font-semibold text-gray-700">Mission</th>
                      <th className="py-1 pr-2 text-left font-semibold text-gray-700">LMD</th>
                      <th className="py-1 pr-2 text-right font-semibold text-gray-700">Trainees</th>
                      <th className="py-1 pr-2 text-right font-semibold text-gray-700">Baptisms</th>
                      <th className="py-1 text-right font-semibold text-gray-700">People Reached</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wr.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100">
                        <td className="py-1 pr-2 font-medium text-gray-900">{r.mission.code}</td>
                        <td className="py-1 pr-2 text-gray-600">{r.lmd.fullName}</td>
                        <td className="py-1 pr-2 text-right text-gray-700">{r.totalTrainees}</td>
                        <td className="py-1 pr-2 text-right text-gray-700">{r.totalBaptisms}</td>
                        <td className="py-1 text-right text-gray-700">{r.totalPeopleReached}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-300">
                      <td className="py-1 pr-2 font-semibold text-gray-700" colSpan={2}>Total</td>
                      <td className="py-1 pr-2 text-right font-semibold text-gray-700">{wr.reduce((s, r) => s + r.totalTrainees, 0)}</td>
                      <td className="py-1 pr-2 text-right font-semibold text-gray-700">{wr.reduce((s, r) => s + r.totalBaptisms, 0)}</td>
                      <td className="py-1 text-right font-semibold text-gray-700">{wr.reduce((s, r) => s + r.totalPeopleReached, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* Reports list */}
      {periodGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            No report windows{year ? ` for ${year}` : ""}{mission ? ` · ${mission}` : ""}.
          </p>
          {!year && !mission && (
            <p className="mt-1 text-xs text-gray-300">
              Open a reporting window to allow LMDs to submit their monthly reports.
            </p>
          )}
        </div>
      ) : (
        <div className="print:hidden space-y-8">
          {periodGroups.map((group) => {
            const groupReports = group.reports;
            const totalBaptisms = groupReports.reduce((s, r) => s + r.totalBaptisms, 0);
            const totalReached = groupReports.reduce((s, r) => s + r.totalPeopleReached, 0);

            return (
              <div key={group.sortKey}>
                <div className="mb-3 flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900">{group.label}</p>
                  {periodMode === "monthly" && (() => {
                    const w = windows.find(
                      (w) => `${w.reportYear}-${String(w.reportMonth).padStart(2, "0")}` === group.sortKey,
                    );
                    return w ? (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${w.state === "OPEN" ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                        {w.state}
                      </span>
                    ) : null;
                  })()}
                  <span className="text-xs text-gray-400">
                    {groupReports.length} / {group.missionCount} submitted
                  </span>
                  {periodMode !== "monthly" && (
                    <span className="text-xs text-gray-400">
                      · {totalBaptisms} baptisms · {totalReached} reached
                    </span>
                  )}
                </div>

                {groupReports.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-100 bg-gray-50 py-6 text-center text-xs text-gray-400">
                    No reports submitted for this period yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {groupReports.map((r) => (
                      <Link
                        key={r.id}
                        href={`/dashboard/lmd/reports/${r.id}`}
                        className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-all"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {r.mission.name}
                            </p>
                            <p className="text-xs text-gray-500">{r.lmd.fullName}</p>
                            {periodMode !== "monthly" && (
                              <p className="text-xs text-gray-400">
                                {MONTHS[r.reportMonth - 1]} {r.reportYear}
                              </p>
                            )}
                          </div>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                            {r.mission.code}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
                          {[
                            { label: "Trainees", value: r.totalTrainees },
                            { label: "Baptisms", value: r.totalBaptisms },
                            { label: "Reached", value: r.totalPeopleReached },
                          ].map((m) => (
                            <div key={m.label} className="rounded-lg bg-gray-50 p-2">
                              <p className="text-[10px] text-gray-400">{m.label}</p>
                              <p className="text-sm font-semibold text-gray-900">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
