-- CreateEnum
CREATE TYPE "LmdReportWindowState" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "lmd_report_windows" (
    "id" TEXT NOT NULL,
    "reportMonth" INTEGER NOT NULL,
    "reportYear" INTEGER NOT NULL,
    "state" "LmdReportWindowState" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lmd_report_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lmd_reports" (
    "id" TEXT NOT NULL,
    "windowId" TEXT NOT NULL,
    "lmdId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "reportMonth" INTEGER NOT NULL,
    "reportYear" INTEGER NOT NULL,
    "totalTrainees" INTEGER NOT NULL DEFAULT 0,
    "totalActivities" INTEGER NOT NULL DEFAULT 0,
    "totalDaysOfWork" INTEGER NOT NULL DEFAULT 0,
    "totalHoursOfWork" INTEGER NOT NULL DEFAULT 0,
    "totalNonSdaHomeVisits" INTEGER NOT NULL DEFAULT 0,
    "totalBibleStudies" INTEGER NOT NULL DEFAULT 0,
    "totalMedicalVisits" INTEGER NOT NULL DEFAULT 0,
    "totalWorshipSessions" INTEGER NOT NULL DEFAULT 0,
    "totalNewGroups" INTEGER NOT NULL DEFAULT 0,
    "totalBaptismCandidates" INTEGER NOT NULL DEFAULT 0,
    "totalBaptisms" INTEGER NOT NULL DEFAULT 0,
    "totalPeopleReached" INTEGER NOT NULL DEFAULT 0,
    "overallSummary" TEXT NOT NULL,
    "challengesAndNeeds" TEXT,
    "recommendationsToDirector" TEXT,
    "prayerRequests" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lmd_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lmd_report_windows_state_idx" ON "lmd_report_windows"("state");

-- CreateIndex
CREATE UNIQUE INDEX "lmd_report_windows_reportMonth_reportYear_key" ON "lmd_report_windows"("reportMonth", "reportYear");

-- CreateIndex
CREATE INDEX "lmd_reports_windowId_idx" ON "lmd_reports"("windowId");

-- CreateIndex
CREATE INDEX "lmd_reports_missionId_idx" ON "lmd_reports"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "lmd_reports_lmdId_reportMonth_reportYear_key" ON "lmd_reports"("lmdId", "reportMonth", "reportYear");

-- AddForeignKey
ALTER TABLE "lmd_report_windows" ADD CONSTRAINT "lmd_report_windows_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lmd_reports" ADD CONSTRAINT "lmd_reports_windowId_fkey" FOREIGN KEY ("windowId") REFERENCES "lmd_report_windows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lmd_reports" ADD CONSTRAINT "lmd_reports_lmdId_fkey" FOREIGN KEY ("lmdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lmd_reports" ADD CONSTRAINT "lmd_reports_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "local_missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
