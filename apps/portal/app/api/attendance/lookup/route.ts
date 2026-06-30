import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["SYSTEM_ADMIN", "MAIN_DIRECTOR", "LOCAL_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"];
  if (!allowed.includes(actor.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ref = new URL(req.url).searchParams.get("ref")?.trim();
  if (!ref) return NextResponse.json({ error: "ref is required" }, { status: 400 });

  let enrollment = await prisma.programEnrollment.findFirst({
    where: {
      deletedAt: null,
      application: { referenceNumber: ref },
    },
    include: {
      trainee: {
        select: {
          id: true,
          fullName: true,
          homeMissionId: true,
          homeMission: { select: { code: true } },
        },
      },
      program: { select: { id: true, code: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!enrollment) {
    enrollment = await prisma.programEnrollment.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { id: ref },
          { id: { endsWith: ref.toLowerCase() } },
        ],
      },
      include: {
        trainee: {
          select: {
            id: true,
            fullName: true,
            homeMissionId: true,
            homeMission: { select: { code: true } },
          },
        },
        program: { select: { id: true, code: true, title: true } },
      },
    });
  }

  if (!enrollment) {
    return NextResponse.json({ error: `No trainee found for "${ref}"` }, { status: 404 });
  }

  // Record the scan (upsert: one record per trainee per program per calendar day)
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const existingScan = await prisma.attendanceScan.findFirst({
    where: {
      enrollmentId: enrollment.id,
      scannedAt: { gte: dayStart, lt: dayEnd },
    },
  });

  if (!existingScan) {
    await prisma.attendanceScan.create({
      data: {
        enrollmentId: enrollment.id,
        traineeId: enrollment.trainee.id,
        programId: enrollment.program.id,
        missionId: enrollment.trainee.homeMissionId ?? null,
        scannedById: actor.id,
      },
    });
  }

  return NextResponse.json({
    fullName: enrollment.trainee.fullName,
    mission: enrollment.trainee.homeMission?.code ?? "—",
    program: enrollment.program.code,
    status: enrollment.status,
    alreadyScanned: !!existingScan,
  });
}
