/**
 * Prisma Seed Script — 1000MM Training Platform
 * Includes rich test data: programs, windows, and applicants across all missions
 */
/// <reference types="node" />
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { PrismaClient, LocalMissionCode, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10; // lower for seed speed

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

// ─── Bangladeshi names for realistic test data ─────────────────────────────

const FIRST_NAMES_MALE = [
  "Rahul",
  "Arif",
  "Sumon",
  "Rajib",
  "Tanvir",
  "Sabbir",
  "Milon",
  "Ripon",
  "Sajib",
  "Farhan",
  "Imran",
  "Karim",
  "Nabil",
  "Omi",
  "Palash",
  "Rohan",
  "Sohel",
  "Tushar",
  "Utpal",
  "Wahid",
];
const FIRST_NAMES_FEMALE = [
  "Priya",
  "Sonia",
  "Riya",
  "Mitu",
  "Lipi",
  "Tania",
  "Ruma",
  "Shila",
  "Puja",
  "Nila",
  "Mim",
  "Lima",
  "Kona",
  "Jharna",
  "Ira",
  "Hema",
  "Gitika",
  "Faria",
  "Eva",
  "Dipa",
];
const LAST_NAMES = [
  "Das",
  "Roy",
  "Sarkar",
  "Biswas",
  "Paul",
  "Ghosh",
  "Mondal",
  "Saha",
  "Dey",
  "Nath",
  "Barman",
  "Chakraborty",
  "Haldar",
  "Islam",
  "Rahman",
  "Hossain",
  "Ahmed",
  "Khan",
  "Akter",
  "Begum",
];
const DISTRICTS = [
  "Dhaka",
  "Chittagong",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barisal",
  "Rangpur",
  "Mymensingh",
  "Comilla",
  "Gazipur",
  "Narayanganj",
  "Tangail",
];
const CHURCHES = [
  "Dhaka SDA Church",
  "Chittagong Central Church",
  "Sylhet Mission Church",
  "Rajshahi SDA Church",
  "Khulna SDA Church",
  "Barisal SDA Church",
];

// ─── SEED LOCAL MISSIONS ──────────────────────────────────────────────────────

async function seedLocalMissions() {
  const missions = [
    {
      code: LocalMissionCode.EBM,
      name: "East Bangladesh Mission",
      nameBangla: "পূর্ব বাংলাদেশ মিশন",
      description: "Serving the eastern divisions of Bangladesh.",
    },
    {
      code: LocalMissionCode.NBM,
      name: "North Bangladesh Mission",
      nameBangla: "উত্তর বাংলাদেশ মিশন",
      description: "Serving the northern divisions of Bangladesh.",
    },
    {
      code: LocalMissionCode.SBM,
      name: "South Bangladesh Mission",
      nameBangla: "দক্ষিণ বাংলাদেশ মিশন",
      description: "Serving the southern divisions of Bangladesh.",
    },
    {
      code: LocalMissionCode.WBM,
      name: "West Bangladesh Mission",
      nameBangla: "পশ্চিম বাংলাদেশ মিশন",
      description: "Serving the western divisions of Bangladesh.",
    },
  ];
  for (const m of missions) {
    await prisma.localMission.upsert({
      where: { code: m.code },
      update: {
        name: m.name,
        nameBangla: m.nameBangla,
        description: m.description,
      },
      create: m,
    });
  }
  console.log("✓ Seeded 4 Local Missions");
}

// ─── SEED SYSTEM ADMIN ────────────────────────────────────────────────────────

async function seedSystemAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME ?? "System Administrator";
  if (!email || !password) {
    console.warn("⚠ Skipping System Admin seed");
    return;
  }
  const ebm = await prisma.localMission.findUniqueOrThrow({
    where: { code: LocalMissionCode.EBM },
  });
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      fullName,
      role: UserRole.SYSTEM_ADMIN,
      homeMissionId: ebm.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log(`✓ Seeded System Admin: ${email}`);
  return admin;
}

// ─── SEED UNION DIRECTOR ──────────────────────────────────────────────────────

async function seedDirector() {
  const email = process.env.SEED_DIRECTOR_EMAIL ?? "director@1000mm.local";
  const password = process.env.SEED_DIRECTOR_PASSWORD ?? "DirectorPass!2026";
  const fullName = process.env.SEED_DIRECTOR_NAME ?? "Union Director";
  const ebm = await prisma.localMission.findUniqueOrThrow({
    where: { code: LocalMissionCode.EBM },
  });
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      fullName,
      role: UserRole.MAIN_DIRECTOR,
      homeMissionId: ebm.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log(`✓ Seeded Union Director: ${email}`);
}

// ─── SEED LMDs ────────────────────────────────────────────────────────────────

async function seedLmds() {
  const defaultPassword = process.env.SEED_LMD_PASSWORD ?? "LmdPass!2026";
  const passwordHash = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);
  const lmdDefs = [
    {
      code: LocalMissionCode.EBM,
      email: process.env.SEED_LMD_EBM_EMAIL ?? "lmd.ebm@1000mm.local",
      fullName: "EBM Local Director",
    },
    {
      code: LocalMissionCode.NBM,
      email: process.env.SEED_LMD_NBM_EMAIL ?? "lmd.nbm@1000mm.local",
      fullName: "NBM Local Director",
    },
    {
      code: LocalMissionCode.SBM,
      email: process.env.SEED_LMD_SBM_EMAIL ?? "lmd.sbm@1000mm.local",
      fullName: "SBM Local Director",
    },
    {
      code: LocalMissionCode.WBM,
      email: process.env.SEED_LMD_WBM_EMAIL ?? "lmd.wbm@1000mm.local",
      fullName: "WBM Local Director",
    },
  ];
  for (const def of lmdDefs) {
    const mission = await prisma.localMission.findUniqueOrThrow({
      where: { code: def.code },
    });
    const lmd = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        email: def.email,
        passwordHash,
        fullName: def.fullName,
        role: UserRole.LOCAL_DIRECTOR,
        homeMissionId: mission.id,
        emailVerified: new Date(),
        isActive: true,
      },
    });
    if (!mission.directorId || mission.directorId === lmd.id) {
      await prisma.localMission.update({
        where: { id: mission.id },
        data: { directorId: lmd.id },
      });
    }
    console.log(`✓ Seeded LMD for ${def.code}: ${def.email}`);
  }
}

// ─── SEED TRAINING PROGRAMS ───────────────────────────────────────────────────

async function seedPrograms(adminId: string) {
  const programs = [
    // 2024 — archived cycle
    {
      code: "1000MM-2024",
      title: "1000MM Missionary Training Program 2024",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৪",
      category: "SPIRITUAL" as const,
      summary: "The 2024 missionary training cycle.",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2024-12-31"),
      location: "Dhaka, Bangladesh",
      targetIntake: 80,
      isPublished: false,
      windowState: "ARCHIVED" as const,
      windowOpen: new Date("2024-01-01"),
      windowClose: new Date("2024-05-31"),
      trainingStart: new Date("2024-07-01"),
    },
    // 2025 — closed cycle
    {
      code: "1000MM-2025",
      title: "1000MM Missionary Training Program 2025",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৫",
      category: "SPIRITUAL" as const,
      summary: "The 2025 missionary training cycle.",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-12-31"),
      location: "Dhaka, Bangladesh",
      targetIntake: 90,
      isPublished: false,
      windowState: "CLOSED" as const,
      windowOpen: new Date("2025-01-15"),
      windowClose: new Date("2025-05-31"),
      trainingStart: new Date("2025-07-01"),
    },
    // 2026 — active open
    {
      code: "1000MM-2026",
      title: "1000MM Missionary Training Program 2026",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৬",
      category: "SPIRITUAL" as const,
      summary: "A comprehensive missionary training program for Bangladesh.",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-12-31"),
      location: "Dhaka, Bangladesh",
      targetIntake: 100,
      isPublished: true,
      windowState: "OPEN" as const,
      windowOpen: new Date("2026-01-01"),
      windowClose: new Date("2026-12-31"),
      trainingStart: new Date("2026-07-01"),
    },
    // 2026 Leadership — second active program
    {
      code: "1000MM-2026-L",
      title: "1000MM Leadership Development Program 2026",
      titleBangla: "১০০০এমএম নেতৃত্ব উন্নয়ন কার্যক্রম ২০২৬",
      category: "MENTAL" as const,
      summary: "Leadership and discipleship training for senior missionaries.",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-11-30"),
      location: "Chittagong, Bangladesh",
      targetIntake: 40,
      isPublished: true,
      windowState: "OPEN" as const,
      windowOpen: new Date("2026-03-01"),
      windowClose: new Date("2026-07-31"),
      trainingStart: new Date("2026-08-01"),
    },
    // 2027 — draft for next cycle
    {
      code: "1000MM-2027",
      title: "1000MM Missionary Training Program 2027",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৭",
      category: "SPIRITUAL" as const,
      summary: "Upcoming 2027 cycle.",
      startDate: new Date("2027-07-01"),
      endDate: new Date("2027-12-31"),
      location: "Dhaka, Bangladesh",
      targetIntake: 120,
      isPublished: false,
      windowState: "DRAFT" as const,
      windowOpen: new Date("2027-01-01"),
      windowClose: new Date("2027-12-31"),
      trainingStart: new Date("2027-07-01"),
    },
  ];

  const createdPrograms: Record<string, string> = {}; // code → id

  for (const p of programs) {
    const program = await prisma.trainingProgram.upsert({
      where: { code: p.code },
      update: { isPublished: p.isPublished },
      create: {
        code: p.code,
        title: p.title,
        titleBangla: p.titleBangla,
        category: p.category,
        summary: p.summary,
        startDate: p.startDate,
        endDate: p.endDate,
        location: p.location,
        targetIntake: p.targetIntake,
        isPublished: p.isPublished,
      },
    });
    createdPrograms[p.code] = program.id;

    // Create window if not exists
    const existingWindow = await prisma.applicationWindow.findFirst({
      where: { programId: program.id, deletedAt: null },
    });

    if (!existingWindow) {
      await prisma.applicationWindow.create({
        data: {
          programId: program.id,
          scopedToMissionId: null,
          state: p.windowState,
          advertisingStartDate: p.windowOpen,
          applicationOpenDate: p.windowOpen,
          applicationCloseDate: p.windowClose,
          trainingStartDate: p.trainingStart,
          targetIntake: p.targetIntake,
          notes: `Dev seed window for ${p.code}.`,
          createdById: adminId,
        },
      });
    } else {
      await prisma.applicationWindow.update({
        where: { id: existingWindow.id },
        data: { state: p.windowState },
      });
    }

    console.log(`✓ Seeded program: ${p.code} (${p.windowState})`);
  }

  return createdPrograms;
}

// ─── SEED APPLICANTS ──────────────────────────────────────────────────────────

type AppStatus =
  | "SUBMITTED"
  | "UNDER_LMD_REVIEW"
  | "RETURNED_TO_APPLICANT"
  | "RECOMMENDED"
  | "UNDER_MAIN_DIRECTOR_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

async function seedApplicants(programCodes: Record<string, string>) {
  const APPLICANT_PASSWORD_HASH = await bcrypt.hash(
    "Trainee!2026",
    BCRYPT_ROUNDS,
  );
  const missions = await prisma.localMission.findMany({
    where: { deletedAt: null },
  });
  const missionMap = Object.fromEntries(missions.map((m) => [m.code, m]));

  // Get windows for each program
  const windows = await prisma.applicationWindow.findMany({
    where: { programId: { in: Object.values(programCodes) }, deletedAt: null },
  });
  const windowByProgram = Object.fromEntries(
    windows.map((w) => [w.programId, w]),
  );

  // Distribution: most apps in 2026, fewer in 2025 and 2024
  const BATCHES: Array<{
    programCode: string;
    count: number;
    statuses: AppStatus[];
  }> = [
    {
      programCode: "1000MM-2024",
      count: 18,
      statuses: [
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "REJECTED",
        "REJECTED",
        "REJECTED",
        "WITHDRAWN",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "REJECTED",
        "ACCEPTED",
        "ACCEPTED",
      ],
    },
    {
      programCode: "1000MM-2025",
      count: 28,
      statuses: [
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "REJECTED",
        "REJECTED",
        "REJECTED",
        "REJECTED",
        "REJECTED",
        "RETURNED_TO_APPLICANT",
        "WITHDRAWN",
        "WITHDRAWN",
        "RECOMMENDED",
        "RECOMMENDED",
        "UNDER_MAIN_DIRECTOR_REVIEW",
        "ACCEPTED",
        "ACCEPTED",
      ],
    },
    {
      programCode: "1000MM-2026",
      count: 47,
      statuses: [
        // Pipeline mix for current year — most still in progress
        "SUBMITTED",
        "SUBMITTED",
        "SUBMITTED",
        "SUBMITTED",
        "SUBMITTED",
        "UNDER_LMD_REVIEW",
        "UNDER_LMD_REVIEW",
        "UNDER_LMD_REVIEW",
        "UNDER_LMD_REVIEW",
        "UNDER_LMD_REVIEW",
        "UNDER_LMD_REVIEW",
        "UNDER_LMD_REVIEW",
        "UNDER_LMD_REVIEW",
        "RETURNED_TO_APPLICANT",
        "RETURNED_TO_APPLICANT",
        "RETURNED_TO_APPLICANT",
        "RECOMMENDED",
        "RECOMMENDED",
        "RECOMMENDED",
        "RECOMMENDED",
        "RECOMMENDED",
        "RECOMMENDED",
        "RECOMMENDED",
        "UNDER_MAIN_DIRECTOR_REVIEW",
        "UNDER_MAIN_DIRECTOR_REVIEW",
        "UNDER_MAIN_DIRECTOR_REVIEW",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "REJECTED",
        "REJECTED",
        "REJECTED",
        "REJECTED",
        "WITHDRAWN",
        "WITHDRAWN",
        "SUBMITTED",
        "SUBMITTED",
        "SUBMITTED",
      ],
    },
    {
      programCode: "1000MM-2026-L",
      count: 14,
      statuses: [
        "SUBMITTED",
        "SUBMITTED",
        "UNDER_LMD_REVIEW",
        "UNDER_LMD_REVIEW",
        "UNDER_LMD_REVIEW",
        "RECOMMENDED",
        "RECOMMENDED",
        "RECOMMENDED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "ACCEPTED",
        "REJECTED",
        "WITHDRAWN",
      ],
    },
  ];

  let totalCreated = 0;

  for (const batch of BATCHES) {
    const programId = programCodes[batch.programCode];
    if (!programId) continue;
    const window = windowByProgram[programId];
    if (!window) continue;

    const missionCodes = [
      LocalMissionCode.EBM,
      LocalMissionCode.NBM,
      LocalMissionCode.SBM,
      LocalMissionCode.WBM,
    ];

    for (let i = 0; i < batch.count; i++) {
      const gender = Math.random() > 0.35 ? "MALE" : "FEMALE";
      const firstName =
        gender === "MALE"
          ? randomFrom(FIRST_NAMES_MALE)
          : randomFrom(FIRST_NAMES_FEMALE);
      const lastName = randomFrom(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const emailLocal = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${batch.programCode.toLowerCase().replace(/-/g, "")}.${i}`;
      const email = `${emailLocal}@test.local`;
      const missionCode = missionCodes[i % 4];
      const mission = missionMap[missionCode];
      const status = batch.statuses[i] ?? "SUBMITTED";
      const dob = randomDate(new Date("1990-01-01"), new Date("2005-01-01"));
      const age = new Date().getFullYear() - dob.getFullYear();
      const submittedAt = randomDate(
        new Date(window.applicationOpenDate),
        new Date(Math.min(window.applicationCloseDate.getTime(), Date.now())),
      );

      // Create user if not exists
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: APPLICANT_PASSWORD_HASH,
          fullName,
          role: UserRole.TRAINEE,
          homeMissionId: mission.id,
          emailVerified: new Date(),
          isActive: true,
        },
      });

      // Skip if application already exists for this user+window
      const existing = await prisma.application.findFirst({
        where: { applicantId: user.id, windowId: window.id },
      });
      if (existing) continue;

      // Generate reference number
      const year = submittedAt.getFullYear();
      const counter = await prisma.applicationCounter.upsert({
        where: { missionCode_year: { missionCode, year } },
        update: { lastSerial: { increment: 1 } },
        create: { missionCode, year, lastSerial: 1 },
      });
      const referenceNumber = `${missionCode}-${year}-${String(counter.lastSerial).padStart(5, "0")}`;

      // Determine timestamps based on status
      const lmdReviewStartedAt = [
        "UNDER_LMD_REVIEW",
        "RETURNED_TO_APPLICANT",
        "RECOMMENDED",
        "UNDER_MAIN_DIRECTOR_REVIEW",
        "ACCEPTED",
        "REJECTED",
      ].includes(status)
        ? new Date(submittedAt.getTime() + randomInt(1, 5) * 86400000)
        : null;
      const lmdReviewCompletedAt =
        [
          "RECOMMENDED",
          "UNDER_MAIN_DIRECTOR_REVIEW",
          "ACCEPTED",
          "REJECTED",
        ].includes(status) && lmdReviewStartedAt
          ? new Date(lmdReviewStartedAt.getTime() + randomInt(2, 14) * 86400000)
          : null;
      const directorReviewStartedAt =
        ["UNDER_MAIN_DIRECTOR_REVIEW", "ACCEPTED", "REJECTED"].includes(
          status,
        ) && lmdReviewCompletedAt
          ? new Date(
              lmdReviewCompletedAt.getTime() + randomInt(1, 3) * 86400000,
            )
          : null;
      const directorReviewCompletedAt =
        ["ACCEPTED", "REJECTED"].includes(status) && directorReviewStartedAt
          ? new Date(
              directorReviewStartedAt.getTime() + randomInt(1, 7) * 86400000,
            )
          : null;

      const application = await prisma.application.create({
        data: {
          referenceNumber,
          applicantId: user.id,
          windowId: window.id,
          submittedFromMissionId: mission.id,
          status,
          submittedAt,
          lastTransitionAt:
            directorReviewCompletedAt ??
            lmdReviewCompletedAt ??
            lmdReviewStartedAt ??
            submittedAt,
          // Personal details
          applicantFullName: fullName,
          applicantFullNameBangla: null,
          applicantDateOfBirth: dob,
          applicantAge: age,
          applicantGender: gender as any,
          applicantBloodType: randomFrom([
            "A_POS",
            "A_NEG",
            "B_POS",
            "B_NEG",
            "AB_POS",
            "O_POS",
            "O_NEG",
          ]) as any,
          applicantMaritalStatus: randomFrom(["SINGLE", "MARRIED"]) as any,
          applicantDenomination: "SEVENTH_DAY_ADVENTIST" as any,
          applicantMobileNo: `01${randomInt(700000000, 999999999)}`,
          applicantEmail: email,
          applicantPlaceOfBirth: randomFrom(DISTRICTS),
          applicantHeight: randomInt(155, 185),
          applicantWeight: randomInt(50, 85),
          applicantChurchName: randomFrom(CHURCHES),
          applicantDateOfBaptism: new Date(
            dob.getTime() + randomInt(10, 20) * 365 * 86400000,
          ),
          applicantWorkplace: randomFrom([
            "Student",
            "Teacher",
            "Farmer",
            "Business",
            null,
            null,
          ]),
          // Address
          presentAddressDistrict: randomFrom(DISTRICTS),
          presentAddressUpazila: "Sadar",
          presentAddressPostOffice: "Main Post Office",
          presentAddressVillage: `Village ${randomInt(1, 50)}`,
          permanentSameAsPresent: Math.random() > 0.4,
          permanentAddressDistrict: randomFrom(DISTRICTS),
          permanentAddressUpazila: "Sadar",
          permanentAddressPostOffice: "Main Post Office",
          permanentAddressVillage: `Village ${randomInt(1, 50)}`,
          // Family
          fatherName: `${randomFrom(FIRST_NAMES_MALE)} ${lastName}`,
          fatherAge: randomInt(45, 70),
          fatherReligion: "CHRISTIANITY" as any,
          fatherChurchName: randomFrom(CHURCHES),
          motherName: `${randomFrom(FIRST_NAMES_FEMALE)} ${lastName}`,
          motherAge: randomInt(40, 65),
          motherReligion: "CHRISTIANITY" as any,
          motherChurchName: randomFrom(CHURCHES),
          familyMobileNo: `01${randomInt(700000000, 999999999)}`,
          // Form data
          formData: {
            education: [
              {
                id: `edu-${i}-1`,
                degree: randomFrom(["SSC", "HSC", "Bachelor", "Master"]),
                institutionName: `${randomFrom(DISTRICTS)} College`,
                gpa: (randomInt(30, 50) / 10).toFixed(2),
                passingYear: randomInt(2010, 2023),
              },
            ],
            missionaryDesire:
              "I feel called to serve the Lord in missionary work and spread the gospel across Bangladesh.",
            courtRecord: false,
            healthCondition: false,
            badHabits: false,
            declarationAccepted: true,
          },
          // Review timestamps
          lmdReviewStartedAt,
          lmdReviewCompletedAt,
          directorReviewStartedAt,
          directorReviewCompletedAt,
          // Rejection reason for rejected apps
          rejectionReason:
            status === "REJECTED" && directorReviewCompletedAt
              ? "Application did not meet the programme requirements for this cycle."
              : null,
          lmdRejectionReason: null,
        },
      });

      // Create recommendation for recommended/accepted/director_review apps
      if (
        [
          "RECOMMENDED",
          "UNDER_MAIN_DIRECTOR_REVIEW",
          "ACCEPTED",
          "REJECTED",
        ].includes(status) &&
        lmdReviewCompletedAt
      ) {
        const lmd = await prisma.user.findFirst({
          where: { role: "LOCAL_DIRECTOR", homeMissionId: mission.id },
        });
        if (lmd) {
          await prisma.recommendation.upsert({
            where: { applicationId: application.id },
            update: {},
            create: {
              applicationId: application.id,
              recommenderId: lmd.id,
              writtenComment:
                "I recommend this applicant. They have shown strong commitment to the mission.",
              recommendedAt: lmdReviewCompletedAt,
            },
          });
          await prisma.application.update({
            where: { id: application.id },
            data: { lmdReviewerId: lmd.id },
          });
        }
      }

      totalCreated++;
    }

    console.log(`✓ Seeded ${batch.count} applicants for ${batch.programCode}`);
  }

  console.log(`✓ Total applications created: ${totalCreated}`);
}

// ─── SEED SYSTEM SETTINGS ─────────────────────────────────────────────────────

async function seedSystemSettings() {
  const defaults = [
    {
      key: "site.organization_name_en",
      value: "1000 Missionary Movement Bangladesh",
      description: "Organization display name (English)",
    },
    {
      key: "site.organization_name_bn",
      value: "১০০০ মিশনারি মুভমেন্ট বাংলাদেশ",
      description: "Organization display name (Bangla)",
    },
    {
      key: "auth.session_timeout_minutes_staff",
      value: 30,
      description: "Inactivity timeout for staff sessions",
    },
    {
      key: "auth.session_timeout_minutes_trainee",
      value: 10080,
      description: "Inactivity timeout for trainee sessions",
    },
    {
      key: "auth.max_failed_login_attempts",
      value: 10,
      description: "Failed logins before account lockout",
    },
    {
      key: "auth.lockout_minutes",
      value: 15,
      description:
        "How long an account stays locked after exceeding failed attempts",
    },
    {
      key: "application.form_current_version",
      value: 1,
      description: "Bio-data form schema version",
    },
    {
      key: "donation.preset_amounts_bdt",
      value: [500, 1000, 2500, 5000, 10000],
      description: "Preset donation amounts shown to BDT donors",
    },
    {
      key: "donation.preset_amounts_usd",
      value: [10, 25, 50, 100, 250],
      description: "Preset donation amounts shown to USD donors",
    },
    {
      key: "donation.gateways_enabled",
      value: { STRIPE: false, PAYPAL: false, SSLCOMMERZ: false, BKASH: false },
      description: "Per-gateway enabled flag",
    },
  ];
  for (const s of defaults) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: s.value as never,
        description: s.description,
      },
    });
  }
  console.log(`✓ Seeded ${defaults.length} system settings`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding 1000MM database with test data…\n");
  await seedLocalMissions();
  const admin = await seedSystemAdmin();
  await seedDirector();
  await seedLmds();
  const programCodes = await seedPrograms(
    admin?.id ??
      (await prisma.user.findFirstOrThrow({ where: { role: "SYSTEM_ADMIN" } }))
        .id,
  );
  await seedApplicants(programCodes);
  await seedSystemSettings();

  console.log("\n── Dev Credentials ────────────────────────────────────────");
  console.log("  Admin:    admin@1000mm.local    / ChangeMe!Now");
  console.log("  Director: director@1000mm.local / DirectorPass!2026");
  console.log("  LMD EBM:  lmd.ebm@1000mm.local / LmdPass!2026");
  console.log("  LMD NBM:  lmd.nbm@1000mm.local / LmdPass!2026");
  console.log("  LMD SBM:  lmd.sbm@1000mm.local / LmdPass!2026");
  console.log("  LMD WBM:  lmd.wbm@1000mm.local / LmdPass!2026");
  console.log("  Trainees: {name}.{programcode}.{n}@test.local / Trainee!2026");
  console.log("────────────────────────────────────────────────────────────");
  console.log("\n── Test Data Summary ──────────────────────────────────────");
  console.log(
    "  Programs:  5  (2024 archived, 2025 closed, 2026 open, 2026-L open, 2027 draft)",
  );
  console.log("  Applicants: ~107 across all cycles");
  console.log(
    "  Pipeline mix: SUBMITTED → ACCEPTED, REJECTED, RECOMMENDED, etc.",
  );
  console.log("────────────────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
