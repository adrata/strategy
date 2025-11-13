-- Script to check and potentially recover linkedinNavigatorUrl data for companies
-- Run this to verify the current state of the data

-- 1. Check current state of linkedinNavigatorUrl in companies
SELECT 
    COUNT(*) as total_companies,
    COUNT("linkedinNavigatorUrl") as companies_with_linkedin_navigator,
    COUNT(CASE WHEN "linkedinNavigatorUrl" IS NOT NULL AND "linkedinNavigatorUrl" != '' THEN 1 END) as companies_with_data
FROM companies
WHERE "deletedAt" IS NULL;

-- 2. Check for any companies that have linkedinUrl but no linkedinNavigatorUrl
-- (These might have lost data if we had it before)
SELECT 
    COUNT(*) as companies_with_linkedin_url_only
FROM companies
WHERE "deletedAt" IS NULL
    AND "linkedinUrl" IS NOT NULL
    AND "linkedinUrl" != ''
    AND ("linkedinNavigatorUrl" IS NULL OR "linkedinNavigatorUrl" = '');

-- 3. Sample of companies with linkedinUrl but missing linkedinNavigatorUrl
SELECT 
    id,
    name,
    "linkedinUrl",
    "linkedinNavigatorUrl",
    "updatedAt"
FROM companies
WHERE "deletedAt" IS NULL
    AND "linkedinUrl" IS NOT NULL
    AND "linkedinUrl" != ''
    AND ("linkedinNavigatorUrl" IS NULL OR "linkedinNavigatorUrl" = '')
LIMIT 10;

-- 4. Check people table for linkedinNavigatorUrl data
SELECT 
    COUNT(*) as total_people,
    COUNT("linkedinNavigatorUrl") as people_with_linkedin_navigator,
    COUNT(CASE WHEN "linkedinNavigatorUrl" IS NOT NULL AND "linkedinNavigatorUrl" != '' THEN 1 END) as people_with_data
FROM people
WHERE "deletedAt" IS NULL;

-- TO RECOVER FROM BACKUP:
-- If you have a database snapshot/backup from before the column was removed,
-- you can restore the data using something like:
--
-- UPDATE companies c
-- SET "linkedinNavigatorUrl" = backup.linkedin_navigator_url
-- FROM backup_companies backup
-- WHERE c.id = backup.id
--     AND backup.linkedin_navigator_url IS NOT NULL
--     AND backup.linkedin_navigator_url != ''
--     AND (c."linkedinNavigatorUrl" IS NULL OR c."linkedinNavigatorUrl" = '');

