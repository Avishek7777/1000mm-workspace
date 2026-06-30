import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function TraineeFieldReportStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { year, month } = await searchParams;
  const yearNum  = year  ? parseInt(year,  10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;
  const hasFilter = !!(year || month);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "TRAINEE") redirect("/dashboard");

  const [reports, yearRows] = await Promise.all([
    prisma.fieldReport.findMany({
      where: {
        traineeId: user.id,
        ...(yearNum  ? { reportYear:  yearNum  } : {}),
        ...(monthNum ? { reportMonth: monthNum } : {}),
      },
      orderBy: [{ reportYear: "asc" }, { reportMonth: "asc" }],
      include: { program: { select: { code: true } } },
    }),
    prisma.fieldReport.findMany({
      where: { traineeId: user.id },
      select: { reportYear: true },
      distinct: ["reportYear"],
      orderBy: { reportYear: "desc" },
    }),
  ]);

  const availableYears = yearRows.map((r) => r.reportYear);

  if (availableYears.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/field-reports" className="text-xs text-gray-500 hover:text-gray-700">← Field Reports</Link>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">My Statistics</h1>
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No field reports yet to display statistics.</p>
        </div>
      </div>
    );
  }

  const totals = reports.reduce(
    (s, r) => ({
      activities: s.activities + r.totalActivities,
      days: s.days + r.daysOfWork,
      baptisms: s.baptisms + r.numberOfBaptisms,
      candidates: s.candidates + r.baptismCandidatesPrepared,
      reached: s.reached + (r.peopleReached ?? 0),
      visits: s.visits + r.nonSdaHomeVisits,
      bibleStudies: s.bibleStudies + r.bibleStudiesConducted,
      worshipSessions: s.worshipSessions + r.worshipSessionsTaken,
      medicalVisits: s.medicalVisits + r.medicalVisits,
      newGroups: s.newGroups + r.newGroupsMade,
    }),
    { activities: 0, days: 0, baptisms: 0, candidates: 0, reached: 0, visits: 0, bibleStudies: 0, worshipSessions: 0, medicalVisits: 0, newGroups: 0 },
  );

  const avg = (val: number) => reports.length ? (val / reports.length).toFixed(1) : "0";

  // Best months
  const bestBaptismReport = [...reports].sort((a, b) => b.numberOfBaptisms - a.numberOfBaptisms)[0];
  const bestReachedReport = [...reports].sort((a, b) => (b.peopleReached ?? 0) - (a.peopleReached ?? 0))[0];
  const bestDaysReport = [...reports].sort((a, b) => b.daysOfWork - a.daysOfWork)[0];

  // Month-by-month chart data (bar heights relative to max)
  const maxBaptisms = Math.max(...reports.map((r) => r.numberOfBaptisms), 1);
  const maxActivities = Math.max(...reports.map((r) => r.totalActivities), 1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Print-only header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-teal-700 pb-4 mb-2">
        <img src="/logos/1000mm-logo.png" alt="1000MM" className="h-14 w-auto" />
        <div className="text-center">
          <p className="text-base font-bold text-gray-900">1000 Missionary Movement Bangladesh</p>
          <p className="text-sm font-semibold text-teal-700 mt-0.5">Missionary Field Report Statistics</p>
          <p className="text-xs text-gray-600 mt-1">{user.fullName}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {yearNum ? `${yearNum}` : "All years"}
            {monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""}
            {" · "}{reports.length} report{reports.length !== 1 ? "s" : ""} ·{" "}
            Printed {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <img src="/logos/sda-logo.png" alt="SDA" className="h-14 w-auto" />
      </div>

      {/* Screen header */}
      <div className="print:hidden flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/field-reports" className="text-xs text-gray-500 hover:text-gray-700">← Field Reports</Link>
            <span className="text-xs text-gray-300">|</span>
            <Link href="/dashboard/field-reports/immersion" className="text-xs text-gray-500 hover:text-gray-700">Immersion Report</Link>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">My Statistics</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {reports.length} report{reports.length !== 1 ? "s" : ""}
            {!hasFilter && ` across ${new Set(reports.map((r) => r.reportYear)).size} year${new Set(reports.map((r) => r.reportYear)).size !== 1 ? "s" : ""}`}
            {yearNum ? ` · ${yearNum}` : ""}
            {monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""}
          </p>
        </div>
        <PrintButton label="Print" />
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
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {hasFilter && (
          <Link
            href="/dashboard/field-reports/stats"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* No results */}
      {reports.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center print:hidden">
          <p className="text-sm text-gray-400">No reports found for the selected period.</p>
          <Link href="/dashboard/field-reports/stats" className="mt-2 inline-block text-xs text-teal-600 hover:underline">Clear filters</Link>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Baptisms", value: totals.baptisms, sub: `avg ${avg(totals.baptisms)}/mo`, color: "text-teal-700" },
          { label: "People Reached", value: totals.reached, sub: `avg ${avg(totals.reached)}/mo`, color: "text-blue-700" },
          { label: "Home Visits", value: totals.visits, sub: `avg ${avg(totals.visits)}/mo`, color: "text-purple-700" },
          { label: "Days Active", value: totals.days, sub: `avg ${avg(totals.days)}/mo`, color: "text-amber-700" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">{c.label}</p>
            <p className={`mt-0.5 text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Full metrics grid */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          {hasFilter ? "Totals for selected period" : "All-time Totals"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { label: "Activities", value: totals.activities },
            { label: "Bible Studies", value: totals.bibleStudies },
            { label: "Worship Sessions", value: totals.worshipSessions },
            { label: "Medical Visits", value: totals.medicalVisits },
            { label: "New Groups", value: totals.newGroups },
            { label: "Bap. Candidates", value: totals.candidates },
            { label: "Baptisms", value: totals.baptisms },
            { label: "People Reached", value: totals.reached },
            { label: "Home Visits", value: totals.visits },
            { label: "Days Active", value: totals.days },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-gray-50 p-2.5 text-center">
              <p className="text-[9px] uppercase tracking-widest text-gray-400">{m.label}</p>
              <p className="text-base font-bold text-gray-800 mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Best months */}
      {reports.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Personal Bests</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Most Baptisms", report: bestBaptismReport, value: bestBaptismReport.numberOfBaptisms, unit: "bap." },
              { label: "Most Reached", report: bestReachedReport, value: bestReachedReport.peopleReached ?? 0, unit: "people" },
              { label: "Most Days Active", report: bestDaysReport, value: bestDaysReport.daysOfWork, unit: "days" },
            ].map(({ label, report: r, value, unit }) => (
              <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-400">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{value} <span className="text-xs font-normal text-gray-400">{unit}</span></p>
                <p className="text-[10px] text-gray-500 mt-1">{MONTHS[r.reportMonth - 1]} {r.reportYear}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Baptism bar chart */}
      {reports.length > 1 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Baptisms by Month</p>
          <div className="flex items-end gap-1 h-28">
            {reports.map((r) => {
              const heightPct = (r.numberOfBaptisms / maxBaptisms) * 100;
              return (
                <div key={r.id} className="flex flex-col items-center gap-1 flex-1" title={`${MONTHS[r.reportMonth - 1]} ${r.reportYear}: ${r.numberOfBaptisms}`}>
                  <span className="text-[9px] text-gray-400">{r.numberOfBaptisms > 0 ? r.numberOfBaptisms : ""}</span>
                  <div
                    className="w-full rounded-t bg-teal-500 min-h-[2px] transition-all"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  />
                  <span className="text-[8px] text-gray-300 rotate-45 origin-left">{MONTHS[r.reportMonth - 1].slice(0, 1)}{r.reportYear.toString().slice(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent report list */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Report History</p>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Period</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Activities</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Days</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Visits</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Baptisms</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Reached</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...reports].reverse().map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/field-reports/${r.id}`} className="font-medium text-gray-900 hover:text-teal-700">
                    {MONTHS[r.reportMonth - 1]} {r.reportYear}
                  </Link>
                </td>
                <td className="px-4 py-2 text-right text-gray-600">{r.totalActivities}</td>
                <td className="px-4 py-2 text-right text-gray-600">{r.daysOfWork}</td>
                <td className="px-4 py-2 text-right text-gray-600">{r.nonSdaHomeVisits}</td>
                <td className="px-4 py-2 text-right font-semibold text-teal-700">{r.numberOfBaptisms}</td>
                <td className="px-4 py-2 text-right text-gray-600">{r.peopleReached ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
