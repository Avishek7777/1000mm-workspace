import { prisma } from "@1000mm/db";
import type { Prisma } from "@1000mm/db";

/**
 * Assignment-history bookkeeping.
 *
 * `MissionaryDeployment.fieldProjectId` is mutable, so it only answers "who is
 * on this project now". These helpers maintain FieldProjectAssignment, which
 * answers "who has been on it" — one open row per missionary per project, with
 * `endedAt` set when they move off.
 *
 * Every caller passes a transaction client: opening a new assignment and
 * closing the previous one must not be separable, or a reassignment that fails
 * halfway leaves a missionary recorded on two projects at once.
 */

type Tx = Prisma.TransactionClient;

/** Closes any open assignment rows for a deployment. Safe to call when none exist. */
export async function closeAssignmentsForDeployment(
  tx: Tx,
  deploymentId: string,
  endReason: string,
) {
  await tx.fieldProjectAssignment.updateMany({
    where: { deploymentId, endedAt: null },
    data: { endedAt: new Date(), endReason },
  });
}

/** Closes any open assignment rows for a missionary on a specific project. */
export async function closeAssignmentsForMissionaryOnProject(
  tx: Tx,
  missionaryId: string,
  fieldProjectId: string,
  endReason: string,
) {
  await tx.fieldProjectAssignment.updateMany({
    where: { missionaryId, fieldProjectId, endedAt: null },
    data: { endedAt: new Date(), endReason },
  });
}

/** Opens an assignment row. Does nothing when there is no project to assign to. */
export async function openAssignment(
  tx: Tx,
  input: {
    fieldProjectId: string | null;
    missionaryId: string;
    deploymentId: string;
    role: string | null;
    assignedById: string;
    startedAt?: Date;
  },
) {
  if (!input.fieldProjectId) return;
  await tx.fieldProjectAssignment.create({
    data: {
      fieldProjectId: input.fieldProjectId,
      missionaryId: input.missionaryId,
      deploymentId: input.deploymentId,
      role: input.role,
      assignedById: input.assignedById,
      ...(input.startedAt ? { startedAt: input.startedAt } : {}),
    },
  });
}
