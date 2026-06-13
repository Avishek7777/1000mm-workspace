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
  reportId?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

// ─── SUBMIT FIELD REPORT ──────────────────────────────────────────────────────

const reportSchema = z.object({
  reportMonth: z.coerce.number().int().min(1).max(12),
  reportYear: z.coerce.number().int().min(2020).max(2100),
  totalActivities: z.coerce.number().int().min(0).default(0),
  daysOfWork: z.coerce.number().int().min(0).max(31).default(0),
  hoursOfWork: z.coerce.number().int().min(0).default(0),
  nonSdaHomeVisits: z.coerce.number().int().min(0).default(0),
  bibleStudiesConducted: z.coerce.number().int().min(0).default(0),
  medicalVisits: z.coerce.number().int().min(0).default(0),
  worshipSessionsTaken: z.coerce.number().int().min(0).default(0),
  newGroupsMade: z.coerce.number().int().min(0).default(0),
  baptismCandidatesPrepared: z.coerce.number().int().min(0).default(0),
  numberOfBaptisms: z.coerce.number().int().min(0).default(0),
  peopleReached: z.coerce.number().int().min(0).optional(),
  activitiesSummary: z
    .string()
    .trim()
    .min(10, "Please describe your activities.")
    .max(3000),
  trainingReceived: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || undefined),
  storyOrWitness: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => v || undefined),
  commentsOrSuggestions: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || undefined),
  challengesFaced: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || undefined),
  prayerRequests: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || undefined),
});

export async function submitFieldReportAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireSession();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, fullName: true, email: true },
  });
  if (!user || user.role !== "TRAINEE") {
    return {
      ok: false,
      error: "Only deployed trainees can submit field reports.",
    };
  }

  // Must have an ACCEPTED application with an active enrollment
  const enrollment = await prisma.programEnrollment.findFirst({
    where: {
      traineeId: userId,
      deletedAt: null,
      application: { status: "ACCEPTED" },
    },
    include: {
      program: { select: { id: true } },
      application: { select: { id: true } },
      deploymentAssignedBy: { select: { fullName: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  if (!enrollment) {
    return {
      ok: false,
      error:
        "You must be an accepted and enrolled trainee to submit field reports.",
    };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = reportSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const d = parsed.data;

  // Check duplicate — one per month
  const existing = await prisma.fieldReport.findUnique({
    where: {
      traineeId_reportMonth_reportYear: {
        traineeId: userId,
        reportMonth: d.reportMonth,
        reportYear: d.reportYear,
      },
    },
  });
  if (existing) {
    return {
      ok: false,
      error: `You already submitted a report for ${d.reportMonth}/${d.reportYear}.`,
    };
  }

  // Get LMD name for snapshot
  const missionDirector = await prisma.localMission.findFirst({
    where: { users: { some: { id: userId } } },
    include: { director: { select: { fullName: true } } },
  });

  const report = await prisma.fieldReport.create({
    data: {
      traineeId: userId,
      applicationId: enrollment.application!.id,
      programId: enrollment.program.id,
      reportMonth: d.reportMonth,
      reportYear: d.reportYear,
      workplaceSnapshot: enrollment.deploymentLocation ?? null,
      lmdNameSnapshot: missionDirector?.director?.fullName ?? null,
      totalActivities: d.totalActivities,
      daysOfWork: d.daysOfWork,
      hoursOfWork: d.hoursOfWork,
      nonSdaHomeVisits: d.nonSdaHomeVisits,
      bibleStudiesConducted: d.bibleStudiesConducted,
      medicalVisits: d.medicalVisits,
      worshipSessionsTaken: d.worshipSessionsTaken,
      newGroupsMade: d.newGroupsMade,
      baptismCandidatesPrepared: d.baptismCandidatesPrepared,
      numberOfBaptisms: d.numberOfBaptisms,
      peopleReached: d.peopleReached ?? null,
      activitiesSummary: d.activitiesSummary,
      trainingReceived: d.trainingReceived ?? null,
      storyOrWitness: d.storyOrWitness ?? null,
      commentsOrSuggestions: d.commentsOrSuggestions ?? null,
      challengesFaced: d.challengesFaced ?? null,
      prayerRequests: d.prayerRequests ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "FIELD_REPORT_SUBMITTED",
      actorId: userId,
      actorRole: "TRAINEE",
      targetType: "FieldReport",
      targetId: report.id,
    },
  });

  revalidatePath("/dashboard/field-reports");
  return { ok: true, reportId: report.id };
}

// ─── ADD COMMENT (LMD / UD / SA) ──────────────────────────────────────────────

export async function addFieldReportCommentAction(
  reportId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireSession();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (
    !user ||
    !["LOCAL_DIRECTOR", "MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role)
  ) {
    return {
      ok: false,
      error: "You are not permitted to comment on field reports.",
    };
  }

  const comment = formData.get("comment")?.toString().trim();
  if (!comment || comment.length < 3) {
    return { ok: false, fieldErrors: { comment: "Comment is required." } };
  }
  if (comment.length > 1000) {
    return { ok: false, fieldErrors: { comment: "Max 1000 characters." } };
  }

  // LMD can only comment on reports from their mission
  if (user.role === "LOCAL_DIRECTOR") {
    const report = await prisma.fieldReport.findUnique({
      where: { id: reportId },
      include: { trainee: { include: { homeMission: true } } },
    });
    if (!report) return { ok: false, error: "Report not found." };

    const lmdMission = await prisma.localMission.findFirst({
      where: { directorId: userId },
    });
    if (!lmdMission || report.trainee.homeMission?.id !== lmdMission.id) {
      return {
        ok: false,
        error: "You can only comment on reports from your mission.",
      };
    }
  }

  await prisma.fieldReportComment.create({
    data: { reportId, authorId: userId, comment },
  });

  revalidatePath(`/dashboard/field-reports/${reportId}`);
  revalidatePath(`/dashboard/lmd/field-reports/${reportId}`);
  revalidatePath(`/dashboard/director/field-reports/${reportId}`);
  return { ok: true };
}
