import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { CertificatePdf } from "@/lib/exports/CertificatePdf";
import { createElement } from "react";
import QRCode from "qrcode";
import path from "path";
import { readFileSync } from "fs";
import { createNotification, NOTIFICATION_TEMPLATES } from "@/lib/notifications";
import { overlayCertificate, ordinal, formatProgramPeriod, formatLongDate } from "@/lib/certificates/templateOverlay";
import { getStringSetting, SETTINGS, CERT_DEFAULTS } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return new NextResponse("Forbidden", { status: 403 });

  const isStaff = ["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"].includes(user.role);
  const isTrainee = user.role === "TRAINEE";

  if (!isStaff && !isTrainee) return new NextResponse("Forbidden", { status: 403 });

  const url = new URL(req.url);
  const enrollmentId = url.searchParams.get("enrollmentId");
  // Reissue (staff only): re-stamp the issue date to today and regenerate.
  const reissue = url.searchParams.get("reissue") === "1" && isStaff;
  if (!enrollmentId) return new NextResponse("enrollmentId required", { status: 400 });

  const enrollment = await prisma.programEnrollment.findFirst({
    where: {
      id: enrollmentId,
      deletedAt: null,
      // Trainees can only download their own certificate if issued
      ...(isTrainee ? { traineeId: user.id, certificateIssued: true } : {}),
    },
    include: {
      trainee: {
        select: {
          fullName: true,
          homeMission: { select: { name: true } },
        },
      },
      program: {
        select: { code: true, title: true, startDate: true, endDate: true, batch: true },
      },
      application: { select: { referenceNumber: true } },
    },
  });

  if (!enrollment) return new NextResponse("Enrollment not found", { status: 404 });

  const mainDirector = await prisma.user.findFirst({
    where: { role: "MAIN_DIRECTOR", deletedAt: null },
    select: { fullName: true },
  });

  const refNum = enrollment.application?.referenceNumber ?? enrollment.id.slice(-8).toUpperCase();

  // Mark certificate as issued if not already (staff only — trainees can only download issued ones)
  if (!enrollment.certificateIssued && isStaff) {
    await prisma.programEnrollment.update({
      where: { id: enrollmentId },
      data: { certificateIssued: true, certificateIssuedAt: new Date() },
    });
    await Promise.all([
      prisma.auditLog.create({
        data: {
          action: "CERTIFICATE_GENERATED",
          actorId: user.id,
          actorRole: user.role,
          targetType: "ProgramEnrollment",
          targetId: enrollmentId,
          details: { referenceNumber: refNum, traineeName: enrollment.trainee.fullName },
        },
      }),
      createNotification({
        userId: enrollment.traineeId,
        templateKey: NOTIFICATION_TEMPLATES.CERTIFICATE_ISSUED,
        templateData: {
          programTitle: enrollment.program.title,
          referenceNumber: refNum,
        },
        actionUrl: "/dashboard/my-application/certificate",
      }),
    ]).catch(() => {});
  } else if (reissue && enrollment.certificateIssued) {
    // Reissue: re-stamp the issue date and record it.
    await prisma.programEnrollment.update({
      where: { id: enrollmentId },
      data: { certificateIssuedAt: new Date() },
    });
    enrollment.certificateIssuedAt = new Date();
    await prisma.auditLog
      .create({
        data: {
          action: "CERTIFICATE_GENERATED",
          actorId: user.id,
          actorRole: user.role,
          targetType: "ProgramEnrollment",
          targetId: enrollmentId,
          details: { referenceNumber: refNum, reissued: true, traineeName: enrollment.trainee.fullName },
        },
      })
      .catch(() => {});
  }

  // /verify lives on the portal itself; NEXT_PUBLIC_APP_URL points to the
  // public website, so it must not be used here.
  const verifyUrl = `${process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.1000mm.org.bd"}/verify/${refNum}`;

  let logoUrl: string | undefined;
  let sdaLogoUrl: string | undefined;
  try {
    logoUrl = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png")).toString("base64")}`;
    sdaLogoUrl = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "sda-logo.png")).toString("base64")}`;
  } catch {}

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 120,
    margin: 1,
    color: { dark: "#0F6E56", light: "#FAFAF8" },
  });

  const issuedAtDate = enrollment.certificateIssuedAt ?? new Date();
  const issuedAt = issuedAtDate.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const data = {
    referenceNumber: refNum,
    traineeName: enrollment.trainee.fullName,
    missionName: enrollment.trainee.homeMission?.name ?? "—",
    programCode: enrollment.program.code,
    programTitle: enrollment.program.title,
    issuedAt,
    programStart: new Date(enrollment.program.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    programEnd: new Date(enrollment.program.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    deploymentLocation: enrollment.deploymentLocation,
    directorName: mainDirector?.fullName ?? "Union Director",
    logoUrl,
    sdaLogoUrl,
    qrDataUrl,
    verifyUrl,
  };

  // ── Certificate signatories + batch label (configured by SA) ────────────
  const [directorName, presidentName, directorSigKey, presidentSigKey, batchSetting] =
    await Promise.all([
      getStringSetting(SETTINGS.CERT_DIRECTOR_NAME),
      getStringSetting(SETTINGS.CERT_PRESIDENT_NAME),
      getStringSetting(SETTINGS.CERT_DIRECTOR_SIGNATURE),
      getStringSetting(SETTINGS.CERT_PRESIDENT_SIGNATURE),
      getStringSetting(SETTINGS.CERT_BATCH_LABEL),
    ]);

  // SA-configured batch wins; a bare number ("28") is ordinalized to "28th".
  // Fallback: the program's own batch number, then the program code.
  const batchLabel = batchSetting
    ? /^\d+$/.test(batchSetting)
      ? ordinal(Number(batchSetting))
      : batchSetting
    : enrollment.program.batch
      ? ordinal(enrollment.program.batch)
      : enrollment.program.code;

  function readSignature(storageKey: string | null): Uint8Array | undefined {
    if (!storageKey) return undefined;
    try {
      return new Uint8Array(
        readFileSync(path.join(process.cwd(), "public", "uploads", storageKey)),
      );
    } catch {
      return undefined;
    }
  }

  // ── Preferred: overlay onto the official designed template ──────────────
  // Drop the blank certificate at public/certificates/template.pdf and it is
  // used automatically; without it, the built-in design below is generated.
  let output: Uint8Array;
  try {
    const templateBytes = readFileSync(
      path.join(process.cwd(), "public", "certificates", "template.pdf"),
    );
    const qrPng = await QRCode.toBuffer(verifyUrl, {
      width: 300,
      margin: 1,
      color: { dark: "#1a1208", light: "#00000000" }, // transparent background
    });
    output = await overlayCertificate(new Uint8Array(templateBytes), {
      batchLabel,
      traineeName: enrollment.trainee.fullName,
      programPeriod: formatProgramPeriod(
        new Date(enrollment.program.startDate),
        new Date(enrollment.program.endDate),
      ),
      issuedAt: formatLongDate(issuedAtDate),
      qrPng: new Uint8Array(qrPng),
      referenceNumber: refNum,
      directorName: directorName ?? CERT_DEFAULTS.directorName,
      directorTitle: CERT_DEFAULTS.directorTitle,
      presidentName: presidentName ?? CERT_DEFAULTS.presidentName,
      presidentTitle: CERT_DEFAULTS.presidentTitle,
      directorSignaturePng: readSignature(directorSigKey),
      presidentSignaturePng: readSignature(presidentSigKey),
    });
  } catch {
    // Template missing or unreadable — fall back to the built-in design.
    const buffer = await renderToBuffer(
      createElement(CertificatePdf, { data }) as any,
    );
    output = new Uint8Array(buffer);
  }

  return new NextResponse(output as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificate-${refNum}.pdf"`,
    },
  });
}
