"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@1000mm/db";
import { requireDbUser } from "@/lib/auth/helpers";
import { SETTINGS } from "@/lib/settings";
import { createNotification, NOTIFICATION_TEMPLATES } from "@/lib/notifications";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireDirector() {
  return requireDbUser(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
}

async function requireLmd() {
  const user = await requireDbUser(["LOCAL_DIRECTOR"]);
  const mission = await prisma.localMission.findFirst({ where: { directorId: user.id } });
  return { ...user, directedMission: mission };
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

// ─── REMOVE SALARY ASSIGNMENT (LMD) ──────────────────────────────────────────

export async function removeSalaryAssignmentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLmd();

  const missionaryId = formData.get("missionaryId")?.toString();
  const cycle = parseInt(formData.get("cycle")?.toString() ?? "0", 10);
  if (!missionaryId || !cycle) return { ok: false, error: "Invalid request." };

  const mission = await prisma.localMission.findFirst({
    where: { directorId: user.id },
  });
  if (!mission) return { ok: false, error: "No mission assigned to your account." };

  const assignment = await prisma.salaryAssignment.findUnique({
    where: { missionaryId_cycle: { missionaryId, cycle } },
    select: { missionId: true },
  });
  if (!assignment || assignment.missionId !== mission.id)
    return { ok: false, error: "Assignment not found." };

  // Block removal if the missionary already submitted a request this cycle
  const today = new Date();
  const hasRequest = await prisma.salaryRequest.findFirst({
    where: { missionaryId, year: today.getFullYear() },
  });
  if (hasRequest)
    return { ok: false, error: "Cannot remove assignment — a salary request has already been submitted." };

  await prisma.salaryAssignment.delete({
    where: { missionaryId_cycle: { missionaryId, cycle } },
  });

  revalidatePath("/dashboard/lmd/salary");
  return { ok: true };
}

// ─── SUBMIT SALARY REQUEST (MISSIONARY) ──────────────────────────────────────

// Requests are submitted by the LMD on behalf of a missionary in their
// mission — missionaries no longer self-submit (they can still view their
// own status/history on /dashboard/salary-request, read-only).
export async function submitSalaryRequestAction(
  missionaryId: string,
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  const user = await requireLmd();
  if (!user.directedMission)
    return { ok: false, error: "No mission assigned to your account." };

  const missionary = await prisma.user.findFirst({
    where: {
      id: missionaryId,
      homeMissionId: user.directedMission.id,
      isMissionary: true,
      deletedAt: null,
    },
  });
  if (!missionary)
    return { ok: false, error: "Missionary not found in your mission." };

  // Check request window
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
    where: { missionaryId_month_year: { missionaryId, month, year } },
  });
  if (existing)
    return {
      ok: false,
      error: "A request has already been submitted for this missionary this month.",
    };

  // Get salary assignment
  const cycle = year;
  const assignment = await prisma.salaryAssignment.findUnique({
    where: { missionaryId_cycle: { missionaryId, cycle } },
  });
  if (!assignment)
    return {
      ok: false,
      error: "No salary assigned to this missionary yet.",
    };

  try {
    await prisma.salaryRequest.create({
      data: {
        missionaryId,
        missionId: assignment.missionId,
        amount: assignment.amount,
        month,
        year,
        status: "PENDING",
      },
    });
  } catch (err: unknown) {
    // Unique constraint violation means a concurrent submission already won
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return { ok: false, error: "A request has already been submitted for this missionary this month." };
    }
    throw err;
  }

  await createNotification({
    userId: missionaryId,
    templateKey: NOTIFICATION_TEMPLATES.SALARY_REQUEST_SUBMITTED,
    templateData: { period: `${MONTH_NAMES[month - 1]} ${year}` },
    actionUrl: "/dashboard/salary-request",
  }).catch(() => {});

  revalidatePath("/dashboard/lmd/salary");
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

  const updated = await prisma.salaryRequest.update({
    where: { id: requestId },
    data: {
      status,
      reviewedById: user.id,
      reviewedAt: new Date(),
      notes,
    },
  });

  await createNotification({
    userId: updated.missionaryId,
    templateKey: NOTIFICATION_TEMPLATES.SALARY_REQUEST_REVIEWED,
    templateData: {
      status,
      period: `${MONTH_NAMES[updated.month - 1]} ${updated.year}`,
    },
    actionUrl: "/dashboard/salary-request",
  }).catch(() => {});

  revalidatePath("/dashboard/salary/requests");
  return { ok: true };
}

// ─── TOGGLE MISSIONARY STATUS (SA only) ──────────────────────────────────────

export async function toggleMissionaryStatusAction(
  userId: string,
): Promise<ActionResult> {
  const actor = await requireDbUser(["SYSTEM_ADMIN"]);
  if (actor.role !== "SYSTEM_ADMIN")
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
  const actor = await requireDbUser(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  if (!["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"].includes(actor.role))
    return { ok: false, error: "Not permitted." };

  await prisma.user.updateMany({
    where: { isMissionary: true },
    data: { isMissionary: false },
  });

  return { ok: true };
}

// ─── SALARY REQUEST WINDOW (SA only) ─────────────────────────────────────────
// Missionaries can only submit salary requests between two days of each month
// (see submitSalaryRequestAction). This lets the SA control that window,
// including closing it entirely (start=0, end=0).

export async function updateSalaryWindowAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireDbUser(["SYSTEM_ADMIN"]);

  const start = Number(formData.get("windowStart"));
  const end = Number(formData.get("windowEnd"));

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    start > 31 ||
    end < 0 ||
    end > 31
  ) {
    return { ok: false, error: "Days must be whole numbers between 0 and 31." };
  }

  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: SETTINGS.SALARY_WINDOW_START },
      update: { value: start, updatedById: actor.id },
      create: { key: SETTINGS.SALARY_WINDOW_START, value: start, updatedById: actor.id },
    }),
    prisma.systemSetting.upsert({
      where: { key: SETTINGS.SALARY_WINDOW_END },
      update: { value: end, updatedById: actor.id },
      create: { key: SETTINGS.SALARY_WINDOW_END, value: end, updatedById: actor.id },
    }),
  ]);

  revalidatePath("/dashboard/salary");
  revalidatePath("/dashboard/salary-request");
  return { ok: true };
}
