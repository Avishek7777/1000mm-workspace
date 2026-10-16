#!/usr/bin/env node
/**
 * Audit ID-card identity sources.
 *
 * An ID card was built from the User account (fullName, profilePicture) while
 * the application that was actually reviewed and accepted carries its own
 * applicantFullName and PROFILE_PHOTO document. Where those disagree, a card
 * goes out with one person's name or face against another person's reference
 * number.
 *
 * Read-only. Run on the server with:
 *   cd /srv/1000mm
 *   DATABASE_URL="$(grep -h '^DATABASE_URL=' packages/db/.env | cut -d= -f2- | tr -d '"')" \
 *     node scripts/audit-idcard-identity.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Single-reference inspector ────────────────────────────────────────────────
// `node scripts/audit-idcard-identity.mjs --ref SBM-2026-00014` prints every
// identity field behind one reference number, so a mismatch can be attributed
// to the right cause: one account whose display name differs from the
// application it submitted, or a genuinely crossed enrollment -> application
// link. Those need very different remedies.
const refArg = process.argv.indexOf("--ref");
if (refArg !== -1 && process.argv[refArg + 1]) {
  const ref = process.argv[refArg + 1].trim().toUpperCase();
  const app = await prisma.application.findFirst({
    where: { referenceNumber: ref },
    select: {
      id: true,
      applicantFullName: true,
      applicantGender: true,
      status: true,
      applicantId: true,
      applicant: {
        select: { id: true, fullName: true, email: true, profilePicture: true },
      },
      profilePhotoDocumentId: true,
      documents: {
        where: { kind: "PROFILE_PHOTO", deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: { id: true, storageKey: true, createdAt: true },
      },
    },
  });

  if (!app) {
    console.log(`No application with reference ${ref}.`);
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log(`\n=== ${ref} ===\n`);
  console.log("APPLICATION   (what was reviewed and accepted)");
  console.log(`  applicantFullName  : ${app.applicantFullName}`);
  console.log(`  gender             : ${app.applicantGender}`);
  console.log(`  status             : ${app.status}`);
  console.log(`  applicantId        : ${app.applicantId}`);

  console.log("\nACCOUNT       (what the old card printed)");
  console.log(`  user.id            : ${app.applicant.id}`);
  console.log(`  user.fullName      : ${app.applicant.fullName}`);
  console.log(`  user.email         : ${app.applicant.email}`);
  console.log(`  user.profilePicture: ${app.applicant.profilePicture ?? "(none)"}`);

  const sameName =
    app.applicantFullName.trim().toLowerCase() ===
    app.applicant.fullName.trim().toLowerCase();
  console.log(`\n  names agree?       : ${sameName ? "yes" : "NO  <-- the mismatch"}`);

  console.log(`\nPHOTOS on the application: ${app.documents.length}`);
  for (const d of app.documents) {
    const mark = d.id === app.profilePhotoDocumentId ? "   <- profilePhotoDocumentId" : "";
    console.log(`  ${d.createdAt.toISOString()}  ${d.storageKey}${mark}`);
  }
  if (app.documents.length === 0) {
    console.log("  (none -- the old card fell back to the ACCOUNT picture above)");
  }

  const enrs = await prisma.programEnrollment.findMany({
    where: { OR: [{ applicationId: app.id }, { traineeId: app.applicantId }] },
    select: {
      id: true,
      traineeId: true,
      applicationId: true,
      deletedAt: true,
      status: true,
      trainee: { select: { fullName: true } },
      program: { select: { code: true } },
      // Each enrollment's OWN application. The integrity test is whether that
      // application's applicant is this enrollment's trainee — not whether it
      // happens to be the reference being inspected. A trainee with two
      // accepted applications legitimately has an enrollment pointing at the
      // other one, which is not a fault.
      application: { select: { referenceNumber: true, applicantId: true } },
    },
  });

  console.log(`\nENROLLMENTS touching this application or applicant: ${enrs.length}`);
  let crossed = false;
  for (const e of enrs) {
    const wrongTrainee = !!e.application && e.application.applicantId !== e.traineeId;
    if (wrongTrainee) crossed = true;
    const other =
      e.application && e.application.referenceNumber !== ref
        ? `   (its own ref: ${e.application.referenceNumber ?? "none"})`
        : e.applicationId
          ? ""
          : "   (no application linked)";
    console.log(
      `  ${e.program.code.padEnd(16)} ${e.status.padEnd(9)} trainee="${e.trainee.fullName}"` +
        (e.deletedAt ? " (removed)" : "") +
        other +
        (wrongTrainee ? "   <-- CROSSED: this application belongs to someone else" : ""),
    );
  }

  console.log("\nVERDICT");
  if (crossed) {
    console.log("  CROSSED LINK — an enrollment points at a different person's record.");
    console.log("  This is a data-integrity problem and needs the rows repaired;");
    console.log("  no code path creates it, so it predates or bypassed the app.");
  } else if (sameName) {
    console.log("  Consistent — no mismatch on this reference.");
  } else {
    console.log("  ONE ACCOUNT, TWO NAMES — the reference number and every link are");
    console.log("  correct. The account's display name simply differs from the name on");
    console.log("  the application it submitted, and the card printed the account name.");
    console.log("  Fixed in 50d99b6; reprint this card.");
  }

  await prisma.$disconnect();
  process.exit(0);
}

const enrollments = await prisma.programEnrollment.findMany({
  where: { deletedAt: null, status: "ENROLLED" },
  select: {
    id: true,
    traineeId: true,
    trainee: { select: { id: true, fullName: true, profilePicture: true } },
    program: { select: { code: true } },
    application: {
      select: {
        id: true,
        applicantId: true,
        referenceNumber: true,
        applicantFullName: true,
        profilePhotoDocumentId: true,
        documents: {
          where: { kind: "PROFILE_PHOTO", deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: { id: true, storageKey: true, createdAt: true },
        },
      },
    },
  },
  orderBy: { enrolledAt: "asc" },
});

const nameMismatch = [];
const crossedLink = [];
const photoFallback = [];
const multiPhoto = [];
const noPhotoAtAll = [];

for (const e of enrollments) {
  const app = e.application;
  if (!app) {
    if (!e.trainee.profilePicture) noPhotoAtAll.push(e);
    continue;
  }

  // Card printed trainee.fullName; the reviewed application says otherwise.
  if (
    app.applicantFullName &&
    app.applicantFullName.trim().toLowerCase() !==
      e.trainee.fullName.trim().toLowerCase()
  ) {
    nameMismatch.push(e);
  }

  // The enrollment's trainee is not the application's applicant at all.
  if (app.applicantId !== e.traineeId) crossedLink.push(e);

  // No application photo -> the card fell back to the account's casual picture.
  if (app.documents.length === 0) {
    if (e.trainee.profilePicture) photoFallback.push(e);
    else noPhotoAtAll.push(e);
  }

  // Multiple photos: the review page showed documents.find() (the oldest)
  // while the card took the newest, so the two could disagree. Both now use
  // profilePhotoDocumentId, but cards printed before that need checking.
  if (app.documents.length > 1) multiPhoto.push(e);
}

const line = (e) =>
  `    ${(e.application?.referenceNumber ?? e.id.slice(-8).toUpperCase()).padEnd(22)} ` +
  `card printed "${e.trainee.fullName}"` +
  (e.application?.applicantFullName &&
  e.application.applicantFullName !== e.trainee.fullName
    ? `  <-- application says "${e.application.applicantFullName}"`
    : "");

console.log(`\nEnrolled trainees examined: ${enrollments.length}\n`);

console.log(`NAME MISMATCH — card name != reviewed application name: ${nameMismatch.length}`);
nameMismatch.forEach((e) => console.log(line(e)));

console.log(`\nPHOTO FALLBACK — no application photo, card used the account picture: ${photoFallback.length}`);
photoFallback.forEach((e) =>
  console.log(
    `    ${(e.application?.referenceNumber ?? "—").padEnd(22)} ${e.trainee.fullName}  (used ${e.trainee.profilePicture})`,
  ),
);

console.log(
  `\nAMBIGUOUS PHOTO — more than one PROFILE_PHOTO on the application: ${multiPhoto.length}`,
);
if (multiPhoto.length) {
  console.log(
    "    The card prints the LAST upload — each retry supersedes the one before.\n" +
      "    Open it and confirm it is the holder: a stray upload wins under this rule,\n" +
      "    and on at least one application the final file is a different person. The\n" +
      "    remedy is to upload the correct photograph, which then becomes the last.\n" +
      "      <portal>/api/uploads/<path>   (needs a logged-in session)\n",
  );
}
multiPhoto.forEach((e) => {
  console.log(
    `    ${(e.application?.referenceNumber ?? "—").padEnd(22)} ${e.application?.applicantFullName ?? e.trainee.fullName}  (${e.application.documents.length} photos)`,
  );
  // Full timestamps, not just dates: most of these are same-session retries,
  // and the minutes between them are what tells a re-upload apart from a
  // genuinely different photograph added later.
  const lastIdx = e.application.documents.length - 1;
  e.application.documents.forEach((d, i) => {
    const mark = i === lastIdx ? "  <- WILL BE PRINTED" : "";
    const when = d.createdAt.toISOString().slice(0, 16).replace("T", " ");
    console.log(`        ${when}  ${d.storageKey}${mark}`);
  });
});

console.log(`\nCROSSED LINK — enrollment.traineeId != application.applicantId: ${crossedLink.length}`);
crossedLink.forEach((e) =>
  console.log(
    `    ${(e.application?.referenceNumber ?? "—").padEnd(22)} trainee=${e.trainee.fullName} applicantId=${e.application.applicantId}`,
  ),
);

console.log(`\nNO PHOTO AVAILABLE — card shows the placeholder: ${noPhotoAtAll.length}`);

const affected = new Set(
  [...nameMismatch, ...photoFallback, ...multiPhoto, ...crossedLink].map((e) => e.id),
);
console.log(`\n=== ${affected.size} of ${enrollments.length} printed cards need reprinting ===`);

await prisma.$disconnect();
