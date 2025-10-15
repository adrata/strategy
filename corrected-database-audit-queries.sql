-- Corrected Database Audit Queries for CoreSignal Data
-- Run these queries to identify missing critical data

-- 1. Check if companies have companyUpdates
SELECT 
  COUNT(*) as total_companies,
  COUNT(CASE WHEN "companyUpdates" IS NOT NULL THEN 1 END) as with_updates,
  COUNT(CASE WHEN "customFields" IS NOT NULL THEN 1 END) as with_custom_fields
FROM companies;

-- 2. Check if people have CoreSignal data in customFields
SELECT 
  COUNT(*) as total_people,
  COUNT(CASE WHEN "customFields" IS NOT NULL THEN 1 END) as with_custom_fields,
  COUNT(CASE WHEN "customFields"->>'coresignal' IS NOT NULL THEN 1 END) as with_coresignal_in_custom,
  COUNT(CASE WHEN "customFields"->>'coresignalData' IS NOT NULL THEN 1 END) as with_coresignal_data,
  COUNT(CASE WHEN "enrichmentScore" IS NOT NULL THEN 1 END) as with_enrichment_score,
  COUNT(CASE WHEN "dataCompleteness" IS NOT NULL THEN 1 END) as with_data_completeness
FROM people;

-- 3. Sample CoreSignal data structure from customFields
SELECT 
  "fullName",
  "customFields"->>'coresignal' as coresignal_sample,
  "customFields"->>'coresignalData' as coresignal_data_sample,
  "enrichmentScore",
  "dataCompleteness"
FROM people 
WHERE "customFields"->>'coresignal' IS NOT NULL 
LIMIT 3;

-- 4. Check companyUpdates structure
SELECT 
  name,
  jsonb_pretty("companyUpdates"::jsonb) as updates_sample
FROM companies 
WHERE "companyUpdates" IS NOT NULL 
LIMIT 3;

-- 5. Check for missing linkedIn URLs
SELECT 
  COUNT(*) as total_companies,
  COUNT("linkedinUrl") as with_linkedin
FROM companies;

SELECT 
  COUNT(*) as total_people,
  COUNT("linkedinUrl") as with_linkedin
FROM people;

-- 6. Check for missing enrichment data
SELECT 
  "fullName", 
  email,
  "dataCompleteness",
  "enrichmentScore",
  "customFields"->>'coresignal' as has_coresignal
FROM people 
WHERE "customFields"->>'coresignal' IS NULL 
  AND email IS NOT NULL
LIMIT 10;

-- 7. Check for companies needing enrichment
SELECT 
  name,
  website,
  industry,
  "employeeCount",
  "companyUpdates" IS NOT NULL as has_company_updates
FROM companies 
WHERE "companyUpdates" IS NULL 
  AND website IS NOT NULL
LIMIT 10;

-- 8. Check for data completeness statistics
SELECT 
  AVG("dataCompleteness") as avg_completeness,
  AVG("enrichmentScore") as avg_enrichment,
  COUNT(CASE WHEN "dataCompleteness" IS NOT NULL THEN 1 END) as people_with_completeness,
  COUNT(CASE WHEN "enrichmentScore" IS NOT NULL THEN 1 END) as people_with_enrichment
FROM people;

-- 9. Check for stale enrichment data
SELECT 
  COUNT(*) as total_with_last_enriched,
  COUNT(CASE WHEN "lastEnriched" < NOW() - INTERVAL '90 days' THEN 1 END) as stale_enrichment
FROM people
WHERE "lastEnriched" IS NOT NULL;

-- 10. Check for buyer group data
SELECT 
  COUNT(*) as total_people,
  COUNT(CASE WHEN "buyerGroupRole" IS NOT NULL THEN 1 END) as with_buyer_group_role,
  COUNT(CASE WHEN "companyId" IS NOT NULL THEN 1 END) as with_company_id
FROM people;

-- 11. Check CoreSignal data quality in customFields
SELECT 
  COUNT(*) as total_people,
  COUNT(CASE WHEN "customFields"->>'coresignal' IS NOT NULL THEN 1 END) as with_coresignal,
  COUNT(CASE WHEN "customFields"->>'coresignalData' IS NOT NULL THEN 1 END) as with_coresignal_data,
  COUNT(CASE WHEN "customFields"->>'enrichedData' IS NOT NULL THEN 1 END) as with_enriched_data
FROM people;

-- 12. Sample of companies with rich CoreSignal data
SELECT 
  name,
  "employeeCount",
  "linkedinUrl",
  "companyUpdates" IS NOT NULL as has_updates,
  "customFields" IS NOT NULL as has_custom_fields
FROM companies 
WHERE "companyUpdates" IS NOT NULL 
  OR "customFields" IS NOT NULL
LIMIT 10;
