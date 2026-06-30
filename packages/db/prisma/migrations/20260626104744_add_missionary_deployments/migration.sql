-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "missionary_deployments" (
    "id" TEXT NOT NULL,
    "missionaryId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "missionary_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "missionary_deployments_missionaryId_idx" ON "missionary_deployments"("missionaryId");

-- CreateIndex
CREATE INDEX "missionary_deployments_missionId_idx" ON "missionary_deployments"("missionId");

-- CreateIndex
CREATE INDEX "missionary_deployments_status_idx" ON "missionary_deployments"("status");

-- AddForeignKey
ALTER TABLE "missionary_deployments" ADD CONSTRAINT "missionary_deployments_missionaryId_fkey" FOREIGN KEY ("missionaryId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missionary_deployments" ADD CONSTRAINT "missionary_deployments_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "local_missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missionary_deployments" ADD CONSTRAINT "missionary_deployments_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missionary_deployments" ADD CONSTRAINT "missionary_deployments_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
