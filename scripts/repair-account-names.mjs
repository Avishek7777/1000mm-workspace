#!/usr/bin/env node
/**
 * Align portal account names with the application that was reviewed.
 *
 * A trainee's name lives in two places: `users.fullName`, which is whatever the
 * account was registered with, and `applications.applicantFullName`, which was
 * typed on the form, reviewed by the LMD and accepted. They drift — an account
 * registered under a relative's name, a shortened name, a different word order,
 * a spelling variant. ID cards, the roster and the verify page now read the
 * application, but roughly ten export routes still print the account name, so
 * the same person appears under two names across the system.
 *
 * Rather than edit those routes one by one and guess which should use which,
 * this corrects the account name itself.
 *
 * SAFETY
 *   - Dry run unless --apply is passed. Nothing is written by default.
 *   - Only touches accounts with EXACTLY ONE accepted application. An account
 *     that submitted for more than one person (a parent applying for two
 *     children) has no single correct name and is listed for manual handling
 *     instead.
 *   - Never touches an account whose role is not TRAINEE.
 *   - --apply writes a rollback file; --rollback <file> restores every previous
 *     name exactly.
 *
 * Usage
 *   node scripts/repair-account-names.mjs                 # dry run
 *   node scripts/repair-account-names.mjs --apply         # write + save rollback
 *   node scripts/repair-account-names.mjs --rollback f.json
 */
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const rollbackIdx = argv.indexOf("--rollback");
const ROLLBACK = rollbackIdx !== -1 ? argv[rollbackIdx + 1] : null;

// ── Rollback ─────────────────────────────────────────────────────────────────
if (ROLLBACK) {
  const entries = JSON.parse(fs.readFileSync(ROLLBACK, "utf8"));
  console.log(`Restoring ${entries.length} account name(s) from ${ROLLBACK}\n`);
  for (const e of entries) {
    await prisma.user.update({
      where: { id: e.userId },
      data: { fullName: e.oldName },
    });
    console.log(`  ${e.email.padEnd(38)} "${e.newName}" -> "${e.oldName}"`);
  }
  console.log("\nDone.");
  await prisma.$disconnect();
  process.exit(0);
}

// ── Gather ───────────────────────────────────────────────────────────────────
const users = await prisma.user.findMany({
  where: {
    role: "TRAINEE",
    deletedAt: null,
    applications: { some: { status: "ACCEPTED", deletedAt: null } },
  },
  select: {
    id: true,
    fullName: true,
    email: true,
    applications: {
      where: { status: "ACCEPTED", deletedAt: null },
      orderBy: { directorReviewCompletedAt: "desc" },
      select: { referenceNumber: true, applicantFullName: true },
    },
  },
  orderBy: { fullName: "asc" },
});

const norm = (s) => s.trim().replace(/\s+/g, " ");
const same = (a, b) => norm(a).toLowerCase() === norm(b).toLowerCase();

const planned = [];
const ambiguous = [];

for (const u of users) {
  const apps = u.applications;
  const differing = apps.filter((a) => a.applicantFullName && !same(a.applicantFullName, u.fullName));
  if (differing.length === 0) continue;

  if (apps.length > 1) {
    ambiguous.push({ user: u, apps });
    continue;
  }

  planned.push({
    userId: u.id,
    email: u.email,
    oldName: u.fullName,
    newName: norm(apps[0].applicantFullName),
    reference: apps[0].referenceNumber,
  });
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`\nTrainee accounts with an accepted application: ${users.length}`);
console.log(`Names already matching: ${users.length - planned.length - ambiguous.length}\n`);

if (planned.length === 0) {
  console.log("Nothing to change.");
} else {
  console.log(`PROPOSED CHANGES (${planned.length})\n`);
  for (const p of planned) {
    console.log(`  ${p.reference ?? "(no ref)"}`);
    console.log(`    account : ${p.email}`);
    console.log(`    from    : "${p.oldName}"`);
    console.log(`    to      : "${p.newName}"`);
    // Whitespace-only or reordering differences are cosmetic; a wholly
    // different name means the account was registered by someone else and
    // deserves a second look before it is overwritten.
    const aWords = norm(p.oldName).toLowerCase().split(" ").filter(Boolean);
    const bWords = norm(p.newName).toLowerCase().split(" ").filter(Boolean);
    const shared = aWords.filter((w) => bWords.includes(w)).length;
    if (shared === 0) {
      console.log(`    NOTE    : no words in common — the account was registered`);
      console.log(`              under a different person's name. Confirm this`);
      console.log(`              account is used only by the applicant.`);
    }
    console.log();
  }
}

if (ambiguous.length) {
  console.log(`\nSKIPPED — more than one accepted application on the account (${ambiguous.length})`);
  console.log(`  No single correct name; handle these by hand.\n`);
  for (const a of ambiguous) {
    console.log(`  ${a.user.email}  (account name "${a.user.fullName}")`);
    for (const app of a.apps) {
      console.log(`      ${app.referenceNumber ?? "(no ref)"}  "${app.applicantFullName}"`);
    }
  }
}

// ── Apply ────────────────────────────────────────────────────────────────────
if (!APPLY) {
  console.log(`\n--- DRY RUN. Nothing was written. Re-run with --apply to make these changes. ---`);
  await prisma.$disconnect();
  process.exit(0);
}

if (planned.length === 0) {
  await prisma.$disconnect();
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const rollbackFile = `account-names-rollback-${stamp}.json`;
fs.writeFileSync(rollbackFile, JSON.stringify(planned, null, 2));
console.log(`\nRollback written to ${rollbackFile} BEFORE any change.`);

let done = 0;
for (const p of planned) {
  await prisma.user.update({ where: { id: p.userId }, data: { fullName: p.newName } });
  done++;
}

console.log(`Updated ${done} account name(s).`);
console.log(`Undo with:  node scripts/repair-account-names.mjs --rollback ${rollbackFile}`);

await prisma.$disconnect();
