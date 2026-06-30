import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CATEGORY_LABELS: Record<string, string> = {
  SPIRITUAL: "Spiritual",
  PHYSICAL: "Physical",
  MENTAL: "Mental",
  SOCIAL: "Social",
};

export default async function FieldReportImmersionPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; mission?: string; program?: string; category?: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const { year, month, mission, program, category } = await searchParams;
  const yearNum  = year  ? parseInt(year,  10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;

  const [reports, missions, yearRows, allPrograms] = await Promise.all([
    prisma.fieldReport.findMany({
      where: {
        ...(yearNum  ? { reportYear:  yearNum  } : {}),
        ...(monthNum ? { reportMonth: monthNum } : {}),
        ...(mission ? { trainee: { homeMission: { code: mission } } } : {}),
        ...(program ? { program: { code: program } } : {}),
        ...(category ? { program: { category: category as any } } : {}),
      },
      orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
      include: {
        trainee: {
          select: { fullName: true, homeMission: { select: { code: true } } },
        },
        program: { select: { code: true, category: true } },
      },
    }),
    prisma.localMission.findMany({ where: { deletedAt: null }, orderBy: { code: "asc" }, select: { code: true } }),
    prisma.fieldReport.findMany({ select: { reportYear: true }, distinct: ["reportYear"], orderBy: { reportYear: "desc" } }),
    prisma.trainingProgram.findMany({ where: { deletedAt: null }, orderBy: { code: "asc" }, select: { code: true, category: true } }),
  ]);

  const years = yearRows.map((r) => r.reportYear);
  const missionCodes = missions.map((m) => m.code);
  const programCodes = [...new Set(allPrograms.map((p) => p.code))];
  const hasFilter = !!(year || month || mission || program || category);

  // Aggregate by trainee
  type Row = {
    name: string; mission: string; program: string;
    reports: number; activities: number; days: number;
    baptisms: number; candidates: number; reached: number; visits: number;
  };
  const rowMap = new Map<string, Row>();
  for (const r of reports) {
    const key = r.traineeId;
    if (!rowMap.has(key)) {
      rowMap.set(key, {
        name: r.trainee.fullName,
        mission: r.trainee.homeMission?.code ?? "—",
        program: r.program.code,
        reports: 0, activities: 0, days: 0,
        baptisms: 0, candidates: 0, reached: 0, visits: 0,
      });
    }
    const row = rowMap.get(key)!;
    row.reports++;
    row.activities += r.totalActivities;
    row.days += r.daysOfWork;
    row.baptisms += r.numberOfBaptisms;
    row.candidates += r.baptismCandidatesPrepared;
    row.reached += r.peopleReached ?? 0;
    row.visits += r.nonSdaHomeVisits;
  }
  const rows = Array.from(rowMap.values()).sort((a, b) => a.mission.localeCompare(b.mission) || a.name.localeCompare(b.name));
  const totals = rows.reduce(
    (s, r) => ({ reports: s.reports + r.reports, activities: s.activities + r.activities, days: s.days + r.days, baptisms: s.baptisms + r.baptisms, candidates: s.candidates + r.candidates, reached: s.reached + r.reached, visits: s.visits + r.visits }),
    { reports: 0, activities: 0, days: 0, baptisms: 0, candidates: 0, reached: 0, visits: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link href="/dashboard/director/field-reports" className="text-xs text-gray-500 hover:text-gray-700">← Field Reports</Link>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Immersion Report</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Aggregated missionary activity summary
            {yearNum  ? ` · ${yearNum}` : ""}
            {monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""}
            {mission  ? ` · ${mission}` : ""}
            {program  ? ` · ${program}` : ""}
            {category ? ` · ${CATEGORY_LABELS[category] ?? category}` : ""}
            {!hasFilter ? " · All records" : ""}
          </p>
        </div>
        <PrintButton label="Print Report" />
      </div>

      {/* Filters */}
      <form method="GET" className="print:hidden flex flex-wrap items-center gap-2">
        <select
          name="year"
          defaultValue={year ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
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
          {missionCodes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          name="program"
          defaultValue={program ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All programs</option>
          {programCodes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All categories</option>
          {["SPIRITUAL", "PHYSICAL", "MENTAL", "SOCIAL"].map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {hasFilter && (
          <Link
            href="/dashboard/director/field-reports/immersion"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-lg font-bold text-gray-900">1000 Missionary Movement Bangladesh — Immersion Report</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {yearNum ? yearNum : "All Years"}
          {monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""}
          {" · "}{mission ?? "All Missions"}
          {program ? ` · ${program}` : ""}
          {category ? ` · ${CATEGORY_LABELS[category] ?? category}` : ""}
          {" · Printed "}{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center print:hidden">
          <p className="text-sm text-gray-400">No field reports for this period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white print:border-0 print:rounded-none">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50 print:bg-white">
                <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Missionary</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Mission</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Program</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Reports</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Activities</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Days</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Visits</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Candidates</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Baptisms</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Reached</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-1.5 font-medium text-gray-900">{r.name}</td>
                  <td className="px-3 py-1.5 text-gray-600">{r.mission}</td>
                  <td className="px-3 py-1.5 font-mono text-gray-500">{r.program}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.reports}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.activities}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.days}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.visits}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.candidates}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-teal-700">{r.baptisms}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.reached}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-100 print:bg-white font-bold">
                <td className="px-3 py-2 text-gray-700" colSpan={4}>Totals ({rows.length} missionaries)</td>
                <td className="px-3 py-2 text-right text-gray-700">{totals.reports}</td>
                <td className="px-3 py-2 text-right text-gray-700">{totals.activities}</td>
                <td className="px-3 py-2 text-right text-gray-700">{totals.days}</td>
                <td className="px-3 py-2 text-right text-gray-700">{totals.visits}</td>
                <td className="px-3 py-2 text-right text-gray-700">{totals.candidates}</td>
                <td className="px-3 py-2 text-right text-teal-700">{totals.baptisms}</td>
                <td className="px-3 py-2 text-right text-gray-700">{totals.reached}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
