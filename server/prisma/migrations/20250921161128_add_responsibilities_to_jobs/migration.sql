-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[];
