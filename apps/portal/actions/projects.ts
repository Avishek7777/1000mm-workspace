"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";

export type ProjectActionResult = {
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

const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  title: z.string().trim().min(2, "Title is required").max(120),
  subtitle: z.string().trim().min(2, "Subtitle is required").max(200),
  description: z.string().trim().min(10, "Description is required"),
  location: z.string().trim().min(2, "Location is required").max(200),
  date: z.string().trim().min(2, "Date/period is required").max(100),
  tags: z.string().trim(),
  status: z.enum(["Active", "Completed", "Upcoming"]),
  goal: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
  participants: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().min(0).max(10_000_000).optional(),
  ),
  highlight: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  body: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  budget: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
  objectivesRaw: z.string().trim().optional(),
  order: z.coerce.number().int().default(0),
  isPublished: z.coerce.boolean().default(true),
});

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseImages(formData: FormData): string[] {
  return [0, 1, 2, 3, 4]
    .map((i) => (formData.get(`image_${i}`) as string ?? "").trim())
    .filter(Boolean);
}

export async function createProjectAction(
  _prev: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  await requireSA();

  const images = parseImages(formData);
  if (images.length === 0)
    return { ok: false, fieldErrors: { images: "At least one image is required." } };

  const raw = Object.fromEntries(formData.entries());
  const parsed = projectSchema.safeParse({
    ...raw,
    isPublished: formData.get("isPublished") === "true",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = issue.path[0]?.toString();
      if (f && !fieldErrors[f]) fieldErrors[f] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { tags: tagsRaw, objectivesRaw, ...rest } = parsed.data;
  const tags = parseTags(tagsRaw);
  const objectives = (objectivesRaw ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  const existing = await prisma.project.findUnique({ where: { slug: rest.slug } });
  if (existing)
    return { ok: false, fieldErrors: { slug: "This slug is already in use." } };

  await prisma.project.create({ data: { ...rest, tags, images, objectives } });

  revalidatePath("/dashboard/system-admin/projects");
  return { ok: true };
}

export async function updateProjectAction(
  id: string,
  _prev: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  await requireSA();

  const images = parseImages(formData);
  if (images.length === 0)
    return { ok: false, fieldErrors: { images: "At least one image is required." } };

  const raw = Object.fromEntries(formData.entries());
  const parsed = projectSchema.safeParse({
    ...raw,
    isPublished: formData.get("isPublished") === "true",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = issue.path[0]?.toString();
      if (f && !fieldErrors[f]) fieldErrors[f] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { tags: tagsRaw, objectivesRaw, ...rest } = parsed.data;
  const tags = parseTags(tagsRaw);
  const objectives = (objectivesRaw ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  const existing = await prisma.project.findUnique({ where: { slug: rest.slug } });
  if (existing && existing.id !== id)
    return { ok: false, fieldErrors: { slug: "This slug is already in use." } };

  await prisma.project.update({ where: { id }, data: { ...rest, tags, images, objectives } });

  revalidatePath("/dashboard/system-admin/projects");
  return { ok: true };
}

export async function deleteProjectAction(id: string): Promise<ProjectActionResult> {
  await requireSA();
  await prisma.project.delete({ where: { id } });
  revalidatePath("/dashboard/system-admin/projects");
  return { ok: true };
}

export async function togglePublishAction(id: string, current: boolean): Promise<ProjectActionResult> {
  await requireSA();
  await prisma.project.update({ where: { id }, data: { isPublished: !current } });
  revalidatePath("/dashboard/system-admin/projects");
  return { ok: true };
}
