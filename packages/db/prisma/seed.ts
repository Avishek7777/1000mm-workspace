/**
 * Prisma Seed Script — 1000MM Training Platform
 *
 * Run from repository root:
 *   pnpm --filter @1000mm/db db:seed
 *
 * Creates deterministic test data for every feature of the portal:
 *   - 4 Local Missions (EBM / NBM / SBM / WBM) with LMDs assigned
 *   - 1 SA · 1 UD · 4 LMDs · 2 Trainers · 6 Trainees (2 missionaries)
 *   - 5 programs with windows covering every state
 *   - Applications across all workflow statuses
 *   - ENROLLED trainees with deployment locations
 *   - Field reports with full metric data (multi-year)
 *   - LMD report windows (OPEN + 3 CLOSED) with submitted reports
 *   - Salary ranges, assignments, requests (pending / approved / rejected)
 *   - Financial entries (income / expense / deposit / transfer) per mission
 *   - Urgent reports with missionary submissions
 *   - Trainer applications (pending / approved / rejected)
 *   - Notifications, complaints, announcements, system settings
 */
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcrypt";
import {
  PrismaClient,
  UserRole,
  Gender,
  MaritalStatus,
  ApplicationStatus,
  ApplicationWindowState,
  TrainingCategory,
  DocumentKind,
  ComplaintCategory,
  DonationStatus,
  PaymentGateway,
  NotificationChannel,
  Denomination,
  FinancialEntryType,
} from "@prisma/client";

const LocalMissionCode = { EBM: "EBM", NBM: "NBM", SBM: "SBM", WBM: "WBM" } as const;
type LocalMissionCode = typeof LocalMissionCode[keyof typeof LocalMissionCode];

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomPhone() {
  return `01${randomInt(11, 99)}${randomInt(100000, 999999)}`;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const DISTRICTS = ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barisal", "Rangpur", "Mymensingh"];
const CHURCHES = ["Dhaka SDA Church", "Chittagong Central Church", "Sylhet Mission Church", "Rajshahi SDA Church", "Khulna SDA Church"];
const BLOOD_TYPES = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"] as const;
const DEPLOYMENT_LOCATIONS = [
  "Mirpur, Dhaka", "Uttara, Dhaka", "Khulshi, Chittagong",
  "Sylhet Sadar", "Rajshahi City", "Khulna Sadar", "Bogura", "Mymensingh Sadar",
];

// ─── Missions ─────────────────────────────────────────────────────────────────

async function seedLocalMissions() {
  const missions = [
    { code: LocalMissionCode.EBM, name: "East Bangladesh Mission",  nameBangla: "পূর্ব বাংলাদেশ মিশন",   description: "Serving the eastern divisions of Bangladesh." },
    { code: LocalMissionCode.NBM, name: "North Bangladesh Mission", nameBangla: "উত্তর বাংলাদেশ মিশন",  description: "Serving the northern divisions of Bangladesh." },
    { code: LocalMissionCode.SBM, name: "South Bangladesh Mission", nameBangla: "দক্ষিণ বাংলাদেশ মিশন", description: "Serving the southern divisions of Bangladesh." },
    { code: LocalMissionCode.WBM, name: "West Bangladesh Mission",  nameBangla: "পশ্চিম বাংলাদেশ মিশন", description: "Serving the western divisions of Bangladesh." },
  ];
  const created = {} as Record<LocalMissionCode, { id: string }>;
  for (const m of missions) {
    const record = await prisma.localMission.upsert({ where: { code: m.code }, update: m, create: m });
    created[m.code] = record;
  }
  console.log("✓ Local missions seeded");
  return created;
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function seedUsers(missions: Record<LocalMissionCode, { id: string }>) {
  const pw = {
    admin:    await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD    ?? "Admin!2026",    BCRYPT_ROUNDS),
    director: await bcrypt.hash(process.env.SEED_DIRECTOR_PASSWORD ?? "Director!2026", BCRYPT_ROUNDS),
    lmd:      await bcrypt.hash("Lmd!2026",     BCRYPT_ROUNDS),
    trainer:  await bcrypt.hash("Trainer!2026", BCRYPT_ROUNDS),
    trainee:  await bcrypt.hash("Trainee!2026", BCRYPT_ROUNDS),
  };

  const admin = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@1000mm.local" },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@1000mm.local",
      passwordHash: pw.admin,
      fullName: "System Administrator",
      role: UserRole.SYSTEM_ADMIN,
      homeMissionId: missions.EBM.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const director = await prisma.user.upsert({
    where: { email: process.env.SEED_DIRECTOR_EMAIL ?? "director@1000mm.local" },
    update: {},
    create: {
      email: process.env.SEED_DIRECTOR_EMAIL ?? "director@1000mm.local",
      passwordHash: pw.director,
      fullName: "Union Director",
      role: UserRole.MAIN_DIRECTOR,
      homeMissionId: missions.EBM.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // One LMD per mission, assigned as directorId
  const missionCodes: LocalMissionCode[] = [LocalMissionCode.EBM, LocalMissionCode.NBM, LocalMissionCode.SBM, LocalMissionCode.WBM];
  const lmdNames: Record<LocalMissionCode, string> = {
    EBM: "Ratan Das",
    NBM: "Sukumar Roy",
    SBM: "Monoj Paul",
    WBM: "Bijon Biswas",
  };
  const lmds = await Promise.all(
    missionCodes.map(async (code) => {
      const email = `lmd.${code.toLowerCase()}@1000mm.local`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: pw.lmd,
          fullName: lmdNames[code],
          role: UserRole.LOCAL_DIRECTOR,
          homeMissionId: missions[code].id,
          emailVerified: new Date(),
          isActive: true,
        },
      });
      await prisma.localMission.update({ where: { id: missions[code].id }, data: { directorId: user.id } });
      return { user, missionCode: code };
    }),
  );

  const trainerData = [
    { email: "trainer1@1000mm.local", name: "Sabin Trainer", missionId: missions.NBM.id },
    { email: "trainer2@1000mm.local", name: "Nushrat Trainer", missionId: missions.WBM.id },
  ];
  const trainers = await Promise.all(
    trainerData.map((t) =>
      prisma.user.upsert({
        where: { email: t.email },
        update: {},
        create: {
          email: t.email,
          passwordHash: pw.trainer,
          fullName: t.name,
          role: UserRole.TRAINER,
          homeMissionId: t.missionId,
          emailVerified: new Date(),
          isActive: true,
        },
      }),
    ),
  );

  // 6 trainees: 4 regular + 2 missionaries (isMissionary: true)
  const traineeData = [
    { email: "trainee1@1000mm.local", name: "Raju Das",    missionId: missions.EBM.id, isMissionary: false, gender: Gender.MALE   },
    { email: "trainee2@1000mm.local", name: "Mina Roy",    missionId: missions.NBM.id, isMissionary: false, gender: Gender.FEMALE },
    { email: "trainee3@1000mm.local", name: "Hasan Ahmed", missionId: missions.SBM.id, isMissionary: false, gender: Gender.MALE   },
    { email: "trainee4@1000mm.local", name: "Tania Sarkar", missionId: missions.WBM.id, isMissionary: false, gender: Gender.FEMALE },
    { email: "missionary1@1000mm.local", name: "Sabbir Paul",  missionId: missions.EBM.id, isMissionary: true,  gender: Gender.MALE   },
    { email: "missionary2@1000mm.local", name: "Lipi Mondal", missionId: missions.NBM.id, isMissionary: true,  gender: Gender.FEMALE },
  ];
  const trainees = await Promise.all(
    traineeData.map((t) =>
      prisma.user.upsert({
        where: { email: t.email },
        update: {},
        create: {
          email: t.email,
          passwordHash: pw.trainee,
          fullName: t.name,
          role: UserRole.TRAINEE,
          homeMissionId: t.missionId,
          emailVerified: new Date(),
          isActive: true,
          isMissionary: t.isMissionary,
        },
      }),
    ),
  );

  console.log("✓ Users seeded");
  return { admin, director, lmds, trainers, trainees };
}

// ─── Programs ─────────────────────────────────────────────────────────────────

async function seedPrograms(adminId: string) {
  const programs = [
    {
      code: "1000MM-2024",
      title: "1000MM Missionary Training Program 2024",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৪",
      category: TrainingCategory.SPIRITUAL,
      summary: "Archived 2024 cycle.",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2024-12-31"),
      location: "Sylhet",
      targetIntake: 80,
      isPublished: false,
      windowState: ApplicationWindowState.ARCHIVED,
      windowDates: {
        advertisingStartDate: new Date("2024-01-01"),
        applicationOpenDate: new Date("2024-01-01"),
        applicationCloseDate: new Date("2024-05-31"),
        trainingStartDate: new Date("2024-07-01"),
      },
    },
    {
      code: "1000MM-2025",
      title: "1000MM Missionary Training Program 2025",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৫",
      category: TrainingCategory.SPIRITUAL,
      summary: "Closed 2025 cycle.",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-12-31"),
      location: "Dhaka",
      targetIntake: 70,
      isPublished: false,
      windowState: ApplicationWindowState.CLOSED,
      windowDates: {
        advertisingStartDate: new Date("2025-01-15"),
        applicationOpenDate: new Date("2025-01-15"),
        applicationCloseDate: new Date("2025-05-31"),
        trainingStartDate: new Date("2025-07-01"),
      },
    },
    {
      code: "1000MM-2026",
      title: "1000MM Missionary Training Program 2026",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৬",
      category: TrainingCategory.SPIRITUAL,
      summary: "Active 2026 main program — window is OPEN.",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-12-31"),
      location: "Dhaka",
      targetIntake: 90,
      isPublished: true,
      windowState: ApplicationWindowState.OPEN,
      windowDates: {
        advertisingStartDate: new Date("2026-01-01"),
        applicationOpenDate: new Date("2026-01-01"),
        applicationCloseDate: new Date("2026-12-31"),
        trainingStartDate: new Date("2026-07-01"),
      },
    },
    {
      code: "1000MM-2026-L",
      title: "1000MM Leadership Development Program 2026",
      titleBangla: "১০০০এমএম নেতৃত্ব উন্নয়ন কার্যক্রম ২০২৬",
      category: TrainingCategory.MENTAL,
      summary: "Leadership track — window OPEN.",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-11-30"),
      location: "Chittagong",
      targetIntake: 40,
      isPublished: true,
      windowState: ApplicationWindowState.OPEN,
      windowDates: {
        advertisingStartDate: new Date("2026-03-01"),
        applicationOpenDate: new Date("2026-03-01"),
        applicationCloseDate: new Date("2026-07-31"),
        trainingStartDate: new Date("2026-08-01"),
      },
    },
    {
      code: "1000MM-2027",
      title: "1000MM Missionary Training Program 2027",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৭",
      category: TrainingCategory.SPIRITUAL,
      summary: "Draft 2027 cycle — not yet open.",
      startDate: new Date("2027-07-01"),
      endDate: new Date("2027-12-31"),
      location: "Gazipur",
      targetIntake: 120,
      isPublished: false,
      windowState: ApplicationWindowState.DRAFT,
      windowDates: {
        advertisingStartDate: new Date("2027-01-01"),
        applicationOpenDate: new Date("2027-01-01"),
        applicationCloseDate: new Date("2027-12-31"),
        trainingStartDate: new Date("2027-07-01"),
      },
    },
  ];

  const created = {} as Record<string, { program: { id: string; code: string }; window: { id: string; state: ApplicationWindowState } }>;

  for (const p of programs) {
    const prog = await prisma.trainingProgram.upsert({
      where: { code: p.code },
      update: { title: p.title, titleBangla: p.titleBangla, category: p.category, summary: p.summary, startDate: p.startDate, endDate: p.endDate, location: p.location, targetIntake: p.targetIntake, isPublished: p.isPublished },
      create:  { code: p.code, title: p.title, titleBangla: p.titleBangla, category: p.category, summary: p.summary, startDate: p.startDate, endDate: p.endDate, location: p.location, targetIntake: p.targetIntake, isPublished: p.isPublished },
    });

    const existingWin = await prisma.applicationWindow.findFirst({ where: { programId: prog.id, deletedAt: null } });
    const win = existingWin
      ? await prisma.applicationWindow.update({
          where: { id: existingWin.id },
          data: { state: p.windowState, ...p.windowDates, targetIntake: p.targetIntake, notes: `${p.code} window`, createdById: adminId },
        })
      : await prisma.applicationWindow.create({
          data: { programId: prog.id, scopedToMissionId: null, state: p.windowState, ...p.windowDates, targetIntake: p.targetIntake, notes: `${p.code} window`, createdById: adminId },
        });

    created[p.code] = { program: prog, window: win };
  }

  console.log("✓ Programs and windows seeded");
  return created;
}

// ─── Applications + Enrollments ───────────────────────────────────────────────

function buildApplicantData(user: { id: string; fullName: string; email: string; homeMissionId: string }) {
  const female = user.fullName.match(/mina|tania|lipi/i);
  const age = randomInt(19, 34);
  const dob = new Date(); dob.setFullYear(dob.getFullYear() - age);
  return {
    applicantFullName: user.fullName,
    applicantFullNameBangla: null,
    applicantDateOfBirth: dob,
    applicantAge: age,
    applicantGender: female ? Gender.FEMALE : Gender.MALE,
    applicantBloodType: randomItem(BLOOD_TYPES) as any,
    applicantMaritalStatus: randomItem([MaritalStatus.SINGLE, MaritalStatus.MARRIED]),
    applicantDenomination: randomItem([Denomination.SEVENTH_DAY_ADVENTIST, Denomination.BAPTIST, Denomination.METHODIST]),
    applicantMobileNo: randomPhone(),
    applicantEmail: user.email,
    applicantPlaceOfBirth: randomItem(DISTRICTS),
    applicantChurchName: randomItem(CHURCHES),
    applicantWorkplace: "Local church ministry",
    presentAddressDistrict: randomItem(DISTRICTS),
    presentAddressUpazila: "Central",
    presentAddressPostOffice: "Main Post Office",
    presentAddressVillage: "Local Village",
    permanentAddressDistrict: randomItem(DISTRICTS),
    permanentAddressUpazila: "Central",
    permanentAddressPostOffice: "Main Post Office",
    permanentAddressVillage: "Home Village",
    permanentSameAsPresent: false,
    familyMobileNo: randomPhone(),
    familyEmail: `family.${user.email}`,
    formData: { motivation: "I want to serve my community.", education: "High school completed" },
  };
}

async function seedApplications(
  trainees: Array<{ id: string; fullName: string; email: string; homeMissionId: string }>,
  programs: Record<string, { program: { id: string; code: string }; window: { id: string; state: ApplicationWindowState } }>,
  adminId: string,
) {
  // Deterministic status per trainee+program pair for predictable test data
  const statusGrid: Record<string, ApplicationStatus[]> = {
    "trainee1@1000mm.local":     [ApplicationStatus.ACCEPTED,                    ApplicationStatus.RECOMMENDED,              ApplicationStatus.UNDER_LMD_REVIEW],
    "trainee2@1000mm.local":     [ApplicationStatus.UNDER_MAIN_DIRECTOR_REVIEW,  ApplicationStatus.ACCEPTED,                 ApplicationStatus.SUBMITTED],
    "trainee3@1000mm.local":     [ApplicationStatus.REJECTED,                    ApplicationStatus.RETURNED_TO_APPLICANT,    ApplicationStatus.ACCEPTED],
    "trainee4@1000mm.local":     [ApplicationStatus.WITHDRAWN,                   ApplicationStatus.SUBMITTED,                ApplicationStatus.UNDER_LMD_REVIEW],
    "missionary1@1000mm.local":  [ApplicationStatus.ACCEPTED,                    ApplicationStatus.ACCEPTED,                 ApplicationStatus.SUBMITTED],
    "missionary2@1000mm.local":  [ApplicationStatus.ACCEPTED,                    ApplicationStatus.UNDER_LMD_REVIEW,         ApplicationStatus.RECOMMENDED],
  };

  const programCodes = ["1000MM-2026", "1000MM-2026-L", "1000MM-2025"];
  const createdApplications: Array<{ id: string; applicantId: string; programId: string; missionId: string; status: ApplicationStatus }> = [];

  for (const trainee of trainees) {
    const statuses = statusGrid[trainee.email] ?? [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_LMD_REVIEW, ApplicationStatus.RECOMMENDED];
    for (let i = 0; i < programCodes.length; i++) {
      const programCode = programCodes[i];
      const program = programs[programCode];
      if (!program) continue;
      const status = statuses[i];
      const referenceNumber = `${program.program.code}-${trainee.email.split("@")[0].toUpperCase()}`;
      const submittedAt = randomDate(new Date("2026-01-01"), new Date("2026-06-01"));
      const applicantData = buildApplicantData(trainee);

      const application = await prisma.application.upsert({
        where: { referenceNumber },
        update: { status, submittedAt, lastTransitionAt: submittedAt, ...applicantData },
        create: { referenceNumber, applicantId: trainee.id, windowId: program.window.id, submittedFromMissionId: trainee.homeMissionId, status, submittedAt, lastTransitionAt: submittedAt, ...applicantData, profilePhotoDocumentId: null },
      });

      // Upsert status history
      const historyExists = await prisma.applicationStatusHistory.findFirst({ where: { applicationId: application.id } });
      if (!historyExists) {
        await prisma.applicationStatusHistory.create({
          data: { applicationId: application.id, fromStatus: ApplicationStatus.DRAFT, toStatus: status, triggeredById: trainee.id, comment: `Seeded: ${status}` },
        });
      }

      // Create ProgramEnrollment for ACCEPTED applications with a deployment location
      if (status === ApplicationStatus.ACCEPTED) {
        const deployment = randomItem(DEPLOYMENT_LOCATIONS);
        const enrollment = await prisma.programEnrollment.upsert({
          where: { applicationId: application.id },
          update: { deploymentLocation: deployment, deploymentAssignedAt: new Date(), deploymentAssignedById: adminId },
          create: {
            programId: program.program.id,
            traineeId: trainee.id,
            applicationId: application.id,
            attendanceConfirmed: true,
            deploymentLocation: deployment,
            deploymentAssignedAt: new Date(),
            deploymentAssignedById: adminId,
          },
        });
        createdApplications.push({ id: application.id, applicantId: trainee.id, programId: program.program.id, missionId: trainee.homeMissionId, status });
      } else {
        createdApplications.push({ id: application.id, applicantId: trainee.id, programId: program.program.id, missionId: trainee.homeMissionId, status });
      }
    }
  }

  console.log(`✓ Seeded ${createdApplications.length} applications`);
  return createdApplications;
}

// ─── Field Reports ────────────────────────────────────────────────────────────

async function seedFieldReports(
  applications: Array<{ id: string; applicantId: string; programId: string; missionId: string; status: ApplicationStatus }>,
) {
  const accepted = applications.filter((a) => a.status === ApplicationStatus.ACCEPTED);

  // Seed 3 months of reports per accepted trainee (covering 2025 + 2026 for year filter testing)
  const reportMonths = [
    { month: 10, year: 2025 },
    { month: 11, year: 2025 },
    { month: 4,  year: 2026 },
    { month: 5,  year: 2026 },
    { month: 6,  year: 2026 },
  ];

  let count = 0;
  for (const app of accepted) {
    // Use only the first 3 months to avoid duplicates from multiple programs
    const months = reportMonths.slice(0, 3);
    for (const { month, year } of months) {
      const baptisms = randomInt(0, 8);
      const daysOfWork = randomInt(10, 26);
      await prisma.fieldReport.upsert({
        where: { traineeId_reportMonth_reportYear: { traineeId: app.applicantId, reportMonth: month, reportYear: year } },
        update: {},
        create: {
          traineeId: app.applicantId,
          applicationId: app.id,
          programId: app.programId,
          reportMonth: month,
          reportYear: year,
          totalActivities: randomInt(20, 60),
          daysOfWork,
          hoursOfWork: daysOfWork * randomInt(4, 8),
          nonSdaHomeVisits: randomInt(5, 20),
          bibleStudiesConducted: randomInt(3, 15),
          medicalVisits: randomInt(0, 5),
          worshipSessionsTaken: randomInt(2, 10),
          newGroupsMade: randomInt(0, 3),
          baptismCandidatesPrepared: baptisms + randomInt(0, 3),
          numberOfBaptisms: baptisms,
          peopleReached: randomInt(30, 120),
          activitiesSummary: "Visited local families, conducted Bible studies, and assisted with community health outreach.",
          trainingReceived: "Weekly online discipleship sessions with program coordinator.",
          challengesFaced: "Weather conditions and transport difficulties in rural areas.",
          prayerRequests: "Continued health, spiritual strength, and provision for travel.",
          workplaceSnapshot: randomItem(DEPLOYMENT_LOCATIONS),
        },
      });
      count++;
    }
  }

  console.log(`✓ Seeded ${count} field reports`);
}

// ─── LMD Reports ─────────────────────────────────────────────────────────────

async function seedLmdReports(
  lmds: Array<{ user: { id: string }; missionCode: LocalMissionCode }>,
  missions: Record<LocalMissionCode, { id: string }>,
  adminId: string,
) {
  const windows = [
    { month: 3,  year: 2026, state: "CLOSED" as const },
    { month: 4,  year: 2026, state: "CLOSED" as const },
    { month: 5,  year: 2026, state: "CLOSED" as const },
    { month: 6,  year: 2026, state: "OPEN"   as const },
  ];

  for (const w of windows) {
    const win = await prisma.lmdReportWindow.upsert({
      where: { reportMonth_reportYear: { reportMonth: w.month, reportYear: w.year } },
      update: { state: w.state },
      create: { reportMonth: w.month, reportYear: w.year, state: w.state, createdById: adminId, notes: `${w.year} month ${w.month} window` },
    });

    // All LMDs submit for CLOSED windows; only EBM + NBM submit for the OPEN one
    const submitters = w.state === "CLOSED" ? lmds : lmds.slice(0, 2);
    for (const lmd of submitters) {
      const mId = missions[lmd.missionCode].id;
      const exists = await prisma.lmdReport.findFirst({ where: { windowId: win.id, lmdId: lmd.user.id } });
      if (!exists) {
        await prisma.lmdReport.create({
          data: {
            windowId: win.id,
            lmdId: lmd.user.id,
            missionId: mId,
            reportMonth: w.month,
            reportYear: w.year,
            totalTrainees: randomInt(8, 20),
            totalActivities: randomInt(50, 150),
            totalDaysOfWork: randomInt(80, 180),
            totalHoursOfWork: randomInt(300, 700),
            totalNonSdaHomeVisits: randomInt(20, 60),
            totalBibleStudies: randomInt(15, 50),
            totalMedicalVisits: randomInt(0, 15),
            totalWorshipSessions: randomInt(10, 40),
            totalNewGroups: randomInt(0, 5),
            totalBaptismCandidates: randomInt(2, 12),
            totalBaptisms: randomInt(0, 8),
            totalPeopleReached: randomInt(80, 300),
            overallSummary: `${lmd.missionCode} monthly report for ${w.year}-${w.month}. Trainees active across all districts.`,
            challengesAndNeeds: "Travel costs remain high. Additional training resources needed.",
            recommendationsToDirector: "Request for quarterly regional gathering to strengthen fellowship.",
          },
        });
      }
    }
  }

  console.log("✓ LMD report windows and reports seeded");
}

// ─── Salary ───────────────────────────────────────────────────────────────────

async function seedSalary(
  missions: Record<LocalMissionCode, { id: string }>,
  trainees: Array<{ id: string; email: string; homeMissionId: string; isMissionary?: boolean }>,
  adminId: string,
) {
  const cycle = 2026;

  // Salary ranges per mission
  const ranges: Array<[LocalMissionCode, number, number]> = [
    [LocalMissionCode.EBM, 4000, 8000],
    [LocalMissionCode.NBM, 3500, 7000],
    [LocalMissionCode.SBM, 4000, 7500],
    [LocalMissionCode.WBM, 3500, 7000],
  ];
  for (const [code, min, max] of ranges) {
    const mId = missions[code].id;
    await prisma.salaryRange.upsert({
      where: { missionId: mId },
      update: { minAmount: min, maxAmount: max, cycle },
      create: { missionId: mId, minAmount: min, maxAmount: max, cycle, createdById: adminId },
    });
  }

  // Salary assignments and requests for missionaries only
  const missionaries = trainees.filter((t) => (t as any).isMissionary);
  for (const missionary of missionaries) {
    const amount = randomInt(4500, 7000);
    await prisma.salaryAssignment.upsert({
      where: { missionaryId_cycle: { missionaryId: missionary.id, cycle } },
      update: {},
      create: { missionaryId: missionary.id, missionId: missionary.homeMissionId, amount, cycle, assignedById: adminId },
    });

    // 3 months of salary requests: approved, pending, pending
    const requestData = [
      { month: 3, year: 2026, status: "APPROVED" as const, reviewedById: adminId, reviewedAt: new Date("2026-04-05"), notes: "Approved for March." },
      { month: 4, year: 2026, status: "APPROVED" as const, reviewedById: adminId, reviewedAt: new Date("2026-05-03"), notes: "Approved for April." },
      { month: 5, year: 2026, status: "PENDING"  as const, reviewedById: null,    reviewedAt: null, notes: null },
    ];
    for (const req of requestData) {
      try {
        await prisma.salaryRequest.upsert({
          where: { missionaryId_month_year: { missionaryId: missionary.id, month: req.month, year: req.year } },
          update: {},
          create: {
            missionaryId: missionary.id,
            missionId: missionary.homeMissionId,
            amount,
            month: req.month,
            year: req.year,
            status: req.status,
            reviewedById: req.reviewedById,
            reviewedAt: req.reviewedAt,
            notes: req.notes,
          },
        });
      } catch {}
    }
  }

  console.log("✓ Salary ranges, assignments, and requests seeded");
}

// ─── Financial Entries ────────────────────────────────────────────────────────

async function seedFinancial(
  missions: Record<LocalMissionCode, { id: string }>,
  adminId: string,
) {
  type EntrySpec = { type: FinancialEntryType; amount: number; description: string; date: Date; reference?: string };

  const entriesPerMission: Record<LocalMissionCode, EntrySpec[]> = {
    EBM: [
      { type: FinancialEntryType.INCOME,             amount: 85000,  description: "Union quarterly grant",          date: new Date("2026-01-10"), reference: "UNI-Q1-2026" },
      { type: FinancialEntryType.DEPOSIT,            amount: 15000,  description: "Local church offering",          date: new Date("2026-02-05") },
      { type: FinancialEntryType.EXPENSE,            amount: 12000,  description: "Office rent — January",          date: new Date("2026-01-31") },
      { type: FinancialEntryType.EXPENSE,            amount: 8500,   description: "Missionary stipends — January",  date: new Date("2026-01-28") },
      { type: FinancialEntryType.TRANSFER_TO_MISSION,amount: 5000,   description: "Transfer to EBM district fund",  date: new Date("2026-03-01") },
      { type: FinancialEntryType.INCOME,             amount: 90000,  description: "Union quarterly grant — Q2",     date: new Date("2026-04-10"), reference: "UNI-Q2-2026" },
      { type: FinancialEntryType.EXPENSE,            amount: 9200,   description: "Missionary stipends — April",    date: new Date("2026-04-28") },
    ],
    NBM: [
      { type: FinancialEntryType.INCOME,             amount: 72000,  description: "Union quarterly grant",          date: new Date("2026-01-10"), reference: "UNI-Q1-2026" },
      { type: FinancialEntryType.DEPOSIT,            amount: 8000,   description: "Tithe contribution",             date: new Date("2026-02-14") },
      { type: FinancialEntryType.EXPENSE,            amount: 6500,   description: "Travel allowance — trainees",    date: new Date("2026-02-20") },
      { type: FinancialEntryType.EXPENSE,            amount: 11000,  description: "Office utilities Q1",            date: new Date("2026-03-30") },
      { type: FinancialEntryType.INCOME,             amount: 75000,  description: "Union quarterly grant — Q2",     date: new Date("2026-04-10") },
    ],
    SBM: [
      { type: FinancialEntryType.INCOME,             amount: 68000,  description: "Union quarterly grant",          date: new Date("2026-01-10") },
      { type: FinancialEntryType.EXPENSE,            amount: 14000,  description: "Training materials",             date: new Date("2026-01-25") },
      { type: FinancialEntryType.DEPOSIT,            amount: 12000,  description: "Special offering — Easter",      date: new Date("2026-04-05") },
      { type: FinancialEntryType.EXPENSE,            amount: 7800,   description: "Monthly stipends",               date: new Date("2026-04-28") },
      { type: FinancialEntryType.TRANSFER_TO_MISSION,amount: 10000,  description: "Transfer to SBM rural unit",     date: new Date("2026-05-01") },
    ],
    WBM: [
      { type: FinancialEntryType.INCOME,             amount: 71000,  description: "Union quarterly grant",          date: new Date("2026-01-10") },
      { type: FinancialEntryType.EXPENSE,            amount: 5500,   description: "Vehicle fuel — Jan/Feb",         date: new Date("2026-02-28") },
      { type: FinancialEntryType.DEPOSIT,            amount: 9000,   description: "Fundraising event",              date: new Date("2026-03-15") },
      { type: FinancialEntryType.EXPENSE,            amount: 18000,  description: "Annual retreat costs",           date: new Date("2026-03-22") },
      { type: FinancialEntryType.INCOME,             amount: 74000,  description: "Union quarterly grant — Q2",     date: new Date("2026-04-10") },
      { type: FinancialEntryType.EXPENSE,            amount: 8800,   description: "Missionary stipends — April",    date: new Date("2026-04-28") },
    ],
  };

  let count = 0;
  for (const [code, entries] of Object.entries(entriesPerMission) as [LocalMissionCode, EntrySpec[]][]) {
    const mId = missions[code].id;
    // Delete old seeded entries for idempotency
    await prisma.financialEntry.deleteMany({ where: { missionId: mId, createdById: adminId } });
    for (const e of entries) {
      await prisma.financialEntry.create({
        data: { type: e.type, amount: e.amount, date: e.date, description: e.description, missionId: mId, reference: e.reference, createdById: adminId },
      });
      count++;
    }
  }

  console.log(`✓ Seeded ${count} financial entries`);
}

// ─── Urgent Reports ───────────────────────────────────────────────────────────

async function seedUrgentReports(
  adminId: string,
  missionaries: Array<{ id: string }>,
) {
  const oldReports = await prisma.urgentReport.findMany({ where: { issuedById: adminId, title: { startsWith: "[SEED]" } }, select: { id: true } });
  if (oldReports.length) {
    await prisma.urgentReportSubmission.deleteMany({ where: { reportId: { in: oldReports.map((r) => r.id) } } });
    await prisma.urgentReport.deleteMany({ where: { id: { in: oldReports.map((r) => r.id) } } });
  }

  const report = await prisma.urgentReport.create({
    data: {
      title: "[SEED] Emergency Prayer Needed — Trainee Hospitalised",
      body: "Trainee Sabbir Paul has been hospitalised in Dhaka. Please lift him in prayer and check in with your local coordinator for updates.",
      issuedById: adminId,
      publishedAt: new Date("2026-05-15"),
    },
  });

  // All missionaries have submitted acknowledgement; some are still pending
  for (const missionary of missionaries) {
    try {
      await prisma.urgentReportSubmission.create({
        data: { reportId: report.id, userId: missionary.id, response: "Acknowledged. Praying for quick recovery.", submittedAt: new Date("2026-05-16") },
      });
    } catch {}
  }

  console.log("✓ Urgent reports seeded");
}

// ─── Trainer Applications ─────────────────────────────────────────────────────

async function seedTrainerApplications(adminId: string) {
  const apps = [
    { fullName: "Dr. Nathan Baroi",    email: "nathan.baroi@trainer.local",   phone: "01711111111", specialization: "Biblical Studies & Theology",      status: "PENDING"  as const, acceptsSelfFunding: true  },
    { fullName: "Sabrina Christodas",  email: "sabrina.christo@trainer.local",phone: "01722222222", specialization: "Community Health & Medical Outreach", status: "APPROVED" as const, acceptsSelfFunding: false },
    { fullName: "Ronald Hasda",        email: "ronald.hasda@trainer.local",   phone: "01733333333", specialization: "Music Ministry & Worship Leading",   status: "REJECTED" as const, acceptsSelfFunding: true  },
  ];

  for (const a of apps) {
    const exists = await prisma.trainerApplication.findFirst({ where: { email: a.email } });
    if (!exists) {
      const reviewed = a.status !== "PENDING";
      await prisma.trainerApplication.create({
        data: {
          fullName: a.fullName,
          email: a.email,
          phone: a.phone,
          fullAddress: "123 Mission Road, Dhaka",
          specialization: a.specialization,
          acceptsSelfFunding: a.acceptsSelfFunding,
          requestsInvitationLetter: !a.acceptsSelfFunding,
          status: a.status,
          reviewedAt: reviewed ? new Date("2026-05-20") : null,
          reviewNote: a.status === "REJECTED" ? "Insufficient experience in missionary context." : reviewed ? "Application reviewed and approved." : null,
          ...(reviewed ? { reviewedBy: { connect: { id: adminId } } } : {}),
        },
      });
    }
  }

  console.log("✓ Trainer applications seeded");
}

// ─── Notifications ────────────────────────────────────────────────────────────

async function seedNotifications(users: Array<{ id: string }>) {
  await prisma.notification.deleteMany({
    where: { userId: { in: users.map((u) => u.id) }, templateKey: "dashboard.notification" },
  });

  let count = 0;
  for (const user of users) {
    for (let i = 0; i < 3; i++) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          channel: NotificationChannel.IN_APP,
          templateKey: i === 0 ? "announcement.published" : "application.status_changed",
          templateData: i === 0 ? { title: "Welcome to the 2026 Training Platform" } : { status: "ACCEPTED" },
          sentAt: new Date(),
          readAt: i < 1 ? null : new Date(), // first notification is unread
          actionUrl: "/dashboard/notifications",
        },
      });
      count++;
    }
  }

  console.log(`✓ Seeded ${count} notifications`);
}

// ─── Complaints ───────────────────────────────────────────────────────────────

async function seedComplaints(users: Array<{ id: string; fullName: string }>) {
  const data = [
    { subject: "Unable to upload bio data documents",      resolved: false },
    { subject: "Application status stuck on LMD review",  resolved: true,  response: "Issue resolved — please try logging out and back in." },
    { subject: "Suggestion: add dark mode to dashboard",   resolved: false },
    { subject: "Field report form missing months",         resolved: true,  response: "Fixed in the latest deployment. Thank you." },
  ];
  for (const [i, u] of users.slice(0, 4).entries()) {
    await prisma.complaint.create({
      data: {
        category: ComplaintCategory.GENERAL_FEEDBACK,
        subject: data[i].subject,
        description: `Complaint from ${u.fullName}: ${data[i].subject}`,
        submittedById: u.id,
        missionCode: LocalMissionCode.EBM,
        isResolved: data[i].resolved,
        response: (data[i] as any).response ?? null,
      },
    });
  }
  console.log("✓ Complaints seeded");
}

// ─── Announcements ────────────────────────────────────────────────────────────

async function seedAnnouncements(adminId: string) {
  const items = [
    { title: "Welcome to the 1000MM Dashboard", body: "Seeded for local testing. See the Testing Guide in the vault for credentials.", publishedAt: new Date(), expiresAt: new Date(Date.now() + 60 * 86400 * 1000) },
    { title: "2026 Training Programs Now Open",  body: "The 1000MM-2026 Missionary and Leadership tracks are accepting applications.", publishedAt: new Date(Date.now() - 7 * 86400 * 1000), expiresAt: new Date(Date.now() + 30 * 86400 * 1000) },
    { title: "June LMD Report Window Open",      body: "LMDs must submit their June reports before the end of the month.", publishedAt: new Date(Date.now() - 2 * 86400 * 1000), expiresAt: new Date(Date.now() + 14 * 86400 * 1000) },
  ];
  await prisma.announcement.deleteMany({ where: { title: { in: items.map((a) => a.title) } } });
  for (const a of items) {
    await prisma.announcement.create({ data: { ...a, createdById: adminId } });
  }
  console.log("✓ Announcements seeded");
}

// ─── System Settings ──────────────────────────────────────────────────────────

async function seedSystemSettings() {
  const settings = [
    { key: "site.organization_name_en",               value: "1000 Missionary Movement Bangladesh",     description: "Organization display name (English)" },
    { key: "auth.session_timeout_minutes_staff",       value: 30,                                       description: "Inactivity timeout for staff sessions (minutes)" },
    { key: "auth.session_timeout_minutes_trainee",     value: 10080,                                    description: "Inactivity timeout for trainee sessions (minutes)" },
    { key: "donation.preset_amounts_bdt",              value: [500, 1000, 2500, 5000, 10000],           description: "Preset donation amounts for BDT donors" },
    { key: "application.form_current_version",         value: 1,                                        description: "Bio-data form schema version" },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({ where: { key: s.key }, update: { value: s.value as any, description: s.description }, create: { key: s.key, value: s.value as any, description: s.description } });
  }
  console.log("✓ System settings seeded");
}

// ─── Testimonies ─────────────────────────────────────────────────────────────

async function seedTestimonies() {
  await prisma.testimony.deleteMany({});

  const testimonies = [
    {
      name: "Samuel Das",
      location: "Dhaka",
      color: "from-green-400 to-emerald-600",
      order: 1,
      isPublished: true,
      quote: "Joining the 1000 Missionary Movement was the best decision of my life. I was a shy university student with no experience in public speaking. During my one year of service in rural Sylhet, I conducted children's programs and health seminars. God gave me courage I never had before. I saw 27 people give their hearts to Jesus. Now I am no longer afraid — I am a missionary for life.",
    },
    {
      name: "Rebecca Sarkar",
      location: "Barishal",
      color: "from-orange-400 to-red-500",
      order: 2,
      isPublished: true,
      quote: "Before joining 1000MM, I was struggling with my faith and purpose. The training in the Philippines and my mission assignment in northern Bangladesh completely changed me. I learned how to share the Gospel through health education. Many families who never heard about Jesus before opened their hearts. This one year gave me a new identity in Christ.",
    },
    {
      name: "Timothy Gomes",
      location: "Chattogram",
      color: "from-emerald-500 to-teal-600",
      order: 3,
      isPublished: true,
      quote: "I left my job to serve as a missionary for one year. It was not easy, but it was worth it. My team and I planted a new church in a village near Bandarban. We faced many challenges, but God performed miracles. Today that small group has grown to more than 45 members. I discovered that when we step out in faith, God steps in with power.",
    },
    {
      name: "Esther Akter",
      location: "Khulna",
      color: "from-amber-400 to-orange-500",
      order: 4,
      isPublished: true,
      quote: "As a young woman, I was nervous about going into mission work. But the 1000 Missionary Movement gave me confidence and purpose. I served in a remote area focusing on women and children's ministry. Seeing hopeless mothers find hope in Jesus was the most beautiful experience. I now understand that God can use anyone who is willing.",
    },
    {
      name: "Immanuel Paul",
      location: "Rajshahi",
      color: "from-green-500 to-lime-600",
      order: 5,
      isPublished: true,
      quote: "The 1000MM experience taught me the real meaning of sacrifice. I left my comfortable city life and lived in a simple village for 10 months. Through literature distribution and Bible studies, we baptized 18 precious souls. My own spiritual life grew deeper than ever. This movement is truly raising a new generation of committed youth for God.",
    },
    {
      name: "Hannah D'Costa",
      location: "Sylhet",
      color: "from-rose-400 to-orange-400",
      order: 6,
      isPublished: true,
      quote: "God called me during a youth camp, and I answered. Serving as a 1000 missionary in a different culture taught me humility and dependence on God. I worked with media and digital evangelism, reaching hundreds of young people online. Many told me they found Christ through the videos we created. I came back changed — on fire for mission!",
    },
    {
      name: "Joseph Mondal",
      location: "Mymensingh",
      color: "from-blue-400 to-indigo-600",
      order: 7,
      isPublished: false, // Draft — for testing publish/unpublish flow
      quote: "This testimony is a draft and should not appear on the public website until published. Use this entry to test the Unpublish → Publish flow in the SA testimonies admin.",
    },
  ];

  for (const t of testimonies) {
    await prisma.testimony.create({ data: t });
  }

  console.log(`✓ Seeded ${testimonies.length} testimonies (6 published, 1 draft)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Seeding 1000MM database...\n");

  const missions    = await seedLocalMissions();
  const users       = await seedUsers(missions);
  const programs    = await seedPrograms(users.admin.id);

  const allTrainees = users.trainees.map((t, i) => ({
    ...t,
    isMissionary: i >= 4, // last 2 are missionaries
  }));

  const applications = await seedApplications(allTrainees, programs, users.admin.id);
  await seedFieldReports(applications);
  await seedLmdReports(users.lmds, missions, users.admin.id);
  await seedSalary(missions, allTrainees, users.admin.id);
  await seedFinancial(missions, users.admin.id);

  const missionaries = allTrainees.filter((t) => t.isMissionary);
  await seedUrgentReports(users.admin.id, missionaries);
  await seedTrainerApplications(users.admin.id);

  const allUsers = [...users.trainees, ...users.trainers, ...users.lmds.map((l) => l.user), users.admin, users.director];
  await seedNotifications(allUsers);
  await seedComplaints(allUsers);
  await seedAnnouncements(users.admin.id);
  await seedSystemSettings();
  await seedTestimonies();
  await seedProjects();

  console.log("\n✅ Seed complete.\n");
  console.log("  SA:       admin@1000mm.local        / Admin!2026");
  console.log("  UD:       director@1000mm.local     / Director!2026");
  console.log("  LMD-EBM:  lmd.ebm@1000mm.local     / Lmd!2026");
  console.log("  Trainee:  trainee1@1000mm.local     / Trainee!2026");
  console.log("  Mission:  missionary1@1000mm.local  / Trainee!2026");
}

async function seedProjects() {
  const projects = [
    {
      slug: "training-center",
      status: "Active",
      title: "1000MM Bangladesh Training Center",
      subtitle: "A Legacy in the Making",
      description: "Groundbreaking held on December 10, 2025 at BASC Campus. Help complete a fully functioning missionary training center that will prepare generations of gospel workers for Bangladesh and beyond.",
      location: "BASC Campus, Bangladesh",
      date: "Dec 10, 2025 — Ongoing",
      images: ["/images/projects/training-center.jpg"],
      tags: ["Construction", "Training", "Mission"],
      order: 1,
    },
    {
      slug: "batch-29",
      status: "Active",
      title: "29th Batch Missionary Training Program 2026",
      subtitle: "29 Years of Faithful Mission",
      description: "An intensive four-week residential training program at BANC, Gazipur preparing 60–100 young missionaries in evangelism, health ministry, leadership, and digital outreach. Total budget: BDT 1,891,382 (≈ USD 15,503).",
      location: "BANC Campus, Gazipur, Bangladesh",
      date: "Oct 04–31, 2026",
      images: ["/images/projects/batch-29/batch-29-1.jpg"],
      tags: ["Training", "Evangelism", "Youth"],
      order: 2,
    },
    {
      slug: "bicycle-for-missionaries",
      status: "Active",
      title: "Wheels for Mission: Bicycles for Missionaries",
      subtitle: "Every Bicycle Carries the Gospel",
      description: "Providing 60 durable bicycles to missionaries serving rural villages, riverine regions, and remote communities — cutting travel time and cost so they can reach more people, strengthen churches, and disciple new believers. Total budget: ≈ USD 17,300.",
      location: "Rural & remote communities, Bangladesh",
      date: "2026 — Ongoing",
      images: ["/images/projects/bicycle-ministry/bicycle-ministry-1.jpg"],
      tags: ["Transportation", "Evangelism", "Sustainability"],
      order: 3,
    },
    {
      slug: "medical-kits",
      status: "Active",
      title: "Medical Kits for Missionaries",
      subtitle: "Healing Hands, Open Doors",
      description: "Equipping 60 missionaries with portable medical kit boxes — blood pressure monitors, glucometers, pulse oximeters, first-aid supplies and more — so they can meet physical needs, build trust, and open doors for the Gospel. Total budget: ≈ USD 16,275.",
      location: "Villages, slums, coastal & hill areas, Bangladesh",
      date: "2026 — Ongoing",
      images: ["/images/projects/medical-kits/medical-kits-1.jpg"],
      tags: ["Healthcare", "Compassion", "Evangelism"],
      order: 4,
    },
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: { ...p, isPublished: true },
      create: { ...p, isPublished: true },
    });
  }
  console.log("  Seeded 4 projects.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
