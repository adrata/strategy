-- Migration: Remove duplicate linkedinnavigatorurl field from companies table
-- This migration removes the typo version (linkedinnavigatorurl) and keeps linkedinNavigatorUrl

-- Step 1: Migrate any data from linkedinnavigatorurl to linkedinNavigatorUrl if needed
-- (Only migrate if linkedinNavigatorUrl is null/empty and linkedinnavigatorurl has data)
UPDATE companies
SET "linkedinNavigatorUrl" = linkedinnavigatorurl
WHERE ("linkedinNavigatorUrl" IS NULL OR "linkedinNavigatorUrl" = '')
  AND linkedinnavigatorurl IS NOT NULL
  AND linkedinnavigatorurl != '';

-- Step 2: Drop the duplicate column
ALTER TABLE companies DROP COLUMN IF EXISTS linkedinnavigatorurl;

