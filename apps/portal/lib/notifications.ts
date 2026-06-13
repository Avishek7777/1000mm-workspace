/**
 * lib/notifications.ts
 * Server-side helpers for creating in-app notifications.
 * Call these from server actions whenever a notification-worthy event occurs.
 */

import { prisma } from "@1000mm/db";
import { Prisma } from "@prisma/client";

type CreateNotificationInput = {
  userId: string;
  templateKey: string;
  templateData?: Record<string, unknown>;
  actionUrl?: string;
};

// ── Single notification ───────────────────────────────────────────────────────

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      channel: "IN_APP",
      templateKey: input.templateKey,
      templateData: (input.templateData ?? {}) as Prisma.InputJsonValue,
      actionUrl: input.actionUrl ?? null,
    },
  });
}

// ── Bulk — notify many users at once ─────────────────────────────────────────

export async function createNotificationForMany(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">,
) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      channel: "IN_APP" as const,
      templateKey: input.templateKey,
      templateData: (input.templateData ?? {}) as Prisma.InputJsonValue,
      actionUrl: input.actionUrl ?? null,
    })),
    skipDuplicates: true,
  });
}

// ── Notify all active users (e.g. on announcement publish) ───────────────────

export async function notifyAllActiveUsers(
  input: Omit<CreateNotificationInput, "userId">,
  excludeUserId?: string,
) {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  await createNotificationForMany(
    users.map((u) => u.id),
    input,
  );
}

// ── Notify staff about a complaint (UD + SA only — LMD does not see complaints) ──

export async function notifyStaffAboutComplaint(
  _missionCode: string | null | undefined, // kept for backwards compat — not used
  input: Omit<CreateNotificationInput, "userId">,
  excludeUserId?: string,
) {
  const staff = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      role: { in: ["MAIN_DIRECTOR", "SYSTEM_ADMIN"] },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  await createNotificationForMany(
    staff.map((u) => u.id),
    input,
  );
}

// ── Template keys (keep in sync with notification page rendering) ─────────────

export const NOTIFICATION_TEMPLATES = {
  ANNOUNCEMENT_PUBLISHED: "announcement.published",
  APPLICATION_STATUS_CHANGED: "application.status_changed",
  COMPLAINT_SUBMITTED: "complaint.submitted",
  COMPLAINT_RESPONSE: "complaint.response",
} as const;

export type NotificationTemplateKey =
  (typeof NOTIFICATION_TEMPLATES)[keyof typeof NOTIFICATION_TEMPLATES];
