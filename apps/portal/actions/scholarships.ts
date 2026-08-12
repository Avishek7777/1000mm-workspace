"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { saveUploadedFile } from "@/lib/uploadFile";
import {
  checkScholarshipEligibility,
  generateScholarshipReference,
} from "@/lib/scholarshipEligibility";
import { loadScholarshipApplicant } from "@/lib/scholarshipApplicant";

export type ScholarshipResult =
  | { ok: true; referenceNumber?: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

/** Attachment fields on the printed form, and whether the form marks them required. */
const ATTACHMENTS = [
  { field: "photo", column: "photoKey", label: "PP size picture" },
  { field: "missionaryCertificate", column: "missionaryCertificateKey", label: "Missionary certificate" },
  { field: "academicResult", column: "academicResultKey", label: "Academic result or certificate" },
  { field: "recommendationLetter", column: "recommendationLetterKey", label: "Recommendation letter" },
  { field: "nid", column: "nidKey", label: "NID" },
] as const;

const formSchema = z.object({
  dateOfBirth: z.string().trim().optional(),
  servingYear: z.string().trim().max(40).optional(),
  passingGrade: z.string().trim().max(60).optional(),
  passingYear: z.string().trim().max(20).optional(),
  gpa: z.string().trim().max(20).optional(),
  planningToStudy: z.string().trim().max(140).optional(),
  subject: z.string().trim().max(140).optional(),
  collegeName: z.string().trim().max(180).optional(),
  collegeAddress: z.string().trim().max(255).optional(),
  estimatedMonthlyFees: z.string().trim().max(60).optional(),
  yearlyFees: z.string().trim().max(60).optional(),
  additionalFees: z.string().trim().max(60).optional(),
  fatherName: z.string().trim().max(120).optional(),
  motherName: z.string().trim().max(120).optional(),
  siblingName: z.string().trim().max(180).optional(),
  homeAddress: z.string().trim().max(255).optional(),
  phoneNumber: z.string().trim().max(20).optional(),
  emailId: z.string().trim().max(160).optional(),
  experience: z.string().trim().min(20, "Please describe your experience as a missionary."),
  desireToStudy: z.string().trim().min(20, "Please explain why you want to study and need a scholarship."),
  familyBackground: z.string().trim().min(20, "Please describe your family background."),
});

// ─── Missionary: submit an application ───────────────────────────────────────

export async function submitScholarshipAction(
  _prev: ScholarshipResult,
  formData: FormData,
): Promise<ScholarshipResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const user = await loadScholarshipApplicant(userId);
  if (!user?.homeMissionId || !user.homeMission) {
    return { ok: false, error: "Your account is not assigned to a mission." };
  }

  // Eligibility is re-checked here, not just hidden in the UI: the page can be
  // reached directly and the twelve-month rule is a real requirement.
  const eligibility = await checkScholarshipEligibility(userId);
  if (!eligibility.eligible) {
    return { ok: false, error: eligibility.reason };
  }

  const existing = await prisma.scholarshipRequest.findFirst({
    where: {
      missionaryId: userId,
      deletedAt: null,
      status: { in: ["SUBMITTED", "UNDER_LMD_REVIEW", "LMD_SUGGESTED"] },
    },
    select: { referenceNumber: true },
  });
  if (existing) {
    return {
      ok: false,
      error: `You already have an application under review (${existing.referenceNumber}).`,
    };
  }

  const parsed = formSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const d = parsed.data;

  // Save attachments before creating the row, so a rejected file does not
  // leave a half-populated application behind.
  const attachmentKeys: Record<string, string | null> = {};
  for (const a of ATTACHMENTS) {
    const file = formData.get(a.field) as File | null;
    if (!file || file.size === 0) {
      attachmentKeys[a.column] = null;
      continue;
    }
    const saved = await saveUploadedFile(
      file,
      `scholarships/${userId}`,
      null,
      MAX_ATTACHMENT_BYTES,
    );
    if (!saved.ok) {
      return { ok: false, fieldErrors: { [a.field]: `${a.label}: ${saved.error}` } };
    }
    attachmentKeys[a.column] = saved.storageKey;
  }

  const referenceNumber = await generateScholarshipReference(
    user.homeMission.code,
    new Date().getFullYear(),
  );

  await prisma.scholarshipRequest.create({
    data: {
      referenceNumber,
      missionaryId: userId,
      missionId: user.homeMissionId,
      status: "SUBMITTED",
      // Taken from the account (or the applicant's bio-data) rather than the
      // posted value, for the same reason as the name below: it is already on
      // record and should not be re-stated differently here.
      dateOfBirth: user.dateOfBirth ?? (d.dateOfBirth ? new Date(d.dateOfBirth) : null),
      servingYear: d.servingYear || null,
      passingGrade: d.passingGrade || null,
      passingYear: d.passingYear || null,
      gpa: d.gpa || null,
      planningToStudy: d.planningToStudy || null,
      subject: d.subject || null,
      collegeName: d.collegeName || null,
      collegeAddress: d.collegeAddress || null,
      estimatedMonthlyFees: d.estimatedMonthlyFees || null,
      yearlyFees: d.yearlyFees || null,
      additionalFees: d.additionalFees || null,
      fatherName: d.fatherName || null,
      motherName: d.motherName || null,
      siblingName: d.siblingName || null,
      homeAddress: d.homeAddress || null,
      phoneNumber: d.phoneNumber || null,
      emailId: d.emailId || null,
      experience: d.experience,
      desireToStudy: d.desireToStudy,
      familyBackground: d.familyBackground,
      // The form's "Submitted By Name" — the missionary signing their own
      // application, taken from the account rather than retyped.
      submittedByName: user.fullName,
      photoKey: attachmentKeys.photoKey,
      missionaryCertificateKey: attachmentKeys.missionaryCertificateKey,
      academicResultKey: attachmentKeys.academicResultKey,
      recommendationLetterKey: attachmentKeys.recommendationLetterKey,
      nidKey: attachmentKeys.nidKey,
    },
  });

  revalidateScholarshipViews();
  return { ok: true, referenceNumber };
}

// ─── LMD: suggest or reject, with the meeting minutes attached ───────────────

export async function reviewScholarshipByLmdAction(
  requestId: string,
  _prev: ScholarshipResult,
  formData: FormData,
): Promise<ScholarshipResult> {
  const user = await requireRole(["LOCAL_DIRECTOR"]);

  const request = await prisma.scholarshipRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: { id: true, missionId: true, status: true },
  });
  if (!request) return { ok: false, error: "Application not found." };

  const mission = await prisma.localMission.findFirst({
    where: { id: request.missionId, directorId: user.id },
    select: { id: true },
  });
  if (!mission) {
    return { ok: false, error: "That application belongs to another mission." };
  }
  if (!["SUBMITTED", "UNDER_LMD_REVIEW"].includes(request.status)) {
    return { ok: false, error: "This application has already been decided." };
  }

  const decision = formData.get("decision") as string;
  if (decision !== "suggest" && decision !== "reject") {
    return { ok: false, error: "Choose whether to suggest or reject." };
  }

  const note = ((formData.get("note") as string) || "").trim();
  if (!note) {
    return { ok: false, fieldErrors: { note: "Please record the committee's reasoning." } };
  }

  // The minutes are the record of the meeting, so they are required to
  // suggest. A rejection can stand on the written reason alone.
  const minutes = formData.get("minutes") as File | null;
  let minutesKey: string | null = null;
  let minutesName: string | null = null;

  if (minutes && minutes.size > 0) {
    const saved = await saveUploadedFile(
      minutes,
      `scholarships/decisions/${requestId}`,
      null,
      MAX_ATTACHMENT_BYTES,
    );
    if (!saved.ok) return { ok: false, fieldErrors: { minutes: saved.error } };
    minutesKey = saved.storageKey;
    minutesName = saved.fileName;
  } else if (decision === "suggest") {
    return {
      ok: false,
      fieldErrors: { minutes: "Attach a copy of the decision before suggesting this candidate." },
    };
  }

  await prisma.scholarshipRequest.update({
    where: { id: requestId },
    data: {
      status: decision === "suggest" ? "LMD_SUGGESTED" : "LMD_REJECTED",
      lmdReviewerId: user.id,
      lmdDecisionNote: note,
      lmdDecisionAt: new Date(),
      ...(minutesKey ? { lmdMinutesKey: minutesKey, lmdMinutesName: minutesName } : {}),
    },
  });

  revalidateScholarshipViews();
  return { ok: true };
}

// ─── UD: final decision, and the amount funded ───────────────────────────────

export async function decideScholarshipByUdAction(
  requestId: string,
  _prev: ScholarshipResult,
  formData: FormData,
): Promise<ScholarshipResult> {
  const user = await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);

  const request = await prisma.scholarshipRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!request) return { ok: false, error: "Application not found." };
  if (request.status !== "LMD_SUGGESTED") {
    return {
      ok: false,
      error: "Only applications suggested by a Local Mission Director can be decided here.",
    };
  }

  const decision = formData.get("decision") as string;
  if (decision !== "approve" && decision !== "reject") {
    return { ok: false, error: "Choose whether to approve or reject." };
  }

  const note = ((formData.get("note") as string) || "").trim();

  let approvedAmount: number | null = null;
  if (decision === "approve") {
    const raw = ((formData.get("approvedAmount") as string) || "").trim();
    const parsedAmount = Number(raw);
    if (!raw || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return {
        ok: false,
        fieldErrors: { approvedAmount: "Enter the amount being funded." },
      };
    }
    approvedAmount = Math.round(parsedAmount);
  }

  await prisma.scholarshipRequest.update({
    where: { id: requestId },
    data: {
      status: decision === "approve" ? "APPROVED" : "REJECTED",
      udReviewerId: user.id,
      udDecisionNote: note || null,
      udDecisionAt: new Date(),
      approvedAmount,
    },
  });

  revalidateScholarshipViews();
  return { ok: true };
}

function revalidateScholarshipViews() {
  revalidatePath("/dashboard/scholarship");
  revalidatePath("/dashboard/lmd/scholarships");
  revalidatePath("/dashboard/director/scholarships");
}
