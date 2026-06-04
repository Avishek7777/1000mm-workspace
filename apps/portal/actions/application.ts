"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { uploadToR2, r2Prefix } from "@/lib/r2";
import {
  Gender,
  BloodType,
  MaritalStatus,
  Denomination,
  Religion,
  DocumentKind,
} from "@prisma/client";

export type FormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ─── File upload helper ───────────────────────────────────────────────────────
// Reads a File from FormData, uploads to R2, returns document row data.
// Returns null if no file was provided (optional uploads).

async function uploadFormFile(
  file: File | null,
  kind: DocumentKind,
  applicationId: string,
  uploadedById: string,
  educationEntryIndex?: number,
) {
  if (!file || file.size === 0) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const prefix = r2Prefix[kind] ?? "uploads";
  const result = await uploadToR2(buffer, file.name, file.type, prefix);

  return prisma.applicationDocument.create({
    data: {
      applicationId,
      kind,
      fileName: result.fileName,
      mimeType: result.mimeType,
      fileSizeBytes: result.fileSizeBytes,
      storageKey: result.storageKey,
      uploadedById,
      educationEntryIndex: educationEntryIndex ?? null,
    },
  });
}

// ─── Reference number generator ──────────────────────────────────────────────

async function generateReferenceNumber(
  missionCode: string,
  year: number,
): Promise<string> {
  const result = await prisma.$transaction(async (tx) => {
    const counter = await tx.applicationCounter.upsert({
      where: { missionCode_year: { missionCode: missionCode as any, year } },
      create: { missionCode: missionCode as any, year, lastSerial: 1 },
      update: { lastSerial: { increment: 1 } },
    });
    return counter.lastSerial;
  });
  const padded = String(result).padStart(5, "0");
  return `${missionCode}-${year}-${padded}`;
}

// ─── Zod schemas per page ─────────────────────────────────────────────────────

const page1Schema = z.object({
  applicantFullName: z.string().trim().min(2).max(36),
  applicantFullNameBangla: z.string().trim().max(50).optional(),
  applicantDateOfBirth: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date of birth",
  }),
  applicantGender: z.nativeEnum(Gender),
  applicantBloodType: z.nativeEnum(BloodType).optional(),
  applicantMaritalStatus: z.nativeEnum(MaritalStatus).optional(),
  applicantDenomination: z.nativeEnum(Denomination).optional(),
  applicantMobileNo: z.string().trim().max(11).optional(),
  applicantEmail: z.string().email().optional().or(z.literal("")),
  applicantPlaceOfBirth: z.string().trim().max(50).optional(),
  applicantHeight: z.coerce.number().positive().optional(),
  applicantWeight: z.coerce.number().max(300).optional(),
  applicantChurchName: z.string().trim().max(70).optional(),
  applicantDateOfBaptism: z
    .string()
    .refine((v) => !v || !isNaN(Date.parse(v)))
    .optional(),
  applicantWorkplace: z.string().trim().max(100).optional(),
  presentAddressDistrict: z.string().trim().optional(),
  presentAddressUpazila: z.string().trim().optional(),
  presentAddressPostOffice: z.string().trim().max(50).optional(),
  presentAddressVillage: z.string().trim().max(50).optional(),
  permanentSameAsPresent: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  permanentAddressDistrict: z.string().trim().optional(),
  permanentAddressUpazila: z.string().trim().optional(),
  permanentAddressPostOffice: z.string().trim().max(50).optional(),
  permanentAddressVillage: z.string().trim().max(50).optional(),
});

const page2Schema = z.object({
  fatherName: z.string().trim().max(36).optional(),
  fatherAge: z.coerce.number().int().max(100).optional(),
  fatherReligion: z.nativeEnum(Religion).optional(),
  fatherChurchName: z.string().trim().max(70).optional(),
  motherName: z.string().trim().max(36).optional(),
  motherAge: z.coerce.number().int().max(100).optional(),
  motherReligion: z.nativeEnum(Religion).optional(),
  motherChurchName: z.string().trim().max(70).optional(),
  familyMobileNo: z.string().trim().max(11).optional(),
  familyEmail: z.string().email().optional().or(z.literal("")),
});

const page3Schema = z.object({
  // education entries come as JSON string from hidden input
  educationEntries: z.string().transform((v) => JSON.parse(v)),
});

const page4Schema = z.object({
  missionaryDesire: z.string().trim().min(10, "Please describe your desire."),
  courtRecord: z.string().transform((v) => v === "true"),
  healthCondition: z.string().transform((v) => v === "true"),
  badHabits: z.string().transform((v) => v === "true"),
  declarationAccepted: z.literal("true", {
    errorMap: () => ({ message: "You must accept the declaration." }),
  }),
});

// ─── SAVE DRAFT (pages 1–3, Next button) ─────────────────────────────────────
// Upserts the Application in DRAFT status. Returns applicationId in fieldErrors
// so the client can track it across page transitions.

export async function saveDraftAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState & { applicationId?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const page = Number(formData.get("__page") ?? 1);
  const applicationId = (formData.get("__applicationId") as string) || null;

  // Find the user's home mission and active application window
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { homeMission: true },
  });
  if (!user) return { ok: false, error: "User not found." };

  const activeWindow = await prisma.applicationWindow.findFirst({
    where: {
      state: "OPEN",
      deletedAt: null,
      OR: [
        { scopedToMissionId: null },
        { scopedToMissionId: user.homeMissionId },
      ],
      applicationCloseDate: { gte: new Date() },
    },
    orderBy: { applicationOpenDate: "desc" },
  });

  if (!activeWindow) {
    return {
      ok: false,
      error: "No application window is currently open for your mission.",
    };
  }

  // ── Page 1 ──
  if (page === 1) {
    const raw = Object.fromEntries(formData.entries());
    const parsed = page1Schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString();
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { ok: false, fieldErrors };
    }

    const d = parsed.data;
    const dob = new Date(d.applicantDateOfBirth);
    const age =
      new Date().getFullYear() -
      dob.getFullYear() -
      (new Date() <
      new Date(new Date().getFullYear(), dob.getMonth(), dob.getDate())
        ? 1
        : 0);

    const baseData = {
      applicantFullName: d.applicantFullName,
      applicantFullNameBangla: d.applicantFullNameBangla || null,
      applicantDateOfBirth: dob,
      applicantAge: age,
      applicantGender: d.applicantGender,
      applicantBloodType: d.applicantBloodType || null,
      applicantMaritalStatus: d.applicantMaritalStatus || null,
      applicantDenomination: d.applicantDenomination || null,
      applicantMobileNo: d.applicantMobileNo || null,
      applicantEmail: d.applicantEmail || null,
      applicantPlaceOfBirth: d.applicantPlaceOfBirth || null,
      applicantHeight: d.applicantHeight ?? null,
      applicantWeight: d.applicantWeight ?? null,
      applicantChurchName: d.applicantChurchName || null,
      applicantDateOfBaptism: d.applicantDateOfBaptism
        ? new Date(d.applicantDateOfBaptism)
        : null,
      applicantWorkplace: d.applicantWorkplace || null,
      presentAddressDistrict: d.presentAddressDistrict || null,
      presentAddressUpazila: d.presentAddressUpazila || null,
      presentAddressPostOffice: d.presentAddressPostOffice || null,
      presentAddressVillage: d.presentAddressVillage || null,
      permanentSameAsPresent: d.permanentSameAsPresent ?? false,
      permanentAddressDistrict: d.permanentSameAsPresent
        ? d.presentAddressDistrict || null
        : d.permanentAddressDistrict || null,
      permanentAddressUpazila: d.permanentSameAsPresent
        ? d.presentAddressUpazila || null
        : d.permanentAddressUpazila || null,
      permanentAddressPostOffice: d.permanentSameAsPresent
        ? d.presentAddressPostOffice || null
        : d.permanentAddressPostOffice || null,
      permanentAddressVillage: d.permanentSameAsPresent
        ? d.presentAddressVillage || null
        : d.permanentAddressVillage || null,
    };

    let app;
    if (applicationId) {
      app = await prisma.application.update({
        where: { id: applicationId },
        data: baseData,
      });
    } else {
      // Check no existing draft for this window
      const existing = await prisma.application.findFirst({
        where: {
          applicantId: userId,
          windowId: activeWindow.id,
          deletedAt: null,
        },
      });
      if (existing) {
        app = await prisma.application.update({
          where: { id: existing.id },
          data: baseData,
        });
      } else {
        app = await prisma.application.create({
          data: {
            ...baseData,
            applicantId: userId,
            windowId: activeWindow.id,
            submittedFromMissionId: user.homeMissionId,
            status: "DRAFT",
            formData: {},
          },
        });
      }
    }

    // Handle profile photo upload
    const photoFile = formData.get("profilePhoto") as File | null;
    if (photoFile && photoFile.size > 0) {
      const doc = await uploadFormFile(
        photoFile,
        DocumentKind.PROFILE_PHOTO,
        app.id,
        userId,
      );
      if (doc) {
        await prisma.application.update({
          where: { id: app.id },
          data: { profilePhotoDocumentId: doc.id },
        });
      }
    }

    return { ok: true, applicationId: app.id };
  }

  // ── Page 2 ──
  if (page === 2) {
    if (!applicationId) return { ok: false, error: "Application not found." };
    const raw = Object.fromEntries(formData.entries());
    const parsed = page2Schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString();
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { ok: false, fieldErrors };
    }
    const d = parsed.data;

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        fatherName: d.fatherName || null,
        fatherAge: d.fatherAge ?? null,
        fatherReligion: d.fatherReligion || null,
        fatherChurchName: d.fatherChurchName || null,
        motherName: d.motherName || null,
        motherAge: d.motherAge ?? null,
        motherReligion: d.motherReligion || null,
        motherChurchName: d.motherChurchName || null,
        familyMobileNo: d.familyMobileNo || null,
        familyEmail: d.familyEmail || null,
      },
    });

    // Handle father/mother NID uploads
    const fatherNid = formData.get("fatherNid") as File | null;
    const motherNid = formData.get("motherNid") as File | null;
    await uploadFormFile(
      fatherNid,
      DocumentKind.FATHER_NID,
      applicationId,
      userId,
    );
    await uploadFormFile(
      motherNid,
      DocumentKind.MOTHER_NID,
      applicationId,
      userId,
    );

    return { ok: true, applicationId };
  }

  // ── Page 3 ──
  if (page === 3) {
    if (!applicationId) return { ok: false, error: "Application not found." };
    const raw = Object.fromEntries(formData.entries());
    const parsed = page3Schema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Invalid education data." };
    }

    const entries = parsed.data.educationEntries as Array<{
      id: string;
      degree: string;
      institutionName: string;
      gpa: number;
      passingYear: number;
    }>;

    // Upload each education certificate
    const savedEntries = await Promise.all(
      entries.map(async (entry, idx) => {
        const certFile = formData.get(`cert_${entry.id}`) as File | null;
        let certDocId: string | null = null;
        if (certFile && certFile.size > 0) {
          const doc = await uploadFormFile(
            certFile,
            DocumentKind.EDUCATION_CERTIFICATE,
            applicationId,
            userId,
            idx,
          );
          certDocId = doc?.id ?? null;
        }
        return { ...entry, certificateDocumentId: certDocId };
      }),
    );

    // Fetch current formData and merge education
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { formData: true },
    });
    const currentFormData = (app?.formData as Record<string, unknown>) ?? {};

    await prisma.application.update({
      where: { id: applicationId },
      data: { formData: { ...currentFormData, education: savedEntries } },
    });

    return { ok: true, applicationId };
  }

  return { ok: false, error: "Unknown page." };
}

// ─── SUBMIT APPLICATION (page 4) ──────────────────────────────────────────────

export async function submitApplicationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState & { applicationId?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const applicationId = formData.get("__applicationId") as string;
  if (!applicationId) return { ok: false, error: "Application not found." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = page4Schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const d = parsed.data;

  // Fetch current formData
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { submittedFromMission: true },
  });
  if (!app) return { ok: false, error: "Application not found." };

  const currentFormData = (app.formData as Record<string, unknown>) ?? {};
  const mergedFormData = {
    ...currentFormData,
    missionaryDesire: d.missionaryDesire,
    courtRecord: d.courtRecord,
    healthCondition: d.healthCondition,
    badHabits: d.badHabits,
    declarationAccepted: true,
  };

  // Handle Page 4 document uploads
  const docKinds: Array<[string, DocumentKind]> = [
    [
      "districtPastorRecommendation",
      DocumentKind.DISTRICT_PASTOR_RECOMMENDATION,
    ],
    ["nid", DocumentKind.NID],
    ["birthCertificate", DocumentKind.BIRTH_CERTIFICATE],
    ["parentPassportPhoto", DocumentKind.PARENT_PASSPORT_PHOTO],
    ["baptismCertificate", DocumentKind.BAPTISM_CERTIFICATE],
    ["parentsConsent", DocumentKind.PARENTS_CONSENT],
    ["letterOfIntent", DocumentKind.LETTER_OF_INTENT],
  ];
  for (const [fieldName, kind] of docKinds) {
    const file = formData.get(fieldName) as File | null;
    await uploadFormFile(file, kind, applicationId, userId);
  }

  // Generate reference number
  const year = new Date().getFullYear();
  const referenceNumber = await generateReferenceNumber(
    app.submittedFromMission.code,
    year,
  );

  // Submit
  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        formData: mergedFormData,
        status: "SUBMITTED",
        submittedAt: new Date(),
        lastTransitionAt: new Date(),
        referenceNumber,
      },
    }),
    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        triggeredById: userId,
        comment: "Application submitted by applicant.",
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "APPLICATION_SUBMITTED",
        actorId: userId,
        actorRole: "TRAINEE",
        targetType: "Application",
        targetId: applicationId,
        details: { referenceNumber },
      },
    }),
  ]);

  redirect("/dashboard/my-application?submitted=true");
}
