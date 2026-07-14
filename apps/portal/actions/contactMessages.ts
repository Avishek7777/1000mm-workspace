"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@1000mm/db";
import type { UserRole } from "@1000mm/db";
import { requireDbUser } from "@/lib/auth/helpers";
import { sendContactReplyEmail } from "@/lib/email";

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// Who can manage website contact messages (SA + union office roles).
const CONTACT_ADMIN_ROLES: UserRole[] = [
  "SYSTEM_ADMIN",
  "MAIN_DIRECTOR",
  "SECRETARY",
  "ASSOCIATE_DIRECTOR",
];

const LIST_PATH = "/dashboard/system-admin/contact-messages";

// ─── MARK HANDLED / UNHANDLED ────────────────────────────────────────────────

export async function toggleContactMessageHandledAction(
  messageId: string,
  markHandled: boolean,
): Promise<ActionResult> {
  const user = await requireDbUser(CONTACT_ADMIN_ROLES);

  const message = await prisma.contactMessage.findFirst({
    where: { id: messageId, deletedAt: null },
  });
  if (!message) return { ok: false, error: "Message not found." };

  await prisma.contactMessage.update({
    where: { id: messageId },
    data: markHandled
      ? { isHandled: true, handledAt: new Date(), handledById: user.id }
      : { isHandled: false, handledAt: null, handledById: null },
  });

  await prisma.auditLog.create({
    data: {
      action: markHandled
        ? "CONTACT_MESSAGE_HANDLED"
        : "CONTACT_MESSAGE_REOPENED",
      actorId: user.id,
      actorRole: user.role,
      targetType: "ContactMessage",
      targetId: messageId,
      ipAddress: await getClientIp(),
    },
  });

  revalidatePath(LIST_PATH);
  return { ok: true };
}

// ─── MARK SPAM / NOT SPAM ────────────────────────────────────────────────────

export async function toggleContactMessageSpamAction(
  messageId: string,
  markSpam: boolean,
): Promise<ActionResult> {
  const user = await requireDbUser(CONTACT_ADMIN_ROLES);

  const message = await prisma.contactMessage.findFirst({
    where: { id: messageId, deletedAt: null },
  });
  if (!message) return { ok: false, error: "Message not found." };

  await prisma.contactMessage.update({
    where: { id: messageId },
    data: { isSpam: markSpam },
  });

  await prisma.auditLog.create({
    data: {
      action: markSpam
        ? "CONTACT_MESSAGE_MARKED_SPAM"
        : "CONTACT_MESSAGE_UNMARKED_SPAM",
      actorId: user.id,
      actorRole: user.role,
      targetType: "ContactMessage",
      targetId: messageId,
      ipAddress: await getClientIp(),
    },
  });

  revalidatePath(LIST_PATH);
  return { ok: true };
}

// ─── REPLY VIA EMAIL ─────────────────────────────────────────────────────────
// Sends the reply from the public info address and records it on the message.

export async function replyToContactMessageAction(
  messageId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDbUser(CONTACT_ADMIN_ROLES);

  const reply = String(formData.get("reply") ?? "").trim();
  if (reply.length < 5) {
    return { ok: false, fieldErrors: { reply: "Reply is too short." } };
  }
  if (reply.length > 5000) {
    return { ok: false, fieldErrors: { reply: "Max 5000 characters." } };
  }

  const message = await prisma.contactMessage.findFirst({
    where: { id: messageId, deletedAt: null },
  });
  if (!message) return { ok: false, error: "Message not found." };

  const subject = message.subject
    ? `Re: ${message.subject}`
    : "Re: Your message to 1000MM Bangladesh";

  try {
    await sendContactReplyEmail(
      message.email,
      message.fullName,
      subject,
      message.message,
      reply,
    );
  } catch (err) {
    console.error("[contactMessages] reply email failed", err);
    return {
      ok: false,
      error:
        "The email could not be sent. Check the email service configuration and try again.",
    };
  }

  await prisma.contactMessage.update({
    where: { id: messageId },
    data: {
      replyBody: reply,
      repliedAt: new Date(),
      repliedById: user.id,
      // Replying implies the message has been dealt with.
      isHandled: true,
      handledAt: message.handledAt ?? new Date(),
      handledById: message.handledById ?? user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "CONTACT_MESSAGE_REPLIED",
      actorId: user.id,
      actorRole: user.role,
      targetType: "ContactMessage",
      targetId: messageId,
      ipAddress: await getClientIp(),
    },
  });

  revalidatePath(LIST_PATH);
  return { ok: true };
}

// ─── DELETE (SOFT) ───────────────────────────────────────────────────────────
// Only SYSTEM_ADMIN can delete, mirroring other destructive admin actions.

export async function deleteContactMessageAction(
  messageId: string,
): Promise<ActionResult> {
  const user = await requireDbUser(["SYSTEM_ADMIN"]);

  const message = await prisma.contactMessage.findFirst({
    where: { id: messageId, deletedAt: null },
  });
  if (!message) return { ok: false, error: "Message not found." };

  await prisma.contactMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      action: "CONTACT_MESSAGE_DELETED",
      actorId: user.id,
      actorRole: user.role,
      targetType: "ContactMessage",
      targetId: messageId,
      ipAddress: await getClientIp(),
    },
  });

  revalidatePath(LIST_PATH);
  return { ok: true };
}
