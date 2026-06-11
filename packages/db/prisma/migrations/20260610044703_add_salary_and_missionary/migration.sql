-- CreateEnum
CREATE TYPE "SalaryRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "training_programs" ADD COLUMN     "isMain" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isMissionary" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SalaryRange" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "minAmount" INTEGER NOT NULL,
    "maxAmount" INTEGER NOT NULL,
    "cycle" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryRange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_assignments" (
    "id" TEXT NOT NULL,
    "missionaryId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "deploymentLocation" TEXT,
    "cycle" INTEGER NOT NULL,
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_requests" (
    "id" TEXT NOT NULL,
    "missionaryId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "SalaryRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaryRange_missionId_key" ON "SalaryRange"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "salary_assignments_missionaryId_cycle_key" ON "salary_assignments"("missionaryId", "cycle");

-- CreateIndex
CREATE UNIQUE INDEX "salary_requests_missionaryId_month_year_key" ON "salary_requests"("missionaryId", "month", "year");

-- AddForeignKey
ALTER TABLE "SalaryRange" ADD CONSTRAINT "SalaryRange_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "local_missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRange" ADD CONSTRAINT "SalaryRange_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_assignments" ADD CONSTRAINT "salary_assignments_missionaryId_fkey" FOREIGN KEY ("missionaryId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_assignments" ADD CONSTRAINT "salary_assignments_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "local_missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_assignments" ADD CONSTRAINT "salary_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_requests" ADD CONSTRAINT "salary_requests_missionaryId_fkey" FOREIGN KEY ("missionaryId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_requests" ADD CONSTRAINT "salary_requests_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "local_missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_requests" ADD CONSTRAINT "salary_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
