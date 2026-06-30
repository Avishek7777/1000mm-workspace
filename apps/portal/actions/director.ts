"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@1000mm/db";
import { requireDbUser } from "@/lib/auth/helpers";
import { headers } from "next/headers";

export type ActionResult = {
  ok: boolean;
  error?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

async function requireDirector() {
  return requireDbUser(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
}

async function getApplication(applicationId: string) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, deletedAt: null },
    include: { submittedFromMission: true },
  });
  return app;
}

// ─── START DIRECTOR REVIEW ────────────────────────────────────────────────────
// Called during render when status is RECOMMENDED.
// Transitions to UNDER_MAIN_DIRECTOR_REVIEW. No revalidatePath (called in render).

export async function startDirectorReviewAction(
  applicationId: string,
): Promise<ActionResult> {
  const user = await requireDirector();
  const app = await getApplication(applicationId);
  if (!app) return { ok: false, error: "Application not found." };

  if (app.status !== "RECOMMENDED") return { ok: true }; // no-op

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "UNDER_MAIN_DIRECTOR_REVIEW",
        directorReviewerId: user.id,
        directorReviewStartedAt: new Date(),
        lastTransitionAt: new Date(),
      },
    }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: "RECOMMENDED",
        toStatus: "UNDER_MAIN_DIRECTOR_REVIEW",
        triggeredById: user.id,
        comment: "Review started by Union Director.",
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "APPLICATION_REVIEW_STARTED",
        actorId: user.id,
        actorRole: user.role,
        targetType: "Application",
        targetId: applicationId,
      },
    }),
  ]);

  return { ok: true };
}

// ─── ACCEPT ───────────────────────────────────────────────────────────────────

const acceptSchema = z.object({
  comment: z.string().trim().optional(),
});

export async function acceptApplicationAction(
  applicationId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDirector();
  const app = await getApplication(applicationId);
  if (!app) return { ok: false, error: "Application not found." };

  if (!["UNDER_MAIN_DIRECTOR_REVIEW", "RECOMMENDED"].includes(app.status)) {
    return { ok: false, error: "Application is not in a reviewable state." };
  }

  const parsed = acceptSchema.safeParse({ comment: formData.get("comment") });
  const comment = parsed.success ? parsed.data.comment : undefined;
  const ipAddress = await getClientIp();

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "ACCEPTED",
        directorReviewerComment: comment || null,
        directorReviewCompletedAt: new Date(),
        lastTransitionAt: new Date(),
      },
    }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: "ACCEPTED",
        triggeredById: user.id,
        comment: comment || "Accepted by Union Director.",
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "APPLICATION_ACCEPTED",
        actorId: user.id,
        actorRole: user.role,
        actorMissionCode: app.submittedFromMission.code,
        targetType: "Application",
        targetId: applicationId,
        ipAddress,
        details: { comment },
      },
    }),
  ]);

  revalidatePath(`/dashboard/director/applications/${applicationId}`);
  revalidatePath(`/dashboard/director/applications`);
  revalidatePath(`/dashboard/director`);
  return { ok: true };
}

// ─── REJECT ───────────────────────────────────────────────────────────────────
// rejectionReason IS shown to the applicant (unlike lmdRejectionReason).

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Please provide a reason (at least 10 characters)."),
  comment: z.string().trim().optional(),
});

export async function rejectApplicationAction(
  applicationId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDirector();
  const app = await getApplication(applicationId);
  if (!app) return { ok: false, error: "Application not found." };

  if (!["UNDER_MAIN_DIRECTOR_REVIEW", "RECOMMENDED"].includes(app.status)) {
    return { ok: false, error: "Application is not in a reviewable state." };
  }

  const parsed = rejectSchema.safeParse({
    reason: formData.get("reason"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { reason, comment } = parsed.data;
  const ipAddress = await getClientIp();

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        rejectionReason: reason, // visible to applicant
        directorReviewerComment: comment || null,
        directorReviewCompletedAt: new Date(),
        lastTransitionAt: new Date(),
      },
    }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: "REJECTED",
        triggeredById: user.id,
        comment: reason,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "APPLICATION_REJECTED",
        actorId: user.id,
        actorRole: user.role,
        actorMissionCode: app.submittedFromMission.code,
        targetType: "Application",
        targetId: applicationId,
        ipAddress,
        details: { reason, comment },
      },
    }),
  ]);

  revalidatePath(`/dashboard/director/applications/${applicationId}`);
  revalidatePath(`/dashboard/director/applications`);
  revalidatePath(`/dashboard/director`);
  return { ok: true };
}

// ─── RETURN TO LMD ────────────────────────────────────────────────────────────

const returnSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(10, "Please provide a reason (at least 10 characters)."),
});

export async function returnToLmdAction(
  applicationId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDirector();
  const app = await getApplication(applicationId);
  if (!app) return { ok: false, error: "Application not found." };

  if (!["UNDER_MAIN_DIRECTOR_REVIEW", "RECOMMENDED"].includes(app.status)) {
    return { ok: false, error: "Application is not in a reviewable state." };
  }

  const parsed = returnSchema.safeParse({ comment: formData.get("comment") });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { comment } = parsed.data;
  const ipAddress = await getClientIp();

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "RETURNED_TO_LMD",
        directorReviewerComment: comment,
        directorReviewCompletedAt: new Date(),
        lastTransitionAt: new Date(),
      },
    }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: "RETURNED_TO_LMD",
        triggeredById: user.id,
        comment,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "APPLICATION_RETURNED_TO_LMD",
        actorId: user.id,
        actorRole: user.role,
        actorMissionCode: app.submittedFromMission.code,
        targetType: "Application",
        targetId: applicationId,
        ipAddress,
        details: { comment },
      },
    }),
  ]);

  revalidatePath(`/dashboard/director/applications/${applicationId}`);
  revalidatePath(`/dashboard/director/applications`);
  revalidatePath(`/dashboard/director`);
  return { ok: true };
}
