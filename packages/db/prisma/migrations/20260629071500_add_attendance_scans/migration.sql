-- CreateTable
CREATE TABLE "attendance_scans" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "missionId" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedById" TEXT NOT NULL,

    CONSTRAINT "attendance_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_scans_programId_idx" ON "attendance_scans"("programId");

-- CreateIndex
CREATE INDEX "attendance_scans_traineeId_idx" ON "attendance_scans"("traineeId");

-- CreateIndex
CREATE INDEX "attendance_scans_missionId_idx" ON "attendance_scans"("missionId");

-- CreateIndex
CREATE INDEX "attendance_scans_scannedAt_idx" ON "attendance_scans"("scannedAt");

-- AddForeignKey
ALTER TABLE "attendance_scans" ADD CONSTRAINT "attendance_scans_programId_fkey" FOREIGN KEY ("programId") REFERENCES "training_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_scans" ADD CONSTRAINT "attendance_scans_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_scans" ADD CONSTRAINT "attendance_scans_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_scans" ADD CONSTRAINT "attendance_scans_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "local_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
