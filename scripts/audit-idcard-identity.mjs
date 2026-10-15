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

console.log(`\nAMBIGUOUS PHOTO — more than one PROFILE_PHOTO on the application: ${multiPhoto.length}`);
multiPhoto.forEach((e) =>
  console.log(
    `    ${(e.application?.referenceNumber ?? "—").padEnd(22)} ${e.trainee.fullName}  (${e.application.documents.length} photos; ` +
      `review page shows the oldest, card showed the newest)`,
  ),
);

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
