"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";

type ActionResult = { ok: boolean; error?: string };

/**
 * Revoke an issued certificate. The certificate stops verifying on the public
 * /verify page and can no longer be downloaded (by staff or the trainee)
 * until it is restored.
 */
export async function revokeCertificateAction(
  enrollmentId: string,
  reason: string,
): Promise<ActionResult> {
  const actor = await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR"]);

  const enrollment = await prisma.programEnrollment.findFirst({
    where: { id: enrollmentId, deletedAt: null },
    select: {
      certificateIssued: true,
      certificateRevokedAt: true,
      trainee: { select: { fullName: true } },
      application: { select: { referenceNumber: true } },
    },
  });
  if (!enrollment) return { ok: false, error: "Enrollment not found." };
  if (!enrollment.certificateIssued)
    return { ok: false, error: "No certificate has been issued for this enrollment." };
  if (enrollment.certificateRevokedAt)
    return { ok: false, error: "Certificate is already revoked." };

  await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: {
      certificateRevokedAt: new Date(),
      certificateRevokeReason: reason.trim() || null,
    },
  });

  await prisma.auditLog
    .create({
      data: {
        action: "CERTIFICATE_REVOKED",
        severity: "WARNING",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "ProgramEnrollment",
        targetId: enrollmentId,
        details: {
          referenceNumber: enrollment.application?.referenceNumber ?? null,
          traineeName: enrollment.trainee.fullName,
          reason: reason.trim() || null,
        },
      },
    })
    .catch(() => {});

  revalidatePath("/dashboard/trainees", "layout");
  return { ok: true };
}

/** Restore a previously revoked certificate — it verifies and downloads again. */
export async function restoreCertificateAction(
  enrollmentId: string,
): Promise<ActionResult> {
  const actor = await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR"]);

  const enrollment = await prisma.programEnrollment.findFirst({
    where: { id: enrollmentId, deletedAt: null },
    select: {
      certificateRevokedAt: true,
      trainee: { select: { fullName: true } },
      application: { select: { referenceNumber: true } },
    },
  });
  if (!enrollment) return { ok: false, error: "Enrollment not found." };
  if (!enrollment.certificateRevokedAt)
    return { ok: false, error: "Certificate is not revoked." };

  await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: { certificateRevokedAt: null, certificateRevokeReason: null },
  });

  await prisma.auditLog
    .create({
      data: {
        action: "CERTIFICATE_RESTORED",
        actorId: actor.id,
        actorRole: actor.role,
        targetType: "ProgramEnrollment",
        targetId: enrollmentId,
        details: {
          referenceNumber: enrollment.application?.referenceNumber ?? null,
          traineeName: enrollment.trainee.fullName,
        },
      },
    })
    .catch(() => {});

  revalidatePath("/dashboard/trainees", "layout");
  return { ok: true };
}
