-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('APPLIED', 'ENROLLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PROGRAM_APPLIED';
ALTER TYPE "AuditAction" ADD VALUE 'TRAINEE_ENROLLED';

-- AlterTable
ALTER TABLE "program_enrollments" ADD COLUMN     "appliedAt" TIMESTAMP(3),
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED';
