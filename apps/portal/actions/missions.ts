"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const createMissionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code is required.")
    .max(10, "Code too long.")
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, "Code must be letters and numbers only."),
  name: z.string().trim().min(2, "Name is required.").max(120),
  nameBangla: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => v || ""),
  contactEmail: z
    .string()
    .trim()
    .email("Invalid email.")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  contactPhone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => v || undefined),
  address: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || undefined),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => v || undefined),
  directorId: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined),
});

export async function createMissionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return { ok: false, error: "Only System Admins can create missions." };
  }

  const parsed = createMissionSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = issue.path[0]?.toString();
      if (f && !fieldErrors[f]) fieldErrors[f] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const d = parsed.data;

  const existing = await prisma.localMission.findFirst({
    where: { code: d.code, deletedAt: null },
  });
  if (existing) {
    return { ok: false, error: `A mission with code "${d.code}" already exists.` };
  }

  await prisma.localMission.create({
    data: {
      code: d.code,
      name: d.name,
      nameBangla: d.nameBangla ?? "",
      contactEmail: d.contactEmail ?? null,
      contactPhone: d.contactPhone ?? null,
      address: d.address ?? null,
      description: d.description ?? null,
      directorId: d.directorId ?? null,
    },
  });

  revalidatePath("/dashboard/missions");
  return { ok: true };
}

const missionSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  nameBangla: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => v || undefined),
  contactEmail: z
    .string()
    .trim()
    .email("Invalid email.")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  contactPhone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => v || undefined),
  address: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || undefined),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => v || undefined),
  directorId: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined),
});

export async function updateMissionAction(
  missionId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role)) {
    return { ok: false, error: "Not permitted." };
  }

  const parsed = missionSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = issue.path[0]?.toString();
      if (f && !fieldErrors[f]) fieldErrors[f] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const d = parsed.data;

  await prisma.localMission.update({
    where: { id: missionId },
    data: {
      name: d.name,
      nameBangla: d.nameBangla ?? "",
      contactEmail: d.contactEmail ?? null,
      contactPhone: d.contactPhone ?? null,
      address: d.address ?? null,
      description: d.description ?? null,
      directorId: d.directorId ?? null,
    },
  });

  revalidatePath("/dashboard/missions");
  return { ok: true };
}
