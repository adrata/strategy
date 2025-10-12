-- For people table: Drop assignedUserId and rename ownerId to mainSellerId
-- First, copy data from ownerId to assignedUserId if assignedUserId is null
UPDATE "people" SET "assignedUserId" = "ownerId" WHERE "assignedUserId" IS NULL AND "ownerId" IS NOT NULL;

-- Now drop the ownerId column and rename assignedUserId to mainSellerId
ALTER TABLE "people" DROP COLUMN IF EXISTS "ownerId";
ALTER TABLE "people" RENAME COLUMN "assignedUserId" TO "mainSellerId";

-- For companies table: Rename assignedUserId to mainSellerId
ALTER TABLE "companies" RENAME COLUMN "assignedUserId" TO "mainSellerId";

-- Update indexes that reference the old column names
-- Drop old indexes
DROP INDEX IF EXISTS "people_assignedUserId_idx";
DROP INDEX IF EXISTS "people_ownerId_idx";
DROP INDEX IF EXISTS "people_workspaceId_assignedUserId_status_idx";
DROP INDEX IF EXISTS "people_workspaceId_ownerId_status_idx";
DROP INDEX IF EXISTS "people_workspaceId_ownerId_status_deletedAt_idx";
DROP INDEX IF EXISTS "companies_assignedUserId_idx";
DROP INDEX IF EXISTS "companies_workspaceId_assignedUserId_status_idx";

-- Create new indexes with mainSellerId
CREATE INDEX "people_mainSellerId_idx" ON "people"("mainSellerId");
CREATE INDEX "people_workspaceId_mainSellerId_status_idx" ON "people"("workspaceId", "mainSellerId", "status");
CREATE INDEX "people_workspaceId_mainSellerId_status_deletedAt_idx" ON "people"("workspaceId", "mainSellerId", "status", "deletedAt");
CREATE INDEX "companies_mainSellerId_idx" ON "companies"("mainSellerId");
CREATE INDEX "companies_workspaceId_mainSellerId_status_idx" ON "companies"("workspaceId", "mainSellerId", "status");
