-- Add RelationshipType enum and relationshipType field to companies and people
-- This migration is safe and does not delete any data
-- All existing records will be set to FUTURE_CLIENT by default

-- Create RelationshipType enum
CREATE TYPE "RelationshipType" AS ENUM ('CLIENT', 'FUTURE_CLIENT', 'PARTNER', 'FUTURE_PARTNER');

-- Add relationshipType column to companies table (nullable initially)
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "relationshipType" "RelationshipType";

-- Add relationshipType column to people table (nullable initially)
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "relationshipType" "RelationshipType";

-- Set all existing companies to FUTURE_CLIENT
UPDATE "companies" SET "relationshipType" = 'FUTURE_CLIENT' WHERE "relationshipType" IS NULL;

-- Set all existing people to FUTURE_CLIENT
UPDATE "people" SET "relationshipType" = 'FUTURE_CLIENT' WHERE "relationshipType" IS NULL;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS "companies_workspaceId_relationshipType_idx" ON "companies"("workspaceId", "relationshipType");
CREATE INDEX IF NOT EXISTS "people_workspaceId_relationshipType_idx" ON "people"("workspaceId", "relationshipType");

