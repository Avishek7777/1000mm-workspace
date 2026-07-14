import type { DeploymentStatus, Prisma } from "@1000mm/db";

export type MissionariesExportFilters = {
  /** Deployment status: PENDING | ACTIVE | COMPLETED | REJECTED */
  status?: string;
  /** Mission code, e.g. "EBM". For UD/SA only — LMD is hard-scoped. */
  mission?: string;
  /** Year of deployment start date, e.g. "2026". */
  year?: string;
  /** Free-text match on missionary full name. */
  search?: string;
  /** Training program id — missionaries enrolled in this program. */
  program?: string;
};

export function parseMissionariesExportFilters(
  searchParams: URLSearchParams,
): MissionariesExportFilters {
  return {
    status: searchParams.get("status") ?? undefined,
    mission: searchParams.get("mission") ?? undefined,
    year: searchParams.get("year") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    program: searchParams.get("program") ?? undefined,
  };
}

export function buildMissionariesExportWhere(
  filters: MissionariesExportFilters,
  opts: { lmdMissionId?: string | null },
): Prisma.MissionaryDeploymentWhereInput {
  const { status, mission, year, search, program } = filters;
  const { lmdMissionId } = opts;

  const yearNum = year ? parseInt(year, 10) : NaN;
  const hasYear = !Number.isNaN(yearNum);

  return {
    deletedAt: null,
    ...(lmdMissionId
      ? { missionId: lmdMissionId }
      : mission
        ? { mission: { code: mission } }
        : {}),
    ...(status ? { status: status as DeploymentStatus } : {}),
    ...(hasYear
      ? {
          startDate: {
            gte: new Date(yearNum, 0, 1),
            lt: new Date(yearNum + 1, 0, 1),
          },
        }
      : {}),
    ...(search || program
      ? {
          missionary: {
            ...(search
              ? { fullName: { contains: search, mode: "insensitive" as const } }
              : {}),
            ...(program
              ? {
                  enrollmentsAsTrainee: {
                    some: { programId: program, deletedAt: null },
                  },
                }
              : {}),
          },
        }
      : {}),
  };
}

export function describeMissionariesFilters(
  filters: MissionariesExportFilters,
  opts: { lmdMissionCode?: string | null },
): string {
  const parts: string[] = [];
  if (opts.lmdMissionCode) parts.push(`Mission: ${opts.lmdMissionCode}`);
  else if (filters.mission) parts.push(`Mission: ${filters.mission}`);
  if (filters.status) parts.push(`Status: ${filters.status}`);
  if (filters.year) parts.push(`Year: ${filters.year}`);
  if (filters.search) parts.push(`Search: "${filters.search}"`);
  return parts.length ? parts.join(" · ") : "All Missions";
}
