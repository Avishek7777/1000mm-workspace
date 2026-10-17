import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { VERIFY_TOKEN_RE } from "@/lib/verification";

const ALLOWED_ROLES = [
  "SYSTEM_ADMIN",
  "MAIN_DIRECTOR",
  "LOCAL_DIRECTOR",
  "SECRETARY",
  "ASSOCIATE_DIRECTOR",
];

const ENROLLMENT_SELECT = {
  id: true,
  status: true,
  trainee: {
    select: {
      id: true,
      fullName: true,
      homeMissionId: true,
      homeMission: { select: { code: true } },
    },
  },
  program: { select: { id: true, code: true, title: true } },
  application: { select: { applicantFullName: true, referenceNumber: true } },
} as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(actor.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const params = new URL(req.url).searchParams;
  let code = params.get("ref")?.trim();
  const programId = params.get("programId")?.trim();

  if (!code) return NextResponse.json({ error: "ref is required" }, { status: 400 });
  // Attendance is always taken for one programme on one day, so the caller must
  // say which. It also disambiguates a trainee enrolled on more than one.
  if (!programId)
    return NextResponse.json({ error: "Select a program first." }, { status: 400 });

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
    select: { id: true, code: true, title: true },
  });
  if (!program)
    return NextResponse.json({ error: "Program not found." }, { status: 404 });

  // ID-card QR codes encode a full verify URL (https://…/verify/<code>) so that
  // a phone camera opens the verification page. Pull the code back out.
  if (/^https?:\/\//i.test(code)) {
    try {
      const segments = new URL(code).pathname.split("/").filter(Boolean);
      code = decodeURIComponent(segments[segments.length - 1] ?? "").trim();
    } catch {
      code = "";
    }
    if (!code)
      return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
  }

  // Cards printed since the verification rework carry an unguessable token;
  // older ones carry the application reference number, and ones printed for a
  // trainee with no linked application carry the last 8 characters of the
  // enrollment id. All three have to keep working — there are printed cards of
  // every kind in circulation.
  const scoped = { deletedAt: null, programId: program.id };
  let enrollment = VERIFY_TOKEN_RE.test(code)
    ? await prisma.programEnrollment.findFirst({
        where: { ...scoped, verifyToken: code },
        select: ENROLLMENT_SELECT,
      })
    : null;

  if (!enrollment) {
    enrollment = await prisma.programEnrollment.findFirst({
      where: { ...scoped, application: { referenceNumber: code.toUpperCase() } },
      select: ENROLLMENT_SELECT,
    });
  }

  if (!enrollment && /^[0-9A-Za-z]{8,}$/.test(code)) {
    enrollment = await prisma.programEnrollment.findFirst({
      where: {
        ...scoped,
        OR: [{ id: code }, { id: { endsWith: code.toLowerCase() } }],
      },
      select: ENROLLMENT_SELECT,
    });
  }

  if (!enrollment) {
    // Distinguish "not on this programme" from "unknown card", or staff cannot
    // tell a wrong-queue scan from a bad one.
    const elsewhere = await prisma.programEnrollment.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { verifyToken: code },
          { application: { referenceNumber: code.toUpperCase() } },
          { id: { endsWith: code.toLowerCase() } },
        ],
      },
      select: { program: { select: { code: true } } },
    });
    return NextResponse.json(
      {
        error: elsewhere
          ? `This card belongs to ${elsewhere.program.code}, not ${program.code}.`
          : `No trainee found for "${code}"`,
      },
      { status: 404 },
    );
  }

  if (enrollment.status !== "ENROLLED") {
    return NextResponse.json(
      { error: `Not enrolled on ${program.code} — application is still pending.` },
      { status: 409 },
    );
  }

  // One record per trainee per programme per calendar day.
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const existingScan = await prisma.attendanceScan.findFirst({
    where: {
      enrollmentId: enrollment.id,
      scannedAt: { gte: dayStart, lt: dayEnd },
    },
    select: { scannedAt: true },
  });

  if (!existingScan) {
    await prisma.attendanceScan.create({
      data: {
        enrollmentId: enrollment.id,
        traineeId: enrollment.trainee.id,
        programId: program.id,
        missionId: enrollment.trainee.homeMissionId ?? null,
        scannedById: actor.id,
      },
    });
  }

  const todayCount = await prisma.attendanceScan.count({
    where: { programId: program.id, scannedAt: { gte: dayStart, lt: dayEnd } },
  });

  return NextResponse.json({
    // Same identity rule as the ID card: the name that was reviewed and
    // accepted, not the portal account's. See lib/verification.ts.
    fullName:
      enrollment.application?.applicantFullName ?? enrollment.trainee.fullName,
    referenceNumber:
      enrollment.application?.referenceNumber ??
      enrollment.id.slice(-8).toUpperCase(),
    mission: enrollment.trainee.homeMission?.code ?? "—",
    program: program.code,
    status: enrollment.status,
    alreadyScanned: !!existingScan,
    scannedAt: (existingScan?.scannedAt ?? new Date()).toISOString(),
    todayCount,
  });
}
