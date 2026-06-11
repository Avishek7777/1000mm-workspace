"use server";

// apps/portal/actions/trainerApplications.ts

import { prisma } from "@1000mm/db";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
  const homeMissionId = String(formData.get("homeMissionId") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim() || null;

  if (!applicationId || !homeMissionId)
    throw new Error("Missing required fields.");

  const application = await prisma.trainerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw new Error("Application not found.");
  if (application.status !== "PENDING")
    throw new Error("Application is no longer pending.");

  // Check no user exists with this email already
  const existingUser = await prisma.user.findUnique({
    where: { email: application.email },
  });
  if (existingUser) throw new Error("A user with this email already exists.");

  // 1. Create User (passwordHash is a placeholder — they'll set it via the link)
  const placeholderHash = await bcrypt.hash(
    crypto.randomBytes(32).toString("hex"),
    12,
  );

  const newUser = await prisma.user.create({
    data: {
      fullName: application.fullName,
      email: application.email,
      phone: application.phone ?? undefined,
      passwordHash: placeholderHash,
      role: "TRAINER",
      homeMissionId,
      isActive: false, // activated when they set their password
    },
  });

  // 2. Create PasswordResetToken (expires in 7 days — generous for email delivery)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      token: rawToken,
      userId: newUser.id,
      expiresAt,
    },
  });

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

  // 5. Email (wire to Resend — same pattern as password reset)
  const resetUrl = `${process.env.NEXT_PUBLIC_PORTAL_URL}/reset-password?token=${rawToken}`;
  console.log(
    `[DEV EMAIL] To: ${application.email}\nSubject: Set up your 1000MM Trainer account\n\nHello ${application.fullName},\n\nYour trainer application has been approved. Click the link below to set your password and access your account:\n\n${resetUrl}\n\nThis link expires in 7 days.\n\n— 1000MM Team`,
  );

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
