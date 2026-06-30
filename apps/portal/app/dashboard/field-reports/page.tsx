import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default async function FieldReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { year, month } = await searchParams;
  const yearNum = year ? parseInt(year, 10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "TRAINEE") redirect("/dashboard");

  // Check enrollment
  const enrollment = await prisma.programEnrollment.findFirst({
    where: {
      traineeId: user.id,
      deletedAt: null,
      application: { status: "ACCEPTED" },
    },
    include: {
      program: { select: { title: true, code: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const allReports = await prisma.fieldReport.findMany({
    where: { traineeId: user.id },
    select: { reportYear: true },
    distinct: ["reportYear"],
    orderBy: { reportYear: "desc" },
  });
  const availableYears = allReports.map((r) => r.reportYear);

  const reports = await prisma.fieldReport.findMany({
    where: {
      traineeId: user.id,
      ...(yearNum ? { reportYear: yearNum } : {}),
      ...(monthNum ? { reportMonth: monthNum } : {}),
    },
    orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
    include: {
      _count: { select: { comments: true } },
    },
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const hasThisMonth = reports.some(
    (r) => r.reportMonth === currentMonth && r.reportYear === currentYear,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Field Reports</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {enrollment
              ? `${enrollment.program.code} — ${enrollment.program.title}`
              : "Monthly activity reports from the mission field"}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Link href="/dashboard/field-reports/immersion" className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">Immersion Report</Link>
          <Link href="/dashboard/field-reports/stats" className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">My Statistics</Link>
          <PrintButton label="Print" />
          {enrollment && !hasThisMonth && (
          <Link
            href="/dashboard/field-reports/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Submit {MONTHS[currentMonth - 1]} Report
          </Link>
          )}
        </div>
      </div>

      {/* Year/Month filters */}
      {availableYears.length > 0 && (
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
          {(year || month) && (
            <Link
              href="/dashboard/field-reports"
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      )}

      {/* Not enrolled */}
      {!enrollment && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Field reports are only available after your application has been
          accepted and you have been enrolled in a program.
        </div>
      )}

      {/* Already submitted this month */}
      {enrollment && hasThisMonth && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm text-teal-800">
          ✓ You have already submitted your report for{" "}
          {MONTHS[currentMonth - 1]} {currentYear}.
        </div>
      )}

      {/* Reports list */}
      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <svg
            className="mx-auto mb-3 h-8 w-8 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="text-sm text-gray-400">No reports submitted yet.</p>
          {enrollment && (
            <Link
              href="/dashboard/field-reports/new"
              className="mt-2 inline-block text-xs text-teal-600 hover:underline"
            >
              Submit your first report →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/field-reports/${r.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {MONTHS[r.reportMonth - 1]} {r.reportYear}
                    </span>
                    {r._count.comments > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        {r._count.comments} comment
                        {r._count.comments !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Activities: {r.totalActivities}</span>
                    <span>Days: {r.daysOfWork}</span>
                    <span>Baptisms: {r.numberOfBaptisms}</span>
                    {r.peopleReached != null && (
                      <span>People reached: {r.peopleReached}</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-gray-400">
                  {new Date(r.submittedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
