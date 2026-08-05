/**
 * Temporary test data for exercising the application flow on a live server.
 *
 * Assumes missions and their directors already exist — it only creates the
 * pieces needed to submit and review an application:
 *   · one TrainingProgram          (code TEST-BATCH)
 *   · one OPEN ApplicationWindow   (open now, closes in 30 days)
 *   · three TRAINEE applicants     (@seedtest.local)
 *
 * Everything it creates is marked so `remove-test-data.ts` can find and delete
 * it again — users by the @seedtest.local email domain, the program by its
 * code. Nothing pre-existing is modified.
 *
 * Run from the repo root:
 *   set -a; . packages/db/.env; set +a
 *   pnpm exec tsx scripts/seed-test-data.ts
 *
 * Optional: MISSION_CODE=XYZ to pick a specific mission (defaults to the first
 * mission that has a director assigned).
 */
import bcrypt from "bcrypt";
import { PrismaClient, UserRole, ApplicationWindowState, TrainingCategory } from "@prisma/client";

const prisma = new PrismaClient();

export const TEST_EMAIL_DOMAIN = "seedtest.local";
export const TEST_PROGRAM_CODE = "TEST-BATCH";

const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "TestApplicant123!";

const APPLICANTS = [
  { fullName: "Test Applicant One", email: `applicant1@${TEST_EMAIL_DOMAIN}` },
  { fullName: "Test Applicant Two", email: `applicant2@${TEST_EMAIL_DOMAIN}` },
  { fullName: "Test Applicant Three", email: `applicant3@${TEST_EMAIL_DOMAIN}` },
];

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  // ─── Mission (must already exist) ──────────────────────────────────────────
  const missionCode = process.env.MISSION_CODE;
  const mission = missionCode
    ? await prisma.localMission.findFirst({ where: { code: missionCode as never, deletedAt: null } })
    : await prisma.localMission.findFirst({
        where: { deletedAt: null, directorId: { not: null } },
        orderBy: { createdAt: "asc" },
      });

  if (!mission) {
    throw new Error(
      missionCode
        ? `No mission found with code ${missionCode}.`
        : "No mission with a director assigned was found. Create one first, or pass MISSION_CODE.",
    );
  }
  if (!mission.directorId) {
    throw new Error(
      `Mission ${mission.code} has no director assigned — the LMD review step needs one.`,
    );
  }

  // ─── Creator for the window (any system admin) ─────────────────────────────
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.SYSTEM_ADMIN, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) throw new Error("No SYSTEM_ADMIN user found to own the application window.");

  console.log(`Mission:  ${mission.name} (${mission.code})`);
  console.log(`Created by: ${admin.email}\n`);

  // ─── Program ───────────────────────────────────────────────────────────────
  const program = await prisma.trainingProgram.upsert({
    where: { code: TEST_PROGRAM_CODE },
    update: {},
    create: {
      code: TEST_PROGRAM_CODE,
      title: "TEST — Missionary Training Batch",
      category: TrainingCategory.SPIRITUAL,
      summary: "Temporary program for testing the application pipeline. Safe to delete.",
      startDate: daysFromNow(45),
      endDate: daysFromNow(75),
      location: "Test Campus",
      targetIntake: 20,
      isPublished: true,
    },
  });
  console.log(`✓ Program   ${program.code} — ${program.title}`);

  // ─── Open application window ───────────────────────────────────────────────
  const existingWindow = await prisma.applicationWindow.findFirst({
    where: { programId: program.id, deletedAt: null },
  });

  const windowData = {
    programId: program.id,
    state: ApplicationWindowState.OPEN,
    advertisingStartDate: daysFromNow(-7),
    applicationOpenDate: daysFromNow(-1),
    applicationCloseDate: daysFromNow(30),
    trainingStartDate: daysFromNow(45),
    targetIntake: 20,
    notes: "Temporary test window — safe to delete.",
    createdById: admin.id,
  };

  const window = existingWindow
    ? await prisma.applicationWindow.update({ where: { id: existingWindow.id }, data: windowData })
    : await prisma.applicationWindow.create({ data: windowData });

  console.log(
    `✓ Window    OPEN, closes ${window.applicationCloseDate.toISOString().slice(0, 10)}`,
  );

  // ─── Applicants ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  for (const a of APPLICANTS) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { passwordHash, isActive: true, homeMissionId: mission.id, role: UserRole.TRAINEE },
      create: {
        email: a.email,
        fullName: a.fullName,
        passwordHash,
        role: UserRole.TRAINEE,
        isActive: true,
        emailVerified: new Date(),
        homeMissionId: mission.id,
      },
    });
    console.log(`✓ Applicant ${user.email}`);
  }

  console.log(`\nAll test accounts use the password: ${TEST_PASSWORD}`);
  console.log(`Remove everything again with: pnpm exec tsx scripts/remove-test-data.ts`);
}

main()
  .catch((e) => {
    console.error(`\n✗ ${e.message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
