-- CreateEnum
CREATE TYPE "FlagRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'USER_FLAG_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_FLAG_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_FLAG_REJECTED';

-- CreateTable
CREATE TABLE "user_flag_requests" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "FlagRequestStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolverNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_flag_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_flag_requests_status_idx" ON "user_flag_requests"("status");

-- CreateIndex
CREATE INDEX "user_flag_requests_targetUserId_idx" ON "user_flag_requests"("targetUserId");

-- AddForeignKey
ALTER TABLE "user_flag_requests" ADD CONSTRAINT "user_flag_requests_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flag_requests" ADD CONSTRAINT "user_flag_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flag_requests" ADD CONSTRAINT "user_flag_requests_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
