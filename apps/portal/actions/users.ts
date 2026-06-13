"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function getActor() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  return user;
}

// ─── FLAG USER FOR DEACTIVATION (UD only) ────────────────────────────────────

const flagSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Please provide a reason (min 10 characters).")
    .max(500),
});

export async function flagUserAction(
  targetUserId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActor();
  if (actor.role !== "MAIN_DIRECTOR") {
    return { ok: false, error: "Only the Union Director can flag users." };
  }

  const parsed = flagSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: { reason: parsed.error.issues[0]?.message ?? "Invalid." },
    };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { ok: false, error: "User not found." };
  if (!target.isActive)
    return { ok: false, error: "User is already deactivated." };
  if (target.role === "SYSTEM_ADMIN")
    return { ok: false, error: "Cannot flag a System Admin." };

  // Check for existing pending flag
  const existing = await prisma.userFlagRequest.findFirst({
    where: { targetUserId, status: "PENDING" },
  });
  if (existing)
    return {
      ok: false,
      error: "A pending flag request already exists for this user.",
    };

  await prisma.userFlagRequest.create({
    data: {
      targetUserId,
      requestedById: actor.id,
      reason: parsed.data.reason,
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "USER_FLAG_REQUESTED",
      actorId: actor.id,
      actorRole: actor.role,
      targetType: "User",
      targetId: targetUserId,
      details: { reason: parsed.data.reason },
    },
  });

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${targetUserId}`);
  revalidatePath("/dashboard/users/flag-requests");
  return { ok: true };
}

// ─── APPROVE FLAG (deactivate user) — SA only ─────────────────────────────────

export async function approveFlagAction(flagId: string): Promise<ActionResult> {
  const actor = await getActor();
  if (actor.role !== "SYSTEM_ADMIN")
    return { ok: false, error: "Not permitted." };

  const flag = await prisma.userFlagRequest.findUnique({
    where: { id: flagId },
    include: { targetUser: true },
  });
  if (!flag) return { ok: false, error: "Flag request not found." };
  if (flag.status !== "PENDING")
    return { ok: false, error: "This request has already been resolved." };

  await prisma.$transaction([
    prisma.userFlagRequest.update({
      where: { id: flagId },
      data: {
        status: "APPROVED",
        resolvedById: actor.id,
        resolvedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: flag.targetUserId },
      data: { isActive: false },
    }),
    prisma.auditLog.create({
      data: {
        action: "USER_FLAG_APPROVED",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "User",
        targetId: flag.targetUserId,
        severity: "WARNING",
      },
    }),
  ]);

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${flag.targetUserId}`);
  revalidatePath("/dashboard/users/flag-requests");
  return { ok: true };
}

// ─── REJECT FLAG — SA only ────────────────────────────────────────────────────

export async function rejectFlagAction(
  flagId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActor();
  if (actor.role !== "SYSTEM_ADMIN")
    return { ok: false, error: "Not permitted." };

  const flag = await prisma.userFlagRequest.findUnique({
    where: { id: flagId },
  });
  if (!flag || flag.status !== "PENDING")
    return { ok: false, error: "Invalid flag request." };

  const note = formData.get("resolverNote")?.toString().trim() || null;

  await prisma.$transaction([
    prisma.userFlagRequest.update({
      where: { id: flagId },
      data: {
        status: "REJECTED",
        resolvedById: actor.id,
        resolvedAt: new Date(),
        resolverNote: note,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "USER_FLAG_REJECTED",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "User",
        targetId: flag.targetUserId,
      },
    }),
  ]);

  revalidatePath("/dashboard/users/flag-requests");
  revalidatePath(`/dashboard/users/${flag.targetUserId}`);
  return { ok: true };
}

// ─── DEACTIVATE / REACTIVATE (SA only, direct) ────────────────────────────────

export async function deactivateUserAction(
  userId: string,
): Promise<ActionResult> {
  const actor = await getActor();
  if (actor.role !== "SYSTEM_ADMIN")
    return { ok: false, error: "Not permitted." };
  if (userId === actor.id)
    return { ok: false, error: "Cannot deactivate your own account." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { isActive: false } }),
    prisma.auditLog.create({
      data: {
        action: "USER_DEACTIVATED",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "User",
        targetId: userId,
        severity: "WARNING",
      },
    }),
  ]);

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${userId}`);
  return { ok: true };
}

export async function reactivateUserAction(
  userId: string,
): Promise<ActionResult> {
  const actor = await getActor();
  if (actor.role !== "SYSTEM_ADMIN")
    return { ok: false, error: "Not permitted." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { isActive: true } }),
    prisma.auditLog.create({
      data: {
        action: "USER_REACTIVATED",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "User",
        targetId: userId,
      },
    }),
  ]);

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${userId}`);
  return { ok: true };
}

// ─── DELETE USER (SA only, hard delete) ──────────────────────────────────────

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const actor = await getActor();
  if (actor.role !== "SYSTEM_ADMIN")
    return { ok: false, error: "Not permitted." };
  if (userId === actor.id)
    return { ok: false, error: "Cannot delete your own account." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found." };
  if (user.role === "SYSTEM_ADMIN")
    return { ok: false, error: "Cannot delete a System Admin account." };

  // Soft delete
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    }),
    prisma.auditLog.create({
      data: {
        action: "USER_DEACTIVATED",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "User",
        targetId: userId,
        severity: "CRITICAL",
        details: {
          action: "hard_delete",
          deletedName: user.fullName,
          deletedEmail: user.email,
        },
      },
    }),
  ]);

  revalidatePath("/dashboard/users");
  return { ok: true };
}

// ─── CREATE LMD ACCOUNT (SA only) ────────────────────────────────────────────

import bcrypt from "bcrypt";

const createLmdSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(100),
  email: z.string().trim().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  missionId: z.string().min(1, "Mission is required."),
});

export async function createLmdAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActor();
  if (actor.role !== "SYSTEM_ADMIN")
    return { ok: false, error: "Not permitted." };

  const parsed = createLmdSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = issue.path[0]?.toString();
      if (f && !fieldErrors[f]) fieldErrors[f] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { fullName, email, password, missionId } = parsed.data;

  // Check email not already taken
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return {
      ok: false,
      fieldErrors: { email: "This email is already in use." },
    };

  const mission = await prisma.localMission.findUnique({
    where: { id: missionId },
  });
  if (!mission) return { ok: false, error: "Mission not found." };

  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: "LOCAL_DIRECTOR",
        homeMissionId: missionId,
        emailVerified: new Date(),
        isActive: true,
      },
    });

    // Assign as mission director
    await tx.localMission.update({
      where: { id: missionId },
      data: { directorId: user.id },
    });

    await tx.auditLog.create({
      data: {
        action: "USER_CREATED",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "User",
        targetId: user.id,
        details: { role: "LOCAL_DIRECTOR", mission: mission.code },
      },
    });

    return user;
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/missions");
  return { ok: true };
}

// ─── REMOVE LMD (SA only) ─────────────────────────────────────────────────────
// Deactivates and removes them as mission director.

export async function removeLmdAction(userId: string): Promise<ActionResult> {
  const actor = await getActor();
  if (actor.role !== "SYSTEM_ADMIN")
    return { ok: false, error: "Not permitted." };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { directedMission: true },
  });
  if (!user) return { ok: false, error: "User not found." };
  if (user.role !== "LOCAL_DIRECTOR")
    return { ok: false, error: "User is not an LMD." };

  await prisma.$transaction(async (tx) => {
    // Remove as mission director
    if (user.directedMission) {
      await tx.localMission.update({
        where: { id: user.directedMission.id },
        data: { directorId: null },
      });
    }

    // Soft delete the user
    await tx.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    await tx.auditLog.create({
      data: {
        action: "USER_DEACTIVATED",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "User",
        targetId: userId,
        severity: "WARNING",
        details: { action: "remove_lmd", mission: user.directedMission?.code },
      },
    });
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/missions");
  return { ok: true };
}
