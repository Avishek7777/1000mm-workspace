"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";

const createSchema = z.object({
  programId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  order: z.coerce.number().int().min(0).default(0),
});

const assignTrainerSchema = z.object({
  topicId: z.string().min(1),
  trainerId: z.string().optional(),
});

export async function createTopicAction(formData: FormData) {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"]);
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { programId, title, order } = parsed.data;

  await prisma.programTopic.create({
    data: { programId, title, order },
  });

  revalidatePath(`/dashboard/director/programs/${programId}`);
  return { ok: true };
}

export async function assignTopicTrainerAction(formData: FormData) {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"]);
  const parsed = assignTrainerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { topicId, trainerId } = parsed.data;

  const topic = await prisma.programTopic.findUnique({
    where: { id: topicId },
    select: { programId: true },
  });
  if (!topic) return { ok: false, error: "Topic not found" };

  await prisma.programTopic.update({
    where: { id: topicId },
    data: { trainerId: trainerId || null },
  });

  revalidatePath(`/dashboard/director/programs/${topic.programId}`);
  return { ok: true };
}

export async function deleteTopicAction(formData: FormData) {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"]);
  const topicId = String(formData.get("topicId") ?? "");
  if (!topicId) return { ok: false, error: "Missing topicId" };

  const topic = await prisma.programTopic.findUnique({
    where: { id: topicId },
    select: { programId: true },
  });
  if (!topic) return { ok: false, error: "Topic not found" };

  await prisma.programTopic.update({
    where: { id: topicId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/dashboard/director/programs/${topic.programId}`);
  return { ok: true };
}
