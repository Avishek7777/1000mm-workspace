"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSchema = z.object({
  programId: z.string().min(1),
  topicId: z.string().min(1, "Topic is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  fileStorageKey: z.string().optional(),
  fileName: z.string().optional(),
});

export async function createAssignment(_: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TRAINER") {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Verify the topic belongs to this program and is assigned to this trainer
  const topic = await prisma.programTopic.findFirst({
    where: {
      id: d.topicId,
      programId: d.programId,
      trainerId: session.user.id,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!topic) return { ok: false, error: "Topic not found or not assigned to you" };

  await prisma.assignment.create({
    data: {
      programId: d.programId,
      topicId: d.topicId,
      title: d.title,
      description: d.description ?? null,
      dueDate: d.dueDate ?? null,
      fileStorageKey: d.fileStorageKey ?? null,
      fileName: d.fileName ?? null,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/dashboard/programs/${d.programId}/assignments`);
  return { ok: true };
}

export async function deleteAssignment(_: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TRAINER") {
    return { ok: false, error: "Unauthorized" };
  }
  const id = formData.get("id") as string;

  const assignment = await prisma.assignment.findFirst({
    where: { id, createdById: session.user.id, deletedAt: null },
    select: { id: true, programId: true },
  });
  if (!assignment) return { ok: false, error: "Not found" };

  await prisma.assignment.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath(`/dashboard/programs/${assignment.programId}/assignments`);
  return { ok: true };
}

const submitSchema = z.object({
  assignmentId: z.string().min(1),
  notes: z.string().optional(),
  fileStorageKey: z.string().optional(),
  fileName: z.string().optional(),
});

export async function submitAssignment(_: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TRAINEE") {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = submitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (!d.notes?.trim() && !d.fileStorageKey) {
    return { ok: false, error: "Please provide a file or written response" };
  }

  const assignment = await prisma.assignment.findFirst({
    where: { id: d.assignmentId, deletedAt: null },
    select: { id: true, programId: true },
  });
  if (!assignment) return { ok: false, error: "Assignment not found" };

  const enrolled = await prisma.programEnrollment.findFirst({
    where: { programId: assignment.programId, traineeId: session.user.id, deletedAt: null },
  });
  if (!enrolled) return { ok: false, error: "You are not enrolled in this program" };

  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_traineeId: { assignmentId: d.assignmentId, traineeId: session.user.id } },
    update: {
      notes: d.notes ?? null,
      fileStorageKey: d.fileStorageKey ?? null,
      fileName: d.fileName ?? null,
      submittedAt: new Date(),
    },
    create: {
      assignmentId: d.assignmentId,
      traineeId: session.user.id,
      notes: d.notes ?? null,
      fileStorageKey: d.fileStorageKey ?? null,
      fileName: d.fileName ?? null,
    },
  });

  revalidatePath("/dashboard/assignments");
  revalidatePath(`/dashboard/assignments/${d.assignmentId}`);
  return { ok: true };
}

const feedbackSchema = z.object({
  submissionId: z.string().min(1),
  feedback: z.string().min(1, "Feedback is required"),
  programId: z.string().min(1),
  assignmentId: z.string().min(1),
});

export async function submitFeedback(_: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TRAINER") {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = feedbackSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  const submission = await prisma.assignmentSubmission.findFirst({
    where: { id: d.submissionId, assignment: { createdById: session.user.id } },
    select: { id: true },
  });
  if (!submission) return { ok: false, error: "Not found" };

  await prisma.assignmentSubmission.update({
    where: { id: d.submissionId },
    data: { feedback: d.feedback, feedbackAt: new Date(), feedbackById: session.user.id },
  });

  revalidatePath(`/dashboard/programs/${d.programId}/assignments/${d.assignmentId}`);
  return { ok: true };
}
