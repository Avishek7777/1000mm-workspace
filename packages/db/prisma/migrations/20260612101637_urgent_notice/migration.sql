-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'URGENT_REPORT_ISSUED';
ALTER TYPE "AuditAction" ADD VALUE 'URGENT_REPORT_SUBMITTED';

-- CreateTable
CREATE TABLE "urgent_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "attachment1" TEXT,
    "attachment2" TEXT,
    "attachment3" TEXT,
    "attachment4" TEXT,
    "attachment5" TEXT,
    "attachment1Name" TEXT,
    "attachment2Name" TEXT,
    "attachment3Name" TEXT,
    "attachment4Name" TEXT,
    "attachment5Name" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urgent_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urgent_report_submissions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "response" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "urgent_report_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "urgent_reports_publishedAt_idx" ON "urgent_reports"("publishedAt");

-- CreateIndex
CREATE INDEX "urgent_report_submissions_reportId_idx" ON "urgent_report_submissions"("reportId");

-- CreateIndex
CREATE INDEX "urgent_report_submissions_userId_idx" ON "urgent_report_submissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "urgent_report_submissions_reportId_userId_key" ON "urgent_report_submissions"("reportId", "userId");

-- AddForeignKey
ALTER TABLE "urgent_reports" ADD CONSTRAINT "urgent_reports_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "urgent_report_submissions" ADD CONSTRAINT "urgent_report_submissions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "urgent_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "urgent_report_submissions" ADD CONSTRAINT "urgent_report_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
