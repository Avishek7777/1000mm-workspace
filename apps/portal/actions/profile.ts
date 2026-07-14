"use server";

import path from "node:path";
import fs from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_SIZE = 2 * 1024 * 1024;

export async function uploadProfilePictureAction(
  _prev: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: boolean; error?: string; url?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const file = formData.get("picture") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file selected." };

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return { ok: false, error: "Only JPEG, PNG, or WebP images are allowed." };
  if (file.size > MAX_SIZE) return { ok: false, error: "Image must be under 2 MB." };

  const dir = path.join(process.cwd(), "public", "uploads", "profile-photos");
  await fs.mkdir(dir, { recursive: true });

  for (const e of Object.values(ALLOWED_TYPES)) {
    await fs.unlink(path.join(dir, `${userId}.${e}`)).catch(() => {});
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, `${userId}.${ext}`), buffer);

  const url = `/uploads/profile-photos/${userId}.${ext}`;
  await prisma.user.update({ where: { id: userId }, data: { profilePicture: url } });

  revalidatePath("/dashboard", "layout");
  return { ok: true, url };
}

export async function removeProfilePictureAction(): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const dir = path.join(process.cwd(), "public", "uploads", "profile-photos");
  for (const e of Object.values(ALLOWED_TYPES)) {
    await fs.unlink(path.join(dir, `${userId}.${e}`)).catch(() => {});
  }

  await prisma.user.update({ where: { id: userId }, data: { profilePicture: null } });

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function updateProfileAction(
  _prev: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const fullNameBangla = (formData.get("fullNameBangla") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";

  if (!fullName) return { ok: false, error: "Full name is required." };
  if (fullName.length < 2) return { ok: false, error: "Full name is too short." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      fullName,
      fullNameBangla: fullNameBangla || null,
      phone: phone || null,
    },
  });

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/**
 * Self-service email change. Requires the current password (so a hijacked
 * session alone can't take over the account) and confirms ownership of the
 * NEW address: a verification link is emailed to it, and the address only
 * becomes the login email once that link is opened.
 */
export async function requestEmailChangeAction(
  _prev: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const newEmail = ((formData.get("newEmail") as string | null) ?? "")
    .trim()
    .toLowerCase();
  const password = ((formData.get("password") as string | null) ?? "").trim();

  if (!newEmail || !password)
    return { ok: false, error: "All fields are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))
    return { ok: false, error: "Invalid email address." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, fullName: true, passwordHash: true },
  });
  if (!user) return { ok: false, error: "User not found." };

  if (newEmail === user.email.toLowerCase())
    return { ok: false, error: "That is already your email address." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Password is incorrect." };

  const taken = await prisma.user.findUnique({ where: { email: newEmail } });
  if (taken)
    return { ok: false, error: "That email address is already in use." };

  const token = randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId: user.id,
      newEmail,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await sendVerificationEmail(newEmail, user.fullName, token);

  return { ok: true };
}

export async function changePasswordAction(
  _prev: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const current = (formData.get("current") as string | null)?.trim() ?? "";
  const next = (formData.get("next") as string | null)?.trim() ?? "";
  const confirm = (formData.get("confirm") as string | null)?.trim() ?? "";

  if (!current || !next || !confirm) return { ok: false, error: "All fields are required." };
  if (next.length < 8) return { ok: false, error: "New password must be at least 8 characters." };
  if (next !== confirm) return { ok: false, error: "New passwords do not match." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) return { ok: false, error: "User not found." };

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return { ok: false, error: "Current password is incorrect." };

  const hash = await bcrypt.hash(next, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hash },
  });

  return { ok: true };
}
