"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/helpers";
import { prisma, FieldProjectStage } from "@1000mm/db";

export type FieldProjectResult =
  | { ok: true; projectId?: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

/** Roles that oversee every mission's projects, not just their own. */
const OVERSIGHT_ROLES = [
  "MAIN_DIRECTOR",
  "SECRETARY",
  "ASSOCIATE_DIRECTOR",
  "SYSTEM_ADMIN",
] as const;

const projectSchema = z.object({
  name: z.string().trim().min(3, "Project name is required.").max(140),
  objective: z.string().trim().min(10, "Please describe the objective."),
  stage: z.nativeEnum(FieldProjectStage).default(FieldProjectStage.PLANNING),
  progressPercent: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().min(0, "0–100").max(100, "0–100").nullable(),
  ),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function parseDates(startStr?: string, endStr?: string) {
  const startDate = startStr ? new Date(startStr) : null;
  const endDate = endStr ? new Date(endStr) : null;
  if (startDate && endDate && endDate <= startDate) {
    return { error: "End date must be after the start date." as const };
  }
  return { startDate, endDate };
}

/**
 * Resolves the mission a project belongs to, and whether the caller may edit
 * it. An LMD is scoped to the mission they direct; oversight roles can read
 * and edit any mission's projects.
 */
async function resolveMissionForWrite(projectId?: string) {
  const user = await requireRole([
    "LOCAL_DIRECTOR",
    ...OVERSIGHT_ROLES,
  ]);
  const isOversight = (OVERSIGHT_ROLES as readonly string[]).includes(user.role);

  if (projectId) {
    const project = await prisma.fieldProject.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true, missionId: true },
    });
    if (!project) return { error: "Project not found." as const };
    if (!isOversight) {
      const mission = await prisma.localMission.findFirst({
        where: { id: project.missionId, directorId: user.id },
        select: { id: true },
      });
      if (!mission) return { error: "That project belongs to another mission." as const };
    }
    return { user, missionId: project.missionId };
  }

  // Creating: LMDs create in their own mission. Oversight roles must say which.
  const mission = await prisma.localMission.findFirst({
    where: { directorId: user.id },
    select: { id: true },
  });
  if (!mission) {
    return {
      error:
        "No mission is assigned to your account, so there is nowhere to create this project." as const,
    };
  }
  return { user, missionId: mission.id };
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createFieldProjectAction(
  _prev: FieldProjectResult,
  formData: FormData,
): Promise<FieldProjectResult> {
  const ctx = await resolveMissionForWrite();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = projectSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const d = parsed.data;
  const dates = parseDates(d.startDate, d.endDate);
  if ("error" in dates) return { ok: false, error: dates.error };

  const project = await prisma.fieldProject.create({
    data: {
      missionId: ctx.missionId,
      name: d.name,
      objective: d.objective,
      stage: d.stage,
      progressPercent: d.progressPercent,
      startDate: dates.startDate,
      endDate: dates.endDate,
      notes: d.notes || null,
      createdById: ctx.user.id,
    },
    select: { id: true },
  });

  revalidateProjectViews();
  return { ok: true, projectId: project.id };
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateFieldProjectAction(
  projectId: string,
  _prev: FieldProjectResult,
  formData: FormData,
): Promise<FieldProjectResult> {
  const ctx = await resolveMissionForWrite(projectId);
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = projectSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const d = parsed.data;
  const dates = parseDates(d.startDate, d.endDate);
  if ("error" in dates) return { ok: false, error: dates.error };

  await prisma.fieldProject.update({
    where: { id: projectId },
    data: {
      name: d.name,
      objective: d.objective,
      stage: d.stage,
      progressPercent: d.progressPercent,
      startDate: dates.startDate,
      endDate: dates.endDate,
      notes: d.notes || null,
    },
  });

  revalidateProjectViews();
  return { ok: true, projectId };
}

// ─── Progress-only update ────────────────────────────────────────────────────

/**
 * Narrow update used from a field report, where the LMD is reacting to what a
 * missionary reported and only wants to move the project on — not re-edit its
 * name, objective and dates.
 */
export async function updateFieldProjectProgressAction(
  projectId: string,
  stage: FieldProjectStage,
  progressPercent: number | null,
): Promise<FieldProjectResult> {
  const ctx = await resolveMissionForWrite(projectId);
  if ("error" in ctx) return { ok: false, error: ctx.error };

  if (
    progressPercent != null &&
    (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100)
  ) {
    return { ok: false, error: "Progress must be a whole number between 0 and 100." };
  }

  await prisma.fieldProject.update({
    where: { id: projectId },
    data: { stage, progressPercent },
  });

  revalidateProjectViews();
  return { ok: true, projectId };
}

// ─── Archive ─────────────────────────────────────────────────────────────────

export async function archiveFieldProjectAction(
  projectId: string,
): Promise<FieldProjectResult> {
  const ctx = await resolveMissionForWrite(projectId);
  if ("error" in ctx) return { ok: false, error: ctx.error };

  // Soft delete, and detach it from any deployment still pointing at it so the
  // assignment does not silently reference an archived project.
  await prisma.$transaction([
    prisma.missionaryDeployment.updateMany({
      where: { fieldProjectId: projectId },
      data: { fieldProjectId: null },
    }),
    prisma.fieldProject.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    }),
  ]);

  revalidateProjectViews();
  return { ok: true };
}

// ─── Reassign a deployment to a different project ────────────────────────────

/**
 * Moves an already-deployed missionary onto different work without ending the
 * deployment. Passing null unassigns them.
 */
export async function reassignDeploymentProjectAction(
  deploymentId: string,
  fieldProjectId: string | null,
  role?: string | null,
): Promise<FieldProjectResult> {
  const user = await requireRole(["LOCAL_DIRECTOR", ...OVERSIGHT_ROLES]);
  const isOversight = (OVERSIGHT_ROLES as readonly string[]).includes(user.role);

  const deployment = await prisma.missionaryDeployment.findFirst({
    where: { id: deploymentId, deletedAt: null },
    select: { id: true, missionId: true },
  });
  if (!deployment) return { ok: false, error: "Deployment not found." };

  if (!isOversight) {
    const mission = await prisma.localMission.findFirst({
      where: { id: deployment.missionId, directorId: user.id },
      select: { id: true },
    });
    if (!mission) {
      return { ok: false, error: "That deployment belongs to another mission." };
    }
  }

  // A project can only take missionaries from the mission that owns it.
  if (fieldProjectId) {
    const project = await prisma.fieldProject.findFirst({
      where: { id: fieldProjectId, deletedAt: null, missionId: deployment.missionId },
      select: { id: true },
    });
    if (!project) {
      return { ok: false, error: "That project is not available for this mission." };
    }
  }

  await prisma.missionaryDeployment.update({
    where: { id: deploymentId },
    data: {
      fieldProjectId,
      ...(role !== undefined ? { role: role || null } : {}),
    },
  });

  revalidateProjectViews();
  return { ok: true };
}

function revalidateProjectViews() {
  revalidatePath("/dashboard/lmd/deployments");
  revalidatePath("/dashboard/lmd/projects");
  revalidatePath("/dashboard/director/projects");
  revalidatePath("/dashboard/secretary/projects");
}
