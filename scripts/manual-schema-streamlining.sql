-- ============================================================
-- Manual Schema Streamlining SQL
-- ============================================================
-- 
-- Run these SQL statements manually if the migration script
-- encounters permission errors (must be owner of table).
-- 
-- These statements should be run by a database admin with
-- appropriate permissions.
-- ============================================================

-- ============================================================
-- 1. Remove duplicate linkedinnavigatorurl from companies
-- ============================================================

-- Step 1: Migrate any data from linkedinnavigatorurl to linkedinNavigatorUrl
-- (Only migrate if linkedinNavigatorUrl is null/empty and linkedinnavigatorurl has data)
UPDATE companies
SET "linkedinNavigatorUrl" = linkedinnavigatorurl
WHERE ("linkedinNavigatorUrl" IS NULL OR "linkedinNavigatorUrl" = '')
  AND linkedinnavigatorurl IS NOT NULL
  AND linkedinnavigatorurl != '';

-- Step 2: Verify migration
SELECT 
  COUNT(*) as rows_migrated,
  COUNT(*) FILTER (WHERE linkedinnavigatorurl IS NOT NULL AND linkedinnavigatorurl != '' AND ("linkedinNavigatorUrl" IS NULL OR "linkedinNavigatorUrl" = '')) as rows_still_need_migration
FROM companies
WHERE linkedinnavigatorurl IS NOT NULL AND linkedinnavigatorurl != '';

-- Step 3: Drop the duplicate column (requires table owner permissions)
ALTER TABLE companies DROP COLUMN IF EXISTS linkedinnavigatorurl;

-- ============================================================
-- 2. Remove title field from people table
-- ============================================================

-- Step 1: Migrate any data from title to jobTitle
-- (Only migrate if jobTitle is null/empty and title has data)
-- Note: Column name is "jobTitle" (camelCase) in the database
UPDATE people
SET "jobTitle" = title
WHERE ("jobTitle" IS NULL OR "jobTitle" = '')
  AND title IS NOT NULL
  AND title != '';

-- Step 2: Verify migration (should return 0 before proceeding)
SELECT COUNT(*) as rows_still_need_migration
FROM people
WHERE title IS NOT NULL
  AND title != ''
  AND ("jobTitle" IS NULL OR "jobTitle" = '');

-- If the count above is > 0, investigate those rows before proceeding

-- Step 3: Drop the title column (requires table owner permissions)
ALTER TABLE people DROP COLUMN IF EXISTS title;

-- ============================================================
-- Verification Queries
-- ============================================================

-- Verify linkedinnavigatorurl is removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND column_name IN ('linkedinnavigatorurl', 'linkedinNavigatorUrl');

-- Should show only 'linkedinNavigatorUrl', not 'linkedinnavigatorurl'

-- Verify title is removed from people
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'people' 
  AND column_name IN ('title', 'jobTitle');

-- Should show only 'jobTitle', not 'title'

