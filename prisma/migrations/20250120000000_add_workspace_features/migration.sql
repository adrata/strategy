-- Add enabledFeatures column to workspaces table
ALTER TABLE "workspaces" ADD COLUMN "enabledFeatures" TEXT[] DEFAULT '{}';

-- Add new permission enum values (one at a time)
ALTER TYPE "public"."Permission" ADD VALUE 'OASIS_ACCESS';
