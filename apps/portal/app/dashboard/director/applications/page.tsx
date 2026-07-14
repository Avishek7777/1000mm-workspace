import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import type { ApplicationStatus } from "@1000mm/db";
import { ExportButtons } from "@/app/dashboard/_components/ExportButtons";
import { PrintButton } from "@/components/PrintButton";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_LMD_REVIEW: "Under LMD Review",
  RETURNED_TO_APPLICANT: "Returned to Applicant",
  RECOMMENDED: "Recommended",
  UNDER_MAIN_DIRECTOR_REVIEW: "Under Final Review",
  RETURNED_TO_LMD: "Returned to LMD",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_LMD_REVIEW: "bg-amber-100 text-amber-700",
  RETURNED_TO_APPLICANT: "bg-orange-100 text-orange-700",
  RECOMMENDED: "bg-teal-100 text-teal-700",
  UNDER_MAIN_DIRECTOR_REVIEW: "bg-purple-100 text-purple-700",
  RETURNED_TO_LMD: "bg-orange-100 text-orange-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

const MISSION_COLORS: Record<string, string> = {
  EBM: "bg-blue-100 text-blue-700",
  NBM: "bg-teal-100 text-teal-700",
  SBM: "bg-purple-100 text-purple-700",
  WBM: "bg-amber-100 text-amber-700",
};

// Director sees these statuses by default (all post-LMD statuses)
const DIRECTOR_STATUSES: ApplicationStatus[] = [
  "RECOMMENDED",
  "UNDER_MAIN_DIRECTOR_REVIEW",
  "RETURNED_TO_LMD",
  "ACCEPTED",
  "REJECTED",
];

type SearchParams = {
  status?: string;
  mission?: string;
  program?: string;
  search?: string;
  year?: string;
  page?: string;
};

const PAGE_SIZE = 20;

// Year dropdown range: current year back to 2023 (self-maintaining).
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 2023 + 1 },
  (_, i) => CURRENT_YEAR - i,
);

export default async function DirectorApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const { status, mission, program, search, year, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10));

  // Fetch missions and programs for the filter dropdowns
  const [missions, programs] = await Promise.all([
    prisma.localMission.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.trainingProgram.findMany({
      where: { deletedAt: null },
      orderBy: { startDate: "desc" },
      select: { id: true, code: true, title: true },
    }),
  ]);

  const missionId = mission
    ? missions.find((m) => m.code === mission)?.id
    : undefined;

  const yearNum = year ? parseInt(year, 10) : NaN;
  const hasYear = !Number.isNaN(yearNum);

  const where = {
    deletedAt: null as null,
    // Default: show all post-LMD statuses; override with specific filter
    status: status
      ? { equals: status as ApplicationStatus }
      : { in: DIRECTOR_STATUSES },
    ...(missionId ? { submittedFromMissionId: missionId } : {}),
    ...(program ? { window: { programId: program } } : {}),
    ...(search
      ? {
          applicantFullName: { contains: search, mode: "insensitive" as const },
        }
      : {}),
    ...(hasYear
      ? {
          submittedAt: {
            gte: new Date(yearNum, 0, 1),
            lt: new Date(yearNum + 1, 0, 1),
          },
        }
      : {}),
  };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: [
        // Recommended first (needs action), then by date
        { lastTransitionAt: "desc" },
      ],
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        referenceNumber: true,
        applicantFullName: true,
        status: true,
        submittedAt: true,
        lastTransitionAt: true,
        submittedFromMission: { select: { code: true, name: true } },
        recommendation: {
          select: {
            recommendedAt: true,
            recommender: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.application.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const baseParams = {
    ...(status ? { status } : {}),
    ...(mission ? { mission } : {}),
    ...(program ? { program } : {}),
    ...(search ? { search } : {}),
    ...(year ? { year } : {}),
  };

  const hasActiveFilters = Boolean(status || mission || program || search || year);

  // Filters to forward to the export routes so they export exactly what's shown.
  // When no status is chosen, send the joined default set so the export's
  // `{ in: [...] }` matches the page's `{ in: DIRECTOR_STATUSES }`.
  const exportFilters = {
    status: status ?? DIRECTOR_STATUSES.join(","),
    mission,
    programId: program,
    search,
    year,
  };

  const selectedProgram = program
    ? programs.find((p) => p.id === program)
    : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Applications</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            All missions · {total} result{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PrintButton label="Print List" />
          <Link
            href="/dashboard/director"
            className="print:hidden text-sm text-gray-500 hover:text-gray-700"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Print-only org/date header */}
      <div className="hidden print:block text-xs text-gray-500 -mt-4">
        1000 Missionary Movement Bangladesh — Applications List
        {status ? ` · ${STATUS_LABELS[status as ApplicationStatus] ?? status}` : " · Recommended & Above"}
        {mission ? ` · ${mission}` : ""}
        {selectedProgram ? ` · ${selectedProgram.code}` : ""}
        {year ? ` · ${year}` : ""} ·{" "}
        {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </div>

      {/* Filters */}
      <form method="GET" className="print:hidden flex flex-wrap gap-3">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search by name…"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />

        {/* Mission filter */}
        <select
          name="mission"
          defaultValue={mission ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Missions</option>
          {missions.map((m) => (
            <option key={m.id} value={m.code}>
              {m.code} — {m.name}
            </option>
          ))}
        </select>

        {/* Program filter */}
        <select
          name="program"
          defaultValue={program ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.title}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Recommended & Above</option>
          {(
            [
              "RECOMMENDED",
              "UNDER_MAIN_DIRECTOR_REVIEW",
              "RETURNED_TO_LMD",
              "ACCEPTED",
              "REJECTED",
              // Also allow Directors to see earlier statuses if needed
              "SUBMITTED",
              "UNDER_LMD_REVIEW",
              "RETURNED_TO_APPLICANT",
            ] as ApplicationStatus[]
          ).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {/* Year filter */}
        <select
          name="year"
          defaultValue={year ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Years</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        <div className="ms-auto">
          <ExportButtons {...exportFilters} />
        </div>

        {hasActiveFilters && (
          <Link
            href="/dashboard/director/applications"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-200 bg-white">
        {applications.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No applications found.</p>
            {hasActiveFilters && (
              <Link
                href="/dashboard/director/applications"
                className="mt-2 inline-block text-xs text-teal-600 hover:underline"
              >
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Reference No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Applicant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Mission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  LMD Recommender
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Recommended
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => {
                const mCode = app.submittedFromMission.code;
                const missionColor =
                  MISSION_COLORS[mCode] ?? "bg-gray-100 text-gray-600";
                const needsAction = [
                  "RECOMMENDED",
                  "UNDER_MAIN_DIRECTOR_REVIEW",
                ].includes(app.status);

                return (
                  <tr
                    key={app.id}
                    className={`transition-colors hover:bg-gray-50 ${needsAction ? "bg-amber-50/30" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {app.referenceNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {app.applicantFullName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${missionColor}`}
                      >
                        {mCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {app.recommendation?.recommender?.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {app.recommendation?.recommendedAt
                        ? new Date(
                            app.recommendation.recommendedAt,
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[app.status]}`}
                      >
                        {STATUS_LABELS[app.status]}
                      </span>
                    </td>
                    <td className="print:hidden px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/director/applications/${app.id}`}
                          className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                            needsAction
                              ? "border-teal-300 bg-white text-teal-700 hover:bg-teal-50"
                              : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {needsAction ? "Review" : "View"}
                        </Link>
                        <Link
                          href={`/dashboard/director/applications/${app.id}/print`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Print
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="print:hidden flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(pageNum - 1) * PAGE_SIZE + 1}–
            {Math.min(pageNum * PAGE_SIZE, total)} of {total}
          </p>
          <ExportButtons {...exportFilters} />
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link
                href={`?${new URLSearchParams({ ...baseParams, page: String(pageNum - 1) })}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                ← Prev
              </Link>
            )}
            {pageNum < totalPages && (
              <Link
                href={`?${new URLSearchParams({ ...baseParams, page: String(pageNum + 1) })}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
