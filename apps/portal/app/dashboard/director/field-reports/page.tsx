import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { FilterBar } from "../../_components/FilterBar";
import { FieldReportExportButton } from "./_components/FieldReportExportButton";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function DirectorFieldReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string; year?: string; month?: string; period?: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const { mission, year, month, period } = await searchParams;
  const QUARTER_LABELS: Record<string, { label: string; months: number[]; sortSuffix: string }> = {
    q1: { label: "1st Quarter", months: [1, 2, 3],   sortSuffix: "-Q1" },
    q2: { label: "2nd Quarter", months: [4, 5, 6],   sortSuffix: "-Q2" },
    q3: { label: "3rd Quarter", months: [7, 8, 9],   sortSuffix: "-Q3" },
    q4: { label: "4th Quarter", months: [10, 11, 12], sortSuffix: "-Q4" },
  };
  const periodMode = period === "monthly" ? "monthly"
    : period === "yearly" ? "yearly"
    : period != null && period in QUARTER_LABELS ? period
    : null;

  const [reports, yearRows] = await Promise.all([
    prisma.fieldReport.findMany({
      where: {
        ...(mission
          ? { trainee: { homeMission: { code: mission as any } } }
          : {}),
        ...(year ? { reportYear: parseInt(year) } : {}),
        ...(month ? { reportMonth: parseInt(month) } : {}),
      },
      orderBy: [
        { reportYear: "desc" },
        { reportMonth: "desc" },
        { submittedAt: "desc" },
      ],
      include: {
        trainee: {
          select: {
            fullName: true,
            homeMission: { select: { code: true } },
          },
        },
        program: { select: { code: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.fieldReport.findMany({
      select: { reportYear: true },
      distinct: ["reportYear"],
      orderBy: { reportYear: "desc" },
    }),
  ]);

  const years = yearRows.map((r) => r.reportYear);
  const missionRows = await prisma.localMission.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: { code: true },
  });
  const missions = missionRows.map((m) => m.code);

  // Best-performance stats (computed on filtered year if set, else all time)
  const perfFilter = year ? { reportYear: parseInt(year) } : {};
  const allReportsForPerf = await prisma.fieldReport.findMany({
    where: perfFilter,
    select: {
      numberOfBaptisms: true,
      nonSdaHomeVisits: true,
      trainee: {
        select: {
          fullName: true,
          homeMission: { select: { code: true } },
        },
      },
    },
  });

  // Aggregate by mission and missionary
  const missionBaptisms: Record<string, number> = {};
  const missionaryBaptisms: Record<string, { name: string; count: number }> = {};
  const missionVisits: Record<string, number> = {};
  const missionaryVisits: Record<string, { name: string; count: number }> = {};

  for (const r of allReportsForPerf) {
    const code = r.trainee.homeMission?.code ?? "Unknown";
    const name = r.trainee.fullName;

    missionBaptisms[code] = (missionBaptisms[code] ?? 0) + r.numberOfBaptisms;
    if (!missionaryBaptisms[name]) missionaryBaptisms[name] = { name, count: 0 };
    missionaryBaptisms[name].count += r.numberOfBaptisms;

    missionVisits[code] = (missionVisits[code] ?? 0) + r.nonSdaHomeVisits;
    if (!missionaryVisits[name]) missionaryVisits[name] = { name, count: 0 };
    missionaryVisits[name].count += r.nonSdaHomeVisits;
  }

  const topMission = Object.entries(missionBaptisms).sort((a, b) => b[1] - a[1])[0];
  const topMissionary = Object.values(missionaryBaptisms).sort((a, b) => b.count - a.count)[0];
  const topVisitMission = Object.entries(missionVisits).sort((a, b) => b[1] - a[1])[0];
  const topVisitMissionary = Object.values(missionaryVisits).sort((a, b) => b.count - a.count)[0];

  // Period grouping
  type ReportGroup = { label: string; sortKey: string; items: typeof reports };
  const periodGroups: ReportGroup[] = [];

  if (periodMode === "monthly") {
    const map = new Map<string, ReportGroup>();
    for (const r of reports) {
      const key = `${r.reportYear}-${String(r.reportMonth).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { label: `${MONTHS_FULL[r.reportMonth - 1]} ${r.reportYear}`, sortKey: key, items: [] });
      map.get(key)!.items.push(r);
    }
    periodGroups.push(...Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey)));
  } else if (periodMode && periodMode in QUARTER_LABELS) {
    const qDef = QUARTER_LABELS[periodMode];
    const filtered = reports.filter((r) => qDef.months.includes(r.reportMonth));
    const map = new Map<string, ReportGroup>();
    for (const r of filtered) {
      const key = `${r.reportYear}${qDef.sortSuffix}`;
      if (!map.has(key)) map.set(key, { label: `${qDef.label} ${r.reportYear}`, sortKey: key, items: [] });
      map.get(key)!.items.push(r);
    }
    periodGroups.push(...Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey)));
  } else if (periodMode === "yearly") {
    const map = new Map<string, ReportGroup>();
    for (const r of reports) {
      const key = `${r.reportYear}`;
      if (!map.has(key)) map.set(key, { label: key, sortKey: key, items: [] });
      map.get(key)!.items.push(r);
    }
    periodGroups.push(...Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey)));
  }

  type Report = (typeof reports)[0];

  function ReportCard({ r, showPeriod }: { r: Report; showPeriod: boolean }) {
    return (
      <Link
        href={`/dashboard/field-reports/${r.id}`}
        className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-all"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">{r.trainee.fullName}</span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                {r.trainee.homeMission?.code}
              </span>
              {showPeriod && (
                <span className="text-xs text-gray-500">{MONTHS[r.reportMonth - 1]} {r.reportYear}</span>
              )}
              <span className="font-mono text-[10px] text-gray-400">{r.program.code}</span>
              {r._count.comments > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                  {r._count.comments} comment{r._count.comments !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>Activities: {r.totalActivities}</span>
              <span>Days: {r.daysOfWork}</span>
              <span>Baptisms: {r.numberOfBaptisms}</span>
              {r.peopleReached != null && <span>People reached: {r.peopleReached}</span>}
            </div>
          </div>
          <span className="flex-shrink-0 text-[11px] text-gray-400">
            {new Date(r.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Field Reports</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {reports.length} report{reports.length !== 1 ? "s" : ""} across all
            missions
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Link
            href="/dashboard/director/field-reports/immersion"
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Immersion Report
          </Link>
          <FieldReportExportButton mission={mission} year={year} month={month} />
          <PrintButton label="Print Reports" />
        </div>
      </div>

      {/* Best-performance panel */}
      {(topMission || topMissionary || topVisitMission || topVisitMissionary) && (
        <div className="print:hidden grid grid-cols-2 gap-3">
          {topMission && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-amber-600">
                Top Baptism Mission {year ? `(${year})` : ""}
              </p>
              <p className="mt-1 text-lg font-bold text-amber-800">{topMission[0]}</p>
              <p className="text-xs text-amber-700">{topMission[1]} baptism{topMission[1] !== 1 ? "s" : ""}</p>
            </div>
          )}
          {topMissionary && topMissionary.count > 0 && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-teal-600">
                Top Baptism Missionary {year ? `(${year})` : ""}
              </p>
              <p className="mt-1 text-lg font-bold text-teal-800 truncate">{topMissionary.name}</p>
              <p className="text-xs text-teal-700">{topMissionary.count} baptism{topMissionary.count !== 1 ? "s" : ""}</p>
            </div>
          )}
          {topVisitMission && topVisitMission[1] > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-blue-600">
                Top Visits Mission {year ? `(${year})` : ""}
              </p>
              <p className="mt-1 text-lg font-bold text-blue-800">{topVisitMission[0]}</p>
              <p className="text-xs text-blue-700">{topVisitMission[1].toLocaleString()} visit{topVisitMission[1] !== 1 ? "s" : ""}</p>
            </div>
          )}
          {topVisitMissionary && topVisitMissionary.count > 0 && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-violet-600">
                Top Visits Missionary {year ? `(${year})` : ""}
              </p>
              <p className="mt-1 text-lg font-bold text-violet-800 truncate">{topVisitMissionary.name}</p>
              <p className="text-xs text-violet-700">{topVisitMissionary.count.toLocaleString()} visit{topVisitMissionary.count !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <FilterBar
        basePath="/dashboard/director/field-reports"
        current={{ mission: mission ?? "", year: year ?? "", month: month ?? "", period: period ?? "" }}
        className="print:hidden"
        filters={[
          {
            name: "mission",
            label: "Mission",
            allLabel: "All missions",
            options: missions.map((m) => ({ value: m, label: m })),
          },
          {
            name: "year",
            label: "Year",
            allLabel: "All years",
            options: years.map((y) => ({ value: String(y), label: String(y) })),
          },
          {
            name: "month",
            label: "Month",
            allLabel: "All months",
            options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
          },
          {
            name: "period",
            label: "Group By",
            allLabel: "No grouping",
            options: [
              { value: "monthly", label: "Monthly"      },
              { value: "q1",      label: "1st Quarter"  },
              { value: "q2",      label: "2nd Quarter"  },
              { value: "q3",      label: "3rd Quarter"  },
              { value: "q4",      label: "4th Quarter"  },
              { value: "yearly",  label: "Yearly"       },
            ],
          },
        ]}
      />

      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No reports found.</p>
        </div>
      ) : (
        <>
        {/* Print-only header */}
        <div className="hidden print:block mb-2">
          <p className="text-xs text-gray-500">
            1000 Missionary Movement Bangladesh — Field Reports
            {mission ? ` · ${mission}` : " · All Missions"}
            {year ? ` · ${year}` : ""}
            {month ? ` · ${MONTHS[parseInt(month) - 1]}` : ""}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Printed{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Print-only table */}
        <div className="hidden print:block">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400">
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">#</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Trainee</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Mission</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Period</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Program</th>
                <th className="py-1.5 pr-2 text-right font-semibold text-gray-700">Activities</th>
                <th className="py-1.5 pr-2 text-right font-semibold text-gray-700">Days</th>
                <th className="py-1.5 pr-2 text-right font-semibold text-gray-700">Baptisms</th>
                <th className="py-1.5 text-right font-semibold text-gray-700">People Reached</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-1 pr-2 text-gray-400">{i + 1}</td>
                  <td className="py-1 pr-2 font-medium text-gray-900">{r.trainee.fullName}</td>
                  <td className="py-1 pr-2 text-gray-600">{r.trainee.homeMission?.code ?? "—"}</td>
                  <td className="py-1 pr-2 text-gray-600">{MONTHS[r.reportMonth - 1]} {r.reportYear}</td>
                  <td className="py-1 pr-2 font-mono text-gray-500">{r.program.code}</td>
                  <td className="py-1 pr-2 text-right text-gray-700">{r.totalActivities}</td>
                  <td className="py-1 pr-2 text-right text-gray-700">{r.daysOfWork}</td>
                  <td className="py-1 pr-2 text-right text-gray-700">{r.numberOfBaptisms}</td>
                  <td className="py-1 text-right text-gray-700">{r.peopleReached ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-right text-[10px] text-gray-400">
            Total: {reports.length} report{reports.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Screen card list */}
        <div className="print:hidden space-y-3">
          {periodMode ? (
            // Grouped view
            <div className="space-y-8">
              {periodGroups.map((group) => (
                <div key={group.sortKey}>
                  <div className="mb-3 flex items-center gap-3">
                    <p className="text-sm font-semibold text-gray-900">{group.label}</p>
                    <span className="text-xs text-gray-400">{group.items.length} report{group.items.length !== 1 ? "s" : ""}</span>
                    <span className="text-xs text-gray-400">
                      · {group.items.reduce((s, r) => s + r.numberOfBaptisms, 0)} baptisms
                      · {group.items.reduce((s, r) => s + r.totalActivities, 0)} activities
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((r) => (
                      <ReportCard key={r.id} r={r} showPeriod={periodMode !== "monthly"} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Flat list
            reports.map((r) => <ReportCard key={r.id} r={r} showPeriod />)
          )}
        </div>
        </>
      )}
    </div>
  );
}
