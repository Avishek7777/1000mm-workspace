import "server-only";
import { prisma } from "@1000mm/db";

/**
 * MissionaryDeployment (the LMD-requests / SA-UD-approves workflow) is the
 * single source of truth for "where is this missionary deployed." Several
 * other places used to store their own independent copy of the same text
 * (ProgramEnrollment.deploymentLocation, SalaryAssignment.deploymentLocation)
 * which could silently drift out of sync since each had its own edit form.
 *
 * Call this after any change to a missionary's ACTIVE deployment status
 * (approve, end) to push the current location into their enrollment record —
 * every read site (Trainees pages, exports, ID cards, certificates, the
 * missionary's own My Program page) already reads from that field, so they
 * all stay correct without needing individual updates.
 */
export async function syncMissionaryDeploymentLocation(
  missionaryId: string,
): Promise<void> {
  const active = await prisma.missionaryDeployment.findFirst({
    where: { missionaryId, status: "ACTIVE", deletedAt: null },
    orderBy: { startDate: "desc" },
  });

  await prisma.programEnrollment.updateMany({
    where: { traineeId: missionaryId, status: "ENROLLED", deletedAt: null },
    data: {
      deploymentLocation: active?.location ?? null,
      deploymentAssignedAt: active ? (active.reviewedAt ?? active.startDate) : null,
      deploymentAssignedById: active ? (active.reviewedById ?? active.requestedById) : null,
    },
  });
}

/**
 * Resolve the location to use for a new salary assignment: the missionary's
 * currently active deployment, falling back to their most recent one if
 * none is active right now (so salary assignment doesn't hard-block on a
 * lapsed/pending renewal). Returns null if the missionary has no deployment
 * record at all yet.
 */
export async function resolveMissionaryDeploymentLocation(
  missionaryId: string,
): Promise<string | null> {
  const active = await prisma.missionaryDeployment.findFirst({
    where: { missionaryId, status: "ACTIVE", deletedAt: null },
    select: { location: true },
  });
  if (active) return active.location;

  const mostRecent = await prisma.missionaryDeployment.findFirst({
    where: { missionaryId, deletedAt: null },
    orderBy: { startDate: "desc" },
    select: { location: true },
  });
  return mostRecent?.location ?? null;
}
