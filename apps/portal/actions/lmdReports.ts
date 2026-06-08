"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  reportId?: string;
  windowId?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function requireDirector() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role))
    redirect("/dashboard");
  return user;
}

// ─── OPEN REPORT WINDOW (UD / SA) ─────────────────────────────────────────────

const windowSchema = z.object({
  reportMonth: z.coerce.number().int().min(1).max(12),
  reportYear: z.coerce.number().int().min(2020).max(2100),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => v || undefined),
});

export async function openLmdReportWindowAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDirector();
  if (user.role === "MAIN_DIRECTOR") {
    const allowed = await isSettingEnabled(
      SETTINGS.UD_CAN_OPEN_LMD_REPORT_WINDOWS,
    );
    if (!allowed) return { ok: false, error: "Not permitted." };
  }

  const parsed = windowSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = issue.path[0]?.toString();
      if (f && !fieldErrors[f]) fieldErrors[f] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { reportMonth, reportYear, notes } = parsed.data;

  // Check for duplicate open window
  const existing = await prisma.lmdReportWindow.findUnique({
    where: { reportMonth_reportYear: { reportMonth, reportYear } },
  });
  if (existing) {
    if (existing.state === "OPEN") {
      return {
        ok: false,
        error: `A window for ${reportMonth}/${reportYear} is already open.`,
      };
    }
    // Re-open closed window
    await prisma.lmdReportWindow.update({
      where: { id: existing.id },
      data: { state: "OPEN" },
    });
    revalidatePath("/dashboard/director/lmd-reports");
    revalidatePath("/dashboard/lmd/reports");
    return { ok: true, windowId: existing.id };
  }

  const window = await prisma.lmdReportWindow.create({
    data: {
      reportMonth,
      reportYear,
      state: "OPEN",
      notes: notes ?? null,
      createdById: user.id,
    },
  });

  revalidatePath("/dashboard/director/lmd-reports");
  revalidatePath("/dashboard/lmd/reports");
  return { ok: true, windowId: window.id };
}

// ─── CLOSE REPORT WINDOW (UD / SA) ───────────────────────────────────────────

export async function closeLmdReportWindowAction(
  windowId: string,
): Promise<ActionResult> {
  const user = await requireDirector();

  if (user.role === "MAIN_DIRECTOR") {
    const allowed = await isSettingEnabled(
      SETTINGS.UD_CAN_OPEN_LMD_REPORT_WINDOWS,
    );
    if (!allowed) return { ok: false, error: "Not permitted." };
  }
  await prisma.lmdReportWindow.update({
    where: { id: windowId },
    data: { state: "CLOSED" },
  });
  revalidatePath("/dashboard/director/lmd-reports");
  revalidatePath("/dashboard/lmd/reports");
  return { ok: true };
}

// ─── SUBMIT LMD REPORT ────────────────────────────────────────────────────────

const reportSchema = z.object({
  windowId: z.string().min(1, "Window ID required."),
  overallSummary: z
    .string()
    .trim()
    .min(20, "Please provide an overall summary.")
    .max(5000),
  challengesAndNeeds: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => v || undefined),
  recommendationsToDirector: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => v || undefined),
  prayerRequests: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || undefined),
});

export async function submitLmdReportAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireLmd();

  const parsed = reportSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const f = issue.path[0]?.toString();
      if (f && !fieldErrors[f]) fieldErrors[f] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const {
    windowId,
    overallSummary,
    challengesAndNeeds,
    recommendationsToDirector,
    prayerRequests,
  } = parsed.data;

  // Validate window is open
  const window = await prisma.lmdReportWindow.findUnique({
    where: { id: windowId },
  });
  if (!window) return { ok: false, error: "Report window not found." };
  if (window.state !== "OPEN")
    return { ok: false, error: "This reporting window is closed." };

  // Check duplicate
  const existing = await prisma.lmdReport.findUnique({
    where: {
      lmdId_reportMonth_reportYear: {
        lmdId: user.id,
        reportMonth: window.reportMonth,
        reportYear: window.reportYear,
      },
    },
  });
  if (existing)
    return {
      ok: false,
      error: `You already submitted a report for ${window.reportMonth}/${window.reportYear}.`,
    };

  // Get mission
  const mission = await prisma.localMission.findFirst({
    where: { directorId: user.id },
  });
  if (!mission)
    return { ok: false, error: "No mission assigned to your account." };

  // Aggregate trainee field reports for this month
  const traineeReports = await prisma.fieldReport.findMany({
    where: {
      reportMonth: window.reportMonth,
      reportYear: window.reportYear,
      trainee: { homeMissionId: mission.id },
    },
  });

  const agg = traineeReports.reduce(
    (acc, r) => ({
      totalTrainees: acc.totalTrainees + 1,
      totalActivities: acc.totalActivities + r.totalActivities,
      totalDaysOfWork: acc.totalDaysOfWork + r.daysOfWork,
      totalHoursOfWork: acc.totalHoursOfWork + r.hoursOfWork,
      totalNonSdaHomeVisits: acc.totalNonSdaHomeVisits + r.nonSdaHomeVisits,
      totalBibleStudies: acc.totalBibleStudies + r.bibleStudiesConducted,
      totalMedicalVisits: acc.totalMedicalVisits + r.medicalVisits,
      totalWorshipSessions: acc.totalWorshipSessions + r.worshipSessionsTaken,
      totalNewGroups: acc.totalNewGroups + r.newGroupsMade,
      totalBaptismCandidates:
        acc.totalBaptismCandidates + r.baptismCandidatesPrepared,
      totalBaptisms: acc.totalBaptisms + r.numberOfBaptisms,
      totalPeopleReached: acc.totalPeopleReached + (r.peopleReached ?? 0),
    }),
    {
      totalTrainees: 0,
      totalActivities: 0,
      totalDaysOfWork: 0,
      totalHoursOfWork: 0,
      totalNonSdaHomeVisits: 0,
      totalBibleStudies: 0,
      totalMedicalVisits: 0,
      totalWorshipSessions: 0,
      totalNewGroups: 0,
      totalBaptismCandidates: 0,
      totalBaptisms: 0,
      totalPeopleReached: 0,
    },
  );

  const report = await prisma.lmdReport.create({
    data: {
      windowId,
      lmdId: user.id,
      missionId: mission.id,
      reportMonth: window.reportMonth,
      reportYear: window.reportYear,
      ...agg,
      overallSummary,
      challengesAndNeeds: challengesAndNeeds ?? null,
      recommendationsToDirector: recommendationsToDirector ?? null,
      prayerRequests: prayerRequests ?? null,
    },
  });

  revalidatePath("/dashboard/lmd/reports");
  revalidatePath("/dashboard/director/lmd-reports");
  return { ok: true, reportId: report.id };
}
