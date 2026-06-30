"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { FinancialEntryType } from "@1000mm/db";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const entrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER_TO_MISSION", "DEPOSIT", "DONATION", "OTHER"]),
  amount: z.coerce.number().positive("Amount must be positive."),
  date: z.string().min(1, "Date is required."),
  description: z.string().trim().min(2, "Description is required.").max(300),
  missionId: z.string().optional().transform((v) => v || undefined),
  reference: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || undefined),
  otherCategory: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || undefined),
});

async function getActorSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, homeMissionId: true },
  });
  return user;
}

export async function createFinancialEntry(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActorSession();
  if (!actor) return { ok: false, error: "Not authenticated." };
  if (!["SYSTEM_ADMIN", "SECRETARY", "ASSOCIATE_DIRECTOR", "MAIN_DIRECTOR"].includes(actor.role)) {
    return { ok: false, error: "Not permitted." };
  }

  const parsed = entrySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = issue.path[0]?.toString();
      if (f && !fieldErrors[f]) fieldErrors[f] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const d = parsed.data;
  const resolvedMissionId = d.missionId;

  // For OTHER type, append the write-in category to the description if provided
  const description =
    d.type === "OTHER" && d.otherCategory
      ? `${d.description} [${d.otherCategory}]`
      : d.description;

  await prisma.financialEntry.create({
    data: {
      type: d.type as FinancialEntryType,
      amount: d.amount,
      date: new Date(d.date),
      description,
      missionId: resolvedMissionId ?? null,
      reference: d.reference,
      createdById: actor.id,
    },
  });

  revalidatePath("/dashboard/financial");
  revalidatePath("/dashboard/director/financial");
  revalidatePath("/dashboard/lmd/financial");
  return { ok: true };
}

export async function deleteFinancialEntry(
  entryId: string,
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  const actor = await getActorSession();
  if (!actor) return { ok: false, error: "Not authenticated." };
  if (actor.role !== "SYSTEM_ADMIN") {
    return { ok: false, error: "Only System Admin can delete financial entries." };
  }

  const entry = await prisma.financialEntry.findUnique({ where: { id: entryId } });
  if (!entry) return { ok: false, error: "Entry not found." };

  await prisma.financialEntry.delete({ where: { id: entryId } });

  revalidatePath("/dashboard/financial");
  revalidatePath("/dashboard/director/financial");
  revalidatePath("/dashboard/lmd/financial");
  return { ok: true };
}
