import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import {
  getFieldReportStats,
  getMissionStats,
  getTopTrainees,
  getSummaryTotals,
  getAvailableYears,
} from "@/lib/fieldReportStats";
import { FieldReportStatsClient } from "./_components/FieldReportStatsClient";
import { PrintButton } from "@/components/PrintButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function DirectorFieldReportStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; mission?: string; program?: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const session = await auth();
  const { year, month, mission, program } = await searchParams;
  const yearNum     = year  ? parseInt(year,  10) : undefined;
  const monthNum    = month ? parseInt(month, 10) : undefined;
  const missionCode = mission || undefined;
  const programCode = program || undefined;

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    select: { fullName: true },
  });

  const [monthly, quarterly, yearly, missionStats, topTrainees, totals, availableYears, allMissions, allPrograms] =
    await Promise.all([
      getFieldReportStats("monthly",   undefined, yearNum, missionCode, programCode, monthNum),
      getFieldReportStats("quarterly", undefined, yearNum, missionCode, programCode, monthNum),
      getFieldReportStats("yearly",    undefined, undefined, missionCode, programCode, monthNum),
      getMissionStats(yearNum, missionCode, programCode, monthNum),
      getTopTrainees(undefined, 10, yearNum, missionCode, programCode, monthNum),
      getSummaryTotals(undefined, yearNum, missionCode, programCode, monthNum),
      getAvailableYears(),
      prisma.localMission.findMany({ where: { deletedAt: null }, orderBy: { code: "asc" }, select: { code: true } }),
      prisma.trainingProgram.findMany({ where: { deletedAt: null }, orderBy: { code: "asc" }, select: { code: true } }),
    ]);

  const hasFilter = !!(year || month || mission || program);

  const filterLabel = [
    missionCode ?? "All missions",
    programCode ? programCode : null,
    yearNum ? String(yearNum) : null,
    monthNum ? MONTHS[monthNum - 1] : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Print-only header */}
      <div className="hidden print:block mb-4">
        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-3 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/1000mm-logo.png" alt="1000MM" className="h-12 w-auto" />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">1000 Missionary Movement Bangladesh</p>
            <h1 className="text-base font-bold text-gray-900 mt-0.5">Field Report Statistics</h1>
            <p className="text-xs text-gray-600 mt-0.5">{filterLabel}</p>
            {user?.fullName && <p className="text-[10px] text-gray-400 mt-0.5">{user.fullName}</p>}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/sda-logo.png" alt="SDA" className="h-12 w-auto" />
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link
              href="/dashboard/director/field-reports"
              className="print:hidden text-xs text-gray-500 hover:text-gray-700"
            >
              ← Field Reports
            </Link>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 print:hidden">
            Field Report Statistics
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 print:hidden">
            {filterLabel} · Monthly, quarterly, and yearly aggregations
          </p>
        </div>
        <PrintButton label="Print Stats" />
      </div>

      {/* Filters */}
      <form method="GET" className="print:hidden flex flex-wrap items-center gap-2">
        <select
          name="year"
          defaultValue={year ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All years</option>
          {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          name="month"
          defaultValue={month ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select
          name="mission"
          defaultValue={mission ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All missions</option>
          {allMissions.map((m) => <option key={m.code} value={m.code}>{m.code}</option>)}
        </select>
        <select
          name="program"
          defaultValue={program ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All programs</option>
          {allPrograms.map((p) => <option key={p.code} value={p.code}>{p.code}</option>)}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {hasFilter && (
          <Link
            href="/dashboard/director/field-reports/stats"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Top-mission highlight cards */}
      {missionStats.length > 0 && (() => {
        const topBaptisms    = [...missionStats].sort((a, b) => b.baptisms - a.baptisms)[0];
        const topReached     = [...missionStats].sort((a, b) => b.peopleReached - a.peopleReached)[0];
        const topVisits      = [...missionStats].sort((a, b) => b.visits - a.visits)[0];
        const topCandidates  = [...missionStats].sort((a, b) => b.baptismCandidates - a.baptismCandidates)[0];
        return (
          <div className="print:hidden grid grid-cols-2 gap-3">
            {topBaptisms.baptisms > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-amber-600">Top by Baptisms</p>
                <p className="mt-1 text-lg font-bold text-amber-800">{topBaptisms.missionCode}</p>
                <p className="text-xs text-amber-700">{topBaptisms.baptisms.toLocaleString()} baptism{topBaptisms.baptisms !== 1 ? "s" : ""}</p>
              </div>
            )}
            {topReached.peopleReached > 0 && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-teal-600">Top by People Reached</p>
                <p className="mt-1 text-lg font-bold text-teal-800">{topReached.missionCode}</p>
                <p className="text-xs text-teal-700">{topReached.peopleReached.toLocaleString()} people reached</p>
              </div>
            )}
            {topVisits.visits > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-blue-600">Top by Visitation</p>
                <p className="mt-1 text-lg font-bold text-blue-800">{topVisits.missionCode}</p>
                <p className="text-xs text-blue-700">{topVisits.visits.toLocaleString()} visit{topVisits.visits !== 1 ? "s" : ""}</p>
              </div>
            )}
            {topCandidates.baptismCandidates > 0 && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-violet-600">Top by Baptism Candidates</p>
                <p className="mt-1 text-lg font-bold text-violet-800">{topCandidates.missionCode}</p>
                <p className="text-xs text-violet-700">{topCandidates.baptismCandidates.toLocaleString()} candidate{topCandidates.baptismCandidates !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        );
      })()}

      <FieldReportStatsClient
        initialMode="monthly"
        monthlyData={monthly}
        quarterlyData={quarterly}
        yearlyData={yearly}
        missionStats={missionStats}
        topTrainees={topTrainees}
        totals={totals}
        isStaff={true}
      />
    </div>
  );
}
