import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function TraineeImmersionReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { year, month } = await searchParams;
  const yearNum  = year  ? parseInt(year,  10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "TRAINEE") redirect("/dashboard");

  const [reports, yearRows] = await Promise.all([
    prisma.fieldReport.findMany({
      where: {
        traineeId: user.id,
        ...(yearNum  ? { reportYear:  yearNum  } : {}),
        ...(monthNum ? { reportMonth: monthNum } : {}),
      },
      orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
      include: { program: { select: { code: true } } },
    }),
    prisma.fieldReport.findMany({
      where: { traineeId: user.id },
      select: { reportYear: true },
      distinct: ["reportYear"],
      orderBy: { reportYear: "desc" },
    }),
  ]);

  const years = yearRows.map((r) => r.reportYear);
  const hasFilter = !!(year || month);
  const totals = reports.reduce(
    (s, r) => ({
      activities: s.activities + r.totalActivities,
      days: s.days + r.daysOfWork,
      baptisms: s.baptisms + r.numberOfBaptisms,
      candidates: s.candidates + r.baptismCandidatesPrepared,
      reached: s.reached + (r.peopleReached ?? 0),
      visits: s.visits + r.nonSdaHomeVisits,
    }),
    { activities: 0, days: 0, baptisms: 0, candidates: 0, reached: 0, visits: 0 },
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link href="/dashboard/field-reports" className="text-xs text-gray-500 hover:text-gray-700">← Field Reports</Link>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">My Immersion Report</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Cumulative missionary activity summary
            {yearNum ? ` · ${yearNum}` : " · All years"}
            {monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""}
          </p>
        </div>
        <PrintButton label="Print" />
      </div>

      {/* Filters */}
      {years.length > 0 && (
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
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            Filter
          </button>
          {hasFilter && (
            <Link
              href="/dashboard/field-reports/immersion"
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      )}

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-lg font-bold text-gray-900">1000 Missionary Movement Bangladesh — Missionary Immersion Report</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {user.fullName}
          {" · "}{yearNum ?? "All Years"}
          {monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""}
          {" · Printed "}{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          { label: "Baptisms", value: totals.baptisms, color: "teal" },
          { label: "Candidates", value: totals.candidates, color: "blue" },
          { label: "Reached", value: totals.reached, color: "purple" },
          { label: "Visits", value: totals.visits, color: "amber" },
          { label: "Activities", value: totals.activities, color: "gray" },
          { label: "Days", value: totals.days, color: "gray" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">{c.label}</p>
            <p className="mt-0.5 text-xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Per-report table */}
      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center print:hidden">
          <p className="text-sm text-gray-400">No reports{yearNum ? " for this year" : " yet"}.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white print:border-0">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50 print:bg-white">
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Period</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Program</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Activities</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Days</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Visits</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Candidates</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Baptisms</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Reached</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-3 py-1.5 font-medium text-gray-900">{MONTHS[r.reportMonth - 1]} {r.reportYear}</td>
                  <td className="px-3 py-1.5 font-mono text-gray-500">{r.program.code}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.totalActivities}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.daysOfWork}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.nonSdaHomeVisits}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.baptismCandidatesPrepared}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-teal-700">{r.numberOfBaptisms}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{r.peopleReached ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-100 print:bg-white font-bold">
                <td className="px-3 py-2 text-gray-700" colSpan={2}>Totals ({reports.length} reports)</td>
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
