-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_homeMissionId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "homeMissionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_homeMissionId_fkey" FOREIGN KEY ("homeMissionId") REFERENCES "local_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
