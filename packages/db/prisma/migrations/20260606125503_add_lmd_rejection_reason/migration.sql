/*
  Warnings:

  - The values [APPLICATION_REJECTED_BY_LMD] on the enum `DocumentKind` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'APPLICATION_REJECTED_BY_LMD';

-- AlterEnum
BEGIN;
CREATE TYPE "DocumentKind_new" AS ENUM ('BIO_DATA_PDF', 'PROFILE_PHOTO', 'FATHER_NID', 'MOTHER_NID', 'EDUCATION_CERTIFICATE', 'DISTRICT_PASTOR_RECOMMENDATION', 'NID', 'BIRTH_CERTIFICATE', 'PARENT_PASSPORT_PHOTO', 'BAPTISM_CERTIFICATE', 'PARENTS_CONSENT', 'LETTER_OF_INTENT', 'RECOMMENDATION_LETTER', 'SWORN_STATEMENT', 'EXCOM_VOTE_COPY', 'ID_CARD', 'CERTIFICATE', 'SUPPORTING_DOCUMENT');
ALTER TABLE "application_documents" ALTER COLUMN "kind" TYPE "DocumentKind_new" USING ("kind"::text::"DocumentKind_new");
ALTER TYPE "DocumentKind" RENAME TO "DocumentKind_old";
ALTER TYPE "DocumentKind_new" RENAME TO "DocumentKind";
DROP TYPE "public"."DocumentKind_old";
COMMIT;

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "lmdRejectionReason" TEXT;
