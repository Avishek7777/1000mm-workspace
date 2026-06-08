-- AlterTable
ALTER TABLE "field_reports" ADD COLUMN     "baptismCandidatesPrepared" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bibleStudiesConducted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "commentsOrSuggestions" TEXT,
ADD COLUMN     "daysOfWork" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hoursOfWork" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lmdNameSnapshot" TEXT,
ADD COLUMN     "medicalVisits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "newGroupsMade" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nonSdaHomeVisits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "numberOfBaptisms" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "storyOrWitness" TEXT,
ADD COLUMN     "totalActivities" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trainingReceived" TEXT,
ADD COLUMN     "workplaceSnapshot" TEXT,
ADD COLUMN     "worshipSessionsTaken" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "field_report_comments" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_report_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "field_report_comments_reportId_idx" ON "field_report_comments"("reportId");

-- AddForeignKey
ALTER TABLE "field_report_comments" ADD CONSTRAINT "field_report_comments_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "field_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_report_comments" ADD CONSTRAINT "field_report_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
