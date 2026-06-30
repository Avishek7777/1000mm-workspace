"use server";

import { prisma } from "@1000mm/db";
import { requireRole } from "@/lib/auth/helpers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Create topic ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  programId: z.string().min(1),
  title: z.string().min(1, "Topic title is required").max(100),
});

export async function createProgramTopicAction(_: unknown, formData: FormData) {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR"]);

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };
  const { programId, title } = parsed.data;

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
    select: { id: true },
  });
  if (!program) return { ok: false, error: "Program not found" };

  const maxOrder = await prisma.programTopic.aggregate({
    where: { programId, deletedAt: null },
    _max: { order: true },
  });

  await prisma.programTopic.create({
    data: { programId, title, order: (maxOrder._max.order ?? 0) + 1 },
  });

  revalidatePath(`/dashboard/director/programs/${programId}`);
  return { ok: true };
}

// ── Update topic title ────────────────────────────────────────────────────────

const updateSchema = z.object({
  topicId: z.string().min(1),
  title: z.string().min(1, "Topic title is required").max(100),
});

export async function updateProgramTopicAction(_: unknown, formData: FormData) {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR"]);

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };
  const { topicId, title } = parsed.data;

  const topic = await prisma.programTopic.findFirst({
    where: { id: topicId, deletedAt: null },
    select: { id: true, programId: true },
  });
  if (!topic) return { ok: false, error: "Topic not found" };

  await prisma.programTopic.update({ where: { id: topicId }, data: { title } });

  revalidatePath(`/dashboard/director/programs/${topic.programId}`);
  return { ok: true };
}

// ── Delete topic ──────────────────────────────────────────────────────────────

export async function deleteProgramTopicAction(_: unknown, formData: FormData) {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR"]);

  const topicId = String(formData.get("topicId") ?? "");
  if (!topicId) return { ok: false, error: "Missing topic ID" };

  const topic = await prisma.programTopic.findFirst({
    where: { id: topicId, deletedAt: null },
    select: { id: true, programId: true, _count: { select: { assignments: { where: { deletedAt: null } } } } },
  });
  if (!topic) return { ok: false, error: "Topic not found" };

  if (topic._count.assignments > 0)
    return { ok: false, error: "Cannot delete a topic that has assignments" };

  await prisma.programTopic.update({
    where: { id: topicId },
    data: { deletedAt: new Date(), trainerId: null },
  });

  revalidatePath(`/dashboard/director/programs/${topic.programId}`);
  return { ok: true };
}

// ── Assign trainer to topic ───────────────────────────────────────────────────

const assignSchema = z.object({
  topicId: z.string().min(1),
  trainerId: z.string().min(1),
});

export async function assignTrainerToTopicAction(_: unknown, formData: FormData) {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR"]);

  const parsed = assignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };
  const { topicId, trainerId } = parsed.data;

  const topic = await prisma.programTopic.findFirst({
    where: { id: topicId, deletedAt: null },
    select: { id: true, programId: true },
  });
  if (!topic) return { ok: false, error: "Topic not found" };

  const trainer = await prisma.user.findFirst({
    where: { id: trainerId, role: "TRAINER", isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (!trainer) return { ok: false, error: "Trainer not found or inactive" };

  await prisma.programTopic.update({
    where: { id: topicId },
    data: { trainerId },
  });

  revalidatePath(`/dashboard/director/programs/${topic.programId}`);
  return { ok: true };
}

// ── Unassign trainer from topic ───────────────────────────────────────────────

export async function unassignTrainerFromTopicAction(_: unknown, formData: FormData) {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR"]);

  const topicId = String(formData.get("topicId") ?? "");
  if (!topicId) return { ok: false, error: "Missing topic ID" };

  const topic = await prisma.programTopic.findFirst({
    where: { id: topicId, deletedAt: null },
    select: { id: true, programId: true },
  });
  if (!topic) return { ok: false, error: "Topic not found" };

  await prisma.programTopic.update({
    where: { id: topicId },
    data: { trainerId: null },
  });

  revalidatePath(`/dashboard/director/programs/${topic.programId}`);
  return { ok: true };
}
