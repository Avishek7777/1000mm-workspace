"use server";

import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { revalidatePath } from "next/cache";
import { syncMissionaryDeploymentLocation } from "@/lib/deploymentSync";
import {
  openAssignment,
  closeAssignmentsForDeployment,
} from "@/lib/fieldProjectAssignments";

type ActionResult = { ok: true } | { ok: false; error: string };

// ─── LMD: Request a new missionary deployment ────────────────────────────────

export async function requestDeploymentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireRole(["LOCAL_DIRECTOR"]);

  const missionaryId = formData.get("missionaryId") as string;
  const location = (formData.get("location") as string).trim();
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = (formData.get("endDate") as string) || null;

  // Assignment details — what the missionary will be working on and on what
  // terms. All optional: a deployment can be requested before the work is
  // pinned down, and the project can be attached later from the projects page.
  const fieldProjectId = ((formData.get("fieldProjectId") as string) || "").trim() || null;
  const role = ((formData.get("role") as string) || "").trim() || null;
  const responsibilities = ((formData.get("responsibilities") as string) || "").trim() || null;
  const jobDescription = ((formData.get("jobDescription") as string) || "").trim() || null;

  if (!missionaryId || !startDateStr) {
    return { ok: false, error: "Missionary and start date are required." };
  }

  // Resolve the LMD's mission
  const lmdMission = await prisma.localMission.findFirst({
    where: { directorId: user.id },
  });
  if (!lmdMission) {
    return { ok: false, error: "No mission assigned to your account." };
  }

  // Verify the missionary belongs to this LMD's mission
  const missionary = await prisma.user.findFirst({
    where: { id: missionaryId, homeMissionId: lmdMission.id, deletedAt: null },
  });
  if (!missionary) {
    return { ok: false, error: "Missionary not found in your mission." };
  }

  // Block if already has an active or pending deployment
  const existing = await prisma.missionaryDeployment.findFirst({
    where: {
      missionaryId,
      status: { in: ["PENDING", "ACTIVE"] },
      deletedAt: null,
    },
  });
  if (existing) {
    return {
      ok: false,
      error:
        existing.status === "ACTIVE"
          ? "This missionary already has an active deployment. End it before requesting a new one."
          : "A pending deployment request already exists for this missionary.",
    };
  }

  const startDate = new Date(startDateStr);
  const endDate = endDateStr ? new Date(endDateStr) : null;

  if (endDate && endDate <= startDate) {
    return { ok: false, error: "End date must be after start date." };
  }

  // A project can only take missionaries from the mission that owns it —
  // checked here rather than trusting the id posted by the form.
  if (fieldProjectId) {
    const project = await prisma.fieldProject.findFirst({
      where: { id: fieldProjectId, missionId: lmdMission.id, deletedAt: null },
      select: { id: true },
    });
    if (!project) {
      return { ok: false, error: "That project is not available for your mission." };
    }
  }

  // The deployment and its opening assignment-history row are written
  // together — a deployment recorded without its assignment would leave a gap
  // in the project's history that nothing later can reconstruct.
  await prisma.$transaction(async (tx) => {
    const deployment = await tx.missionaryDeployment.create({
      data: {
        missionaryId,
        missionId: lmdMission.id,
        location: location || null,
        startDate,
        endDate,
        status: "PENDING",
        requestedById: user.id,
        fieldProjectId,
        role,
        responsibilities,
        jobDescription,
      },
      select: { id: true },
    });

    await openAssignment(tx, {
      fieldProjectId,
      missionaryId,
      deploymentId: deployment.id,
      role,
      assignedById: user.id,
      startedAt: startDate,
    });
  });

  revalidatePath("/dashboard/lmd/deployments");
  return { ok: true };
}

// ─── SA/UD: Approve or reject a pending deployment request ───────────────────

export async function reviewDeploymentAction(
  deploymentId: string,
  approve: boolean,
  reviewNote?: string,
): Promise<ActionResult> {
  const reviewer = await requireRole(["SYSTEM_ADMIN", "SECRETARY", "ASSOCIATE_DIRECTOR", "MAIN_DIRECTOR"]);

  const deployment = await prisma.missionaryDeployment.findFirst({
    where: { id: deploymentId, status: "PENDING", deletedAt: null },
  });
  if (!deployment) {
    return { ok: false, error: "Deployment request not found or already reviewed." };
  }

  if (!approve && !reviewNote?.trim()) {
    return { ok: false, error: "A reason is required when rejecting a deployment." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.missionaryDeployment.update({
      where: { id: deploymentId },
      data: {
        status: approve ? "ACTIVE" : "REJECTED",
        reviewedById: reviewer.id,
        reviewNote: reviewNote?.trim() || null,
        reviewedAt: new Date(),
      },
    });

    if (approve) {
      await tx.user.update({
        where: { id: deployment.missionaryId },
        data: { isMissionary: true },
      });
    } else {
      // A rejected request never became real work, so its assignment row
      // closes immediately rather than lingering as an open one.
      await closeAssignmentsForDeployment(tx, deploymentId, "Request rejected");
    }
  });

  // Push the (now-active, or no longer active if rejected) location out to
  // every place that mirrors it — Trainees pages, exports, ID cards, the
  // missionary's own My Program page.
  await syncMissionaryDeploymentLocation(deployment.missionaryId);

  revalidatePath("/dashboard/director/deployments");
  revalidatePath("/dashboard/lmd/deployments");
  revalidatePath("/dashboard/trainees");
  revalidatePath("/dashboard/my-program");
  return { ok: true };
}

// ─── SA/UD or LMD: End an active deployment ──────────────────────────────────

export async function endDeploymentAction(
  deploymentId: string,
): Promise<ActionResult> {
  const user = await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR", "LOCAL_DIRECTOR"]);

  const deployment = await prisma.missionaryDeployment.findFirst({
    where: { id: deploymentId, status: "ACTIVE", deletedAt: null },
    include: { mission: true },
  });
  if (!deployment) {
    return { ok: false, error: "Active deployment not found." };
  }

  // LMD can only end deployments within their own mission
  if (user.role === "LOCAL_DIRECTOR") {
    const lmdMission = await prisma.localMission.findFirst({
      where: { directorId: user.id },
    });
    if (!lmdMission || deployment.missionId !== lmdMission.id) {
      return { ok: false, error: "You can only end deployments within your own mission." };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.missionaryDeployment.update({
      where: { id: deploymentId },
      data: {
        status: "COMPLETED",
        endDate: deployment.endDate ?? new Date(),
      },
    });
    // The missionary is no longer on the project, so their assignment closes
    // with the deployment rather than being left open forever.
    await closeAssignmentsForDeployment(tx, deploymentId, "Deployment ended");
  });

  await syncMissionaryDeploymentLocation(deployment.missionaryId);

  revalidatePath("/dashboard/director/deployments");
  revalidatePath("/dashboard/lmd/deployments");
  revalidatePath("/dashboard/trainees");
  revalidatePath("/dashboard/my-program");
  return { ok: true };
}

// ─── LMD: Cancel a pending deployment request ────────────────────────────────

export async function cancelDeploymentRequestAction(
  deploymentId: string,
): Promise<ActionResult> {
  const user = await requireRole(["LOCAL_DIRECTOR"]);

  const deployment = await prisma.missionaryDeployment.findFirst({
    where: {
      id: deploymentId,
      status: "PENDING",
      requestedById: user.id,
      deletedAt: null,
    },
  });
  if (!deployment) {
    return { ok: false, error: "Pending request not found or you did not create it." };
  }

  await prisma.missionaryDeployment.update({
    where: { id: deploymentId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/dashboard/lmd/deployments");
  return { ok: true };
}
