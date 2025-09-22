-- Add rank field to prospects and leads tables to match companies table structure
-- This will allow prospects and leads to be sorted by rank like companies

-- Add rank column to prospects table
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

-- Add rank column to leads table  
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

-- Add indexes on rank for better performance
CREATE INDEX IF NOT EXISTS idx_prospects_rank ON prospects(rank);
CREATE INDEX IF NOT EXISTS idx_leads_rank ON leads(rank);

-- Update existing 5 Bars Services prospects with appropriate ranks
-- Decision Makers get rank 1, Champions get rank 2, etc.
UPDATE prospects 
SET rank = CASE 
  WHEN "customFields"->>'buyerGroupRole' = 'Decision Maker' THEN 1
  WHEN "customFields"->>'buyerGroupRole' = 'Champion' THEN 2
  WHEN "customFields"->>'buyerGroupRole' = 'Blocker' THEN 3
  WHEN "customFields"->>'buyerGroupRole' = 'Stakeholder' THEN 4
  WHEN "customFields"->>'buyerGroupRole' = 'Introducer' THEN 5
  ELSE 6
END
WHERE company = '5 Bars Services, LLC';

-- Update existing 5 Bars Services leads with appropriate ranks
UPDATE leads 
SET rank = CASE 
  WHEN "customFields"->>'buyerGroupRole' = 'Decision Maker' THEN 1
  WHEN "customFields"->>'buyerGroupRole' = 'Champion' THEN 2
  WHEN "customFields"->>'buyerGroupRole' = 'Blocker' THEN 3
  WHEN "customFields"->>'buyerGroupRole' = 'Stakeholder' THEN 4
  WHEN "customFields"->>'buyerGroupRole' = 'Introducer' THEN 5
  ELSE 6
END
WHERE company = '5 Bars Services, LLC';

-- Verify the rank updates
SELECT 'Prospects with ranks:' as table_name;
SELECT "fullName", "customFields"->>'buyerGroupRole' as role, rank
FROM prospects 
WHERE company = '5 Bars Services, LLC'
ORDER BY rank, "fullName";

SELECT 'Leads with ranks:' as table_name;
SELECT "fullName", "customFields"->>'buyerGroupRole' as role, rank
FROM leads 
WHERE company = '5 Bars Services, LLC'
ORDER BY rank, "fullName";

SELECT 'Rank fields added to prospects and leads tables successfully!' as status;
