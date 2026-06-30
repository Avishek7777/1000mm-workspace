"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";

export type ActionResult = { ok: boolean; error?: string };

// ─── ASSIGN DEPLOYMENT LOCATION ───────────────────────────────────────────────
// LOCAL_DIRECTOR: can assign trainees in their own mission.
// MAIN_DIRECTOR / SYSTEM_ADMIN: can assign any trainee.

export async function assignDeploymentAction(
  enrollmentId: string,
  location: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const allowedRoles = ["LOCAL_DIRECTOR", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"];
  if (!user || !allowedRoles.includes(user.role)) {
    return { ok: false, error: "Not permitted to assign deployment locations." };
  }

  const enrollment = await prisma.programEnrollment.findFirst({
    where: { id: enrollmentId, deletedAt: null },
    include: { trainee: { select: { homeMissionId: true } } },
  });
  if (!enrollment) return { ok: false, error: "Enrollment not found." };

  // LMD: trainee must belong to their mission
  if (user.role === "LOCAL_DIRECTOR") {
    const lmdMission = await prisma.localMission.findFirst({
      where: { directorId: user.id },
    });
    if (!lmdMission) return { ok: false, error: "No mission assigned to your account." };
    if (enrollment.trainee.homeMissionId !== lmdMission.id) {
      return { ok: false, error: "This trainee is not in your mission." };
    }
  }

  if (!location.trim()) return { ok: false, error: "Location is required." };

  await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: {
      deploymentLocation: location.trim(),
      deploymentAssignedAt: new Date(),
      deploymentAssignedById: user.id,
    },
  });

  revalidatePath("/dashboard/trainees");
  revalidatePath(`/dashboard/trainees/${enrollment.traineeId}`);
  return { ok: true };
}

// ─── UPDATE ATTENDANCE ────────────────────────────────────────────────────────
// UD/SA can confirm attendance.

export async function updateAttendanceAction(
  enrollmentId: string,
  confirmed: boolean,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role)) {
    return { ok: false, error: "Only Directors can update attendance." };
  }

  await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: { attendanceConfirmed: confirmed },
  });

  revalidatePath("/dashboard/trainees");
  return { ok: true };
}

export async function applyToProgramAction(
  programId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };
  const userId = session.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "TRAINEE")
    return { ok: false, error: "Only trainees can apply to programs." };

  // Consent basis: must be accepted into the system
  const acceptedApp = await prisma.application.findFirst({
    where: { applicantId: userId, status: "ACCEPTED", deletedAt: null },
    orderBy: { directorReviewCompletedAt: "desc" },
  });
  if (!acceptedApp)
    return {
      ok: false,
      error: "You must be accepted before applying to a program.",
    };

  // One program application/enrollment at a time
  const existing = await prisma.programEnrollment.findFirst({
    where: {
      traineeId: userId,
      deletedAt: null,
      status: { in: ["APPLIED", "ENROLLED"] },
    },
  });
  if (existing)
    return {
      ok: false,
      error:
        existing.status === "ENROLLED"
          ? "You're already enrolled in a program."
          : "You've already applied to a program. Withdraw it first to choose another.",
    };

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null, isPublished: true },
  });
  if (!program) return { ok: false, error: "Program not available." };
  if (new Date(program.endDate) < new Date())
    return { ok: false, error: "This program has already ended." };

  // applicationId is @unique — only link if it isn't already tied to an enrollment
  const appLinked = await prisma.programEnrollment.findUnique({
    where: { applicationId: acceptedApp.id },
  });

  try {
    await prisma.programEnrollment.create({
      data: {
        programId,
        traineeId: userId,
        status: "APPLIED",
        appliedAt: new Date(),
        applicationId: appLinked ? null : acceptedApp.id,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "PROGRAM_APPLIED",
        actorId: userId,
        actorRole: user.role,
        targetType: "TrainingProgram",
        targetId: programId,
        details: { programCode: program.code },
      },
    });
  } catch (e) {
    console.error("applyToProgramAction failed", e);
    return {
      ok: false,
      error: "Could not submit your application. Please try again.",
    };
  }

  revalidatePath("/dashboard/my-program");
  return { ok: true };
}

// withdrawProgramApplicationAction — trainee cancels their pending application
export async function withdrawProgramApplicationAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };

  const applied = await prisma.programEnrollment.findFirst({
    where: { traineeId: session.user.id, deletedAt: null, status: "APPLIED" },
  });
  if (!applied)
    return { ok: false, error: "No pending application to withdraw." };

  // Hard delete — it's an intent record; avoids the @@unique([programId, traineeId])
  // clash if they later re-apply to the same program.
  await prisma.programEnrollment.delete({ where: { id: applied.id } });

  revalidatePath("/dashboard/my-program");
  return { ok: true };
}

// enrollTraineeAction — SA/UD places an APPLIED trainee into the program (APPLIED → ENROLLED)
export async function enrollTraineeAction(
  enrollmentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!actor || !["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(actor.role)) {
    return { ok: false, error: "Not permitted." };
  }
  if (actor.role === "MAIN_DIRECTOR") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_MANAGE_PROGRAMS);
    if (!allowed)
      return {
        ok: false,
        error: "You don't have permission to enroll trainees.",
      };
  }

  const enrollment = await prisma.programEnrollment.findFirst({
    where: { id: enrollmentId, deletedAt: null },
    include: { program: { select: { code: true } } },
  });
  if (!enrollment) return { ok: false, error: "Application not found." };
  if (enrollment.status === "ENROLLED") return { ok: true }; // already placed
  if (enrollment.status !== "APPLIED") {
    return { ok: false, error: "This enrollment is not in an applied state." };
  }

  try {
    await prisma.programEnrollment.update({
      where: { id: enrollmentId },
      data: { status: "ENROLLED", enrolledAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        action: "TRAINEE_ENROLLED",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "ProgramEnrollment",
        targetId: enrollmentId,
        details: {
          programCode: enrollment.program.code,
          traineeId: enrollment.traineeId,
        },
      },
    });
  } catch (e) {
    console.error("enrollTraineeAction failed", e);
    return {
      ok: false,
      error: "Could not enroll the trainee. Please try again.",
    };
  }

  revalidatePath("/dashboard/director/programs/applicants");
  revalidatePath("/dashboard/trainees");
  return { ok: true };
}

// declineProgramApplicationAction — SA/UD declines an APPLIED trainee (frees them to apply elsewhere)
export async function declineProgramApplicationAction(
  enrollmentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!actor || !["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(actor.role)) {
    return { ok: false, error: "Not permitted." };
  }
  if (actor.role === "MAIN_DIRECTOR") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_MANAGE_PROGRAMS);
    if (!allowed) return { ok: false, error: "You don't have permission." };
  }

  const enrollment = await prisma.programEnrollment.findFirst({
    where: { id: enrollmentId, deletedAt: null, status: "APPLIED" },
  });
  if (!enrollment)
    return { ok: false, error: "Pending application not found." };

  // Hard delete the intent row so the trainee can apply again (avoids @@unique clash)
  await prisma.programEnrollment.delete({ where: { id: enrollmentId } });

  revalidatePath("/dashboard/director/programs/applicants");
  return { ok: true };
}
