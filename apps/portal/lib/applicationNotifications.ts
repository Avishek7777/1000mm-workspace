import "server-only";
import { prisma } from "@1000mm/db";
import { createNotification, NOTIFICATION_TEMPLATES } from "./notifications";
import { sendApplicationEventEmail } from "./email";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3001";

/**
 * Notify the mission's Local Director that a trainee just submitted an
 * application. Fire-and-forget — called after the submit transaction
 * commits, never allowed to fail the submission itself.
 */
export async function notifyLmdOfSubmission(params: {
  missionId: string;
  applicationId: string;
  applicantName: string;
  referenceNumber: string;
}) {
  try {
    const mission = await prisma.localMission.findUnique({
      where: { id: params.missionId },
      select: { directorId: true },
    });
    if (!mission?.directorId) return;

    const lmd = await prisma.user.findUnique({
      where: { id: mission.directorId },
      select: { id: true, fullName: true, email: true },
    });
    if (!lmd) return;

    const actionUrl = `${APP_URL}/dashboard/lmd/applications/${params.applicationId}`;

    await createNotification({
      userId: lmd.id,
      templateKey: NOTIFICATION_TEMPLATES.APPLICATION_SUBMITTED_TO_LMD,
      templateData: {
        applicantName: params.applicantName,
        referenceNumber: params.referenceNumber,
      },
      actionUrl: `/dashboard/lmd/applications/${params.applicationId}`,
    });

    await sendApplicationEventEmail({
      to: lmd.email,
      recipientName: lmd.fullName,
      subject: `New application from ${params.applicantName} — ${params.referenceNumber}`,
      heading: "New Application Submitted",
      message: `${params.applicantName} submitted a new application (reference ${params.referenceNumber}) to your mission. Please review it at your earliest convenience.`,
      actionUrl,
      actionLabel: "Review Application",
    });
  } catch (err) {
    console.error("[NOTIFY] Failed to notify LMD of new application:", err);
  }
}

/**
 * Notify the Union Director(s) (MAIN_DIRECTOR) that an LMD has recommended
 * an application for final review.
 */
export async function notifyUdOfRecommendation(params: {
  applicationId: string;
  applicantName: string;
  referenceNumber: string;
}) {
  try {
    const directors = await prisma.user.findMany({
      where: { role: "MAIN_DIRECTOR", deletedAt: null, isActive: true },
      select: { id: true, fullName: true, email: true },
    });
    if (directors.length === 0) return;

    const actionUrl = `${APP_URL}/dashboard/director/applications/${params.applicationId}`;

    await Promise.all(
      directors.map(async (ud) => {
        await createNotification({
          userId: ud.id,
          templateKey: NOTIFICATION_TEMPLATES.APPLICATION_RECOMMENDED_TO_UD,
          templateData: {
            applicantName: params.applicantName,
            referenceNumber: params.referenceNumber,
          },
          actionUrl: `/dashboard/director/applications/${params.applicationId}`,
        });

        await sendApplicationEventEmail({
          to: ud.email,
          recipientName: ud.fullName,
          subject: `Application recommended for review — ${params.referenceNumber}`,
          heading: "Application Awaiting Your Review",
          message: `${params.applicantName}'s application (reference ${params.referenceNumber}) was recommended by the Local Mission Director and now needs your final review.`,
          actionUrl,
          actionLabel: "Review Application",
        });
      }),
    );
  } catch (err) {
    console.error("[NOTIFY] Failed to notify Union Director of recommendation:", err);
  }
}

/**
 * Notify the applicant that their application was rejected.
 *
 * `reason` is optional and only ever passed for a Union Director rejection —
 * the LMD's rejection reason is intentionally kept staff-only (see
 * lmdRejectionReason in actions/lmd.ts) and must never reach the applicant.
 */
export async function notifyApplicantOfRejection(params: {
  applicantId: string;
  reason?: string;
}) {
  try {
    const applicant = await prisma.user.findUnique({
      where: { id: params.applicantId },
      select: { id: true, fullName: true, email: true },
    });
    if (!applicant) return;

    const actionUrl = `${APP_URL}/dashboard/my-application`;

    await createNotification({
      userId: applicant.id,
      templateKey: NOTIFICATION_TEMPLATES.APPLICATION_STATUS_CHANGED,
      templateData: { status: "REJECTED", reason: params.reason ?? null },
      actionUrl: "/dashboard/my-application",
    });

    await sendApplicationEventEmail({
      to: applicant.email,
      recipientName: applicant.fullName,
      subject: "Update on your 1000MM application",
      heading: "Application Not Approved",
      message: params.reason
        ? `Your application was not approved. Reason: ${params.reason}`
        : "Your application was not approved this time. Contact your Local Mission Director for more information.",
      actionUrl,
      actionLabel: "View My Application",
    });
  } catch (err) {
    console.error("[NOTIFY] Failed to notify applicant of rejection:", err);
  }
}
