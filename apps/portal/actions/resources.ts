"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  fileStorageKey: z.string().min(1, "File is required"),
  fileName: z.string().min(1),
  mimeType: z.string().optional(),
  fileSizeBytes: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  programId: z.string().optional().transform((v) => v || undefined),
});

export async function createResource(_: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const role = session.user.role;
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Trainers can only upload program-specific resources for their own programs
  if (role === "TRAINER") {
    if (!d.programId) return { ok: false, error: "Program is required for trainer resources" };
    const program = await prisma.trainingProgram.findFirst({
      where: { id: d.programId, topics: { some: { trainerId: session.user.id, deletedAt: null } }, deletedAt: null },
      select: { id: true },
    });
    if (!program) return { ok: false, error: "Program not found or access denied" };
  } else if (role !== "SYSTEM_ADMIN" && role !== "MAIN_DIRECTOR" && role !== "SECRETARY" && role !== "ASSOCIATE_DIRECTOR") {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await prisma.resource.create({
      data: {
        title: d.title,
        description: d.description ?? null,
        fileStorageKey: d.fileStorageKey,
        fileName: d.fileName,
        mimeType: d.mimeType ?? null,
        fileSizeBytes: d.fileSizeBytes ?? null,
        programId: d.programId ?? null,
        uploadedById: session.user.id,
      },
    });
  } catch (err) {
    console.error("[createResource]", err);
    return { ok: false, error: "Failed to save resource. Please try again." };
  }

  revalidatePath("/dashboard/resources");
  if (d.programId) revalidatePath(`/dashboard/programs/${d.programId}/resources`);
  return { ok: true };
}

export async function deleteResource(_: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  const role = session.user.role;

  const resource = await prisma.resource.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, uploadedById: true, programId: true },
  });
  if (!resource) return { ok: false, error: "Not found" };

  // Trainer can only delete their own resources; SA/UD can delete any
  if (role === "TRAINER" && resource.uploadedById !== session.user.id) {
    return { ok: false, error: "Unauthorized" };
  } else if (role !== "TRAINER" && role !== "SYSTEM_ADMIN" && role !== "MAIN_DIRECTOR" && role !== "SECRETARY" && role !== "ASSOCIATE_DIRECTOR") {
    return { ok: false, error: "Unauthorized" };
  }

  await prisma.resource.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/dashboard/resources");
  if (resource.programId) revalidatePath(`/dashboard/programs/${resource.programId}/resources`);
  return { ok: true };
}
