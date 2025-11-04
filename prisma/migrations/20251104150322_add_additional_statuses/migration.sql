-- AlterTable
ALTER TABLE "companies" ADD COLUMN "additionalStatuses" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "people" ADD COLUMN "additionalStatuses" TEXT[] DEFAULT ARRAY[]::TEXT[];

