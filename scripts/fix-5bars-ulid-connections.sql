-- Fix 5 Bars Services records to use proper ULIDs and connect people to prospects
-- This script will:
-- 1. Generate proper ULIDs for all records
-- 2. Link prospects to people via personId
-- 3. Ensure all records follow the ULID standard

-- First, let's see what we have
SELECT 'Current People Records:' as status;
SELECT id, "fullName", "jobTitle" FROM people WHERE "companyId" = '01K5D5VGQ35SXGBPK5F2WSMFM2';

SELECT 'Current Prospect Records:' as status;
SELECT id, "fullName", "personId" FROM prospects WHERE company = '5 Bars Services, LLC';

-- Generate new ULIDs and update people records
-- John Delisi - People record
UPDATE people 
SET 
    id = '01K5D6BT0SYMGSQ6700GGA146J',  -- New ULID for John Delisi
    "updatedAt" = NOW()
WHERE "fullName" = 'John Delisi' 
  AND "companyId" = '01K5D5VGQ35SXGBPK5F2WSMFM2';

-- Dustin Stephens - People record  
UPDATE people 
SET 
    id = '01K5D6BT0SYMGSQ6700GGA146K',  -- New ULID for Dustin Stephens
    "updatedAt" = NOW()
WHERE "fullName" = 'Dustin Stephens' 
  AND "companyId" = '01K5D5VGQ35SXGBPK5F2WSMFM2';

-- Update prospect records with proper ULIDs and link to people
-- John Delisi - Prospect record
UPDATE prospects 
SET 
    id = '01K5D6BT0SYMGSQ6700GGA146L',  -- New ULID for John Delisi prospect
    "personId" = '01K5D6BT0SYMGSQ6700GGA146J',  -- Link to John Delisi people record
    "updatedAt" = NOW()
WHERE "fullName" = 'John Delisi' 
  AND company = '5 Bars Services, LLC';

-- Dustin Stephens - Prospect record
UPDATE prospects 
SET 
    id = '01K5D6BT0SYMGSQ6700GGA146M',  -- New ULID for Dustin Stephens prospect
    "personId" = '01K5D6BT0SYMGSQ6700GGA146K',  -- Link to Dustin Stephens people record
    "updatedAt" = NOW()
WHERE "fullName" = 'Dustin Stephens' 
  AND company = '5 Bars Services, LLC';

-- Verify the connections
SELECT 'Updated People Records:' as status;
SELECT id, "fullName", "jobTitle", "customFields"->>'buyerGroupRole' as role
FROM people 
WHERE "companyId" = '01K5D5VGQ35SXGBPK5F2WSMFM2'
ORDER BY "fullName";

SELECT 'Updated Prospect Records:' as status;
SELECT id, "fullName", "personId", "customFields"->>'buyerGroupRole' as role
FROM prospects 
WHERE company = '5 Bars Services, LLC'
ORDER BY "fullName";

-- Verify the connections work
SELECT 'People-Prospect Connections:' as status;
SELECT 
    p.id as people_id,
    p."fullName" as people_name,
    p."jobTitle" as people_title,
    pr.id as prospect_id,
    pr."personId" as linked_person_id,
    pr.company as prospect_company
FROM people p
LEFT JOIN prospects pr ON p.id = pr."personId"
WHERE p."companyId" = '01K5D5VGQ35SXGBPK5F2WSMFM2'
ORDER BY p."fullName";

SELECT 'All records updated with proper ULIDs and connections!' as status;
