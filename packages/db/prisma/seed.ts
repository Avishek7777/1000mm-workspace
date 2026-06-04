/**
 * Prisma Seed Script — 1000MM Training Platform
 *
 * Run: `npx prisma db seed`
 * (Configure in package.json: "prisma": { "seed": "tsx prisma/seed.ts" })
 *
 * Idempotent: safe to run multiple times. Uses upsert for fixed data.
 *
 * Seeds:
 *  - The four Local Missions (EBM, NBM, SBM, WBM)
 *  - A first System Admin user (credentials from env)
 *  - Baseline system settings
 *
 * Does NOT seed:
 *  - Trainees, applications, donations (created via UI in normal use)
 *  - Training programs (created by Main Director after login)
 */
/// <reference types="node" />
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
console.log("ENV CHECK:", process.env.SEED_ADMIN_EMAIL, __dirname);

import { PrismaClient, LocalMissionCode, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function seedLocalMissions() {
  const missions = [
    {
      code: LocalMissionCode.EBM,
      name: "Eastern Bangladesh Mission",
      nameBangla: "পূর্ব বাংলাদেশ মিশন",
      description: "Serving the eastern divisions of Bangladesh.",
    },
    {
      code: LocalMissionCode.NBM,
      name: "Northern Bangladesh Mission",
      nameBangla: "উত্তর বাংলাদেশ মিশন",
      description: "Serving the northern divisions of Bangladesh.",
    },
    {
      code: LocalMissionCode.SBM,
      name: "Southern Bangladesh Mission",
      nameBangla: "দক্ষিণ বাংলাদেশ মিশন",
      description: "Serving the southern divisions of Bangladesh.",
    },
    {
      code: LocalMissionCode.WBM,
      name: "Western Bangladesh Mission",
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

async function seedSystemAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME ?? "System Administrator";

  if (!email || !password) {
    console.warn(
      "⚠ Skipping System Admin seed: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env",
    );
    return;
  }

  // Default the admin to EBM; this can be changed via the UI later.
  // The role is what matters; for SYSTEM_ADMIN the mission is administrative.
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
      role: UserRole.SYSTEM_ADMIN,
      homeMissionId: ebm.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log(`✓ Seeded System Admin: ${email}`);
}

async function seedSystemSettings() {
  const defaults: Array<{ key: string; value: unknown; description: string }> =
    [
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
        value: 10080, // 7 days
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
        description: "Bio-data form schema version (bump when fields change)",
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
        value: {
          STRIPE: false,
          PAYPAL: false,
          SSLCOMMERZ: false,
          BKASH: false,
        },
        description:
          "Per-gateway enabled flag — flip true after configuring API credentials for each",
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

async function main() {
  console.log("Seeding 1000MM database…");
  console.log("EMAIL:", process.env.SEED_ADMIN_EMAIL);
  console.log("PASSWORD:", process.env.SEED_ADMIN_PASSWORD ? "set" : "NOT SET");
  await seedLocalMissions();
  await seedSystemAdmin();
  await seedSystemSettings();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
