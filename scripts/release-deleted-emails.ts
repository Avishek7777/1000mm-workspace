/**
 * One-off cleanup for users soft-deleted before emails were tombstoned.
 *
 * `User.email` is @unique, so a soft-deleted row kept its address reserved and
 * recreating a user with the same email failed with "already in use".
 * Deleting now rewrites the address (see packages/db/src/deleted-email.ts);
 * this releases the ones deleted before that change.
 *
 * Only touches rows where deletedAt is set. Live accounts are never modified.
 *
 * Run from the repo root:
 *   set -a; . packages/db/.env; set +a
 *   pnpm exec tsx scripts/release-deleted-emails.ts          # dry run
 *   pnpm exec tsx scripts/release-deleted-emails.ts --yes    # apply
 */
import { PrismaClient } from "@prisma/client";
// Relative rather than "@1000mm/db": the root package doesn't depend on the
// workspace package, and importing the barrel would pull in a second Prisma
// client instance for no reason.
import { tombstoneEmail, DELETED_EMAIL_PREFIX } from "../packages/db/src/deleted-email";

const prisma = new PrismaClient();

async function main() {
  const confirmed = process.argv.includes("--yes");

  const deletedUsers = await prisma.user.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, email: true, fullName: true, deletedAt: true },
    orderBy: { deletedAt: "asc" },
  });

  const stillHolding = deletedUsers.filter(
    (u) => !u.email.startsWith(DELETED_EMAIL_PREFIX),
  );

  console.log(`${deletedUsers.length} soft-deleted users, ${stillHolding.length} still holding their email.\n`);

  if (stillHolding.length === 0) {
    console.log("Nothing to do — every deleted account has already been released.");
    return;
  }

  for (const u of stillHolding) {
    console.log(`  ${u.email}  →  ${tombstoneEmail(u.email, u.deletedAt ?? new Date())}`);
  }

  if (!confirmed) {
    console.log("\nDry run. Re-run with --yes to apply.");
    return;
  }

  let released = 0;
  for (const u of stillHolding) {
    await prisma.user.update({
      where: { id: u.id },
      data: { email: tombstoneEmail(u.email, u.deletedAt ?? new Date()) },
    });
    released++;
  }

  console.log(`\n✓ Released ${released} email address${released === 1 ? "" : "es"} for reuse.`);
}

main()
  .catch((e) => {
    console.error(`\n✗ ${e.message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
