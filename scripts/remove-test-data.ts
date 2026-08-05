/**
 * Removes everything created by seed-test-data.ts, and nothing else.
 *
 * Selection is strictly marker-based — users whose email ends in
 * @seedtest.local, and the TEST-BATCH program with its window. Real accounts
 * and real applications are never touched.
 *
 * Deletion is ordered by foreign key: the schema has almost no ON DELETE
 * CASCADE (only sessions and tokens), so every dependent row has to go first
 * or Postgres rejects the delete.
 *
 * Run from the repo root:
 *   set -a; . packages/db/.env; set +a
 *   pnpm exec tsx scripts/remove-test-data.ts          # dry run, lists only
 *   pnpm exec tsx scripts/remove-test-data.ts --yes    # actually deletes
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Both seeds are marker-based; this removes either or both.
const TEST_EMAIL_DOMAINS = ["seedtest.local", "demo.local"];
const TEST_PROGRAM_CODES = ["TEST-BATCH", "DEMO-2026"];
const TEST_TESTIMONY_NAMES = [
  "Samuel Das",
  "Rebecca Sarkar",
  "Timothy Gomes",
  "Esther Akter",
];

async function main() {
  const confirmed = process.argv.includes("--yes");

  const users = await prisma.user.findMany({
    where: { OR: TEST_EMAIL_DOMAINS.map((d) => ({ email: { endsWith: `@${d}` } })) },
    select: { id: true, email: true },
  });
  const userIds = users.map((u) => u.id);

  const programs = await prisma.trainingProgram.findMany({
    where: { code: { in: TEST_PROGRAM_CODES } },
    select: { id: true, code: true },
  });
  const programIds = programs.map((p) => p.id);

  const windows = programIds.length
    ? await prisma.applicationWindow.findMany({
        where: { programId: { in: programIds } },
        select: { id: true },
      })
    : [];
  const windowIds = windows.map((w) => w.id);

  const applications = await prisma.application.findMany({
    where: {
      OR: [
        ...(userIds.length ? [{ applicantId: { in: userIds } }] : []),
        ...(windowIds.length ? [{ windowId: { in: windowIds } }] : []),
      ],
    },
    select: { id: true, referenceNumber: true },
  });
  const applicationIds = applications.map((a) => a.id);

  console.log("Found:");
  console.log(`  ${users.length} test users        ${users.map((u) => u.email).join(", ") || "—"}`);
  console.log(`  ${applications.length} applications      ${applications.map((a) => a.referenceNumber ?? "(draft)").join(", ") || "—"}`);
  console.log(`  ${windows.length} application window(s)`);
  console.log(`  ${programs.length} program(s)        ${programs.map((p) => p.code).join(", ") || "—"}`);

  if (!confirmed) {
    console.log("\nDry run. Re-run with --yes to delete.");
    return;
  }

  console.log("\nDeleting…");

  if (applicationIds.length) {
    const docs = await prisma.applicationDocument.deleteMany({
      where: { applicationId: { in: applicationIds } },
    });
    const history = await prisma.applicationStatusHistory.deleteMany({
      where: { applicationId: { in: applicationIds } },
    });
    console.log(`  ✓ ${docs.count} documents, ${history.count} status history rows`);
  }

  if (userIds.length) {
    // Rows that reference the user directly and would otherwise block the
    // delete. Audit logs are included because a test submission writes one.
    const notifications = await prisma.notification.deleteMany({
      where: { userId: { in: userIds } },
    });
    const audits = await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    const enrollments = await prisma.programEnrollment.deleteMany({
      where: { traineeId: { in: userIds } },
    });
    console.log(
      `  ✓ ${notifications.count} notifications, ${audits.count} audit logs, ${enrollments.count} enrollments`,
    );
  }

  if (applicationIds.length) {
    const apps = await prisma.application.deleteMany({ where: { id: { in: applicationIds } } });
    console.log(`  ✓ ${apps.count} applications`);
  }

  if (userIds.length) {
    const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    console.log(`  ✓ ${deletedUsers.count} users`);
  }

  if (windowIds.length) {
    const w = await prisma.applicationWindow.deleteMany({ where: { id: { in: windowIds } } });
    console.log(`  ✓ ${w.count} application windows`);
  }

  if (programIds.length) {
    const p = await prisma.trainingProgram.deleteMany({ where: { id: { in: programIds } } });
    console.log(`  ✓ ${p.count} programs`);
  }

  // Demo testimonies, matched by name so hand-written ones survive.
  const t = await prisma.testimony.deleteMany({
    where: { name: { in: TEST_TESTIMONY_NAMES } },
  });
  if (t.count) console.log(`  ✓ ${t.count} demo testimonies`);

  console.log("\nDone. No real data was touched.");
}

main()
  .catch((e) => {
    console.error(`\n✗ ${e.message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
