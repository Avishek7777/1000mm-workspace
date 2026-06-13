"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import {
  notifyAllActiveUsers,
  NOTIFICATION_TEMPLATES,
} from "@/lib/notifications";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "SYSTEM_ADMIN") redirect("/dashboard");
  return user;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

const announcementSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(120),
  body: z.string().trim().min(10, "Body is required.").max(5000),
  attachmentUrl: z
    .string()
    .url("Must be a valid URL.")
    .optional()
    .or(z.literal("")),
  publishNow: z.string().optional(), // checkbox value "on" or undefined
  expiresAt: z.string().optional(),
});

export async function createAnnouncementAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = announcementSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { title, body, attachmentUrl, publishNow, expiresAt } = parsed.data;
  const publishedAt = publishNow === "on" ? new Date() : null;

  const announcement = await prisma.announcement.create({
    data: {
      title,
      body,
      attachmentUrl: attachmentUrl || null,
      publishedAt,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById: user.id,
    },
  });

  // If published immediately, notify all users
  if (publishedAt) {
    await notifyAllActiveUsers(
      {
        templateKey: NOTIFICATION_TEMPLATES.ANNOUNCEMENT_PUBLISHED,
        templateData: { title, announcementId: announcement.id },
        actionUrl: "/dashboard/news",
      },
      user.id,
    );
  }

  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard/news");
  return { ok: true, id: announcement.id };
}

// ─── PUBLISH ──────────────────────────────────────────────────────────────────

export async function publishAnnouncementAction(
  id: string,
): Promise<ActionResult> {
  const user = await requireAdmin();

  const announcement = await prisma.announcement.findFirst({
    where: { id, deletedAt: null },
  });
  if (!announcement) return { ok: false, error: "Not found." };
  if (announcement.publishedAt) return { ok: true }; // already published

  await prisma.announcement.update({
    where: { id },
    data: { publishedAt: new Date() },
  });

  await notifyAllActiveUsers(
    {
      templateKey: NOTIFICATION_TEMPLATES.ANNOUNCEMENT_PUBLISHED,
      templateData: { title: announcement.title, announcementId: id },
      actionUrl: "/dashboard/news",
    },
    user.id,
  );

  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard/news");
  return { ok: true };
}

// ─── UNPUBLISH ────────────────────────────────────────────────────────────────

export async function unpublishAnnouncementAction(
  id: string,
): Promise<ActionResult> {
  await requireAdmin();
  await prisma.announcement.update({
    where: { id },
    data: { publishedAt: null },
  });
  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard/news");
  return { ok: true };
}

// ─── DELETE (soft) ────────────────────────────────────────────────────────────

export async function deleteAnnouncementAction(
  id: string,
): Promise<ActionResult> {
  await requireAdmin();
  await prisma.announcement.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard/news");
  return { ok: true };
}
