-- CreateEnum
CREATE TYPE "TrainerApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'TRAINER_APPLICATION_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'TRAINER_ACCOUNT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'TRAINER_APPLICATION_REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentKind" ADD VALUE 'TRAINER_CV';
ALTER TYPE "DocumentKind" ADD VALUE 'TRAINER_PASSPORT';
ALTER TYPE "DocumentKind" ADD VALUE 'TRAINER_PHOTO';

-- CreateTable
CREATE TABLE "trainer_applications" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "fullAddress" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "cvStorageKey" TEXT,
    "passportStorageKey" TEXT,
    "photoStorageKey" TEXT,
    "acceptsSelfFunding" BOOLEAN NOT NULL DEFAULT false,
    "requestsInvitationLetter" BOOLEAN NOT NULL DEFAULT false,
    "status" "TrainerApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdUserId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trainer_applications_createdUserId_key" ON "trainer_applications"("createdUserId");

-- CreateIndex
CREATE INDEX "trainer_applications_status_idx" ON "trainer_applications"("status");

-- CreateIndex
CREATE INDEX "trainer_applications_email_idx" ON "trainer_applications"("email");

-- CreateIndex
CREATE INDEX "trainer_applications_createdAt_idx" ON "trainer_applications"("createdAt");

-- AddForeignKey
ALTER TABLE "trainer_applications" ADD CONSTRAINT "trainer_applications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_applications" ADD CONSTRAINT "trainer_applications_createdUserId_fkey" FOREIGN KEY ("createdUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
