/**
 * Presentation demo data — a populated system to walk an audience through.
 *
 * Assumes missions and their directors already exist. It creates a program,
 * an open intake window, applicants spread across every review stage so each
 * dashboard has something in it, and a few website testimonies.
 *
 * Everything is marked so `remove-test-data.ts` can delete it again:
 * users by the @demo.local email domain, the program by its DEMO-2026 code.
 *
 * Run from the repo root:
 *   set -a; . packages/db/.env; set +a
 *   pnpm exec tsx scripts/seed-demo-data.ts
 *
 * Optional: MISSION_CODE=EBM to pin it to one mission, DEMO_PASSWORD=… to set
 * the shared login password (default Demo12345!).
 */
import bcrypt from "bcrypt";
import {
  PrismaClient,
  UserRole,
  Gender,
  ApplicationStatus,
  ApplicationWindowState,
  TrainingCategory,
} from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL_DOMAIN = "demo.local";
const DEMO_PROGRAM_CODE = "DEMO-2026";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo12345!";

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function birthDate(age: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d;
}

/**
 * Applicants, deliberately spread across the workflow so every queue in the
 * demo has rows: the LMD sees new and in-review applications, the main
 * director sees recommended ones, and a returned one shows the resubmit path.
 */
const APPLICANTS: Array<{
  fullName: string;
  gender: Gender;
  age: number;
  district: string;
  church: string;
  status: ApplicationStatus;
}> = [
  { fullName: "Nirob Halder",     gender: Gender.MALE,   age: 22, district: "Dhaka",       church: "Dhaka Central SDA Church",   status: ApplicationStatus.SUBMITTED },
  { fullName: "Priya Biswas",     gender: Gender.FEMALE, age: 20, district: "Khulna",      church: "Khulna SDA Church",          status: ApplicationStatus.SUBMITTED },
  { fullName: "Emon Sarkar",      gender: Gender.MALE,   age: 24, district: "Rajshahi",    church: "Rajshahi SDA Church",        status: ApplicationStatus.UNDER_LMD_REVIEW },
  { fullName: "Ruth Mondal",      gender: Gender.FEMALE, age: 21, district: "Barishal",    church: "Barishal SDA Church",        status: ApplicationStatus.UNDER_LMD_REVIEW },
  { fullName: "Shuvo Costa",      gender: Gender.MALE,   age: 23, district: "Chattogram",  church: "Chattogram SDA Church",      status: ApplicationStatus.RECOMMENDED },
  { fullName: "Anima Gomes",      gender: Gender.FEMALE, age: 25, district: "Sylhet",      church: "Sylhet SDA Church",          status: ApplicationStatus.RECOMMENDED },
  { fullName: "Jibon Roy",        gender: Gender.MALE,   age: 22, district: "Mymensingh",  church: "Mymensingh SDA Church",      status: ApplicationStatus.ACCEPTED },
  { fullName: "Shanti Baroi",     gender: Gender.FEMALE, age: 19, district: "Gazipur",     church: "Gazipur SDA Church",         status: ApplicationStatus.ACCEPTED },
  { fullName: "Palash Adhikari",  gender: Gender.MALE,   age: 26, district: "Rangpur",     church: "Rangpur SDA Church",         status: ApplicationStatus.RETURNED_TO_APPLICANT },
];

const TESTIMONIES = [
  {
    name: "Samuel Das",
    location: "Dhaka",
    color: "from-green-400 to-emerald-600",
    quote:
      "Joining the 1000 Missionary Movement was the best decision of my life. I was a shy university student with no experience in public speaking. During my one year of service in rural Sylhet, I conducted children's programs and health seminars. God gave me courage I never had before. I saw 27 people give their hearts to Jesus. Now I am no longer afraid — I am a missionary for life.",
  },
  {
    name: "Rebecca Sarkar",
    location: "Barishal",
    color: "from-orange-400 to-red-500",
    quote:
      "Before joining 1000MM, I was struggling with my faith and purpose. The training and my mission assignment in northern Bangladesh completely changed me. I learned how to share the Gospel through health education. Many families who never heard about Jesus before opened their hearts. This one year gave me a new identity in Christ.",
  },
  {
    name: "Timothy Gomes",
    location: "Chattogram",
    color: "from-emerald-500 to-teal-600",
    quote:
      "I left my job to serve as a missionary for one year. It was not easy, but it was worth it. My team and I planted a new church in a village near Bandarban. We faced many challenges, but God performed miracles. Today that small group has grown to more than 45 members. I discovered that when we step out in faith, God steps in with power.",
  },
  {
    name: "Esther Akter",
    location: "Khulna",
    color: "from-amber-400 to-orange-500",
    quote:
      "As a young woman, I was nervous about going into mission work. But the 1000 Missionary Movement gave me confidence and purpose. I served in a remote area focusing on women and children's ministry. Seeing hopeless mothers find hope in Jesus was the most beautiful experience. I now understand that God can use anyone who is willing.",
  },
];

async function main() {
  // ─── Mission + director (must already exist) ───────────────────────────────
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
    throw new Error(`Mission ${mission.code} has no director — the LMD queues would be empty.`);
  }

  const admin = await prisma.user.findFirst({
    where: { role: UserRole.SYSTEM_ADMIN, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) throw new Error("No SYSTEM_ADMIN user found to own the application window.");

  console.log(`Mission:    ${mission.name} (${mission.code})`);
  console.log(`Window by:  ${admin.email}\n`);

  // ─── Program + open window ─────────────────────────────────────────────────
  const program = await prisma.trainingProgram.upsert({
    where: { code: DEMO_PROGRAM_CODE },
    update: {},
    create: {
      code: DEMO_PROGRAM_CODE,
      title: "30th Batch Missionary Training Program",
      titleBangla: "৩০তম ব্যাচ মিশনারি প্রশিক্ষণ কর্মসূচি",
      category: TrainingCategory.SPIRITUAL,
      summary:
        "Four-week residential training preparing young missionaries in evangelism, health ministry, leadership, and digital outreach.",
      startDate: daysFromNow(45),
      endDate: daysFromNow(75),
      location: "BANC Campus, Gazipur",
      targetIntake: 60,
      maxIntake: 100,
      batch: 30,
      isPublished: true,
    },
  });
  console.log(`✓ Program    ${program.code} — ${program.title}`);

  const existingWindow = await prisma.applicationWindow.findFirst({
    where: { programId: program.id, deletedAt: null },
  });
  const windowData = {
    programId: program.id,
    state: ApplicationWindowState.OPEN,
    advertisingStartDate: daysFromNow(-21),
    applicationOpenDate: daysFromNow(-14),
    applicationCloseDate: daysFromNow(30),
    trainingStartDate: daysFromNow(45),
    targetIntake: 60,
    notes: "Demo intake window.",
    createdById: admin.id,
  };
  const window = existingWindow
    ? await prisma.applicationWindow.update({ where: { id: existingWindow.id }, data: windowData })
    : await prisma.applicationWindow.create({ data: windowData });
  console.log(
    `✓ Window     OPEN, closes ${window.applicationCloseDate.toISOString().slice(0, 10)}`,
  );

  // ─── Applicants + applications ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const counts: Record<string, number> = {};

  for (const [i, a] of APPLICANTS.entries()) {
    const email = `${a.fullName.split(" ")[0].toLowerCase()}@${DEMO_EMAIL_DOMAIN}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        fullName: a.fullName,
        isActive: true,
        role: UserRole.TRAINEE,
        homeMissionId: mission.id,
      },
      create: {
        email,
        fullName: a.fullName,
        passwordHash,
        role: UserRole.TRAINEE,
        isActive: true,
        emailVerified: new Date(),
        homeMissionId: mission.id,
      },
    });

    const isDraftLike = a.status === ApplicationStatus.RETURNED_TO_APPLICANT;
    const referenceNumber = `${mission.code}-${new Date().getFullYear()}-D${String(i + 1).padStart(3, "0")}`;

    const appData = {
      applicantId: user.id,
      windowId: window.id,
      submittedFromMissionId: mission.id,
      status: a.status,
      referenceNumber,
      submittedAt: daysFromNow(-(APPLICANTS.length - i)),
      lastTransitionAt: daysFromNow(-(APPLICANTS.length - i) + 1),
      applicantFullName: a.fullName,
      applicantDateOfBirth: birthDate(a.age),
      applicantAge: a.age,
      applicantGender: a.gender,
      applicantEmail: email,
      applicantMobileNo: `01${700000000 + i * 111111}`,
      applicantChurchName: a.church,
      presentAddressDistrict: a.district,
      permanentAddressDistrict: a.district,
      permanentSameAsPresent: true,
      lmdReviewerComment: isDraftLike
        ? "Your baptism certificate was unreadable. Please re-upload a clearer scan and resubmit."
        : null,
      formData: {
        missionaryDesire:
          "I want to dedicate a year of my life to sharing the Gospel and serving communities across Bangladesh.",
        declarationAccepted: true,
      },
    };

    const existingApp = await prisma.application.findFirst({
      where: { applicantId: user.id, windowId: window.id },
    });
    if (existingApp) {
      await prisma.application.update({ where: { id: existingApp.id }, data: appData });
    } else {
      await prisma.application.create({ data: appData });
    }

    counts[a.status] = (counts[a.status] ?? 0) + 1;
  }

  console.log(`✓ Applicants ${APPLICANTS.length} users with applications`);
  for (const [status, n] of Object.entries(counts)) {
    console.log(`    ${status.padEnd(24)} ${n}`);
  }

  // ─── Website testimonies ───────────────────────────────────────────────────
  for (const [i, t] of TESTIMONIES.entries()) {
    const existing = await prisma.testimony.findFirst({ where: { name: t.name } });
    if (existing) {
      await prisma.testimony.update({
        where: { id: existing.id },
        data: { ...t, order: i + 1, isPublished: true },
      });
    } else {
      await prisma.testimony.create({ data: { ...t, order: i + 1, isPublished: true } });
    }
  }
  console.log(`✓ Testimonies ${TESTIMONIES.length} published`);

  console.log(`\nDemo logins — all use password: ${DEMO_PASSWORD}`);
  for (const a of APPLICANTS.slice(0, 3)) {
    console.log(`  ${a.fullName.split(" ")[0].toLowerCase()}@${DEMO_EMAIL_DOMAIN}`);
  }
  console.log(`  …and ${APPLICANTS.length - 3} more`);
  console.log(`\nRemove it all again: pnpm exec tsx scripts/remove-test-data.ts --yes`);
}

main()
  .catch((e) => {
    console.error(`\n✗ ${e.message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
