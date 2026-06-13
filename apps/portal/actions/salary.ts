"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { isSettingEnabled, SETTINGS, getSettings } from "@/lib/settings";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireDirector() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role))
    redirect("/dashboard");
  return user;
}

async function requireLmd() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { homeMission: true },
  });
  if (!user || user.role !== "LOCAL_DIRECTOR") redirect("/dashboard");
  return user;
}

async function requireMissionary() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.isMissionary) redirect("/dashboard");
  return user;
}

// ─── SET SALARY RANGE (SA / UD) ───────────────────────────────────────────────

const rangeSchema = z.object({
  missionId: z.string().min(1),
  minAmount: z.coerce.number().int().min(0),
  maxAmount: z.coerce.number().int().min(0),
  cycle: z.coerce.number().int().min(2020).max(2100),
});

export async function setSalaryRangeAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDirector();

  const parsed = rangeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = issue.path[0]?.toString();
      if (f && !fieldErrors[f]) fieldErrors[f] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { missionId, minAmount, maxAmount, cycle } = parsed.data;

  if (minAmount >= maxAmount)
    return { ok: false, error: "Min amount must be less than max amount." };

  await prisma.salaryRange.upsert({
    where: { missionId },
    create: { missionId, minAmount, maxAmount, cycle, createdById: user.id },
    update: { minAmount, maxAmount, cycle },
  });

  revalidatePath("/dashboard/salary");
  return { ok: true };
}

// ─── ASSIGN SALARY + DEPLOYMENT (LMD) ────────────────────────────────────────

const assignSchema = z.object({
  missionaryId: z.string().min(1),
  amount: z.coerce.number().int().min(0),
  deploymentLocation: z.string().trim().min(1, "Deployment location required."),
  cycle: z.coerce.number().int().min(2020).max(2100),
});

export async function assignSalaryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLmd();

  const parsed = assignSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = issue.path[0]?.toString();
      if (f && !fieldErrors[f]) fieldErrors[f] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { missionaryId, amount, deploymentLocation, cycle } = parsed.data;

  // Get LMD's mission
  const mission = await prisma.localMission.findFirst({
    where: { directorId: user.id },
  });
  if (!mission) return { ok: false, error: "No mission assigned to you." };

  // Validate amount is within range
  const range = await prisma.salaryRange.findUnique({
    where: { missionId: mission.id },
  });
  if (!range)
    return {
      ok: false,
      error:
        "No salary range set for your mission. Ask the Union Director to set one.",
    };
  if (amount < range.minAmount || amount > range.maxAmount) {
    return {
      ok: false,
      error: `Amount must be between ৳${range.minAmount.toLocaleString()} and ৳${range.maxAmount.toLocaleString()}.`,
    };
  }

  // Verify missionary belongs to this mission
  const missionary = await prisma.user.findFirst({
    where: { id: missionaryId, homeMissionId: mission.id, isMissionary: true },
  });
  if (!missionary)
    return { ok: false, error: "Missionary not found in your mission." };

  await prisma.salaryAssignment.upsert({
    where: { missionaryId_cycle: { missionaryId, cycle } },
    create: {
      missionaryId,
      missionId: mission.id,
      amount,
      deploymentLocation,
      cycle,
      assignedById: user.id,
    },
    update: { amount, deploymentLocation },
  });

  revalidatePath("/dashboard/lmd/salary");
  return { ok: true };
}

// ─── SUBMIT SALARY REQUEST (MISSIONARY) ──────────────────────────────────────

export async function submitSalaryRequestAction(
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  const user = await requireMissionary();

  // Check request window
  const settings = await getSettings([
    SETTINGS.SALARY_WINDOW_START,
    SETTINGS.SALARY_WINDOW_END,
  ]);

  // Get window start/end from settings (stored as numbers)
  const settingStart = await prisma.systemSetting.findUnique({
    where: { key: SETTINGS.SALARY_WINDOW_START },
  });
  const settingEnd = await prisma.systemSetting.findUnique({
    where: { key: SETTINGS.SALARY_WINDOW_END },
  });

  const windowStart = (settingStart?.value as number) ?? 8;
  const windowEnd = (settingEnd?.value as number) ?? 14;

  const today = new Date();
  const dayOfMonth = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  if (dayOfMonth < windowStart || dayOfMonth > windowEnd) {
    return {
      ok: false,
      error: `Salary requests can only be submitted between day ${windowStart} and ${windowEnd} of the month.`,
    };
  }

  // Check for duplicate
  const existing = await prisma.salaryRequest.findUnique({
    where: { missionaryId_month_year: { missionaryId: user.id, month, year } },
  });
  if (existing)
    return {
      ok: false,
      error: "You already submitted a request for this month.",
    };

  // Get salary assignment
  const cycle = year;
  const assignment = await prisma.salaryAssignment.findUnique({
    where: { missionaryId_cycle: { missionaryId: user.id, cycle } },
  });
  if (!assignment)
    return {
      ok: false,
      error: "No salary assigned to you yet. Contact your Local Director.",
    };

  await prisma.salaryRequest.create({
    data: {
      missionaryId: user.id,
      missionId: assignment.missionId,
      amount: assignment.amount,
      month,
      year,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/salary-request");
  return { ok: true };
}

// ─── REVIEW SALARY REQUEST (SA / UD) ─────────────────────────────────────────

export async function reviewSalaryRequestAction(
  requestId: string,
  status: "APPROVED" | "REJECTED",
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDirector();

  const notes = formData.get("notes")?.toString().trim() || null;

  await prisma.salaryRequest.update({
    where: { id: requestId },
    data: {
      status,
      reviewedById: user.id,
      reviewedAt: new Date(),
      notes,
    },
  });

  revalidatePath("/dashboard/salary/requests");
  return { ok: true };
}

// ─── TOGGLE MISSIONARY STATUS (SA only) ──────────────────────────────────────

export async function toggleMissionaryStatusAction(
  userId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!actor || actor.role !== "SYSTEM_ADMIN")
    return {
      ok: false,
      error: "Only System Admins can grant missionary status.",
    };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };
  if (target.role !== "TRAINEE")
    return {
      ok: false,
      error: "Missionary status can only be granted to trainees.",
    };

  await prisma.user.update({
    where: { id: userId },
    data: { isMissionary: !target.isMissionary },
  });

  revalidatePath(`/dashboard/users/${userId}`);
  revalidatePath("/dashboard/users");
  return { ok: true };
}

// ─── RESET ALL MISSIONARY STATUS (triggered on main program creation) ─────────

export async function resetMissionaryStatusAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!actor || !["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(actor.role))
    return { ok: false, error: "Not permitted." };

  await prisma.user.updateMany({
    where: { isMissionary: true },
    data: { isMissionary: false },
  });

  return { ok: true };
}
