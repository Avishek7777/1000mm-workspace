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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return new NextResponse("Forbidden", { status: 403 });

  const isStaff = ["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"].includes(user.role);
  const isTrainee = user.role === "TRAINEE";

  if (!isStaff && !isTrainee) return new NextResponse("Forbidden", { status: 403 });

  const enrollmentId = new URL(req.url).searchParams.get("enrollmentId");
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
        select: { code: true, title: true, startDate: true, endDate: true },
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
  }

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://portal.1000mmbd.org"}/verify/${refNum}`;

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

  const issuedAt = (enrollment.certificateIssuedAt ?? new Date()).toLocaleDateString("en-GB", {
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

  const buffer = await renderToBuffer(
    createElement(CertificatePdf, { data }) as any,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificate-${refNum}.pdf"`,
    },
  });
}
