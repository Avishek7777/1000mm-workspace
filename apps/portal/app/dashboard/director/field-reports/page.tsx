import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";

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

export default async function DirectorFieldReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string; year?: string; month?: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);
  const { mission, year, month } = await searchParams;

  const reports = await prisma.fieldReport.findMany({
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
  });

  // Available years for filter
  const years = [...new Set(reports.map((r) => r.reportYear))].sort(
    (a, b) => b - a,
  );
  const missions = ["EBM", "NBM", "SBM", "WBM"];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Field Reports</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {reports.length} report{reports.length !== 1 ? "s" : ""} across all
          missions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Mission filter */}
        <Link
          href={`?${new URLSearchParams({ ...(year ? { year } : {}), ...(month ? { month } : {}) })}`}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!mission ? "border-teal-400 bg-teal-50 text-teal-800" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
        >
          All missions
        </Link>
        {missions.map((m) => (
          <Link
            key={m}
            href={`?${new URLSearchParams({ mission: m, ...(year ? { year } : {}), ...(month ? { month } : {}) })}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${mission === m ? "border-purple-400 bg-purple-50 text-purple-800" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
          >
            {m}
          </Link>
        ))}
        {/* Year filter */}
        {years.map((y) => (
          <Link
            key={y}
            href={`?${new URLSearchParams({ ...(mission ? { mission } : {}), year: String(y), ...(month ? { month } : {}) })}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${year === String(y) ? "border-amber-400 bg-amber-50 text-amber-800" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
          >
            {y}
          </Link>
        ))}
        {(mission || year || month) && (
          <Link
            href="?"
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 hover:border-gray-300"
          >
            ✕ clear
          </Link>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No reports found.</p>
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
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {r.trainee.fullName}
                    </span>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                      {r.trainee.homeMission?.code}
                    </span>
                    <span className="text-xs text-gray-500">
                      {MONTHS[r.reportMonth - 1]} {r.reportYear}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      {r.program.code}
                    </span>
                    {r._count.comments > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        {r._count.comments} comment
                        {r._count.comments !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Activities: {r.totalActivities}</span>
                    <span>Days: {r.daysOfWork}</span>
                    <span>Baptisms: {r.numberOfBaptisms}</span>
                    {r.peopleReached != null && (
                      <span>People reached: {r.peopleReached}</span>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 text-[11px] text-gray-400">
                  {new Date(r.submittedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
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
