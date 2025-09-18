-- TOP Engineers Plus Minimal Data Enrichment Script
-- This script enriches the TOP Engineers Plus workspace with minimal data to test field lengths
-- Workspace ID: 01K5D01YCQJ9TJ7CT4DZDE79T1

-- Update the workspace with TOP Engineers Plus context
UPDATE "workspaces" 
SET 
  "description" = 'TOP Engineers Plus - Communications Engineering firm.',
  "updatedAt" = NOW()
WHERE "id" = '01K5D01YCQJ9TJ7CT4DZDE79T1';

-- Update or create TOP Engineers Plus company record with minimal context
INSERT INTO "companies" (
  "id",
  "workspaceId",
  "name",
  "industry",
  "sector",
  "description",
  "tags",
  "createdAt",
  "updatedAt"
) VALUES (
  '01K5D01YCQJ9TJ7CT4DZDE79T1_COMPANY',
  '01K5D01YCQJ9TJ7CT4DZDE79T1',
  'TOP Engineers Plus',
  'Communications Engineering',
  'Professional Services',
  'TOP Engineers Plus is a Communications Engineering firm.',
  ARRAY['Communications Engineering', 'Utility Infrastructure'],
  NOW(),
  NOW()
) ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "industry" = EXCLUDED."industry",
  "sector" = EXCLUDED."sector",
  "description" = EXCLUDED."description",
  "tags" = EXCLUDED."tags",
  "updatedAt" = NOW();

-- Create a summary of the enrichment
SELECT 
  'TOP Engineers Plus Minimal Enrichment Complete' as status,
  COUNT(*) as companies_updated,
  (SELECT COUNT(*) FROM "companies" WHERE "workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1') as total_companies
FROM "companies" 
WHERE "workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1';
