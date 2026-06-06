"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import {
  createNotification,
  notifyStaffAboutComplaint,
  NOTIFICATION_TEMPLATES,
} from "@/lib/notifications";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  complaintId?: string;
};

// ─── SUBMIT COMPLAINT ─────────────────────────────────────────────────────────

const submitSchema = z.object({
  category: z.enum(["GRIEVANCE", "SUGGESTION", "GENERAL_FEEDBACK"], {
    errorMap: () => ({ message: "Please select a category." }),
  }),
  subject: z
    .string()
    .trim()
    .min(3, "Subject is required.")
    .max(100, "Max 100 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Please describe the issue.")
    .max(3000),
  revealIdentity: z.string().optional(), // checkbox: "on" or undefined
});

export async function submitComplaintAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { homeMission: { select: { code: true, id: true } } },
  });
  if (!user) redirect("/login");

  // Only TRAINEE and LOCAL_DIRECTOR can submit
  if (!["TRAINEE", "LOCAL_DIRECTOR"].includes(user.role)) {
    return { ok: false, error: "You are not permitted to submit complaints." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = submitSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { category, subject, description, revealIdentity } = parsed.data;
  const isAnonymous = revealIdentity !== "on";

  const complaint = await prisma.complaint.create({
    data: {
      category,
      subject,
      description,
      isAnonymous,
      // Only store submitter identity if they opted in
      submittedById: isAnonymous ? null : user.id,
      missionCode: user.homeMission?.code ?? null,
      missionId: user.homeMission?.id ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "COMPLAINT_SUBMITTED",
      // No actor if anonymous
      actorId: isAnonymous ? null : user.id,
      actorRole: isAnonymous ? null : user.role,
      targetType: "Complaint",
      targetId: complaint.id,
    },
  });

  // Notify LMD of mission + UD + SA
  await notifyStaffAboutComplaint(
    user.homeMission?.code ?? null,
    {
      templateKey: NOTIFICATION_TEMPLATES.COMPLAINT_SUBMITTED,
      templateData: {
        category,
        subject,
        complaintId: complaint.id,
        isAnonymous,
        submitterName: isAnonymous ? null : user.fullName,
      },
      actionUrl: `/dashboard/complaints/${complaint.id}`,
    },
    user.id,
  );

  revalidatePath("/dashboard/complaints");
  return { ok: true, complaintId: complaint.id };
}

// ─── RESPOND TO COMPLAINT ─────────────────────────────────────────────────────
// Only MAIN_DIRECTOR and SYSTEM_ADMIN can respond.

const respondSchema = z.object({
  response: z.string().trim().min(5, "Response is required.").max(2000),
});

export async function respondToComplaintAction(
  complaintId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role)) {
    return {
      ok: false,
      error: "You are not permitted to respond to complaints.",
    };
  }

  const parsed = respondSchema.safeParse({
    response: formData.get("response"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: { response: parsed.error.issues[0]?.message ?? "Invalid." },
    };
  }

  const complaint = await prisma.complaint.findFirst({
    where: { id: complaintId, deletedAt: undefined },
  });
  if (!complaint) return { ok: false, error: "Complaint not found." };

  await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      response: parsed.data.response,
      isResolved: true,
      resolvedAt: new Date(),
      resolvedById: user.id,
    },
  });

  // Notify submitter if non-anonymous
  if (!complaint.isAnonymous && complaint.submittedById) {
    await createNotification({
      userId: complaint.submittedById,
      templateKey: NOTIFICATION_TEMPLATES.COMPLAINT_RESPONSE,
      templateData: {
        subject: complaint.subject,
        complaintId,
        responderName: user.fullName,
      },
      actionUrl: `/dashboard/complaints/${complaintId}`,
    });
  }

  revalidatePath(`/dashboard/complaints/${complaintId}`);
  revalidatePath("/dashboard/complaints");
  return { ok: true };
}
