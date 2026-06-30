/*
  Warnings:

  - You are about to drop the `_ProgramTrainers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ProgramTrainers" DROP CONSTRAINT "_ProgramTrainers_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProgramTrainers" DROP CONSTRAINT "_ProgramTrainers_B_fkey";

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "topicId" TEXT;

-- DropTable
DROP TABLE "_ProgramTrainers";

-- CreateTable
CREATE TABLE "program_topics" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trainerId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "program_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_topics_programId_idx" ON "program_topics"("programId");

-- CreateIndex
CREATE INDEX "program_topics_trainerId_idx" ON "program_topics"("trainerId");

-- CreateIndex
CREATE INDEX "assignments_topicId_idx" ON "assignments"("topicId");

-- AddForeignKey
ALTER TABLE "program_topics" ADD CONSTRAINT "program_topics_programId_fkey" FOREIGN KEY ("programId") REFERENCES "training_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_topics" ADD CONSTRAINT "program_topics_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "program_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
