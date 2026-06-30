"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";

export type TestimonyActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireSA() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SYSTEM_ADMIN") redirect("/dashboard");
  return user;
}

const testimonySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  location: z.string().trim().min(2, "Location is required").max(120),
  quote: z.string().trim().min(10, "Quote is required"),
  color: z.string().trim().min(2, "Color is required"),
  order: z.coerce.number().int().default(0),
  isPublished: z.preprocess((v) => v === "true" || v === true, z.boolean()).default(true),
});

export async function createTestimonyAction(
  _prev: TestimonyActionResult,
  formData: FormData,
): Promise<TestimonyActionResult> {
  await requireSA();

  const raw = Object.fromEntries(formData.entries());
  const parsed = testimonySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[k] = v[0] ?? "Invalid";
    }
    return { ok: false, fieldErrors };
  }

  await prisma.testimony.create({ data: parsed.data });
  revalidatePath("/dashboard/settings/testimonials");
  return { ok: true };
}

export async function updateTestimonyAction(
  id: string,
  _prev: TestimonyActionResult,
  formData: FormData,
): Promise<TestimonyActionResult> {
  await requireSA();

  const raw = Object.fromEntries(formData.entries());
  const parsed = testimonySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[k] = v[0] ?? "Invalid";
    }
    return { ok: false, fieldErrors };
  }

  await prisma.testimony.update({ where: { id }, data: parsed.data });
  revalidatePath("/dashboard/settings/testimonials");
  return { ok: true };
}

export async function deleteTestimonyAction(id: string): Promise<void> {
  await requireSA();
  await prisma.testimony.delete({ where: { id } });
  revalidatePath("/dashboard/settings/testimonials");
}

export async function togglePublishTestimonyAction(id: string, current: boolean): Promise<void> {
  await requireSA();
  await prisma.testimony.update({ where: { id }, data: { isPublished: !current } });
  revalidatePath("/dashboard/settings/testimonials");
}
