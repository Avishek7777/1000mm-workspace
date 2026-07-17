-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'USER_EMAIL_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_MESSAGE_HANDLED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_MESSAGE_REOPENED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_MESSAGE_MARKED_SPAM';
ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_MESSAGE_UNMARKED_SPAM';
ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_MESSAGE_REPLIED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_MESSAGE_DELETED';

-- AlterTable
ALTER TABLE "contact_messages" ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "repliedById" TEXT,
ADD COLUMN     "replyBody" TEXT;

-- AlterTable
ALTER TABLE "email_verification_tokens" ADD COLUMN     "newEmail" TEXT;

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "images" DROP DEFAULT,
ALTER COLUMN "objectives" DROP DEFAULT;

-- AlterTable
ALTER TABLE "testimonies" ALTER COLUMN "updatedAt" DROP DEFAULT;
