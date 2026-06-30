import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@1000mm/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ referenceNumber: string }> },
) {
  const { referenceNumber } = await params;
  const ref = referenceNumber.trim().toUpperCase();

  const enrollment = await prisma.programEnrollment.findFirst({
    where: {
      deletedAt: null,
      certificateIssued: true,
      application: { referenceNumber: ref },
    },
    select: {
      certificateIssuedAt: true,
      deploymentLocation: true,
      trainee: {
        select: {
          fullName: true,
          homeMission: { select: { code: true, name: true } },
        },
      },
      program: {
        select: { code: true, title: true, startDate: true, endDate: true },
      },
    },
  });

  if (!enrollment) {
    return NextResponse.json(
      { valid: false, message: "No certificate found for this reference number." },
      {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  return NextResponse.json(
    {
      valid: true,
      referenceNumber: ref,
      traineeName: enrollment.trainee.fullName,
      missionCode: enrollment.trainee.homeMission?.code ?? "—",
      missionName: enrollment.trainee.homeMission?.name ?? "—",
      programCode: enrollment.program.code,
      programTitle: enrollment.program.title,
      programStart: enrollment.program.startDate,
      programEnd: enrollment.program.endDate,
      deploymentLocation: enrollment.deploymentLocation ?? null,
      issuedAt: enrollment.certificateIssuedAt,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    },
  );
}
