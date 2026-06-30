-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FinancialEntryType" ADD VALUE 'DONATION';
ALTER TYPE "FinancialEntryType" ADD VALUE 'OTHER';

-- DropForeignKey
ALTER TABLE "financial_entries" DROP CONSTRAINT "financial_entries_missionId_fkey";

-- AlterTable
ALTER TABLE "financial_entries" ALTER COLUMN "missionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "local_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
