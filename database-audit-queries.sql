-- Database Audit Queries for CoreSignal Data
-- Run these queries to identify missing critical data

-- 1. Check if companies have companyUpdates
SELECT 
  COUNT(*) as total_companies,
  COUNT(CASE WHEN "companyUpdates" IS NOT NULL THEN 1 END) as with_updates,
  COUNT(CASE WHEN "customFields" IS NOT NULL THEN 1 END) as with_custom_fields
FROM companies;

-- 2. Check if people have CoreSignal data
SELECT 
  COUNT(*) as total_people,
  COUNT(CASE WHEN "coresignalData" IS NOT NULL THEN 1 END) as with_coresignal,
  COUNT(CASE WHEN "enrichedData" IS NOT NULL THEN 1 END) as with_enriched,
  COUNT(CASE WHEN "customFields" IS NOT NULL THEN 1 END) as with_custom_fields
FROM people;

-- 3. Sample CoreSignal data structure
SELECT 
  name,
  jsonb_pretty("coresignalData"::jsonb) as coresignal_sample,
  jsonb_pretty("enrichedData"::jsonb) as enriched_sample
FROM people 
WHERE "coresignalData" IS NOT NULL 
LIMIT 1;

-- 4. Check companyUpdates structure
SELECT 
  name,
  jsonb_pretty("companyUpdates"::jsonb) as updates_sample
FROM companies 
WHERE "companyUpdates" IS NOT NULL 
LIMIT 1;

-- 5. Check for missing linkedIn URLs
SELECT 
  COUNT(*) as total,
  COUNT("linkedinUrl") as with_linkedin
FROM companies;

SELECT 
  COUNT(*) as total,
  COUNT("linkedin") as with_linkedin
FROM people;

-- 6. Check for missing enrichment data
SELECT 
  name, 
  email,
  "dataCompleteness",
  "enrichmentScore"
FROM people 
WHERE "coresignalData" IS NULL 
  AND email IS NOT NULL
LIMIT 10;

-- 7. Check for companies needing enrichment
SELECT 
  name,
  website,
  industry,
  "employeeCount"
FROM companies 
WHERE "companyUpdates" IS NULL 
  AND website IS NOT NULL
LIMIT 10;

-- 8. Check for data completeness
SELECT 
  AVG("dataCompleteness") as avg_completeness,
  AVG("enrichmentScore") as avg_enrichment
FROM people;

-- 9. Check for stale data
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN "lastEnriched" < NOW() - INTERVAL '90 days' THEN 1 END) as stale
FROM people
WHERE "lastEnriched" IS NOT NULL;

-- 10. Check for missing buyer group data
SELECT 
  COUNT(*) as total_people,
  COUNT(CASE WHEN "isBuyerGroupMember" = true THEN 1 END) as buyer_group_members,
  COUNT(CASE WHEN "buyerGroupRole" IS NOT NULL THEN 1 END) as with_role
FROM people
WHERE "companyId" IS NOT NULL;
