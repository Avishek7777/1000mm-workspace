import type { ApplicationStatus, Prisma } from "@1000mm/db";

export type ApplicantsExportFilters = {
  programId?: string;
  /** Single status OR a comma-separated list of statuses. */
  status?: string;
  /** Mission code, e.g. "EBM". */
  mission?: string;
  /** Free-text match on applicant full name. */
  search?: string;
  /** Submission year, e.g. "2026". */
  year?: string;
};

export function parseApplicantsExportFilters(
  searchParams: URLSearchParams,
): ApplicantsExportFilters {
  return {
    programId: searchParams.get("programId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    mission: searchParams.get("mission") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    year: searchParams.get("year") ?? undefined,
  };
}

export function buildApplicantsExportWhere(
  filters: ApplicantsExportFilters,
  opts: { lmdMissionId?: string | null },
): Prisma.ApplicationWhereInput {
  const { programId, status, mission, search, year } = filters;
  const { lmdMissionId } = opts;

  // status may be a single value or comma-separated list.
  const statusList = status
    ? (status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as ApplicationStatus[])
    : undefined;

  const yearNum = year ? parseInt(year, 10) : NaN;
  const hasYear = !Number.isNaN(yearNum);

  return {
    deletedAt: null,
    // Explicit statuses (from the page) win; otherwise legacy "all but drafts".
    status: statusList ? { in: statusList } : { not: "DRAFT" },
    // LMD is hard-scoped to its own mission; director/SA use the mission filter.
    ...(lmdMissionId
      ? { submittedFromMissionId: lmdMissionId }
      : mission
        ? { submittedFromMission: { code: mission } }
        : {}),
    ...(programId ? { window: { programId } } : {}),
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
}

/** Human-readable label of the active filters, for the export header/summary. */
export function describeApplicantsFilters(
  filters: ApplicantsExportFilters,
  opts: { lmdMissionCode?: string | null },
): string {
  const parts: string[] = [];
  if (opts.lmdMissionCode) parts.push(`Mission: ${opts.lmdMissionCode}`);
  else if (filters.mission) parts.push(`Mission: ${filters.mission}`);
  if (filters.year) parts.push(`Year: ${filters.year}`);
  if (filters.search) parts.push(`Search: "${filters.search}"`);
  // Only label status when a single one is chosen (the default set isn't a useful label).
  if (filters.status && filters.status.split(",").length === 1) {
    parts.push(`Status: ${filters.status.replace(/_/g, " ")}`);
  }
  return parts.length ? parts.join(" · ") : "All Missions";
}
