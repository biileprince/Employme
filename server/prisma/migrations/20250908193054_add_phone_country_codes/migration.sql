-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "job_seekers" ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "contactCountryCode" TEXT;
