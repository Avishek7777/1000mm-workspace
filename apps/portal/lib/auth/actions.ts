"use server";

import { z } from "zod";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "@1000mm/db";
import { signIn, signOut } from "@/lib/auth/config";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/email";

// ─────────────────────────────────────────────────────────────────────
// Common types
// ─────────────────────────────────────────────────────────────────────
export type FormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ─────────────────────────────────────────────────────────────────────
// REGISTER (Trainee self-registration)
// ─────────────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required."),
    email: z.string().email("Invalid email.").toLowerCase().trim(),
    phone: z.string().trim().optional(),
    homeMissionCode: z.string().min(1, "Select a Local Mission."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password too long."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const { fullName, email, phone, homeMissionCode, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // If the account exists but was never verified, act as a resend rather
    // than blocking them. A fresh token invalidates the old one via expiresAt.
    if (!existing.emailVerified && !existing.isActive) {
      const token = randomBytes(32).toString("hex");
      await prisma.emailVerificationToken.create({
        data: {
          token,
          userId: existing.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await sendVerificationEmail(email, existing.fullName, token);
      return { ok: true };
    }
    return {
      ok: false,
      fieldErrors: { email: "An account with this email already exists." },
    };
  }

  const mission = await prisma.localMission.findUnique({
    where: { code: homeMissionCode },
  });
  if (!mission) {
    return { ok: false, error: "Invalid mission selection." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      phone: phone || null,
      role: "TRAINEE",
      homeMissionId: mission.id,
      emailVerified: null,
      isActive: false,
    },
  });

  // Generate verification token (24 hours)
  const token = randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await sendVerificationEmail(email, fullName, token);

  // Return ok — RegisterForm will show the check-email state
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, "Password is required."),
  from: z.string().optional(),
});

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: "Invalid input." };
  }
  const { email, password, from } = parsed.data;

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    return { ok: false, error: "Invalid email or password." };
  }

  // Only allow relative paths; reject protocol-relative URLs like //attacker.com
  const target = from && from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard";
  redirect(target);
}

// ─────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────
export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/");
}

// ─────────────────────────────────────────────────────────────────────
// PASSWORD RESET REQUEST
// ─────────────────────────────────────────────────────────────────────
const forgotSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, fieldErrors: { email: "Enter a valid email." } };
  }

  const { email } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  // Same response whether or not user exists — prevents email enumeration.
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const resetUrl = `${process.env.AUTH_URL ?? "http://localhost:3001"}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, user.fullName, resetUrl);
  }

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// PASSWORD RESET CONFIRM
// ─────────────────────────────────────────────────────────────────────
const resetSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
        // Activate accounts that haven't been activated yet
        // (covers the trainer "set password" flow)
        ...(!record.user.emailVerified && { emailVerified: new Date() }),
        ...(!record.user.isActive && { isActive: true }),
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?reset=success");
}
