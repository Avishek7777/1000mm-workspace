// apps/portal/actions/urgentReports.ts
"use server";

import { prisma as db } from "@1000mm/db";
import { auth } from "@/lib/auth/config";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

async function saveAttachment(
  file: File,
  slot: number,
  reportSlug: string,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const fileName = `${reportSlug}-${slot}.${ext}`;
  const key = `urgent-reports/${fileName}`;
  const fullPath = path.join(process.cwd(), "public", "uploads", "urgent-reports", fileName);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));
  return key;
}

// ── SA: issue a new urgent report ────────────────────────────────────────────
export async function issueUrgentReportAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    throw new Error("Unauthorised");
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) throw new Error("Title and body are required.");

  const slug = `${Date.now()}`;
  const attachmentData: Record<string, string | undefined> = {};

  for (let i = 1; i <= 5; i++) {
    const file = formData.get(`attachment${i}`) as File | null;
    if (file && file.size > 0) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Attachment ${i}: unsupported file type.`);
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`Attachment ${i}: exceeds 10 MB limit.`);
      }
      const key = await saveAttachment(file, i, slug);
      attachmentData[`attachment${i}`] = key;
      attachmentData[`attachment${i}Name`] = file.name;
    }
  }

  const report = await db.urgentReport.create({
    data: {
      title,
      body,
      issuedById: session.user.id,
      ...attachmentData,
    },
  });

  // Notify all active missionaries
  const missionaries = await db.user.findMany({
    where: { isMissionary: true, isActive: true, deletedAt: null },
    select: { id: true },
  });

  if (missionaries.length > 0) {
    await db.notification.createMany({
      data: missionaries.map((m) => ({
        userId: m.id,
        channel: "IN_APP" as const,
        templateKey: "urgent_report.issued",
        templateData: { title, reportId: report.id },
        actionUrl: `/dashboard/urgent-reports/${report.id}`,
      })),
    });
  }

  await db.auditLog.create({
    data: {
      action: "URGENT_REPORT_ISSUED",
      severity: "NOTICE",
      actorId: session.user.id,
      actorRole: "SYSTEM_ADMIN",
      targetType: "UrgentReport",
      targetId: report.id,
      details: { title, recipientCount: missionaries.length },
    },
  }).catch((err: unknown) => console.error("[auditLog urgent_report_issued]", err));

  revalidatePath("/dashboard/system-admin/urgent-reports");
  return { ok: true as const, id: report.id };
}

// ── SA: delete an urgent report ───────────────────────────────────────────────
export async function deleteUrgentReportAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    throw new Error("Unauthorised");
  }

  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) throw new Error("Missing report ID.");

  await db.urgentReport.update({
    where: { id: reportId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/dashboard/system-admin/urgent-reports");
}

// ── Missionary: acknowledge / submit response ─────────────────────────────────
export async function submitUrgentReportResponseAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorised");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isMissionary: true },
  });
  if (!user?.isMissionary)
    throw new Error("Only missionaries can submit responses.");

  const reportId = String(formData.get("reportId") ?? "");
  const response = String(formData.get("response") ?? "").trim() || null;
  if (!reportId) throw new Error("Missing report ID.");

  // Up to 3 optional attachments (e.g. proof of compliance, a photo, etc.)
  const attachmentData: Record<string, string | undefined> = {};
  for (let i = 1; i <= 3; i++) {
    const file = formData.get(`attachment${i}`) as File | null;
    if (file && file.size > 0) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Attachment ${i}: unsupported file type.`);
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`Attachment ${i}: exceeds 10 MB limit.`);
      }
      const key = await saveAttachment(file, i, `sub-${reportId}-${session.user.id}`);
      attachmentData[`attachment${i}`] = key;
      attachmentData[`attachment${i}Name`] = file.name;
    }
  }

  // Upsert — idempotent if they re-submit
  await db.urgentReportSubmission.upsert({
    where: { reportId_userId: { reportId, userId: session.user.id } },
    create: { reportId, userId: session.user.id, response, ...attachmentData },
    update: { response, submittedAt: new Date(), ...attachmentData },
  });

  await db.auditLog.create({
    data: {
      action: "URGENT_REPORT_SUBMITTED",
      severity: "INFO",
      actorId: session.user.id,
      actorRole: "TRAINEE",
      targetType: "UrgentReport",
      targetId: reportId,
    },
  }).catch((err: unknown) => console.error("[auditLog urgent_report_submitted]", err));

  revalidatePath(`/dashboard/urgent-reports/${reportId}`);
}
