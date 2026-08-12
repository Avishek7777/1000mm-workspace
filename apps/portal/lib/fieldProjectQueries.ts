import { prisma } from "@1000mm/db";

/**
 * Shared loader for the project management views. `missionId` scopes it to one
 * mission (the LMD's own); omitting it spans every mission, which is what the
 * oversight roles see.
 */
export async function loadFieldProjects(missionId?: string) {
  return prisma.fieldProject.findMany({
    where: { deletedAt: null, ...(missionId ? { missionId } : {}) },
    orderBy: [{ stage: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      objective: true,
      stage: true,
      progressPercent: true,
      startDate: true,
      endDate: true,
      notes: true,
      mission: { select: { code: true, name: true } },
      assignments: {
        // Open assignments first, then most recently ended — the current team
        // matters more than who left two years ago.
        orderBy: [{ endedAt: "asc" }, { startedAt: "desc" }],
        select: {
          id: true,
          role: true,
          startedAt: true,
          endedAt: true,
          endReason: true,
          missionary: { select: { fullName: true } },
        },
      },
    },
  });
}

/** Headline counts for the board. */
export function summariseProjects(
  projects: Array<{ stage: string; assignments: Array<{ endedAt: Date | null }> }>,
) {
  return {
    total: projects.length,
    active: projects.filter((p) => ["STARTED", "IN_PROGRESS", "NEARLY_COMPLETE"].includes(p.stage))
      .length,
    completed: projects.filter((p) => p.stage === "COMPLETED").length,
    assigned: projects.reduce(
      (n, p) => n + p.assignments.filter((a) => a.endedAt == null).length,
      0,
    ),
  };
}
