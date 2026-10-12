"use server";

/**
 * Manual program roster management.
 *
 * Accepting an Application admits someone to the programme as a whole — it does
 * not place them in a TrainingProgram. The normal route is two further steps:
 * the trainee picks a programme themselves (applyToProgramAction → APPLIED) and
 * staff place them (enrollTraineeAction → ENROLLED).
 *
 * When that self-apply step never happens — a window opened, filled and was
 * reviewed offline — the programme shows 0 enrolled and no roster or ID cards
 * can be printed. The actions here let staff place people directly, skipping
 * the self-apply step.
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@1000mm/db";
import type { UserRole } from "@1000mm/db";
import { getCurrentUser } from "@/lib/auth/helpers";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";

export type ActionResult = { ok: boolean; error?: string };

const PROGRAM_STAFF_ROLES: UserRole[] = [
  "MAIN_DIRECTOR",
  "SECRETARY",
  "ASSOCIATE_DIRECTOR",
  "SYSTEM_ADMIN",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Same gate as /dashboard/director/programs, but returns an error instead of
 * redirecting — these actions are called from client components that render the
 * message inline.
 */
async function requireProgramStaff() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return { actor: null, error: "Not authenticated." };

  const actor = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!actor || !PROGRAM_STAFF_ROLES.includes(actor.role)) {
    return { actor: null, error: "Not permitted." };
  }
  if (actor.role !== "SYSTEM_ADMIN") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_MANAGE_PROGRAMS);
    if (!allowed) {
      return { actor: null, error: "You don't have permission to manage programs." };
    }
  }
  return { actor, error: null };
}

function revalidateRoster(programId: string) {
  revalidatePath(`/dashboard/director/programs/${programId}`);
  revalidatePath("/dashboard/director/programs");
  revalidatePath("/dashboard/director/programs/applicants");
  revalidatePath("/dashboard/trainees");
  revalidatePath("/dashboard/id-cards");
}

// ─── SEARCH CANDIDATES ────────────────────────────────────────────────────────

export type CandidateScope =
  /** Accepted applicants who applied through one of THIS programme's windows. */
  | "window"
  /** Anyone with an accepted application, whichever window it came through. */
  | "accepted"
  /** Any active trainee account — for people admitted on paper. */
  | "all";

export type EnrollCandidate = {
  traineeId: string;
  fullName: string;
  email: string;
  missionCode: string | null;
  referenceNumber: string | null;
  /** Set when they already hold an APPLIED/ENROLLED place on another programme. */
  conflictProgramCode: string | null;
  /** They already have a pending APPLIED row on this programme. */
  pendingHere: boolean;
};

export type SearchResult = {
  ok: boolean;
  error?: string;
  candidates?: EnrollCandidate[];
  /** True when the 200-row cap was hit, so the list shown is partial. */
  truncated?: boolean;
};

/**
 * Trainees who can still be added to `programId`. Anyone already holding a live
 * ENROLLED place here is filtered out.
 */
export async function searchProgramCandidatesAction(
  programId: string,
  scope: CandidateScope,
  query: string,
): Promise<SearchResult> {
  const { actor, error } = await requireProgramStaff();
  if (!actor) return { ok: false, error: error ?? "Not permitted." };

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
    select: { id: true },
  });
  if (!program) return { ok: false, error: "Program not found." };

  const q = query.trim();
  const search = q
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Scope → which accepted applications make someone eligible
  const eligibility =
    scope === "all"
      ? {}
      : {
          applications: {
            some: {
              status: "ACCEPTED" as const,
              deletedAt: null,
              ...(scope === "window" ? { window: { programId } } : {}),
            },
          },
        };

  const TAKE = 200;
  const users = await prisma.user.findMany({
    where: {
      role: "TRAINEE",
      deletedAt: null,
      ...(scope === "all" ? { isActive: true } : {}),
      ...search,
      ...eligibility,
      // Exclude anyone already holding a live place on this programme
      enrollmentsAsTrainee: {
        none: { programId, deletedAt: null, status: "ENROLLED" },
      },
    },
    orderBy: [{ homeMission: { code: "asc" } }, { fullName: "asc" }],
    take: TAKE,
    select: {
      id: true,
      fullName: true,
      email: true,
      homeMission: { select: { code: true } },
      applications: {
        where: { status: "ACCEPTED", deletedAt: null },
        orderBy: { directorReviewCompletedAt: "desc" },
        take: 1,
        select: { referenceNumber: true },
      },
      enrollmentsAsTrainee: {
        where: { deletedAt: null, status: { in: ["APPLIED", "ENROLLED"] } },
        select: {
          programId: true,
          status: true,
          program: { select: { code: true } },
        },
      },
    },
  });

  const candidates: EnrollCandidate[] = users.map((u) => {
    const places = u.enrollmentsAsTrainee;
    const elsewhere = places.find((e) => e.programId !== programId);
    return {
      traineeId: u.id,
      fullName: u.fullName,
      email: u.email,
      missionCode: u.homeMission?.code ?? null,
      referenceNumber: u.applications[0]?.referenceNumber ?? null,
      conflictProgramCode: elsewhere?.program.code ?? null,
      pendingHere: places.some(
        (e) => e.programId === programId && e.status === "APPLIED",
      ),
    };
  });

  return { ok: true, candidates, truncated: users.length === TAKE };
}

// ─── ADD TRAINEES ─────────────────────────────────────────────────────────────

export type AddResult = {
  ok: boolean;
  error?: string;
  /** Brand new enrollment rows. */
  added?: number;
  /** Existing APPLIED (or previously removed) rows flipped to ENROLLED. */
  promoted?: number;
  skipped?: { fullName: string; reason: string }[];
};

/**
 * Place trainees into a programme directly as ENROLLED.
 *
 * `allowMultiProgram` overrides the one-live-programme-at-a-time rule that
 * applyToProgramAction enforces for self-service applications.
 */
export async function addTraineesToProgramAction(
  programId: string,
  traineeIds: string[],
  allowMultiProgram = false,
): Promise<AddResult> {
  const { actor, error } = await requireProgramStaff();
  if (!actor) return { ok: false, error: error ?? "Not permitted." };

  const ids = [...new Set(traineeIds.filter(Boolean))];
  if (ids.length === 0) return { ok: false, error: "No trainees selected." };

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
    select: { id: true, code: true },
  });
  if (!program) return { ok: false, error: "Program not found." };

  const trainees = await prisma.user.findMany({
    where: { id: { in: ids }, role: "TRAINEE", deletedAt: null },
    select: {
      id: true,
      fullName: true,
      applications: {
        where: { status: "ACCEPTED", deletedAt: null },
        orderBy: { directorReviewCompletedAt: "desc" },
        select: { id: true },
      },
      // Every live place they hold, on this programme or another
      enrollmentsAsTrainee: {
        where: { status: { in: ["APPLIED", "ENROLLED"] }, deletedAt: null },
        select: { programId: true, program: { select: { code: true } } },
      },
    },
  });

  const skipped: NonNullable<AddResult["skipped"]> = [];
  let added = 0;
  let promoted = 0;

  for (const trainee of trainees) {
    const conflict = trainee.enrollmentsAsTrainee.find(
      (e) => e.programId !== programId,
    );
    if (conflict && !allowMultiProgram) {
      skipped.push({
        fullName: trainee.fullName,
        reason: `Already active on ${conflict.program.code}`,
      });
      continue;
    }

    // @@unique([programId, traineeId]) still matches soft-deleted rows, so look
    // without the deletedAt filter and revive rather than insert.
    const existing = await prisma.programEnrollment.findUnique({
      where: { programId_traineeId: { programId, traineeId: trainee.id } },
      select: { id: true, status: true, deletedAt: true },
    });

    if (existing) {
      if (existing.status === "ENROLLED" && !existing.deletedAt) {
        skipped.push({
          fullName: trainee.fullName,
          reason: "Already enrolled on this program",
        });
        continue;
      }
      await prisma.programEnrollment.update({
        where: { id: existing.id },
        data: { status: "ENROLLED", enrolledAt: new Date(), deletedAt: null },
      });
      promoted++;
    } else {
      // applicationId is @unique — link only an accepted application no other
      // enrollment has claimed, so ID cards can show a real reference number.
      let applicationId: string | null = null;
      for (const app of trainee.applications) {
        const taken = await prisma.programEnrollment.findUnique({
          where: { applicationId: app.id },
          select: { id: true },
        });
        if (!taken) {
          applicationId = app.id;
          break;
        }
      }

      try {
        await prisma.programEnrollment.create({
          data: {
            programId,
            traineeId: trainee.id,
            status: "ENROLLED",
            enrolledAt: new Date(),
            appliedAt: new Date(),
            applicationId,
          },
        });
        added++;
      } catch (e) {
        console.error("addTraineesToProgramAction create failed", e);
        skipped.push({
          fullName: trainee.fullName,
          reason: "Could not be added — please retry",
        });
        continue;
      }
    }

    // Never let the trail block the placement itself — TRAINEE_ENROLLED_MANUALLY
    // is a new AuditAction value, so this throws until the schema is pushed.
    try {
      await prisma.auditLog.create({
        data: {
          action: "TRAINEE_ENROLLED_MANUALLY",
          actorId: actor.id,
          actorRole: actor.role,
          targetType: "TrainingProgram",
          targetId: programId,
          details: {
            programCode: program.code,
            traineeId: trainee.id,
            traineeName: trainee.fullName,
            overrodeProgramConflict: !!conflict,
          },
        },
      });
    } catch (e) {
      console.error("addTraineesToProgramAction audit log failed", e);
    }
  }

  // Anything requested that isn't a loadable active trainee account
  for (const id of ids) {
    if (!trainees.some((t) => t.id === id)) {
      skipped.push({ fullName: id, reason: "Not an active trainee account" });
    }
  }

  revalidateRoster(programId);

  return { ok: true, added, promoted, skipped };
}

/**
 * One-click: enroll every accepted applicant who came through this programme's
 * own application windows — the fix for a window that was opened, filled and
 * reviewed, but whose accepted applicants never self-applied.
 */
export async function addAllAcceptedFromWindowsAction(
  programId: string,
  allowMultiProgram = false,
): Promise<AddResult> {
  const { actor, error } = await requireProgramStaff();
  if (!actor) return { ok: false, error: error ?? "Not permitted." };

  const accepted = await prisma.application.findMany({
    where: {
      status: "ACCEPTED",
      deletedAt: null,
      window: { programId },
      applicant: { role: "TRAINEE", deletedAt: null },
    },
    select: { applicantId: true },
  });

  const traineeIds = [...new Set(accepted.map((a) => a.applicantId))];
  if (traineeIds.length === 0) {
    return {
      ok: false,
      error:
        "No accepted applications on this program's windows. Use the search below to add trainees individually.",
    };
  }

  return addTraineesToProgramAction(programId, traineeIds, allowMultiProgram);
}

// ─── REMOVE ───────────────────────────────────────────────────────────────────

/**
 * Take someone off a programme roster. Soft delete, so the history (and any
 * attendance already scanned) survives — addTraineesToProgramAction revives the
 * same row if they are added back.
 */
export async function removeEnrollmentAction(
  enrollmentId: string,
): Promise<ActionResult> {
  const { actor, error } = await requireProgramStaff();
  if (!actor) return { ok: false, error: error ?? "Not permitted." };

  const enrollment = await prisma.programEnrollment.findFirst({
    where: { id: enrollmentId, deletedAt: null },
    select: {
      id: true,
      programId: true,
      traineeId: true,
      certificateIssued: true,
      program: { select: { code: true } },
    },
  });
  if (!enrollment) return { ok: false, error: "Enrollment not found." };
  if (enrollment.certificateIssued) {
    return {
      ok: false,
      error:
        "This trainee holds a certificate for the program — revoke it before removing them.",
    };
  }

  await prisma.programEnrollment.update({
    where: { id: enrollment.id },
    data: { deletedAt: new Date() },
  });

  // As above: new AuditAction value, so don't let it undo a completed removal.
  try {
    await prisma.auditLog.create({
      data: {
        action: "TRAINEE_REMOVED_FROM_PROGRAM",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "ProgramEnrollment",
        targetId: enrollment.id,
        details: {
          programCode: enrollment.program.code,
          traineeId: enrollment.traineeId,
        },
      },
    });
  } catch (e) {
    console.error("removeEnrollmentAction audit log failed", e);
  }

  revalidateRoster(enrollment.programId);

  return { ok: true };
}
