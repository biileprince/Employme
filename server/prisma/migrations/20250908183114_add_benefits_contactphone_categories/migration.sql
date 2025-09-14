/*
  Warnings:

  - The values [REMOTE] on the enum `JobType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `resetToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationTokenExpiry` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobCategory" ADD VALUE 'REAL_ESTATE';
ALTER TYPE "JobCategory" ADD VALUE 'TELECOMMUNICATIONS';

-- AlterEnum
BEGIN;
CREATE TYPE "JobType_new" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE');
ALTER TABLE "jobs" ALTER COLUMN "jobType" DROP DEFAULT;
ALTER TABLE "jobs" ALTER COLUMN "jobType" TYPE "JobType_new" USING ("jobType"::text::"JobType_new");
ALTER TYPE "JobType" RENAME TO "JobType_old";
ALTER TYPE "JobType_new" RENAME TO "JobType";
DROP TYPE "JobType_old";
ALTER TABLE "jobs" ALTER COLUMN "jobType" SET DEFAULT 'FULL_TIME';
COMMIT;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "benefits" TEXT[],
ADD COLUMN     "contactPhone" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry",
DROP COLUMN "verificationToken",
DROP COLUMN "verificationTokenExpiry",
ADD COLUMN     "resetCode" TEXT,
ADD COLUMN     "resetCodeExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationCode" TEXT,
ADD COLUMN     "verificationCodeExpiry" TIMESTAMP(3);
