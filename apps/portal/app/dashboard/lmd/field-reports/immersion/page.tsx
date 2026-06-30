import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function LmdFieldReportImmersionPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; district?: string }>;
}) {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();
  const { year, month, district } = await searchParams;
  const yearNum  = year  ? parseInt(year,  10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;
  const hasFilter = !!(year || month || district);

  const lmdMission = await prisma.localMission.findFirst({
    where: { directorId: session!.user!.id },
  });
  if (!lmdMission) return <p className="text-sm text-gray-500">No mission assigned.</p>;

  const [reports, yearRows, districtRows] = await Promise.all([
    prisma.fieldReport.findMany({
      where: {
        trainee: {
          homeMissionId: lmdMission.id,
          ...(district ? {
            applications: { some: { status: "ACCEPTED", presentAddressDistrict: district } },
          } : {}),
        },
        ...(yearNum  ? { reportYear:  yearNum  } : {}),
        ...(monthNum ? { reportMonth: monthNum } : {}),
      },
      orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
      include: {
        trainee: { select: { fullName: true } },
        program: { select: { code: true } },
      },
    }),
    prisma.fieldReport.findMany({
      where: { trainee: { homeMissionId: lmdMission.id } },
      select: { reportYear: true },
      distinct: ["reportYear"],
      orderBy: { reportYear: "desc" },
    }),
    prisma.application.findMany({
      where: {
        status: "ACCEPTED",
        applicant: { homeMissionId: lmdMission.id, isMissionary: true },
        presentAddressDistrict: { not: null },
      },
      select: { presentAddressDistrict: true },
      distinct: ["presentAddressDistrict"],
      orderBy: { presentAddressDistrict: "asc" },
    }),
  ]);

  const years = yearRows.map((r) => r.reportYear);
  const districts = districtRows.map((d) => d.presentAddressDistrict!).filter(Boolean);

  type Row = {
    name: string; program: string;
    reports: number; activities: number; days: number;
    baptisms: number; candidates: number; reached: number; visits: number;
  };
  const rowMap = new Map<string, Row>();
  for (const r of reports) {
    if (!rowMap.has(r.traineeId)) {
      rowMap.set(r.traineeId, {
        name: r.trainee.fullName, program: r.program.code,
        reports: 0, activities: 0, days: 0,
        baptisms: 0, candidates: 0, reached: 0, visits: 0,
      });
    }
    const row = rowMap.get(r.traineeId)!;
    row.reports++;
    row.activities += r.totalActivities;
    row.days       += r.daysOfWork;
    row.baptisms   += r.numberOfBaptisms;
    row.candidates += r.baptismCandidatesPrepared;
    row.reached    += r.peopleReached ?? 0;
    row.visits     += r.nonSdaHomeVisits;
  }
  const rows = Array.from(rowMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  const totals = rows.reduce(
    (s, r) => ({ reports: s.reports + r.reports, activities: s.activities + r.activities, days: s.days + r.days, baptisms: s.baptisms + r.baptisms, candidates: s.candidates + r.candidates, reached: s.reached + r.reached, visits: s.visits + r.visits }),
    { reports: 0, activities: 0, days: 0, baptisms: 0, candidates: 0, reached: 0, visits: 0 },
  );

  const filterLabel = [
    yearNum  ? String(yearNum)         : "All years",
    monthNum ? MONTHS[monthNum - 1]    : null,
    district ?? null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link href="/dashboard/lmd/field-reports" className="text-xs text-gray-500 hover:text-gray-700">← Field Reports</Link>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Immersion Report</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {lmdMission.name} · {filterLabel}
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
          name="district"
          defaultValue={district ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All districts</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {hasFilter && (
          <Link
            href="/dashboard/lmd/field-reports/immersion"
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
          {lmdMission.name} · {filterLabel} ·
          Printed {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center print:hidden">
          <p className="text-sm text-gray-400">No field reports{hasFilter ? " for the selected filters" : " yet"}.</p>
          {hasFilter && (
            <Link href="/dashboard/lmd/field-reports/immersion" className="mt-2 inline-block text-xs text-teal-600 hover:underline">Clear filters</Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white print:border-0 print:rounded-none">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50 print:bg-white">
                <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Missionary</th>
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
                <td className="px-3 py-2 text-gray-700" colSpan={3}>Totals ({rows.length} missionaries)</td>
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
