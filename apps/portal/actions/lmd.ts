"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireDbUser } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { uploadToR2, r2Prefix } from "@/lib/r2";
import { DocumentKind } from "@1000mm/db";
import { headers } from "next/headers";

export type ActionResult = {
  ok: boolean;
  error?: string;
};

// ─── IP helper ────────────────────────────────────────────────────────────────

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

// ─── Auth helper ──────────────────────────────────────────────────────────────
// Returns the LMD user + their directed mission id, or throws redirect.

async function requireLmd() {
  const user = await requireDbUser(["LOCAL_DIRECTOR"]);
  const mission = await prisma.localMission.findFirst({ where: { directorId: user.id } });
  if (!mission) redirect("/dashboard");
  return { user, missionId: mission.id };
}

// ─── Guard: verify application belongs to this LMD's mission ─────────────────

async function getApplicationForLmd(applicationId: string, missionId: string) {
  const app = await prisma.application.findFirst({
    where: {
      id: applicationId,
      submittedFromMissionId: missionId,
      deletedAt: null,
    },
    include: {
      applicant: { select: { id: true, fullName: true, email: true } },
      submittedFromMission: true,
      documents: { where: { deletedAt: null } },
      recommendation: true,
    },
  });
  if (!app) return null;
  return app;
}

// ─── START REVIEW ─────────────────────────────────────────────────────────────
// Called when LMD opens the application detail page for the first time.
// Marks status as UNDER_LMD_REVIEW and sets lmdReviewerId + lmdReviewStartedAt.

export async function startReviewAction(
  applicationId: string,
): Promise<ActionResult> {
  const { user, missionId } = await requireLmd();
  const app = await getApplicationForLmd(applicationId, missionId);
  if (!app) return { ok: false, error: "Application not found." };

  // Only transition from SUBMITTED or RETURNED_TO_LMD
  if (!["SUBMITTED", "RETURNED_TO_LMD"].includes(app.status)) {
    return { ok: true }; // already under review, no-op
  }

  const ipAddress = await getClientIp();

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "UNDER_LMD_REVIEW",
        lmdReviewerId: user.id,
        lmdReviewStartedAt: new Date(),
        lastTransitionAt: new Date(),
      },
    }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: "UNDER_LMD_REVIEW",
        triggeredById: user.id,
        comment: "Review started by LMD.",
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "APPLICATION_REVIEW_STARTED",
        actorId: user.id,
        actorRole: "LOCAL_DIRECTOR",
        actorMissionCode: app.submittedFromMission.code,
        targetType: "Application",
        targetId: applicationId,
        ipAddress,
      },
    }),
  ]);

  revalidatePath(`/dashboard/lmd/applications/${applicationId}`);
  return { ok: true };
}

// ─── RETURN TO APPLICANT ──────────────────────────────────────────────────────

const returnSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(10, "Please provide a reason (at least 10 characters)."),
});

export async function returnToApplicantAction(
  applicationId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { user, missionId } = await requireLmd();
  const app = await getApplicationForLmd(applicationId, missionId);
  if (!app) return { ok: false, error: "Application not found." };

  if (!["UNDER_LMD_REVIEW", "SUBMITTED"].includes(app.status)) {
    return { ok: false, error: "Application is not in a reviewable state." };
  }

  const parsed = returnSchema.safeParse({ comment: formData.get("comment") });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const ipAddress = await getClientIp();

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "RETURNED_TO_APPLICANT",
        lmdReviewerComment: parsed.data.comment,
        lmdReviewCompletedAt: new Date(),
        lastTransitionAt: new Date(),
      },
    }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: "RETURNED_TO_APPLICANT",
        triggeredById: user.id,
        comment: parsed.data.comment,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "APPLICATION_RETURNED_TO_APPLICANT",
        actorId: user.id,
        actorRole: "LOCAL_DIRECTOR",
        actorMissionCode: app.submittedFromMission.code,
        targetType: "Application",
        targetId: applicationId,
        ipAddress,
        details: { comment: parsed.data.comment },
      },
    }),
  ]);

  revalidatePath(`/dashboard/lmd/applications/${applicationId}`);
  revalidatePath(`/dashboard/lmd/applications`);
  return { ok: true };
}

// ─── UPLOAD LMD DOCUMENT ──────────────────────────────────────────────────────
// Uploads one of the 3 LMD recommendation documents.
// Replaces any existing doc of the same kind for this application.

export async function uploadLmdDocumentAction(
  applicationId: string,
  kind: "RECOMMENDATION_LETTER" | "SWORN_STATEMENT" | "EXCOM_VOTE_COPY",
  formData: FormData,
): Promise<ActionResult> {
  const { user, missionId } = await requireLmd();
  const app = await getApplicationForLmd(applicationId, missionId);
  if (!app) return { ok: false, error: "Application not found." };

  if (
    !["UNDER_LMD_REVIEW", "SUBMITTED", "RETURNED_TO_LMD"].includes(app.status)
  ) {
    return { ok: false, error: "Application is not in a reviewable state." };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0)
    return { ok: false, error: "No file provided." };
  if (file.size > 5 * 1024 * 1024)
    return { ok: false, error: "File must be under 5 MB." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const prefix = r2Prefix[kind] ?? "lmd-docs";
  const result = await uploadToR2(buffer, file.name, file.type, prefix);

  // Soft-delete any existing doc of this kind for this application
  await prisma.applicationDocument.updateMany({
    where: { applicationId, kind: kind as DocumentKind, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  await prisma.applicationDocument.create({
    data: {
      applicationId,
      kind: kind as DocumentKind,
      fileName: result.fileName,
      mimeType: result.mimeType,
      fileSizeBytes: result.fileSizeBytes,
      storageKey: result.storageKey,
      uploadedById: user.id,
    },
  });

  revalidatePath(`/dashboard/lmd/applications/${applicationId}`);
  return { ok: true };
}

// ─── RECOMMEND ────────────────────────────────────────────────────────────────
// Final LMD action. Requires at least RECOMMENDATION_LETTER to be uploaded.
// Creates a Recommendation record and sets status to RECOMMENDED.

const recommendSchema = z.object({
  writtenComment: z.string().trim().optional(),
});

export async function recommendAction(
  applicationId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { user, missionId } = await requireLmd();
  const app = await getApplicationForLmd(applicationId, missionId);
  if (!app) return { ok: false, error: "Application not found." };

  if (app.status !== "UNDER_LMD_REVIEW") {
    return {
      ok: false,
      error: "Application must be under review before recommending.",
    };
  }

  // Must have at least a recommendation letter
  const hasRecommendationLetter = app.documents.some(
    (d) => d.kind === "RECOMMENDATION_LETTER" && !d.deletedAt,
  );
  if (!hasRecommendationLetter) {
    return {
      ok: false,
      error: "Please upload the Recommendation Letter before submitting.",
    };
  }

  const parsed = recommendSchema.safeParse({
    writtenComment: formData.get("writtenComment"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid input." };
  }

  const ipAddress = await getClientIp();

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "RECOMMENDED",
        lmdReviewCompletedAt: new Date(),
        lastTransitionAt: new Date(),
      },
    }),
    prisma.recommendation.upsert({
      where: { applicationId },
      create: {
        applicationId,
        recommenderId: user.id,
        writtenComment: parsed.data.writtenComment || null,
        recommendedAt: new Date(),
      },
      update: {
        writtenComment: parsed.data.writtenComment || null,
        recommendedAt: new Date(),
        deletedAt: null,
      },
    }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: "UNDER_LMD_REVIEW",
        toStatus: "RECOMMENDED",
        triggeredById: user.id,
        comment: parsed.data.writtenComment || "Recommended by LMD.",
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "APPLICATION_RECOMMENDED",
        actorId: user.id,
        actorRole: "LOCAL_DIRECTOR",
        actorMissionCode: app.submittedFromMission.code,
        targetType: "Application",
        targetId: applicationId,
        ipAddress,
      },
    }),
  ]);

  revalidatePath(`/dashboard/lmd/applications/${applicationId}`);
  revalidatePath(`/dashboard/lmd/applications`);
  revalidatePath(`/dashboard/lmd`);
  return { ok: true };
}

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Please provide a reason (at least 10 characters)."),
});

export async function rejectApplicationAction(
  applicationId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { user, missionId } = await requireLmd();
  const app = await getApplicationForLmd(applicationId, missionId);
  if (!app) return { ok: false, error: "Application not found." };

  if (!["UNDER_LMD_REVIEW", "SUBMITTED"].includes(app.status)) {
    return { ok: false, error: "Application is not in a reviewable state." };
  }

  const parsed = rejectSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const ipAddress = await getClientIp();

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        lmdRejectionReason: parsed.data.reason, // hidden from applicant
        lmdReviewCompletedAt: new Date(),
        lastTransitionAt: new Date(),
      },
    }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: "REJECTED",
        triggeredById: user.id,
        // Store reason in history comment — history is staff-only
        comment: `Rejected by LMD: ${parsed.data.reason}`,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "APPLICATION_REJECTED_BY_LMD",
        actorId: user.id,
        actorRole: "LOCAL_DIRECTOR",
        actorMissionCode: app.submittedFromMission.code,
        targetType: "Application",
        targetId: applicationId,
        ipAddress,
        details: { reason: parsed.data.reason },
      },
    }),
  ]);

  revalidatePath(`/dashboard/lmd/applications/${applicationId}`);
  revalidatePath(`/dashboard/lmd/applications`);
  revalidatePath(`/dashboard/lmd`);
  return { ok: true };
}
