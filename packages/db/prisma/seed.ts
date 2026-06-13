/**
 * Prisma Seed Script — 1000MM Training Platform
 *
 * Run from repository root:
 *   pnpm --filter @1000mm/db db:seed
 *
 * This seed creates:
 *   - 4 Local Missions
 *   - admin, director, 4 LMDs, 2 trainers, 4 trainees
 *   - 5 programs with windows in OPEN/CLOSED/ARCHIVED/DRAFT states
 *   - applications across roles, statuses, and missions
 *   - notifications, complaints, announcements, donations, and field reports
 */
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcrypt";
import {
  PrismaClient,
  LocalMissionCode,
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
  Religion,
} from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function randomPhone() {
  return `01${randomInt(11, 99)}${randomInt(100000, 999999)}`;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FIRST_NAMES = [
  "Rahul",
  "Arif",
  "Sumon",
  "Priya",
  "Sonia",
  "Riya",
  "Rajib",
  "Tania",
  "Tanvir",
  "Mitu",
  "Sabbir",
  "Rohan",
  "Lipi",
  "Nabil",
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
  "Ahmed",
  "Khan",
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
];
const CHURCHES = [
  "Dhaka SDA Church",
  "Chittagong Central Church",
  "Sylhet Mission Church",
  "Rajshahi SDA Church",
  "Khulna SDA Church",
  "Barisal SDA Church",
];
const TRAINING_CATEGORIES: TrainingCategory[] = [
  TrainingCategory.SPIRITUAL,
  TrainingCategory.MENTAL,
  TrainingCategory.PHYSICAL,
  TrainingCategory.SOCIAL,
];
const BLOOD_TYPES = [
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
] as const;

function buildName(seed: string) {
  return `${seed} ${randomItem(LAST_NAMES)}`;
}

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

  const created = {} as Record<LocalMissionCode, { id: string }>;
  for (const mission of missions) {
    const record = await prisma.localMission.upsert({
      where: { code: mission.code },
      update: mission,
      create: mission,
    });
    created[mission.code] = record;
  }

  console.log("✓ Local missions seeded");
  return created;
}

async function seedUsers(missions: Record<LocalMissionCode, { id: string }>) {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!Now";
  const directorPassword =
    process.env.SEED_DIRECTOR_PASSWORD ?? "DirectorPass!2026";
  const lmdPassword = process.env.SEED_LMD_PASSWORD ?? "LmdPass!2026";

  const passwordHashes = {
    admin: await bcrypt.hash(adminPassword, BCRYPT_ROUNDS),
    director: await bcrypt.hash(directorPassword, BCRYPT_ROUNDS),
    lmd: await bcrypt.hash(lmdPassword, BCRYPT_ROUNDS),
    trainer: await bcrypt.hash("Trainer!2026", BCRYPT_ROUNDS),
    trainee: await bcrypt.hash("Trainee!2026", BCRYPT_ROUNDS),
  };

  const admin = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@1000mm.local" },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@1000mm.local",
      passwordHash: passwordHashes.admin,
      fullName: process.env.SEED_ADMIN_NAME ?? "System Administrator",
      role: UserRole.SYSTEM_ADMIN,
      homeMissionId: missions.EBM.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const director = await prisma.user.upsert({
    where: {
      email: process.env.SEED_DIRECTOR_EMAIL ?? "director@1000mm.local",
    },
    update: {},
    create: {
      email: process.env.SEED_DIRECTOR_EMAIL ?? "director@1000mm.local",
      passwordHash: passwordHashes.director,
      fullName: process.env.SEED_DIRECTOR_NAME ?? "Union Director",
      role: UserRole.MAIN_DIRECTOR,
      homeMissionId: missions.EBM.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const lmds = await Promise.all(
    Object.entries(missions).map(async ([code, mission]) => {
      const email = `lmd.${code.toLowerCase()}@1000mm.local`;
      const fullName = `${code} Local Director`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: passwordHashes.lmd,
          fullName,
          role: UserRole.LOCAL_DIRECTOR,
          homeMissionId: mission.id,
          emailVerified: new Date(),
          isActive: true,
        },
      });
      await prisma.localMission.update({
        where: { id: mission.id },
        data: { directorId: user.id },
      });
      return user;
    }),
  );

  const trainers = await Promise.all(
    ["sabin", "nushrat"].map(async (name, index) => {
      const email = `trainer${index + 1}@1000mm.local`;
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: passwordHashes.trainer,
          fullName: `${name[0].toUpperCase()}${name.slice(1)} Trainer`,
          role: UserRole.TRAINER,
          homeMissionId: missions.WBM.id,
          emailVerified: new Date(),
          isActive: true,
        },
      });
    }),
  );

  const trainees = await Promise.all(
    ["raju", "mina", "hasan", "tania"].map(async (name, index) => {
      const email = `trainee${index + 1}@1000mm.local`;
      const mission =
        missions[Object.keys(missions)[index % 4] as LocalMissionCode];
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: passwordHashes.trainee,
          fullName: `${name[0].toUpperCase()}${name.slice(1)} Trainee`,
          role: UserRole.TRAINEE,
          homeMissionId: mission.id,
          emailVerified: new Date(),
          isActive: true,
        },
      });
    }),
  );

  console.log("✓ Users seeded");
  return { admin, director, lmds, trainers, trainees };
}

async function seedPrograms(adminId: string) {
  const programs = [
    {
      code: "1000MM-2025",
      title: "1000MM Missionary Training Program 2025",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৫",
      category: TrainingCategory.SPIRITUAL,
      summary: "A previous cycle that is now closed.",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-12-31"),
      location: "Dhaka",
      targetIntake: 70,
      isPublished: false,
      window: {
        state: ApplicationWindowState.CLOSED,
        advertisingStartDate: new Date("2025-01-15"),
        applicationOpenDate: new Date("2025-01-15"),
        applicationCloseDate: new Date("2025-05-31"),
        trainingStartDate: new Date("2025-07-01"),
        targetIntake: 70,
      },
    },
    {
      code: "1000MM-2026",
      title: "1000MM Missionary Training Program 2026",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৬",
      category: TrainingCategory.SPIRITUAL,
      summary: "The current active missionary training program.",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-12-31"),
      location: "Dhaka",
      targetIntake: 90,
      isPublished: true,
      window: {
        state: ApplicationWindowState.OPEN,
        advertisingStartDate: new Date("2026-01-01"),
        applicationOpenDate: new Date("2026-01-01"),
        applicationCloseDate: new Date("2026-12-31"),
        trainingStartDate: new Date("2026-07-01"),
        targetIntake: 90,
      },
    },
    {
      code: "1000MM-2026-L",
      title: "1000MM Leadership Development Program 2026",
      titleBangla: "১০০০এমএম নেতৃত্ব উন্নয়ন কার্যক্রম ২০২৬",
      category: TrainingCategory.MENTAL,
      summary: "Leadership training for senior missionaries.",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-11-30"),
      location: "Chittagong",
      targetIntake: 40,
      isPublished: true,
      window: {
        state: ApplicationWindowState.OPEN,
        advertisingStartDate: new Date("2026-03-01"),
        applicationOpenDate: new Date("2026-03-01"),
        applicationCloseDate: new Date("2026-07-31"),
        trainingStartDate: new Date("2026-08-01"),
        targetIntake: 40,
      },
    },
    {
      code: "1000MM-2024",
      title: "1000MM Missionary Training Program 2024",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৪",
      category: TrainingCategory.SPIRITUAL,
      summary: "An archived 2024 cycle for historical testing.",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2024-12-31"),
      location: "Sylhet",
      targetIntake: 80,
      isPublished: false,
      window: {
        state: ApplicationWindowState.ARCHIVED,
        advertisingStartDate: new Date("2024-01-01"),
        applicationOpenDate: new Date("2024-01-01"),
        applicationCloseDate: new Date("2024-05-31"),
        trainingStartDate: new Date("2024-07-01"),
        targetIntake: 80,
      },
    },
    {
      code: "1000MM-2027",
      title: "1000MM Missionary Training Program 2027",
      titleBangla: "১০০০এমএম মিশনারি প্রশিক্ষণ কার্যক্রম ২০২৭",
      category: TrainingCategory.SPIRITUAL,
      summary: "A draft 2027 cycle that is not yet open.",
      startDate: new Date("2027-07-01"),
      endDate: new Date("2027-12-31"),
      location: "Gazipur",
      targetIntake: 120,
      isPublished: false,
      window: {
        state: ApplicationWindowState.DRAFT,
        advertisingStartDate: new Date("2027-01-01"),
        applicationOpenDate: new Date("2027-01-01"),
        applicationCloseDate: new Date("2027-12-31"),
        trainingStartDate: new Date("2027-07-01"),
        targetIntake: 120,
      },
    },
  ];

  const created = {} as Record<
    string,
    {
      program: { id: string; code: string };
      window: { id: string; state: ApplicationWindowState };
    }
  >;

  for (const program of programs) {
    const createdProgram = await prisma.trainingProgram.upsert({
      where: { code: program.code },
      update: {
        title: program.title,
        titleBangla: program.titleBangla,
        category: program.category,
        summary: program.summary,
        startDate: program.startDate,
        endDate: program.endDate,
        location: program.location,
        targetIntake: program.targetIntake,
        isPublished: program.isPublished,
      },
      create: {
        code: program.code,
        title: program.title,
        titleBangla: program.titleBangla,
        category: program.category,
        summary: program.summary,
        startDate: program.startDate,
        endDate: program.endDate,
        location: program.location,
        targetIntake: program.targetIntake,
        isPublished: program.isPublished,
      },
    });

    const existingWindow = await prisma.applicationWindow.findFirst({
      where: { programId: createdProgram.id, deletedAt: null },
    });

    const window = existingWindow
      ? await prisma.applicationWindow.update({
          where: { id: existingWindow.id },
          data: {
            state: program.window.state,
            advertisingStartDate: program.window.advertisingStartDate,
            applicationOpenDate: program.window.applicationOpenDate,
            applicationCloseDate: program.window.applicationCloseDate,
            trainingStartDate: program.window.trainingStartDate,
            targetIntake: program.window.targetIntake,
            notes: `${program.code} application window`,
            createdById: adminId,
          },
        })
      : await prisma.applicationWindow.create({
          data: {
            programId: createdProgram.id,
            scopedToMissionId: null,
            state: program.window.state,
            advertisingStartDate: program.window.advertisingStartDate,
            applicationOpenDate: program.window.applicationOpenDate,
            applicationCloseDate: program.window.applicationCloseDate,
            trainingStartDate: program.window.trainingStartDate,
            targetIntake: program.window.targetIntake,
            notes: `${program.code} application window`,
            createdById: adminId,
          },
        });

    created[program.code] = { program: createdProgram, window };
  }

  console.log("✓ Programs and windows seeded");
  return created;
}

function buildApplicantData(user: {
  id: string;
  fullName: string;
  email: string;
  homeMissionId: string;
}) {
  const nameParts = user.fullName.split(" ");
  const gender =
    nameParts[0].toLowerCase().includes("mina") ||
    nameParts[0].toLowerCase().includes("tania")
      ? Gender.FEMALE
      : Gender.MALE;
  const age = randomInt(19, 34);
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - age);
  return {
    applicantFullName: user.fullName,
    applicantFullNameBangla: null,
    applicantDateOfBirth: dob,
    applicantAge: age,
    applicantGender: gender,
    applicantBloodType: randomItem(BLOOD_TYPES) as any,
    applicantMaritalStatus: randomItem([
      MaritalStatus.SINGLE,
      MaritalStatus.MARRIED,
    ]),
    applicantDenomination: randomItem([
      Denomination.SEVENTH_DAY_ADVENTIST,
      Denomination.BAPTIST,
      Denomination.METHODIST,
      Denomination.PENTECOSTAL,
    ]),
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
    permanentSameAsPresent: true,
    familyMobileNo: randomPhone(),
    familyEmail: `family.${user.email}`,
    formData: {
      motivation: "I want to serve my community.",
      education: "High school completed",
    },
  };
}

async function seedApplications(
  trainees: Array<{
    id: string;
    fullName: string;
    email: string;
    homeMissionId: string;
  }>,
  programs: Record<
    string,
    {
      program: { id: string; code: string };
      window: { id: string; state: ApplicationWindowState };
    }
  >,
) {
  const statuses = [
    ApplicationStatus.SUBMITTED,
    ApplicationStatus.UNDER_LMD_REVIEW,
    ApplicationStatus.RECOMMENDED,
    ApplicationStatus.UNDER_MAIN_DIRECTOR_REVIEW,
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
    ApplicationStatus.RETURNED_TO_APPLICANT,
  ];

  const createdApplications: Array<{
    id: string;
    applicantId: string;
    programId: string;
  }> = [];

  for (const trainee of trainees) {
    for (const programCode of ["1000MM-2026", "1000MM-2026-L", "1000MM-2025"]) {
      const program = programs[programCode];
      if (!program) continue;
      const status = randomItem(statuses);
      const referenceNumber = `${program.program.code}-${trainee.email.split("@")[0].toUpperCase()}`;
      const now = new Date();
      const submittedAt = randomDate(new Date("2026-01-01"), now);
      const applicantData = buildApplicantData(trainee);

      const application = await prisma.application.upsert({
        where: { referenceNumber },
        update: {
          applicantId: trainee.id,
          windowId: program.window.id,
          submittedFromMissionId: trainee.homeMissionId,
          status,
          submittedAt,
          lastTransitionAt: submittedAt,
          ...applicantData,
          formData: {
            ...applicantData.formData,
            programInterest: program.program.code,
          },
          profilePhotoDocumentId: null,
        },
        create: {
          referenceNumber,
          applicantId: trainee.id,
          windowId: program.window.id,
          submittedFromMissionId: trainee.homeMissionId,
          status,
          submittedAt,
          lastTransitionAt: submittedAt,
          ...applicantData,
          formData: {
            ...applicantData.formData,
            programInterest: program.program.code,
          },
          profilePhotoDocumentId: null,
        },
      });

      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: ApplicationStatus.DRAFT,
          toStatus: status,
          triggeredById: trainee.id,
          comment: `Seeded status ${status}`,
        },
      });

      if (status === ApplicationStatus.ACCEPTED) {
        await prisma.programEnrollment.upsert({
          where: { applicationId: application.id },
          update: {
            attendanceConfirmed: false,
          },
          create: {
            programId: program.program.id,
            traineeId: trainee.id,
            applicationId: application.id,
            attendanceConfirmed: false,
          },
        });
      }

      if (randomInt(1, 3) === 1) {
        const existingDocument = await prisma.applicationDocument.findFirst({
          where: {
            applicationId: application.id,
            kind: DocumentKind.BIO_DATA_PDF,
          },
        });

        if (existingDocument) {
          await prisma.applicationDocument.update({
            where: { id: existingDocument.id },
            data: {
              fileName: "bio-data.pdf",
              mimeType: "application/pdf",
              fileSizeBytes: 125_000,
              storageKey: `applications/${application.id}/bio-data.pdf`,
              uploadedById: trainee.id,
            },
          });
        } else {
          await prisma.applicationDocument.create({
            data: {
              applicationId: application.id,
              kind: DocumentKind.BIO_DATA_PDF,
              fileName: "bio-data.pdf",
              mimeType: "application/pdf",
              fileSizeBytes: 125_000,
              storageKey: `applications/${application.id}/bio-data.pdf`,
              uploadedById: trainee.id,
            },
          });
        }
      }

      createdApplications.push({
        id: application.id,
        applicantId: trainee.id,
        programId: program.program.id,
      });
    }
  }

  console.log(`✓ Seeded ${createdApplications.length} applications`);
  return createdApplications;
}

async function seedNotifications(users: Array<{ id: string }>) {
  const unreadActions = [
    "New form assigned",
    "Application update",
    "Reminder to submit",
  ].map((message) => ({
    templateKey: "dashboard.notification",
    templateData: { message },
  }));

  await prisma.notification.deleteMany({
    where: {
      userId: { in: users.map((user) => user.id) },
      templateKey: "dashboard.notification",
    },
  });

  const created: Array<any> = [];
  for (const user of users) {
    const count = randomInt(1, 3);
    for (let i = 0; i < count; i += 1) {
      const isUnread = i === 0;
      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          channel: NotificationChannel.IN_APP,
          templateKey: "dashboard.notification",
          templateData: { message: `Notification ${i + 1}` },
          sentAt: new Date(),
          readAt: isUnread ? null : new Date(),
          actionUrl: "/dashboard/notifications",
        },
      });
      created.push(notification);
    }
  }

  console.log(`✓ Seeded ${created.length} notifications`);
  return created;
}

async function seedComplaints(users: Array<{ id: string; fullName: string }>) {
  const complaints = [
    "Unable to upload documents",
    "Program application status mismatch",
    "Login page returns an error",
    "Suggestion to simplify dashboard flow",
  ];

  const created = [];
  for (const [index, user] of users.slice(0, 4).entries()) {
    const complaint = await prisma.complaint.create({
      data: {
        category: ComplaintCategory.GENERAL_FEEDBACK,
        subject: complaints[index],
        description: `Seeded complaint from ${user.fullName}`,
        submittedById: user.id,
        missionCode: LocalMissionCode.EBM,
        missionId: null,
        isResolved: index % 2 === 0,
        response: index % 2 === 0 ? "Resolved by support team." : null,
      },
    });
    created.push(complaint);
  }

  console.log(`✓ Seeded ${created.length} complaints`);
  return created;
}

async function seedAnnouncements(adminId: string) {
  const announcements = [
    {
      title: "Welcome to the 1000MM Dashboard",
      body: "This platform is seeded for local testing. Use the seeded credentials in TESTING.md.",
      publishedAt: new Date(),
      expiresAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 60),
    },
    {
      title: "New training cycle launched",
      body: "The 2026 missionary and leadership programs are now open for applications.",
      publishedAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7),
      expiresAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 14),
    },
  ];

  await prisma.announcement.deleteMany({
    where: { title: { in: announcements.map((item) => item.title) } },
  });

  for (const announcement of announcements) {
    await prisma.announcement.create({
      data: {
        createdById: adminId,
        ...announcement,
      },
    });
  }

  console.log(`✓ Seeded ${announcements.length} announcements`);
}

async function seedDonations() {
  const donations = [
    {
      donorName: "Sadia Akter",
      amount: 1500n,
      currency: "BDT",
      gateway: PaymentGateway.BKASH,
      status: DonationStatus.COMPLETED,
    },
    {
      donorName: "John Doe",
      amount: 25n,
      currency: "USD",
      gateway: PaymentGateway.STRIPE,
      status: DonationStatus.PENDING,
    },
    {
      donorName: "Mina Rahman",
      amount: 5000n,
      currency: "BDT",
      gateway: PaymentGateway.SSLCOMMERZ,
      status: DonationStatus.COMPLETED,
    },
  ];

  for (const donation of donations) {
    await prisma.donation.upsert({
      where: {
        receiptNumber: `${donation.currency}-${donation.amount}-${donation.gateway}`,
      },
      update: {
        isAnonymous: false,
        gateway: donation.gateway,
        status: donation.status,
        completedAt:
          donation.status === DonationStatus.COMPLETED ? new Date() : null,
      },
      create: {
        donorName: donation.donorName,
        donorEmail: `${donation.donorName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        amountMinor: donation.amount,
        currency: donation.currency,
        gateway: donation.gateway,
        status: donation.status,
        initiatedAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2),
        completedAt:
          donation.status === DonationStatus.COMPLETED ? new Date() : null,
        receiptNumber: `${donation.currency}-${donation.amount}-${donation.gateway}`,
      },
    });
  }

  console.log("✓ Seeded donations");
}

async function seedFieldReports(
  applications: Array<{ id: string; applicantId: string; programId: string }>,
) {
  const reports = applications.slice(0, 4).map((application, index) => ({
    traineeId: application.applicantId,
    applicationId: application.id,
    programId: application.programId,
    reportMonth: 4 + index,
    reportYear: 2026,
    activitiesSummary: "Visited a local church and coached new trainees.",
    peopleReached: randomInt(12, 55),
    challengesFaced: "Weather delays and transport coordination.",
    prayerRequests: "Strength for upcoming training sessions.",
  }));

  for (const report of reports) {
    await prisma.fieldReport.upsert({
      where: {
        traineeId_reportMonth_reportYear: {
          traineeId: report.traineeId,
          reportMonth: report.reportMonth,
          reportYear: report.reportYear,
        },
      },
      update: report,
      create: report,
    });
  }

  console.log(`✓ Seeded ${reports.length} field reports`);
}

async function seedSystemSettings() {
  const defaults = [
    {
      key: "site.organization_name_en",
      value: "1000 Missionary Movement Bangladesh",
      description: "Organization display name (English)",
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
      key: "donation.preset_amounts_bdt",
      value: [500, 1000, 2500, 5000, 10000],
      description: "Preset donation amounts shown to BDT donors",
    },
    {
      key: "application.form_current_version",
      value: 1,
      description: "Bio-data form schema version",
    },
  ];

  for (const item of defaults) {
    await prisma.systemSetting.upsert({
      where: { key: item.key },
      update: {
        value: item.value as any,
        description: item.description,
      },
      create: {
        key: item.key,
        value: item.value as any,
        description: item.description,
      },
    });
  }

  console.log(`✓ Seeded ${defaults.length} system settings`);
}

async function main() {
  console.log("Seeding 1000MM database...");
  const missions = await seedLocalMissions();
  const users = await seedUsers(missions);
  const programs = await seedPrograms(users.admin.id);

  const applications = await seedApplications(users.trainees, programs);
  await seedNotifications(
    users.trainees.concat(users.trainers, users.lmds, [
      users.admin,
      users.director,
    ]),
  );
  await seedComplaints(users.trainees.slice(0, 4));
  await seedAnnouncements(users.admin.id);
  await seedDonations();
  await seedFieldReports(applications);
  await seedSystemSettings();

  console.log(`\nSeed complete. Credentials are documented in TESTING.md.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
