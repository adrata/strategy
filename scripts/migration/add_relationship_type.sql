-- Add RelationshipType enum and relationshipType field to companies and people
-- This migration is safe and does not delete any data
-- All existing records will be set to FUTURE_CLIENT by default
-- 
-- Run this script directly on your database:
-- psql $DATABASE_URL -f scripts/migration/add_relationship_type.sql
-- OR execute via your database client

-- Step 1: Create RelationshipType enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RelationshipType') THEN
        CREATE TYPE "RelationshipType" AS ENUM ('CLIENT', 'FUTURE_CLIENT', 'PARTNER', 'FUTURE_PARTNER');
    END IF;
END $$;

-- Step 2: Add relationshipType column to companies table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'relationshipType'
    ) THEN
        ALTER TABLE "companies" ADD COLUMN "relationshipType" "RelationshipType";
    END IF;
END $$;

-- Step 3: Add relationshipType column to people table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'people' AND column_name = 'relationshipType'
    ) THEN
        ALTER TABLE "people" ADD COLUMN "relationshipType" "RelationshipType";
    END IF;
END $$;

-- Step 4: Set all existing companies to FUTURE_CLIENT (safe - only updates NULL values)
UPDATE "companies" 
SET "relationshipType" = 'FUTURE_CLIENT' 
WHERE "relationshipType" IS NULL;

-- Step 5: Set all existing people to FUTURE_CLIENT (safe - only updates NULL values)
UPDATE "people" 
SET "relationshipType" = 'FUTURE_CLIENT' 
WHERE "relationshipType" IS NULL;

-- Step 6: Create indexes for efficient filtering (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "companies_workspaceId_relationshipType_idx" 
ON "companies"("workspaceId", "relationshipType");

CREATE INDEX IF NOT EXISTS "people_workspaceId_relationshipType_idx" 
ON "people"("workspaceId", "relationshipType");

-- Verify the changes
SELECT 
    'companies' as table_name,
    COUNT(*) as total_records,
    COUNT("relationshipType") as records_with_relationship_type,
    COUNT(CASE WHEN "relationshipType" = 'FUTURE_CLIENT' THEN 1 END) as future_clients
FROM "companies"
UNION ALL
SELECT 
    'people' as table_name,
    COUNT(*) as total_records,
    COUNT("relationshipType") as records_with_relationship_type,
    COUNT(CASE WHEN "relationshipType" = 'FUTURE_CLIENT' THEN 1 END) as future_clients
FROM "people";

