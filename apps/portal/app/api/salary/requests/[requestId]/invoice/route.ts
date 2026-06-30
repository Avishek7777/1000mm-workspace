import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { SalaryInvoicePdf } from "@/lib/exports/SalaryInvoicePdf";
import React from "react";
import path from "path";
import { readFileSync } from "fs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["SYSTEM_ADMIN", "MAIN_DIRECTOR"].includes(user.role))
    return new NextResponse("Forbidden", { status: 403 });

  const { requestId } = await params;

  const request = await prisma.salaryRequest.findUnique({
    where: { id: requestId },
    include: {
      missionary: { select: { fullName: true, email: true } },
      mission: { select: { code: true, name: true } },
      reviewedBy: { select: { fullName: true, role: true } },
    },
  });

  if (!request)
    return new NextResponse("Salary request not found", { status: 404 });

  if (request.status !== "APPROVED")
    return new NextResponse("Invoice only available for approved requests", { status: 400 });

  const now = new Date();
  const invoiceNumber = `INV-${request.year}-${String(request.month).padStart(2, "0")}-${requestId.slice(-6).toUpperCase()}`;
  const generatedAt = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const generatedTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const mainDirector = await prisma.user.findFirst({
    where: { role: "MAIN_DIRECTOR", deletedAt: null },
    select: { fullName: true },
  });
  const reviewerName = mainDirector?.fullName ?? request.reviewedBy?.fullName ?? user.fullName;
  const reviewerRole = "Union Director";

  let logoSrc: string | undefined;
  try {
    const logoFile = readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png"));
    logoSrc = `data:image/png;base64,${logoFile.toString("base64")}`;
  } catch {
    logoSrc = undefined;
  }

  const buffer = await renderToBuffer(
    React.createElement(SalaryInvoicePdf, {
      data: {
        invoiceNumber,
        generatedAt,
        generatedTime,
        generatedBy: user.fullName,
        approvedBy: reviewerName,
        approvedByRole: reviewerRole,
        logoPath: logoSrc,
        missionaryName: request.missionary.fullName,
        missionaryEmail: request.missionary.email,
        missionCode: request.mission.code,
        missionName: request.mission.name,
        month: request.month,
        year: request.year,
        amount: request.amount,
        notes: request.notes,
        requestId,
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  );

  await prisma.auditLog.create({
    data: {
      action: "SALARY_INVOICE_GENERATED",
      actorId: user.id,
      actorRole: user.role,
      targetType: "SalaryRequest",
      targetId: requestId,
      details: { invoiceNumber, missionaryName: request.missionary.fullName },
    },
  }).catch(() => {});

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNumber}.pdf"`,
    },
  });
}
