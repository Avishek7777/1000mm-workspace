/**
 * Prisma Seed Script — 1000MM Training Platform (Large Seed)
 *
 * Run from repository root:
 *   pnpm --filter @1000mm/db db:seed
 *
 * Covers every model:
 *   Users: all 7 roles (SA · UD · SEC · AD · 4 LMDs · 4 Trainers · 20 Trainees/8 missionaries)
 *   Programs, Topics, Assignments, Submissions, Resources
 *   Applications (all statuses), Enrollments, AttendanceScans
 *   FieldReports + Comments, Recommendations
 *   LmdReportWindows + LmdReports
 *   Salary ranges / assignments / requests
 *   Financial entries, MissionaryDeployments
 *   UrgentReports + Submissions, TrainerApplications
 *   Donations, ContactMessages, UserFlagRequests
 *   Notifications, Complaints, Announcements
 *   Testimonies, Projects, SystemSettings
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
  ComplaintCategory,
  DonationStatus,
  PaymentGateway,
  NotificationChannel,
  Denomination,
  FinancialEntryType,
  DeploymentStatus,
  FlagRequestStatus,
} from "@prisma/client";

const LocalMissionCode = { EBM: "EBM", NBM: "NBM", SBM: "SBM", WBM: "WBM" } as const;
type LocalMissionCode = (typeof LocalMissionCode)[keyof typeof LocalMissionCode];

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
  "Narsingdi", "Comilla Sadar", "Rangpur City", "Barisal Sadar",
];

// ─── Trainee Roster (20 trainees, 8 missionaries — 2 per mission) ─────────────

interface TraineeSpec {
  email: string;
  name: string;
  missionCode: LocalMissionCode;
  isMissionary: boolean;
  gender: Gender;
}

const TRAINEE_SPECS: TraineeSpec[] = [
  // EBM
  { email: "trainee.ebm1@1000mm.local",    name: "Raju Das",      missionCode: "EBM", isMissionary: false, gender: Gender.MALE   },
  { email: "trainee.ebm2@1000mm.local",    name: "Shefali Roy",   missionCode: "EBM", isMissionary: false, gender: Gender.FEMALE },
  { email: "trainee.ebm3@1000mm.local",    name: "Puja Das",      missionCode: "EBM", isMissionary: false, gender: Gender.FEMALE },
  { email: "missionary.ebm1@1000mm.local", name: "Sabbir Paul",   missionCode: "EBM", isMissionary: true,  gender: Gender.MALE   },
  { email: "missionary.ebm2@1000mm.local", name: "Rachel Biswas", missionCode: "EBM", isMissionary: true,  gender: Gender.FEMALE },
  // NBM
  { email: "trainee.nbm1@1000mm.local",    name: "Kiran Ghosh",   missionCode: "NBM", isMissionary: false, gender: Gender.MALE   },
  { email: "trainee.nbm2@1000mm.local",    name: "Mina Roy",      missionCode: "NBM", isMissionary: false, gender: Gender.FEMALE },
  { email: "trainee.nbm3@1000mm.local",    name: "Sunita Das",    missionCode: "NBM", isMissionary: false, gender: Gender.FEMALE },
  { email: "missionary.nbm1@1000mm.local", name: "Lipi Mondal",   missionCode: "NBM", isMissionary: true,  gender: Gender.FEMALE },
  { email: "missionary.nbm2@1000mm.local", name: "David Sarkar",  missionCode: "NBM", isMissionary: true,  gender: Gender.MALE   },
  // SBM
  { email: "trainee.sbm1@1000mm.local",    name: "Hasan Ahmed",   missionCode: "SBM", isMissionary: false, gender: Gender.MALE   },
  { email: "trainee.sbm2@1000mm.local",    name: "Bipasha Paul",  missionCode: "SBM", isMissionary: false, gender: Gender.FEMALE },
  { email: "trainee.sbm3@1000mm.local",    name: "Joykumar Das",  missionCode: "SBM", isMissionary: false, gender: Gender.MALE   },
  { email: "missionary.sbm1@1000mm.local", name: "Nathan Gomes",  missionCode: "SBM", isMissionary: true,  gender: Gender.MALE   },
  { email: "missionary.sbm2@1000mm.local", name: "Priya Barman",  missionCode: "SBM", isMissionary: true,  gender: Gender.FEMALE },
  // WBM
  { email: "trainee.wbm1@1000mm.local",    name: "Tania Sarkar",  missionCode: "WBM", isMissionary: false, gender: Gender.FEMALE },
  { email: "trainee.wbm2@1000mm.local",    name: "Robin Mondal",  missionCode: "WBM", isMissionary: false, gender: Gender.MALE   },
  { email: "trainee.wbm3@1000mm.local",    name: "James Baroi",   missionCode: "WBM", isMissionary: false, gender: Gender.MALE   },
  { email: "missionary.wbm1@1000mm.local", name: "Suzan Sarkar",  missionCode: "WBM", isMissionary: true,  gender: Gender.FEMALE },
  { email: "missionary.wbm2@1000mm.local", name: "Nita Roy",      missionCode: "WBM", isMissionary: true,  gender: Gender.FEMALE },
];

// ─── Local Missions ───────────────────────────────────────────────────────────

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
    admin:    await bcrypt.hash("Admin!2026",    BCRYPT_ROUNDS),
    director: await bcrypt.hash("Director!2026", BCRYPT_ROUNDS),
    staff:    await bcrypt.hash("Staff!2026",   BCRYPT_ROUNDS),
    lmd:      await bcrypt.hash("Lmd!2026",     BCRYPT_ROUNDS),
    trainer:  await bcrypt.hash("Trainer!2026", BCRYPT_ROUNDS),
    trainee:  await bcrypt.hash("Trainee!2026", BCRYPT_ROUNDS),
  };

  const admin = await prisma.user.upsert({
    where: { email: "admin@1000mm.local" },
    update: { passwordHash: pw.admin, isActive: true, emailVerified: new Date() },
    create: { email: "admin@1000mm.local", passwordHash: pw.admin, fullName: "System Administrator", role: UserRole.SYSTEM_ADMIN, homeMissionId: missions.EBM.id, emailVerified: new Date(), isActive: true },
  });

  const director = await prisma.user.upsert({
    where: { email: "director@1000mm.local" },
    update: { passwordHash: pw.director, isActive: true, emailVerified: new Date() },
    create: { email: "director@1000mm.local", passwordHash: pw.director, fullName: "Union Director", role: UserRole.MAIN_DIRECTOR, homeMissionId: missions.EBM.id, emailVerified: new Date(), isActive: true },
  });

  const secretary = await prisma.user.upsert({
    where: { email: "secretary@1000mm.local" },
    update: { passwordHash: pw.staff, isActive: true, emailVerified: new Date() },
    create: { email: "secretary@1000mm.local", passwordHash: pw.staff, fullName: "Mission Secretary", role: UserRole.SECRETARY, homeMissionId: missions.EBM.id, emailVerified: new Date(), isActive: true },
  });

  const assocDirector = await prisma.user.upsert({
    where: { email: "assoc@1000mm.local" },
    update: { passwordHash: pw.staff, isActive: true, emailVerified: new Date() },
    create: { email: "assoc@1000mm.local", passwordHash: pw.staff, fullName: "Associate Director", role: UserRole.ASSOCIATE_DIRECTOR, homeMissionId: missions.NBM.id, emailVerified: new Date(), isActive: true },
  });

  const missionCodes: LocalMissionCode[] = ["EBM", "NBM", "SBM", "WBM"];
  const lmdNames: Record<LocalMissionCode, string> = { EBM: "Ratan Das", NBM: "Sukumar Roy", SBM: "Monoj Paul", WBM: "Bijon Biswas" };
  const lmds = await Promise.all(
    missionCodes.map(async (code) => {
      const email = `lmd.${code.toLowerCase()}@1000mm.local`;
      const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash: pw.lmd, isActive: true, emailVerified: new Date() },
        create: { email, passwordHash: pw.lmd, fullName: lmdNames[code], role: UserRole.LOCAL_DIRECTOR, homeMissionId: missions[code].id, emailVerified: new Date(), isActive: true },
      });
      await prisma.localMission.update({ where: { id: missions[code].id }, data: { directorId: user.id } });
      return { user, missionCode: code };
    }),
  );

  const trainerData = [
    { email: "trainer1@1000mm.local", name: "Sabin Trainer",  missionId: missions.NBM.id },
    { email: "trainer2@1000mm.local", name: "Nushrat Trainer", missionId: missions.WBM.id },
    { email: "trainer3@1000mm.local", name: "Philip Baroi",   missionId: missions.EBM.id },
    { email: "trainer4@1000mm.local", name: "Grace Mondal",   missionId: missions.SBM.id },
  ];
  const trainers = await Promise.all(
    trainerData.map((t) =>
      prisma.user.upsert({
        where: { email: t.email },
        update: {},
        create: { email: t.email, passwordHash: pw.trainer, fullName: t.name, role: UserRole.TRAINER, homeMissionId: t.missionId, emailVerified: new Date(), isActive: true },
      }),
    ),
  );

  const trainees = await Promise.all(
    TRAINEE_SPECS.map((spec) =>
      prisma.user.upsert({
        where: { email: spec.email },
        update: {},
        create: {
          email: spec.email,
          passwordHash: pw.trainee,
          fullName: spec.name,
          role: UserRole.TRAINEE,
          homeMissionId: missions[spec.missionCode].id,
          emailVerified: new Date(),
          isActive: true,
          isMissionary: spec.isMissionary,
          phone: randomPhone(),
          dateOfBirth: new Date(2000 - randomInt(0, 8), randomInt(0, 11), randomInt(1, 28)),
        },
      }),
    ),
  );

  console.log(`✓ Users seeded (SA · UD · SEC · AD · 4 LMDs · 4 Trainers · ${trainees.length} Trainees)`);
  return { admin, director, secretary, assocDirector, lmds, trainers, trainees };
}

// ─── Programs ─────────────────────────────────────────────────────────────────

async function seedPrograms(adminId: string) {
  const programs = [
    {
      code: "1000MM-2024", title: "1000MM Missionary Training Program 2024", titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৪",
      category: TrainingCategory.SPIRITUAL, summary: "Archived 2024 cycle.", startDate: new Date("2024-07-01"), endDate: new Date("2024-12-31"),
      location: "Sylhet", targetIntake: 80, isPublished: false, windowState: ApplicationWindowState.ARCHIVED,
      windowDates: { advertisingStartDate: new Date("2024-01-01"), applicationOpenDate: new Date("2024-01-01"), applicationCloseDate: new Date("2024-05-31"), trainingStartDate: new Date("2024-07-01") },
    },
    {
      code: "1000MM-2025", title: "1000MM Missionary Training Program 2025", titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৫",
      category: TrainingCategory.SPIRITUAL, summary: "Closed 2025 cycle.", startDate: new Date("2025-07-01"), endDate: new Date("2025-12-31"),
      location: "Dhaka", targetIntake: 70, isPublished: false, windowState: ApplicationWindowState.CLOSED,
      windowDates: { advertisingStartDate: new Date("2025-01-15"), applicationOpenDate: new Date("2025-01-15"), applicationCloseDate: new Date("2025-05-31"), trainingStartDate: new Date("2025-07-01") },
    },
    {
      code: "1000MM-2026", title: "1000MM Missionary Training Program 2026", titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৬",
      category: TrainingCategory.SPIRITUAL, summary: "Active 2026 main program — window is OPEN.", startDate: new Date("2026-07-01"), endDate: new Date("2026-12-31"),
      location: "Dhaka", targetIntake: 90, isPublished: true, windowState: ApplicationWindowState.OPEN,
      windowDates: { advertisingStartDate: new Date("2026-01-01"), applicationOpenDate: new Date("2026-01-01"), applicationCloseDate: new Date("2026-12-31"), trainingStartDate: new Date("2026-07-01") },
    },
    {
      code: "1000MM-2026-L", title: "1000MM Leadership Development Program 2026", titleBangla: "১০০০এমএম নেতৃত্ব উন্নয়ন কার্যক্রম ২০২৬",
      category: TrainingCategory.MENTAL, summary: "Leadership track — window OPEN.", startDate: new Date("2026-08-01"), endDate: new Date("2026-11-30"),
      location: "Chittagong", targetIntake: 40, isPublished: true, windowState: ApplicationWindowState.OPEN,
      windowDates: { advertisingStartDate: new Date("2026-03-01"), applicationOpenDate: new Date("2026-03-01"), applicationCloseDate: new Date("2026-07-31"), trainingStartDate: new Date("2026-08-01") },
    },
    {
      code: "1000MM-2027", title: "1000MM Missionary Training Program 2027", titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৭",
      category: TrainingCategory.SPIRITUAL, summary: "Draft 2027 cycle — not yet open.", startDate: new Date("2027-07-01"), endDate: new Date("2027-12-31"),
      location: "Gazipur", targetIntake: 120, isPublished: false, windowState: ApplicationWindowState.DRAFT,
      windowDates: { advertisingStartDate: new Date("2027-01-01"), applicationOpenDate: new Date("2027-01-01"), applicationCloseDate: new Date("2027-12-31"), trainingStartDate: new Date("2027-07-01") },
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
      ? await prisma.applicationWindow.update({ where: { id: existingWin.id }, data: { state: p.windowState, ...p.windowDates, targetIntake: p.targetIntake, notes: `${p.code} window`, createdById: adminId } })
      : await prisma.applicationWindow.create({ data: { programId: prog.id, scopedToMissionId: null, state: p.windowState, ...p.windowDates, targetIntake: p.targetIntake, notes: `${p.code} window`, createdById: adminId } });
    created[p.code] = { program: prog, window: win };
  }

  console.log("✓ Programs and windows seeded");
  return created;
}

// ─── Program Topics ───────────────────────────────────────────────────────────

async function seedProgramTopics(
  programs: Record<string, { program: { id: string; code: string }; window: { id: string } }>,
  trainers: Array<{ id: string }>,
) {
  const topicsByProgram: Record<string, Array<{ title: string; trainerIdx: number }>> = {
    "1000MM-2026": [
      { title: "Biblical Foundations of Mission",      trainerIdx: 0 },
      { title: "Health Ministry & Medical Evangelism", trainerIdx: 2 },
      { title: "Leadership & Church Planting",         trainerIdx: 0 },
      { title: "Digital Outreach & Media Ministry",    trainerIdx: 1 },
    ],
    "1000MM-2026-L": [
      { title: "Servant Leadership Principles",        trainerIdx: 0 },
      { title: "Strategic Planning for Missions",      trainerIdx: 2 },
      { title: "Conflict Resolution & Peacemaking",    trainerIdx: 1 },
    ],
    "1000MM-2025": [
      { title: "Evangelism Techniques",                trainerIdx: 3 },
      { title: "Community Development",                trainerIdx: 2 },
    ],
  };

  const created: Record<string, Array<{ id: string; programId: string; title: string }>> = {};

  for (const [code, topics] of Object.entries(topicsByProgram)) {
    const prog = programs[code];
    if (!prog) continue;
    await prisma.programTopic.deleteMany({ where: { programId: prog.program.id, deletedAt: null } });
    const programTopics = [];
    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      const record = await prisma.programTopic.create({
        data: { programId: prog.program.id, title: t.title, trainerId: trainers[t.trainerIdx]?.id ?? null, order: i + 1 },
      });
      programTopics.push(record);
    }
    created[code] = programTopics;
  }

  console.log("✓ Program topics seeded");
  return created;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

async function seedAssignments(
  topics: Record<string, Array<{ id: string; programId: string; title: string }>>,
  programs: Record<string, { program: { id: string; code: string }; window: { id: string } }>,
  adminId: string,
) {
  const templates: Record<string, Array<{ title: string; description: string; topicIdx: number; dueDate: Date }>> = {
    "1000MM-2026": [
      { title: "Personal Testimony Essay",         description: "Write a 500-word personal testimony about your call to mission work.", topicIdx: 0, dueDate: new Date("2026-08-15") },
      { title: "Health Education Lesson Plan",     description: "Prepare a 30-minute health lesson plan for a village community.",       topicIdx: 1, dueDate: new Date("2026-09-01") },
      { title: "Church Planting Strategy",         description: "Draft a 3-month church planting strategy for your deployment area.",     topicIdx: 2, dueDate: new Date("2026-09-15") },
      { title: "Social Media Evangelism Campaign", description: "Create a 2-week social media evangelism plan with sample posts.",        topicIdx: 3, dueDate: new Date("2026-10-01") },
    ],
    "1000MM-2026-L": [
      { title: "Leadership Self-Assessment Report", description: "Complete the leadership self-assessment tool and write a reflection.",   topicIdx: 0, dueDate: new Date("2026-09-30") },
      { title: "6-Month Mission Strategic Plan",    description: "Develop a strategic plan for your assigned mission area.",              topicIdx: 1, dueDate: new Date("2026-10-15") },
    ],
    "1000MM-2025": [
      { title: "Monthly Evangelism Report",         description: "Submit a summary of your evangelism activities for the month.",         topicIdx: 0, dueDate: new Date("2025-09-30") },
    ],
  };

  const createdAssignments: Array<{ id: string; programId: string; topicId: string | null; title: string }> = [];

  for (const [code, tpls] of Object.entries(templates)) {
    const prog = programs[code];
    if (!prog) continue;
    const existingAssignments = await prisma.assignment.findMany({ where: { programId: prog.program.id, createdById: adminId }, select: { id: true } });
    if (existingAssignments.length) {
      await prisma.assignmentSubmission.deleteMany({ where: { assignmentId: { in: existingAssignments.map((a) => a.id) } } });
      await prisma.assignment.deleteMany({ where: { id: { in: existingAssignments.map((a) => a.id) } } });
    }
    const programTopics = topics[code] ?? [];
    for (const t of tpls) {
      const topic = programTopics[t.topicIdx];
      const a = await prisma.assignment.create({
        data: { programId: prog.program.id, topicId: topic?.id ?? null, title: t.title, description: t.description, dueDate: t.dueDate, createdById: adminId },
      });
      createdAssignments.push({ id: a.id, programId: prog.program.id, topicId: topic?.id ?? null, title: t.title });
    }
  }

  console.log(`✓ Seeded ${createdAssignments.length} assignments`);
  return createdAssignments;
}

// ─── Assignment Submissions ───────────────────────────────────────────────────

async function seedAssignmentSubmissions(
  assignments: Array<{ id: string; programId: string; topicId: string | null; title: string }>,
  applications: Array<{ id: string; applicantId: string; programId: string; missionId: string; status: ApplicationStatus }>,
  adminId: string,
) {
  const accepted = applications.filter((a) => a.status === ApplicationStatus.ACCEPTED);
  const byProgram: Record<string, typeof accepted> = {};
  for (const app of accepted) {
    (byProgram[app.programId] ??= []).push(app);
  }

  let count = 0;
  for (const assignment of assignments) {
    const enrollees = byProgram[assignment.programId] ?? [];
    for (const app of enrollees) {
      if (Math.random() < 0.25) continue; // ~75% submission rate
      const hasFeedback = Math.random() > 0.4;
      try {
        await prisma.assignmentSubmission.upsert({
          where: { assignmentId_traineeId: { assignmentId: assignment.id, traineeId: app.applicantId } },
          update: {},
          create: {
            assignmentId: assignment.id,
            traineeId: app.applicantId,
            notes: `Submitted work for: ${assignment.title}. I have completed the required tasks as instructed.`,
            submittedAt: new Date("2026-09-02"),
            feedback: hasFeedback ? "Good work! Your submission demonstrates solid understanding. Consider adding more practical examples next time." : null,
            feedbackAt: hasFeedback ? new Date("2026-09-06") : null,
            feedbackById: hasFeedback ? adminId : null,
          },
        });
        count++;
      } catch {}
    }
  }

  console.log(`✓ Seeded ${count} assignment submissions`);
}

// ─── Resources ────────────────────────────────────────────────────────────────

async function seedResources(
  programs: Record<string, { program: { id: string; code: string }; window: { id: string } }>,
  adminId: string,
) {
  await prisma.resource.deleteMany({ where: { uploadedById: adminId } });

  const general = [
    { title: "1000MM Missionary Handbook 2026",  fileName: "1000mm-handbook-2026.pdf",   mimeType: "application/pdf", fileSizeBytes: 2_500_000 },
    { title: "Bible Study Guide — Evangelism",    fileName: "bible-study-evangelism.pdf", mimeType: "application/pdf", fileSizeBytes: 1_200_000 },
    { title: "Health Ministry Manual",            fileName: "health-ministry-manual.pdf", mimeType: "application/pdf", fileSizeBytes: 3_100_000 },
  ];

  const programSpecific: Record<string, Array<{ title: string; fileName: string; mimeType: string; fileSizeBytes: number }>> = {
    "1000MM-2026": [
      { title: "2026 Training Schedule",      fileName: "training-schedule-2026.pdf",  mimeType: "application/pdf", fileSizeBytes: 450_000 },
      { title: "Church Planting Toolkit",     fileName: "church-planting-toolkit.zip", mimeType: "application/zip", fileSizeBytes: 8_200_000 },
    ],
    "1000MM-2026-L": [
      { title: "Leadership Development Workbook", fileName: "leadership-workbook.pdf",  mimeType: "application/pdf", fileSizeBytes: 1_800_000 },
    ],
  };

  let count = 0;
  for (const r of general) {
    await prisma.resource.create({ data: { title: r.title, fileName: r.fileName, fileStorageKey: `general/${r.fileName}`, mimeType: r.mimeType, fileSizeBytes: r.fileSizeBytes, programId: null, uploadedById: adminId } });
    count++;
  }
  for (const [code, resources] of Object.entries(programSpecific)) {
    const prog = programs[code];
    if (!prog) continue;
    for (const r of resources) {
      await prisma.resource.create({ data: { title: r.title, fileName: r.fileName, fileStorageKey: `programs/${code}/${r.fileName}`, mimeType: r.mimeType, fileSizeBytes: r.fileSizeBytes, programId: prog.program.id, uploadedById: adminId } });
      count++;
    }
  }

  console.log(`✓ Seeded ${count} resources`);
}

// ─── Applications + Enrollments ───────────────────────────────────────────────

function buildApplicantData(user: { id: string; fullName: string; email: string; homeMissionId: string }, gender?: Gender) {
  const isFemale = gender === Gender.FEMALE || /mina|tania|lipi|shefali|puja|rachel|sunita|bipasha|priya|nita|nushrat|grace|sabrina|esther|hannah|ruth|maria|sarah/i.test(user.fullName);
  const age = randomInt(19, 34);
  const dob = new Date(); dob.setFullYear(dob.getFullYear() - age);
  return {
    applicantFullName: user.fullName,
    applicantFullNameBangla: null,
    applicantDateOfBirth: dob,
    applicantAge: age,
    applicantGender: isFemale ? Gender.FEMALE : Gender.MALE,
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

const APP_STATUS_SEQUENCE: ApplicationStatus[] = [
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.RECOMMENDED,
  ApplicationStatus.UNDER_LMD_REVIEW,
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.UNDER_MAIN_DIRECTOR_REVIEW,
  ApplicationStatus.RETURNED_TO_APPLICANT,
  ApplicationStatus.REJECTED,
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.WITHDRAWN,
  ApplicationStatus.ACCEPTED,
];

function getAppStatus(traineeIdx: number, programIdx: number, isMissionary: boolean): ApplicationStatus {
  if (isMissionary && programIdx === 0) return ApplicationStatus.ACCEPTED;
  return APP_STATUS_SEQUENCE[(traineeIdx * 2 + programIdx * 3) % APP_STATUS_SEQUENCE.length];
}

async function seedApplications(
  trainees: Array<{ id: string; fullName: string; email: string; homeMissionId: string; isMissionary?: boolean }>,
  programs: Record<string, { program: { id: string; code: string }; window: { id: string; state: ApplicationWindowState } }>,
  adminId: string,
) {
  const programCodes = ["1000MM-2026", "1000MM-2026-L", "1000MM-2025"];
  const createdApplications: Array<{ id: string; applicantId: string; programId: string; missionId: string; status: ApplicationStatus }> = [];

  for (const [ti, trainee] of trainees.entries()) {
    const spec = TRAINEE_SPECS.find((s) => s.email === trainee.email);
    for (const [pi, programCode] of programCodes.entries()) {
      const program = programs[programCode];
      if (!program) continue;
      const status = getAppStatus(ti, pi, !!(trainee as any).isMissionary);
      const referenceNumber = `${program.program.code}-${trainee.email.split("@")[0].toUpperCase()}`;
      const submittedAt = randomDate(new Date("2026-01-01"), new Date("2026-06-01"));
      const applicantData = buildApplicantData(trainee, spec?.gender);

      const application = await prisma.application.upsert({
        where: { referenceNumber },
        update: { status, submittedAt, lastTransitionAt: submittedAt, ...applicantData },
        create: { referenceNumber, applicantId: trainee.id, windowId: program.window.id, submittedFromMissionId: trainee.homeMissionId, status, submittedAt, lastTransitionAt: submittedAt, ...applicantData, profilePhotoDocumentId: null },
      });

      const historyExists = await prisma.applicationStatusHistory.findFirst({ where: { applicationId: application.id } });
      if (!historyExists) {
        await prisma.applicationStatusHistory.create({
          data: { applicationId: application.id, fromStatus: ApplicationStatus.DRAFT, toStatus: status, triggeredById: trainee.id, comment: `Seeded: ${status}` },
        });
      }

      if (status === ApplicationStatus.ACCEPTED) {
        const deployment = randomItem(DEPLOYMENT_LOCATIONS);
        await prisma.programEnrollment.upsert({
          where: { applicationId: application.id },
          update: { deploymentLocation: deployment, deploymentAssignedAt: new Date(), deploymentAssignedById: adminId },
          create: { programId: program.program.id, traineeId: trainee.id, applicationId: application.id, attendanceConfirmed: true, deploymentLocation: deployment, deploymentAssignedAt: new Date(), deploymentAssignedById: adminId },
        });
      } else if (status === ApplicationStatus.RECOMMENDED) {
        // Consent-given but not yet placed
        const existsEnr = await prisma.programEnrollment.findFirst({ where: { programId: program.program.id, traineeId: trainee.id } });
        if (!existsEnr) {
          await prisma.programEnrollment.create({
            data: { programId: program.program.id, traineeId: trainee.id, applicationId: application.id, status: "APPLIED" as any, appliedAt: new Date() },
          });
        }
      }

      createdApplications.push({ id: application.id, applicantId: trainee.id, programId: program.program.id, missionId: trainee.homeMissionId, status });
    }
  }

  console.log(`✓ Seeded ${createdApplications.length} applications`);
  return createdApplications;
}

// ─── Attendance Scans ─────────────────────────────────────────────────────────

async function seedAttendanceScans(
  applications: Array<{ id: string; applicantId: string; programId: string; missionId: string; status: ApplicationStatus }>,
  adminId: string,
) {
  const accepted = applications.filter((a) => a.status === ApplicationStatus.ACCEPTED);

  // Clear old seeded scans
  await prisma.attendanceScan.deleteMany({ where: { scannedById: adminId } });

  const enrollments = await prisma.programEnrollment.findMany({
    where: { traineeId: { in: accepted.map((a) => a.applicantId) }, deletedAt: null },
    select: { id: true, traineeId: true, programId: true },
  });
  const enrollmentMap = new Map(enrollments.map((e) => [`${e.traineeId}-${e.programId}`, e.id]));

  const scanDates = [
    new Date("2026-10-05T08:30:00Z"),
    new Date("2026-10-05T14:00:00Z"),
    new Date("2026-10-12T08:30:00Z"),
    new Date("2026-10-19T09:00:00Z"),
  ];

  let count = 0;
  for (const app of accepted) {
    const enrollmentId = enrollmentMap.get(`${app.applicantId}-${app.programId}`) ?? "unknown";
    for (const scanDate of scanDates.slice(0, 2)) {
      await prisma.attendanceScan.create({
        data: { enrollmentId, traineeId: app.applicantId, programId: app.programId, missionId: app.missionId, scannedAt: scanDate, scannedById: adminId },
      });
      count++;
    }
  }

  console.log(`✓ Seeded ${count} attendance scans`);
}

// ─── Field Reports ────────────────────────────────────────────────────────────

async function seedFieldReports(
  applications: Array<{ id: string; applicantId: string; programId: string; missionId: string; status: ApplicationStatus }>,
) {
  const accepted = applications.filter((a) => a.status === ApplicationStatus.ACCEPTED);

  // Deduplicate by trainee — one field report per trainee per month regardless of program
  const seenTrainees = new Set<string>();
  const deduped = accepted.filter((a) => {
    if (seenTrainees.has(a.applicantId)) return false;
    seenTrainees.add(a.applicantId);
    return true;
  });

  const reportMonths = [
    { month: 10, year: 2025 },
    { month: 11, year: 2025 },
    { month: 4,  year: 2026 },
    { month: 5,  year: 2026 },
    { month: 6,  year: 2026 },
  ];

  let count = 0;
  for (const app of deduped) {
    for (const { month, year } of reportMonths) {
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

// ─── Field Report Comments ────────────────────────────────────────────────────

async function seedFieldReportComments(
  adminId: string,
  lmds: Array<{ user: { id: string } }>,
) {
  const reports = await prisma.fieldReport.findMany({ take: 8, select: { id: true }, orderBy: { createdAt: "asc" } });
  await prisma.fieldReportComment.deleteMany({ where: { reportId: { in: reports.map((r) => r.id) } } });

  const comments = [
    "Excellent work this month! Your baptism numbers are outstanding. Keep it up.",
    "Please increase your home visit count next month — it is an important metric.",
    "Great community engagement. Would love to see more Bible studies conducted.",
    "Your report is well-written. The story of witness is particularly encouraging.",
    "Please submit on time next month — this report arrived 3 days late.",
    "Strong numbers across the board. Well done!",
    "Consider collaborating with the local church to extend your reach.",
    "The challenges you noted will be discussed at the next regional gathering.",
  ];

  let count = 0;
  for (let i = 0; i < reports.length; i++) {
    const authorId = i % 2 === 0 ? adminId : (lmds[i % lmds.length]?.user.id ?? adminId);
    await prisma.fieldReportComment.create({
      data: { reportId: reports[i].id, authorId, comment: comments[i % comments.length] },
    });
    count++;
  }

  console.log(`✓ Seeded ${count} field report comments`);
}

// ─── Recommendations ─────────────────────────────────────────────────────────

async function seedRecommendations(
  applications: Array<{ id: string; applicantId: string; programId: string; missionId: string; status: ApplicationStatus }>,
  lmds: Array<{ user: { id: string }; missionCode: LocalMissionCode }>,
  missions: Record<LocalMissionCode, { id: string }>,
) {
  const eligible = applications.filter((a) =>
    a.status === ApplicationStatus.RECOMMENDED ||
    a.status === ApplicationStatus.UNDER_MAIN_DIRECTOR_REVIEW ||
    a.status === ApplicationStatus.ACCEPTED,
  );

  const lmdByMission: Record<string, string> = {};
  for (const lmd of lmds) {
    lmdByMission[missions[lmd.missionCode].id] = lmd.user.id;
  }

  let count = 0;
  for (const app of eligible) {
    const recommenderId = lmdByMission[app.missionId];
    if (!recommenderId) continue;
    const exists = await prisma.recommendation.findFirst({ where: { applicationId: app.id } });
    if (!exists) {
      await prisma.recommendation.create({
        data: {
          applicationId: app.id,
          recommenderId,
          writtenComment: "This applicant has demonstrated exceptional character, spiritual maturity, and a genuine calling to mission work. I recommend them wholeheartedly.",
          recommendedAt: new Date("2026-03-15"),
        },
      });
      count++;
    }
  }

  console.log(`✓ Seeded ${count} recommendations`);
}

// ─── LMD Reports ─────────────────────────────────────────────────────────────

async function seedLmdReports(
  lmds: Array<{ user: { id: string }; missionCode: LocalMissionCode }>,
  missions: Record<LocalMissionCode, { id: string }>,
  adminId: string,
) {
  const windows = [
    { month: 3, year: 2026, state: "CLOSED" as const },
    { month: 4, year: 2026, state: "CLOSED" as const },
    { month: 5, year: 2026, state: "CLOSED" as const },
    { month: 6, year: 2026, state: "OPEN"   as const },
  ];

  for (const w of windows) {
    const win = await prisma.lmdReportWindow.upsert({
      where: { reportMonth_reportYear: { reportMonth: w.month, reportYear: w.year } },
      update: { state: w.state },
      create: { reportMonth: w.month, reportYear: w.year, state: w.state, createdById: adminId, notes: `${w.year} month ${w.month} window` },
    });

    const submitters = w.state === "CLOSED" ? lmds : lmds.slice(0, 2);
    for (const lmd of submitters) {
      const mId = missions[lmd.missionCode].id;
      const exists = await prisma.lmdReport.findFirst({ where: { windowId: win.id, lmdId: lmd.user.id } });
      if (!exists) {
        await prisma.lmdReport.create({
          data: {
            windowId: win.id, lmdId: lmd.user.id, missionId: mId, reportMonth: w.month, reportYear: w.year,
            totalTrainees: randomInt(8, 20), totalActivities: randomInt(50, 150), totalDaysOfWork: randomInt(80, 180),
            totalHoursOfWork: randomInt(300, 700), totalNonSdaHomeVisits: randomInt(20, 60), totalBibleStudies: randomInt(15, 50),
            totalMedicalVisits: randomInt(0, 15), totalWorshipSessions: randomInt(10, 40), totalNewGroups: randomInt(0, 5),
            totalBaptismCandidates: randomInt(2, 12), totalBaptisms: randomInt(0, 8), totalPeopleReached: randomInt(80, 300),
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
  trainees: Array<{ id: string; email: string; homeMissionId: string }>,
  adminId: string,
) {
  const cycle = 2026;
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

  const missionaries = trainees.filter((t) => {
    const spec = TRAINEE_SPECS.find((s) => s.email === t.email);
    return spec?.isMissionary;
  });

  for (const missionary of missionaries) {
    const amount = randomInt(4500, 7000);
    await prisma.salaryAssignment.upsert({
      where: { missionaryId_cycle: { missionaryId: missionary.id, cycle } },
      update: {},
      create: { missionaryId: missionary.id, missionId: missionary.homeMissionId, amount, cycle, assignedById: adminId },
    });

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
          create: { missionaryId: missionary.id, missionId: missionary.homeMissionId, amount, month: req.month, year: req.year, status: req.status, reviewedById: req.reviewedById, reviewedAt: req.reviewedAt, notes: req.notes },
        });
      } catch {}
    }
  }

  console.log("✓ Salary ranges, assignments, and requests seeded");
}

// ─── Financial Entries ────────────────────────────────────────────────────────

async function seedFinancial(missions: Record<LocalMissionCode, { id: string }>, adminId: string) {
  type EntrySpec = { type: FinancialEntryType; amount: number; description: string; date: Date; reference?: string };

  const entriesPerMission: Record<LocalMissionCode, EntrySpec[]> = {
    EBM: [
      { type: FinancialEntryType.INCOME,              amount: 85000, description: "Union quarterly grant",          date: new Date("2026-01-10"), reference: "UNI-Q1-2026" },
      { type: FinancialEntryType.DEPOSIT,             amount: 15000, description: "Local church offering",          date: new Date("2026-02-05") },
      { type: FinancialEntryType.EXPENSE,             amount: 12000, description: "Office rent — January",          date: new Date("2026-01-31") },
      { type: FinancialEntryType.EXPENSE,             amount: 8500,  description: "Missionary stipends — January",  date: new Date("2026-01-28") },
      { type: FinancialEntryType.TRANSFER_TO_MISSION, amount: 5000,  description: "Transfer to EBM district fund",  date: new Date("2026-03-01") },
      { type: FinancialEntryType.INCOME,              amount: 90000, description: "Union quarterly grant — Q2",     date: new Date("2026-04-10"), reference: "UNI-Q2-2026" },
      { type: FinancialEntryType.EXPENSE,             amount: 9200,  description: "Missionary stipends — April",    date: new Date("2026-04-28") },
    ],
    NBM: [
      { type: FinancialEntryType.INCOME,              amount: 72000, description: "Union quarterly grant",          date: new Date("2026-01-10"), reference: "UNI-Q1-2026" },
      { type: FinancialEntryType.DEPOSIT,             amount: 8000,  description: "Tithe contribution",             date: new Date("2026-02-14") },
      { type: FinancialEntryType.EXPENSE,             amount: 6500,  description: "Travel allowance — trainees",    date: new Date("2026-02-20") },
      { type: FinancialEntryType.EXPENSE,             amount: 11000, description: "Office utilities Q1",            date: new Date("2026-03-30") },
      { type: FinancialEntryType.INCOME,              amount: 75000, description: "Union quarterly grant — Q2",     date: new Date("2026-04-10") },
    ],
    SBM: [
      { type: FinancialEntryType.INCOME,              amount: 68000, description: "Union quarterly grant",          date: new Date("2026-01-10") },
      { type: FinancialEntryType.EXPENSE,             amount: 14000, description: "Training materials",             date: new Date("2026-01-25") },
      { type: FinancialEntryType.DEPOSIT,             amount: 12000, description: "Special offering — Easter",      date: new Date("2026-04-05") },
      { type: FinancialEntryType.EXPENSE,             amount: 7800,  description: "Monthly stipends",               date: new Date("2026-04-28") },
      { type: FinancialEntryType.TRANSFER_TO_MISSION, amount: 10000, description: "Transfer to SBM rural unit",     date: new Date("2026-05-01") },
    ],
    WBM: [
      { type: FinancialEntryType.INCOME,              amount: 71000, description: "Union quarterly grant",          date: new Date("2026-01-10") },
      { type: FinancialEntryType.EXPENSE,             amount: 5500,  description: "Vehicle fuel — Jan/Feb",         date: new Date("2026-02-28") },
      { type: FinancialEntryType.DEPOSIT,             amount: 9000,  description: "Fundraising event",              date: new Date("2026-03-15") },
      { type: FinancialEntryType.EXPENSE,             amount: 18000, description: "Annual retreat costs",           date: new Date("2026-03-22") },
      { type: FinancialEntryType.INCOME,              amount: 74000, description: "Union quarterly grant — Q2",     date: new Date("2026-04-10") },
      { type: FinancialEntryType.EXPENSE,             amount: 8800,  description: "Missionary stipends — April",    date: new Date("2026-04-28") },
    ],
  };

  let count = 0;
  for (const [code, entries] of Object.entries(entriesPerMission) as [LocalMissionCode, EntrySpec[]][]) {
    const mId = missions[code].id;
    await prisma.financialEntry.deleteMany({ where: { missionId: mId, createdById: adminId } });
    for (const e of entries) {
      await prisma.financialEntry.create({ data: { type: e.type, amount: e.amount, date: e.date, description: e.description, missionId: mId, reference: e.reference, createdById: adminId } });
      count++;
    }
  }

  console.log(`✓ Seeded ${count} financial entries`);
}

// ─── Missionary Deployments ───────────────────────────────────────────────────

async function seedMissionaryDeployments(
  missionaries: Array<{ id: string; homeMissionId: string }>,
  lmds: Array<{ user: { id: string }; missionCode: LocalMissionCode }>,
  missions: Record<LocalMissionCode, { id: string }>,
  adminId: string,
) {
  await prisma.missionaryDeployment.deleteMany({ where: { missionaryId: { in: missionaries.map((m) => m.id) } } });

  const lmdByMission: Record<string, string> = {};
  for (const lmd of lmds) {
    lmdByMission[missions[lmd.missionCode].id] = lmd.user.id;
  }

  let count = 0;
  for (const missionary of missionaries) {
    const lmdId = lmdByMission[missionary.homeMissionId] ?? adminId;

    await prisma.missionaryDeployment.create({
      data: {
        missionaryId: missionary.id, missionId: missionary.homeMissionId, location: randomItem(DEPLOYMENT_LOCATIONS),
        startDate: new Date("2025-07-01"), endDate: new Date("2025-12-31"),
        status: DeploymentStatus.COMPLETED, requestedById: lmdId, reviewedById: adminId,
        reviewNote: "Deployment completed successfully.", reviewedAt: new Date("2025-06-20"),
      },
    });

    await prisma.missionaryDeployment.create({
      data: {
        missionaryId: missionary.id, missionId: missionary.homeMissionId, location: randomItem(DEPLOYMENT_LOCATIONS),
        startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"),
        status: DeploymentStatus.ACTIVE, requestedById: lmdId, reviewedById: adminId,
        reviewNote: "Approved for 2026 cycle.", reviewedAt: new Date("2025-12-20"),
      },
    });

    count += 2;
  }

  // One pending deployment awaiting approval
  if (missionaries[0]) {
    await prisma.missionaryDeployment.create({
      data: {
        missionaryId: missionaries[0].id, missionId: missionaries[0].homeMissionId,
        location: "Narayanganj", startDate: new Date("2027-01-01"),
        status: DeploymentStatus.PENDING, requestedById: lmdByMission[missionaries[0].homeMissionId] ?? adminId,
      },
    });
    count++;
  }

  // One rejected deployment
  if (missionaries[1]) {
    await prisma.missionaryDeployment.create({
      data: {
        missionaryId: missionaries[1].id, missionId: missionaries[1].homeMissionId,
        location: "Cox's Bazar", startDate: new Date("2026-06-01"), endDate: new Date("2026-12-31"),
        status: DeploymentStatus.REJECTED, requestedById: lmdByMission[missionaries[1].homeMissionId] ?? adminId,
        reviewedById: adminId, reviewNote: "Location not approved for this cycle.", reviewedAt: new Date("2026-05-15"),
      },
    });
    count++;
  }

  console.log(`✓ Seeded ${count} missionary deployments`);
}

// ─── Urgent Reports ───────────────────────────────────────────────────────────

async function seedUrgentReports(adminId: string, missionaries: Array<{ id: string }>) {
  const old = await prisma.urgentReport.findMany({ where: { issuedById: adminId, title: { startsWith: "[SEED]" } }, select: { id: true } });
  if (old.length) {
    await prisma.urgentReportSubmission.deleteMany({ where: { reportId: { in: old.map((r) => r.id) } } });
    await prisma.urgentReport.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
  }

  const reports = [
    {
      title: "[SEED] Emergency Prayer — Trainee Hospitalised",
      body: "Trainee Sabbir Paul has been hospitalised in Dhaka. Please lift him in prayer and check in with your local coordinator for updates.",
      publishedAt: new Date("2026-05-15"),
      submitters: missionaries,
    },
    {
      title: "[SEED] Security Alert — Field Area Advisory",
      body: "A security advisory has been issued for missionaries in the Rangpur region. All trainees in the area should check in with their LMD immediately and avoid travel until further notice.",
      publishedAt: new Date("2026-06-01"),
      submitters: missionaries.slice(0, 4),
    },
    {
      title: "[SEED] Mid-Year Gathering — All Active Missionaries",
      body: "All active missionaries are required to attend the mid-year gathering on July 15–17, 2026 at BANC Campus, Gazipur. Travel allowance provided. Confirm attendance by July 5.",
      publishedAt: new Date("2026-06-10"),
      submitters: [],
    },
  ];

  for (const r of reports) {
    const report = await prisma.urgentReport.create({
      data: { title: r.title, body: r.body, issuedById: adminId, publishedAt: r.publishedAt },
    });
    for (const missionary of r.submitters) {
      try {
        await prisma.urgentReportSubmission.create({
          data: { reportId: report.id, userId: missionary.id, response: "Acknowledged. Thank you for the update.", submittedAt: new Date(r.publishedAt.getTime() + 86400000) },
        });
      } catch {}
    }
  }

  console.log(`✓ Seeded ${reports.length} urgent reports`);
}

// ─── Trainer Applications ─────────────────────────────────────────────────────

async function seedTrainerApplications(adminId: string) {
  const apps = [
    { fullName: "Dr. Nathan Baroi",     email: "nathan.baroi@trainer.local",    phone: "01711111111", specialization: "Biblical Studies & Theology",          status: "PENDING"  as const, acceptsSelfFunding: true,  requestsInvitationLetter: false },
    { fullName: "Sabrina Christodas",   email: "sabrina.christo@trainer.local", phone: "01722222222", specialization: "Community Health & Medical Outreach",  status: "APPROVED" as const, acceptsSelfFunding: false, requestsInvitationLetter: true  },
    { fullName: "Ronald Hasda",         email: "ronald.hasda@trainer.local",    phone: "01733333333", specialization: "Music Ministry & Worship Leading",     status: "REJECTED" as const, acceptsSelfFunding: true,  requestsInvitationLetter: false },
    { fullName: "Dr. James Colney",     email: "james.colney@trainer.local",    phone: "01744444444", specialization: "Leadership & Organisational Development", status: "PENDING" as const, acceptsSelfFunding: false, requestsInvitationLetter: true  },
    { fullName: "Margaret Dewan",       email: "margaret.dewan@trainer.local",  phone: "01755555555", specialization: "Children & Youth Ministry",            status: "APPROVED" as const, acceptsSelfFunding: true,  requestsInvitationLetter: false },
  ];

  for (const a of apps) {
    const exists = await prisma.trainerApplication.findFirst({ where: { email: a.email } });
    if (!exists) {
      const reviewed = a.status !== "PENDING";
      await prisma.trainerApplication.create({
        data: {
          fullName: a.fullName, email: a.email, phone: a.phone, fullAddress: "123 Mission Road, Dhaka",
          specialization: a.specialization, acceptsSelfFunding: a.acceptsSelfFunding, requestsInvitationLetter: a.requestsInvitationLetter,
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

// ─── Donations ────────────────────────────────────────────────────────────────

async function seedDonations() {
  await prisma.donation.deleteMany({});

  const donations = [
    { donorName: "Ahmed Hassan",    donorEmail: "ahmed@example.com",   amountMinor: BigInt(100000), currency: "BDT", gateway: PaymentGateway.BKASH,      status: DonationStatus.COMPLETED, receiptNumber: "RCP-2026-001", completedAt: new Date("2026-01-15"), donorMessage: "Support for training program." },
    { donorName: "Sarah Johnson",   donorEmail: "sarah@example.com",   amountMinor: BigInt(5000),   currency: "USD", gateway: PaymentGateway.STRIPE,     status: DonationStatus.COMPLETED, receiptNumber: "RCP-2026-002", completedAt: new Date("2026-01-20"), donorMessage: null },
    { donorName: "Karim Uddin",     donorEmail: "karim@example.com",   amountMinor: BigInt(50000),  currency: "BDT", gateway: PaymentGateway.BKASH,      status: DonationStatus.COMPLETED, receiptNumber: "RCP-2026-003", completedAt: new Date("2026-02-01"), donorMessage: null },
    { donorName: "Grace Park",      donorEmail: "grace@example.com",   amountMinor: BigInt(2500),   currency: "USD", gateway: PaymentGateway.PAYPAL,     status: DonationStatus.COMPLETED, receiptNumber: "RCP-2026-004", completedAt: new Date("2026-02-14"), donorMessage: "God bless the missionaries!" },
    { donorName: "Bashir Rahman",   donorEmail: "bashir@example.com",  amountMinor: BigInt(250000), currency: "BDT", gateway: PaymentGateway.BKASH,      status: DonationStatus.COMPLETED, receiptNumber: "RCP-2026-005", completedAt: new Date("2026-03-05"), donorMessage: null },
    { donorName: "John Anderson",   donorEmail: "john@example.com",    amountMinor: BigInt(10000),  currency: "USD", gateway: PaymentGateway.STRIPE,     status: DonationStatus.COMPLETED, receiptNumber: "RCP-2026-006", completedAt: new Date("2026-03-20"), donorMessage: null },
    { donorName: "Maria Cruz",      donorEmail: "maria@example.com",   amountMinor: BigInt(7500),   currency: "USD", gateway: PaymentGateway.PAYPAL,     status: DonationStatus.COMPLETED, receiptNumber: "RCP-2026-007", completedAt: new Date("2026-04-02"), donorMessage: null },
    { donorName: "Rahim Chowdhury", donorEmail: "rahim@example.com",   amountMinor: BigInt(75000),  currency: "BDT", gateway: PaymentGateway.SSLCOMMERZ, status: DonationStatus.COMPLETED, receiptNumber: "RCP-2026-008", completedAt: new Date("2026-04-15"), donorMessage: null },
    { donorName: null,              donorEmail: null,                  amountMinor: BigInt(100000), currency: "BDT", gateway: PaymentGateway.BKASH,      status: DonationStatus.COMPLETED, receiptNumber: "RCP-2026-009", completedAt: new Date("2026-05-01"), donorMessage: null, isAnonymous: true },
    { donorName: "Peter Kim",       donorEmail: "peter@example.com",   amountMinor: BigInt(20000),  currency: "USD", gateway: PaymentGateway.STRIPE,     status: DonationStatus.PENDING,   receiptNumber: null, completedAt: null, donorMessage: "Monthly support for the bicycle project." },
    { donorName: "Nasrin Begum",    donorEmail: "nasrin@example.com",  amountMinor: BigInt(30000),  currency: "BDT", gateway: PaymentGateway.SSLCOMMERZ, status: DonationStatus.FAILED,    receiptNumber: null, completedAt: null, donorMessage: null },
    { donorName: "Samuel Osei",     donorEmail: "samuel@example.com",  amountMinor: BigInt(15000),  currency: "USD", gateway: PaymentGateway.PAYPAL,     status: DonationStatus.REFUNDED,  receiptNumber: "RCP-2026-010", completedAt: new Date("2026-03-01"), donorMessage: null, refundedAt: new Date("2026-03-10") },
  ];

  for (const d of donations) {
    await prisma.donation.create({
      data: {
        donorName: d.donorName, donorEmail: d.donorEmail, amountMinor: d.amountMinor, currency: d.currency,
        gateway: d.gateway, status: d.status, receiptNumber: (d as any).receiptNumber ?? null,
        completedAt: (d as any).completedAt ?? null, refundedAt: (d as any).refundedAt ?? null,
        donorMessage: (d as any).donorMessage ?? null, isAnonymous: (d as any).isAnonymous ?? false,
        gatewayTransactionId: d.status === DonationStatus.COMPLETED ? `TXN-${Math.random().toString(36).slice(2, 10).toUpperCase()}` : null,
      },
    });
  }

  console.log(`✓ Seeded ${donations.length} donations`);
}

// ─── Contact Messages ─────────────────────────────────────────────────────────

async function seedContactMessages(adminId: string) {
  await prisma.contactMessage.deleteMany({});

  const messages = [
    { fullName: "Mohammad Ali",      email: "mali@example.com",     phone: "01711000001", subject: "How to apply for the training program?", message: "I am interested in applying for the 1000MM 2026 training program. Can you tell me the eligibility requirements and how to apply online?", isHandled: true,  isSpam: false },
    { fullName: "Ruth Christiansen", email: "ruth@example.com",     phone: null,          subject: "Church partnership interest",             message: "We are a church in Denmark and would like to partner with your organisation. Please contact us to discuss support opportunities.", isHandled: false, isSpam: false },
    { fullName: "Sumon Biswas",      email: "sumon@example.com",    phone: "01822000002", subject: "Scholarship availability",                message: "My family cannot afford the training fees. Is there any scholarship or financial support available for trainees from poor families?", isHandled: true, isSpam: false },
    { fullName: "Daniel Nkrumah",    email: "daniel@example.com",   phone: null,          subject: "Visiting from Ghana",                     message: "I am a pastor from Ghana visiting Bangladesh next month and would love to visit your training centre.", isHandled: false, isSpam: false },
    { fullName: "Fatima Khanam",     email: "fatima@example.com",   phone: "01933000003", subject: "Prayer request for my son",               message: "Please pray for my son Sabbir who is serving as a missionary in a remote area. We thank God for this ministry.", isHandled: true, isSpam: false },
    { fullName: "Click Here Now",    email: "spam@spammer.invalid", phone: null,          subject: "Business opportunity!!!",                 message: "CLICK HERE for amazing business opportunity. Make money fast!!!!", isHandled: true, isSpam: true },
  ];

  for (const m of messages) {
    await prisma.contactMessage.create({
      data: {
        fullName: m.fullName, email: m.email, phone: m.phone ?? null, subject: m.subject, message: m.message,
        isHandled: m.isHandled, isSpam: m.isSpam,
        handledAt: m.isHandled ? new Date("2026-04-01") : null,
        handledById: m.isHandled ? adminId : null,
        ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      },
    });
  }

  console.log(`✓ Seeded ${messages.length} contact messages`);
}

// ─── User Flag Requests ───────────────────────────────────────────────────────

async function seedFlagRequests(
  missionaries: Array<{ id: string }>,
  lmds: Array<{ user: { id: string } }>,
  adminId: string,
) {
  if (missionaries.length < 2 || lmds.length < 2) return;

  await prisma.userFlagRequest.deleteMany({ where: { requestedById: { in: lmds.map((l) => l.user.id) } } });

  const requests = [
    {
      targetUserId:  missionaries[0].id,
      requestedById: lmds[0].user.id,
      reason: "Trainee has been unreachable for 3 weeks and is not submitting field reports. Welfare check recommended.",
      status: FlagRequestStatus.PENDING,
    },
    {
      targetUserId:  missionaries[1].id,
      requestedById: lmds[1].user.id,
      reason: "Missionary reportedly left deployment location without informing LMD. Whereabouts unknown.",
      status: FlagRequestStatus.APPROVED,
      resolvedById: adminId,
      resolvedAt: new Date("2026-05-10"),
      resolverNote: "Confirmed — trainee returned home due to family emergency. Case closed.",
    },
    {
      targetUserId:  missionaries[2]?.id ?? missionaries[0].id,
      requestedById: lmds[2]?.user.id ?? lmds[0].user.id,
      reason: "Multiple complaints from local community. Requesting formal investigation.",
      status: FlagRequestStatus.REJECTED,
      resolvedById: adminId,
      resolvedAt: new Date("2026-06-01"),
      resolverNote: "Investigation completed. Complaints found to be unsubstantiated. Flag rejected.",
    },
  ];

  for (const req of requests) {
    await prisma.userFlagRequest.create({
      data: {
        targetUserId: req.targetUserId, requestedById: req.requestedById, reason: req.reason, status: req.status,
        resolvedById: (req as any).resolvedById ?? null, resolvedAt: (req as any).resolvedAt ?? null, resolverNote: (req as any).resolverNote ?? null,
      },
    });
  }

  console.log(`✓ Seeded ${requests.length} flag requests`);
}

// ─── Notifications ────────────────────────────────────────────────────────────

async function seedNotifications(users: Array<{ id: string }>) {
  await prisma.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) }, templateKey: { in: ["announcement.published", "application.status_changed"] } } });

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
          readAt: i < 1 ? null : new Date(),
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
    { subject: "Unable to upload bio data documents",      category: ComplaintCategory.GRIEVANCE,        resolved: false },
    { subject: "Application status stuck on LMD review",  category: ComplaintCategory.GRIEVANCE,        resolved: true,  response: "Issue resolved — please try logging out and back in." },
    { subject: "Suggestion: add dark mode to dashboard",  category: ComplaintCategory.SUGGESTION,       resolved: false },
    { subject: "Field report form missing months",        category: ComplaintCategory.GENERAL_FEEDBACK, resolved: true,  response: "Fixed in the latest deployment. Thank you." },
    { subject: "Salary payment delayed for 2 months",    category: ComplaintCategory.GRIEVANCE,        resolved: false },
    { subject: "Need Bengali language support in forms",  category: ComplaintCategory.SUGGESTION,       resolved: false },
    { subject: "Request for more training resources",     category: ComplaintCategory.GENERAL_FEEDBACK, resolved: true,  response: "New resources have been uploaded. Please check the Resources section." },
    { subject: "LMD unresponsive to messages",            category: ComplaintCategory.GRIEVANCE,        resolved: false },
  ];

  for (const [i, u] of users.slice(0, data.length).entries()) {
    await prisma.complaint.create({
      data: {
        category: data[i].category, subject: data[i].subject,
        description: `${data[i].subject}. Submitted by ${u.fullName}.`,
        submittedById: u.id, missionCode: LocalMissionCode.EBM,
        isResolved: data[i].resolved,
        response: (data[i] as any).response ?? null,
        resolvedAt: data[i].resolved ? new Date("2026-05-01") : null,
      },
    });
  }

  console.log(`✓ Seeded ${data.length} complaints`);
}

// ─── Announcements ────────────────────────────────────────────────────────────

async function seedAnnouncements(adminId: string) {
  const items = [
    { title: "Welcome to the 1000MM Dashboard",   body: "Seeded for local testing. See the Testing Guide in the vault for credentials.",                                        publishedAt: new Date(), expiresAt: new Date(Date.now() + 60 * 86400 * 1000) },
    { title: "2026 Training Programs Now Open",    body: "The 1000MM-2026 Missionary and Leadership tracks are accepting applications.",                                          publishedAt: new Date(Date.now() - 7 * 86400 * 1000), expiresAt: new Date(Date.now() + 30 * 86400 * 1000) },
    { title: "June LMD Report Window Open",        body: "LMDs must submit their June reports before the end of the month.",                                                     publishedAt: new Date(Date.now() - 2 * 86400 * 1000), expiresAt: new Date(Date.now() + 14 * 86400 * 1000) },
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
    { key: "site.organization_name_en",           value: "1000 Missionary Movement Bangladesh",   description: "Organisation display name (English)" },
    { key: "auth.session_timeout_minutes_staff",   value: 30,                                     description: "Inactivity timeout for staff sessions (minutes)" },
    { key: "auth.session_timeout_minutes_trainee", value: 10080,                                  description: "Inactivity timeout for trainee sessions (minutes)" },
    { key: "donation.preset_amounts_bdt",          value: [500, 1000, 2500, 5000, 10000],         description: "Preset donation amounts for BDT donors" },
    { key: "application.form_current_version",     value: 1,                                     description: "Bio-data form schema version" },
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
    { name: "Samuel Das",     location: "Dhaka",       color: "from-green-400 to-emerald-600", order: 1, isPublished: true,  quote: "Joining the 1000 Missionary Movement was the best decision of my life. I was a shy university student with no experience in public speaking. During my one year of service in rural Sylhet, I conducted children's programs and health seminars. God gave me courage I never had before. I saw 27 people give their hearts to Jesus. Now I am no longer afraid — I am a missionary for life." },
    { name: "Rebecca Sarkar", location: "Barishal",    color: "from-orange-400 to-red-500",    order: 2, isPublished: true,  quote: "Before joining 1000MM, I was struggling with my faith and purpose. The training in the Philippines and my mission assignment in northern Bangladesh completely changed me. I learned how to share the Gospel through health education. Many families who never heard about Jesus before opened their hearts. This one year gave me a new identity in Christ." },
    { name: "Timothy Gomes",  location: "Chattogram",  color: "from-emerald-500 to-teal-600",  order: 3, isPublished: true,  quote: "I left my job to serve as a missionary for one year. It was not easy, but it was worth it. My team and I planted a new church in a village near Bandarban. We faced many challenges, but God performed miracles. Today that small group has grown to more than 45 members. I discovered that when we step out in faith, God steps in with power." },
    { name: "Esther Akter",   location: "Khulna",      color: "from-amber-400 to-orange-500",  order: 4, isPublished: true,  quote: "As a young woman, I was nervous about going into mission work. But the 1000 Missionary Movement gave me confidence and purpose. I served in a remote area focusing on women and children's ministry. Seeing hopeless mothers find hope in Jesus was the most beautiful experience. I now understand that God can use anyone who is willing." },
    { name: "Immanuel Paul",  location: "Rajshahi",    color: "from-green-500 to-lime-600",    order: 5, isPublished: true,  quote: "The 1000MM experience taught me the real meaning of sacrifice. I left my comfortable city life and lived in a simple village for 10 months. Through literature distribution and Bible studies, we baptized 18 precious souls. My own spiritual life grew deeper than ever. This movement is truly raising a new generation of committed youth for God." },
    { name: "Hannah D'Costa", location: "Sylhet",      color: "from-rose-400 to-orange-400",   order: 6, isPublished: true,  quote: "God called me during a youth camp, and I answered. Serving as a 1000 missionary in a different culture taught me humility and dependence on God. I worked with media and digital evangelism, reaching hundreds of young people online. Many told me they found Christ through the videos we created. I came back changed — on fire for mission!" },
    { name: "Joseph Mondal",  location: "Mymensingh",  color: "from-blue-400 to-indigo-600",   order: 7, isPublished: false, quote: "This testimony is a draft and should not appear on the public website until published. Use this entry to test the Unpublish → Publish flow in the SA testimonies admin." },
  ];

  for (const t of testimonies) {
    await prisma.testimony.create({ data: t });
  }

  console.log(`✓ Seeded ${testimonies.length} testimonies (6 published, 1 draft)`);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

async function seedProjects() {
  const projects = [
    {
      slug: "training-center", status: "Active", title: "1000MM Bangladesh Training Center", subtitle: "A Legacy in the Making",
      description: "Groundbreaking held on December 10, 2025 at BASC Campus. Help complete a fully functioning missionary training center that will prepare generations of gospel workers for Bangladesh and beyond.",
      location: "BASC Campus, Bangladesh", date: "Dec 10, 2025 — Ongoing", images: ["/images/projects/training-center.jpg"],
      tags: ["Construction", "Training", "Mission"], order: 1,
    },
    {
      slug: "batch-29", status: "Active", title: "29th Batch Missionary Training Program 2026", subtitle: "29 Years of Faithful Mission",
      description: "An intensive four-week residential training program at BANC, Gazipur preparing 60–100 young missionaries in evangelism, health ministry, leadership, and digital outreach. Total budget: BDT 1,891,382 (≈ USD 15,503).",
      location: "BANC Campus, Gazipur, Bangladesh", date: "Oct 04–31, 2026", images: ["/images/projects/batch-29/batch-29-1.jpg"],
      tags: ["Training", "Evangelism", "Youth"], order: 2,
    },
    {
      slug: "bicycle-for-missionaries", status: "Active", title: "Wheels for Mission: Bicycles for Missionaries", subtitle: "Every Bicycle Carries the Gospel",
      description: "Providing 60 durable bicycles to missionaries serving rural villages, riverine regions, and remote communities — cutting travel time and cost so they can reach more people, strengthen churches, and disciple new believers. Total budget: ≈ USD 17,300.",
      location: "Rural & remote communities, Bangladesh", date: "2026 — Ongoing", images: ["/images/projects/bicycle-ministry/bicycle-ministry-1.jpg"],
      tags: ["Transportation", "Evangelism", "Sustainability"], order: 3,
    },
    {
      slug: "medical-kits", status: "Active", title: "Medical Kits for Missionaries", subtitle: "Healing Hands, Open Doors",
      description: "Equipping 60 missionaries with portable medical kit boxes — blood pressure monitors, glucometers, pulse oximeters, first-aid supplies and more — so they can meet physical needs, build trust, and open doors for the Gospel. Total budget: ≈ USD 16,275.",
      location: "Villages, slums, coastal & hill areas, Bangladesh", date: "2026 — Ongoing", images: ["/images/projects/medical-kits/medical-kits-1.jpg"],
      tags: ["Healthcare", "Compassion", "Evangelism"], order: 4,
    },
  ];

  for (const p of projects) {
    await prisma.project.upsert({ where: { slug: p.slug }, update: { ...p, isPublished: true }, create: { ...p, isPublished: true } });
  }

  console.log(`✓ Seeded ${projects.length} projects`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Seeding 1000MM database (large seed)...\n");

  const missions      = await seedLocalMissions();
  const users         = await seedUsers(missions);
  const programs      = await seedPrograms(users.admin.id);
  const topics        = await seedProgramTopics(programs, users.trainers);
  const assignments   = await seedAssignments(topics, programs, users.admin.id);
  await seedResources(programs, users.admin.id);

  const allTrainees = users.trainees.map((t, i) => ({
    ...t,
    isMissionary: TRAINEE_SPECS[i]?.isMissionary ?? false,
    homeMissionId: t.homeMissionId as string,
  }));

  const applications = await seedApplications(allTrainees, programs, users.admin.id);
  await seedAssignmentSubmissions(assignments, applications, users.admin.id);
  await seedAttendanceScans(applications, users.admin.id);
  await seedFieldReports(applications);
  await seedFieldReportComments(users.admin.id, users.lmds);
  await seedRecommendations(applications, users.lmds, missions);
  await seedLmdReports(users.lmds, missions, users.admin.id);

  const missionaries = allTrainees.filter((t) => t.isMissionary);
  await seedMissionaryDeployments(missionaries, users.lmds, missions, users.admin.id);
  await seedSalary(missions, allTrainees, users.admin.id);
  await seedFinancial(missions, users.admin.id);
  await seedUrgentReports(users.admin.id, missionaries);
  await seedTrainerApplications(users.admin.id);
  await seedFlagRequests(missionaries, users.lmds, users.admin.id);
  await seedDonations();
  await seedContactMessages(users.admin.id);

  const allUsers = [
    ...users.trainees, ...users.trainers,
    ...users.lmds.map((l) => l.user),
    users.admin, users.director, users.secretary, users.assocDirector,
  ];
  await seedNotifications(allUsers);
  await seedComplaints(allUsers);
  await seedAnnouncements(users.admin.id);
  await seedSystemSettings();
  await seedTestimonies();
  await seedProjects();

  console.log("\n✅ Large seed complete.\n");
  console.log("  SA:          admin@1000mm.local            / Admin!2026");
  console.log("  UD:          director@1000mm.local         / Director!2026");
  console.log("  SEC:         secretary@1000mm.local        / Staff!2026");
  console.log("  AD:          assoc@1000mm.local            / Staff!2026");
  console.log("  LMD-EBM:     lmd.ebm@1000mm.local         / Lmd!2026");
  console.log("  LMD-NBM:     lmd.nbm@1000mm.local         / Lmd!2026");
  console.log("  LMD-SBM:     lmd.sbm@1000mm.local         / Lmd!2026");
  console.log("  LMD-WBM:     lmd.wbm@1000mm.local         / Lmd!2026");
  console.log("  Trainer:     trainer1@1000mm.local         / Trainer!2026");
  console.log("  Trainee:     trainee.ebm1@1000mm.local     / Trainee!2026");
  console.log("  Missionary:  missionary.ebm1@1000mm.local  / Trainee!2026");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
