"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";

export type ActionResult = { ok: boolean; error?: string };

// ─── ASSIGN DEPLOYMENT LOCATION ───────────────────────────────────────────────
// Only LOCAL_DIRECTOR can assign deployment to trainees in their mission.

export async function assignDeploymentAction(
  enrollmentId: string,
  location: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "LOCAL_DIRECTOR") {
    return {
      ok: false,
      error: "Only Local Directors can assign deployment locations.",
    };
  }

  const lmdMission = await prisma.localMission.findFirst({
    where: { directorId: user.id },
  });
  if (!lmdMission) return { ok: false, error: "No mission assigned." };

  const enrollment = await prisma.programEnrollment.findFirst({
    where: { id: enrollmentId, deletedAt: null },
    include: { trainee: { select: { homeMissionId: true } } },
  });
  if (!enrollment) return { ok: false, error: "Enrollment not found." };

  // Scope check — trainee must be in LMD's mission
  if (enrollment.trainee.homeMissionId !== lmdMission.id) {
    return { ok: false, error: "This trainee is not in your mission." };
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
