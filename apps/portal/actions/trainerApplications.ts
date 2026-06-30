"use server";

// apps/portal/actions/trainerApplications.ts

import { prisma } from "@1000mm/db";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendTrainerSetupEmail } from "@/lib/email";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireSA() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    throw new Error("Unauthorised");
  }
  return session.user;
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * SA approves a trainer application:
 * 1. Creates a User with role TRAINER (inactive until password set)
 * 2. Creates a PasswordResetToken (reused as "set password" link)
 * 3. Marks application APPROVED + links createdUserId
 * 4. Logs to audit
 * 5. Sends email (console log for now — wire to Resend)
 *
 * The trainer's homeMissionId must be provided by the SA (they pick from
 * the missions list in the UI — passed as formData).
 */
export async function approveTrainerApplicationAction(formData: FormData) {
  const sa = await requireSA();

  const applicationId = String(formData.get("applicationId") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim() || null;
  const topicId = String(formData.get("topicId") ?? "").trim() || null;

  if (!applicationId)
    throw new Error("Missing required fields.");

  const application = await prisma.trainerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw new Error("Application not found.");
  if (application.status !== "PENDING")
    throw new Error("Application is no longer pending.");

  // Check if a portal account already exists for this email
  const existingUser = await prisma.user.findUnique({
    where: { email: application.email },
  });

  let newUser: { id: string };
  let resetUrl: string | null = null;

  if (existingUser) {
    if (existingUser.role !== "TRAINER") {
      throw new Error(
        `A portal account with this email already exists (current role: ${existingUser.role.replace(/_/g, " ")}). ` +
          `Go to Users → find this person → change their role to Trainer first, then approve this application.`,
      );
    }
    // Already a TRAINER — link their existing account without creating a duplicate
    newUser = existingUser;
  } else {
    // 1. Create User (passwordHash is a placeholder — they'll set it via the link)
    const placeholderHash = await bcrypt.hash(
      crypto.randomBytes(32).toString("hex"),
      12,
    );

    newUser = await prisma.user.create({
      data: {
        fullName: application.fullName,
        email: application.email,
        phone: application.phone ?? undefined,
        passwordHash: placeholderHash,
        role: "TRAINER",
        isActive: true,
        emailVerified: new Date(),
      } as any,
    });

    // 2. Create PasswordResetToken (expires in 7 days — generous for email delivery)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token: rawToken, userId: newUser.id, expiresAt },
    });

    resetUrl = `${process.env.NEXT_PUBLIC_PORTAL_URL}/reset-password?token=${rawToken}`;
  }

  // 3. Update application
  await prisma.trainerApplication.update({
    where: { id: applicationId },
    data: {
      status: "APPROVED",
      reviewedById: sa.id,
      reviewedAt: new Date(),
      reviewNote,
      createdUserId: newUser.id,
    },
  });

  // 3b. Optional: assign trainer to a program topic
  if (topicId) {
    const topic = await prisma.programTopic.findFirst({
      where: { id: topicId, trainerId: null, deletedAt: null },
      select: { id: true },
    });
    if (topic) {
      await prisma.programTopic.update({
        where: { id: topicId },
        data: { trainerId: newUser.id },
      });
    }
  }

  // 4. Audit log
  await prisma.auditLog.create({
    data: {
      action: "TRAINER_ACCOUNT_CREATED",
      severity: "INFO",
      actorId: sa.id,
      actorRole: "SYSTEM_ADMIN",
      targetType: "TrainerApplication",
      targetId: applicationId,
      details: { trainerEmail: application.email, userId: newUser.id },
    },
  });

  // 5. Send trainer setup email
  if (resetUrl) {
    await sendTrainerSetupEmail(application.email, application.fullName, resetUrl);
  }

  redirect("/dashboard/system-admin/trainer-applications");
}

/**
 * SA rejects a trainer application.
 */
export async function rejectTrainerApplicationAction(formData: FormData) {
  const sa = await requireSA();

  const applicationId = String(formData.get("applicationId") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();

  if (!applicationId) throw new Error("Missing application ID.");

  const application = await prisma.trainerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw new Error("Application not found.");
  if (application.status !== "PENDING")
    throw new Error("Application is no longer pending.");

  await prisma.trainerApplication.update({
    where: { id: applicationId },
    data: {
      status: "REJECTED",
      reviewedById: sa.id,
      reviewedAt: new Date(),
      reviewNote: reviewNote || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "TRAINER_APPLICATION_REJECTED",
      severity: "INFO",
      actorId: sa.id,
      actorRole: "SYSTEM_ADMIN",
      targetType: "TrainerApplication",
      targetId: applicationId,
      details: { trainerEmail: application.email, reason: reviewNote },
    },
  });

  // Optional: notify applicant of rejection
  console.log(
    `[DEV EMAIL] To: ${application.email}\nSubject: Your trainer application\n\nHello ${application.fullName},\n\nThank you for your interest. After reviewing your application we are unable to proceed at this time.\n\n${reviewNote ? `Note: ${reviewNote}` : ""}\n\n— 1000MM Team`,
  );

  redirect("/dashboard/system-admin/trainer-applications");
}

// ── Save custom letter body + required docs ────────────────────────────────────

export async function saveTrainerLetterAction(
  _prev: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireSA();

  const applicationId = formData.get("applicationId")?.toString();
  const letterType = formData.get("letterType")?.toString(); // "invitation" | "recommendation"
  const body = formData.get("body")?.toString() ?? null;
  const doc1 = formData.get("doc1")?.toString() || null;
  const doc2 = formData.get("doc2")?.toString() || null;
  const doc3 = formData.get("doc3")?.toString() || null;
  const doc4 = formData.get("doc4")?.toString() || null;

  if (!applicationId || !letterType) {
    return { ok: false, error: "Missing required fields." };
  }

  const updateData =
    letterType === "invitation"
      ? {
          invitationLetterBody: body,
          requiredDoc1: doc1,
          requiredDoc2: doc2,
          requiredDoc3: doc3,
          requiredDoc4: doc4,
        }
      : {
          recommendationLetterBody: body,
        };

  await prisma.trainerApplication.update({
    where: { id: applicationId },
    data: updateData,
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/dashboard/system-admin/trainer-applications/${applicationId}`);
  return { ok: true };
}

// ── Attach / delete admin documents ──────────────────────────────────────────

export async function attachTrainerDocumentAction(_: unknown, formData: FormData) {
  const user = await requireSA();
  const applicationId = formData.get("applicationId")?.toString();
  const storageKey    = formData.get("storageKey")?.toString();
  const fileName      = formData.get("fileName")?.toString();
  const label         = formData.get("label")?.toString() || null;

  if (!applicationId || !storageKey || !fileName) {
    return { ok: false, error: "Missing required fields." };
  }

  await prisma.trainerApplicationAttachment.create({
    data: { applicationId, storageKey, fileName, label, uploadedById: user.id },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/dashboard/system-admin/trainer-applications/${applicationId}`);
  return { ok: true };
}

export async function deleteTrainerAttachmentAction(_: unknown, formData: FormData) {
  await requireSA();
  const attachmentId  = formData.get("attachmentId")?.toString();
  const applicationId = formData.get("applicationId")?.toString();

  if (!attachmentId || !applicationId) return { ok: false, error: "Missing id." };

  await prisma.trainerApplicationAttachment.delete({ where: { id: attachmentId } });

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/dashboard/system-admin/trainer-applications/${applicationId}`);
  return { ok: true };
}
