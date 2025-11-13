-- Migration: Remove title field from people table (standardize on jobTitle)
-- This migration migrates any data from title to jobTitle, then removes the title field

-- Step 1: Migrate any data from title to jobTitle where jobTitle is null/empty
-- (Only migrate if jobTitle is null/empty and title has data)
UPDATE people
SET job_title = title
WHERE (job_title IS NULL OR job_title = '')
  AND title IS NOT NULL
  AND title != '';

-- Step 2: Verify migration (should return 0 before proceeding)
-- SELECT COUNT(*) FROM people WHERE title IS NOT NULL AND title != '' AND (job_title IS NULL OR job_title = '');
-- If count > 0, investigate before proceeding

-- Step 3: Drop the title column
ALTER TABLE people DROP COLUMN IF EXISTS title;

