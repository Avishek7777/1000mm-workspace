import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import type { ApplicationStatus } from "@1000mm/db";
import { ExportButton } from "./_components/ExportButton";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_LMD_REVIEW: "Under Review",
  RETURNED_TO_APPLICANT: "Returned",
  RECOMMENDED: "Recommended",
  UNDER_MAIN_DIRECTOR_REVIEW: "Final Review",
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

type SearchParams = {
  status?: string;
  search?: string;
  page?: string;
  year?: string;
  gender?: string;
  district?: string;
  programId?: string;
};

const PAGE_SIZE = 20;

export default async function LmdApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireRole(["LOCAL_DIRECTOR"]);
  const { status, search, page, year, gender, district, programId } = await searchParams;

  const lmdUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { directedMission: true },
  });

  const missionId = lmdUser?.directedMission?.id;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10));
  const yearNum = year ? parseInt(year, 10) : undefined;

  // Fetch programs available within this mission's windows for filter
  const programWindows = await prisma.applicationWindow.findMany({
    where: { scopedToMissionId: missionId },
    select: { programId: true, program: { select: { id: true, code: true, title: true } } },
    distinct: ["programId"],
  });
  const availablePrograms = programWindows.map((w) => w.program);

  const where = {
    submittedFromMissionId: missionId,
    deletedAt: null as null,
    // Applicant's account may have been deleted after they applied — don't
    // surface those in the active list.
    applicant: { deletedAt: null },
    status: status
      ? { equals: status as ApplicationStatus }
      : { not: "DRAFT" as ApplicationStatus },
    ...(search ? { applicantFullName: { contains: search, mode: "insensitive" as const } } : {}),
    ...(yearNum ? { submittedAt: { gte: new Date(`${yearNum}-01-01`), lt: new Date(`${yearNum + 1}-01-01`) } } : {}),
    ...(gender ? { applicantGender: gender as "MALE" | "FEMALE" } : {}),
    ...(district ? { presentAddressDistrict: { contains: district, mode: "insensitive" as const } } : {}),
    ...(programId ? { window: { programId } } : {}),
  };

  // Year options from submitted apps for this mission
  const yearRows = await prisma.application.findMany({
    where: { submittedFromMissionId: missionId, deletedAt: null, status: { not: "DRAFT" } },
    select: { submittedAt: true },
    orderBy: { submittedAt: "desc" },
  });
  const availableYears = [...new Set(
    yearRows
      .filter((r) => r.submittedAt)
      .map((r) => new Date(r.submittedAt!).getFullYear()),
  )].sort((a, b) => b - a);

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        referenceNumber: true,
        applicantFullName: true,
        status: true,
        submittedAt: true,
        applicantGender: true,
        applicantMobileNo: true,
      },
    }),
    prisma.application.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Applications</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} total</p>
        </div>
        <ExportButton
          missionId={missionId ?? ""}
          status={status}
          search={search}
        />
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-2">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search by name…"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {(["SUBMITTED","UNDER_LMD_REVIEW","RETURNED_TO_APPLICANT","RECOMMENDED","RETURNED_TO_LMD","ACCEPTED","REJECTED"] as ApplicationStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        {availableYears.length > 0 && (
          <select name="year" defaultValue={year ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500">
            <option value="">All Years</option>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        <select name="gender" defaultValue={gender ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500">
          <option value="">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        {availablePrograms.length > 0 && (
          <select name="programId" defaultValue={programId ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500">
            <option value="">All Programs</option>
            {availablePrograms.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
        )}
        <input
          type="text"
          name="district"
          defaultValue={district}
          placeholder="District…"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-32"
        />
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {(status || search || year || gender || district || programId) && (
          <Link
            href="/dashboard/lmd/applications"
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
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Reference No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Applicant Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Submitted
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
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {app.referenceNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {app.applicantFullName}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {app.submittedAt
                      ? new Date(app.submittedAt).toLocaleDateString("en-GB", {
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/lmd/applications/${app.id}/bio-data`}
                        target="_blank"
                        className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                      >
                        Bio-Data
                      </Link>
                      <Link
                        href={`/dashboard/lmd/applications/${app.id}/print`}
                        target="_blank"
                        className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                      >
                        Print
                      </Link>
                      <Link
                        href={`/dashboard/lmd/applications/${app.id}`}
                        className="rounded-lg border border-teal-300 bg-white px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(pageNum - 1) * PAGE_SIZE + 1}–
            {Math.min(pageNum * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link
                href={`?${new URLSearchParams({ ...(status ? { status } : {}), ...(search ? { search } : {}), ...(year ? { year } : {}), ...(gender ? { gender } : {}), ...(district ? { district } : {}), ...(programId ? { programId } : {}), page: String(pageNum - 1) })}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                ← Prev
              </Link>
            )}
            {pageNum < totalPages && (
              <Link
                href={`?${new URLSearchParams({ ...(status ? { status } : {}), ...(search ? { search } : {}), ...(year ? { year } : {}), ...(gender ? { gender } : {}), ...(district ? { district } : {}), ...(programId ? { programId } : {}), page: String(pageNum + 1) })}`}
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
