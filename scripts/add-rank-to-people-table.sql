-- Add rank field to people table to match companies table structure
-- This will allow buyer groups to be sorted by rank like companies

-- Add rank column to people table
ALTER TABLE people ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

-- Add index on rank for better performance
CREATE INDEX IF NOT EXISTS idx_people_rank ON people(rank);

-- Update existing 5 Bars Services people with appropriate ranks
-- Decision Makers get rank 1, Champions get rank 2, etc.
UPDATE people 
SET rank = CASE 
  WHEN "customFields"->>'buyerGroupRole' = 'Decision Maker' THEN 1
  WHEN "customFields"->>'buyerGroupRole' = 'Champion' THEN 2
  WHEN "customFields"->>'buyerGroupRole' = 'Blocker' THEN 3
  WHEN "customFields"->>'buyerGroupRole' = 'Stakeholder' THEN 4
  WHEN "customFields"->>'buyerGroupRole' = 'Introducer' THEN 5
  ELSE 6
END
WHERE "companyId" = '01K5D5VGQ35SXGBPK5F2WSMFM2';

-- Verify the rank updates
SELECT "fullName", "customFields"->>'buyerGroupRole' as role, rank
FROM people 
WHERE "companyId" = '01K5D5VGQ35SXGBPK5F2WSMFM2'
ORDER BY rank, "fullName";

SELECT 'Rank field added to people table successfully!' as status;
