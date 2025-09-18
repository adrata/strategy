-- TOP Engineers Plus Simple Data Enrichment Script
-- This script enriches the TOP Engineers Plus workspace using existing schema fields
-- Workspace ID: 01K5D01YCQJ9TJ7CT4DZDE79T1

-- Update the workspace with TOP Engineers Plus context
UPDATE "workspaces" 
SET 
  "description" = 'TOP Engineers Plus - Communications Engineering firm specializing in critical infrastructure and broadband deployment. We simplify complex communication engineering challenges and deliver strategic clarity for thriving communities.',
  "updatedAt" = NOW()
WHERE "id" = '01K5D01YCQJ9TJ7CT4DZDE79T1';

-- Update or create TOP Engineers Plus company record with enriched context
INSERT INTO "companies" (
  "id",
  "workspaceId",
  "name",
  "legalName",
  "tradingName",
  "website",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "country",
  "postalCode",
  "industry",
  "sector",
  "size",
  "description",
  "notes",
  "tags",
  "accountType",
  "tier",
  "vertical",
  "businessChallenges",
  "businessPriorities",
  "competitiveAdvantages",
  "growthOpportunities",
  "marketPosition",
  "strategicInitiatives",
  "successMetrics",
  "createdAt",
  "updatedAt"
) VALUES (
  '01K5D01YCQJ9TJ7CT4DZDE79T1_COMPANY',
  '01K5D01YCQJ9TJ7CT4DZDE79T1',
  'TOP Engineers Plus',
  'TOP Engineers Plus PLLC',
  'TOP Engineers Plus',
  'https://topengineersplus.com',
  'info@topengineersplus.com',
  '(210) 416-4808',
  '1100 West 116th Avenue',
  'Westminster',
  'CO',
  'United States',
  '80234',
  'Communications Engineering',
  'Professional Services',
  'Small-Medium',
  'TOP Engineers Plus is a competitive Communications Engineering firm specializing in critical infrastructure and broadband deployment. We simplify complex communication engineering challenges, breaking them down into clear, actionable tasks for thriving communities.',
  'Specializes in Communications technology, process development, and organizational alignment for a holistic project approach. Excels in deconstructing complex problems into actionable components, providing clients with strategic clarity and confidence in their decision-making processes.',
  ARRAY['Communications Engineering', 'Utility Infrastructure', 'Critical Infrastructure', 'Broadband Deployment', 'Engineering Consulting'],
  'Customer',
  'Premium',
  'Communications Engineering',
  ARRAY['Complex communication engineering challenges', 'Infrastructure deployment complexity', 'Organizational alignment issues', 'Process optimization needs'],
  ARRAY['Simplify complex challenges', 'Deliver strategic clarity', 'Provide comprehensive expertise', 'Ensure client satisfaction'],
  ARRAY['Complexity Simplified', 'Comprehensive Expertise', 'Strategic Clarity', 'Proven Track Record', 'Innovative Solutions', 'Efficient Delivery'],
  ARRAY['Infrastructure development growth', 'Digital transformation opportunities', 'Smart city initiatives', 'Broadband expansion projects'],
  'Established',
  ARRAY['Expand service offerings', 'Enhance client engagement', 'Develop new capabilities', 'Strengthen market position'],
  ARRAY['Client satisfaction', 'Project success rate', 'On-time delivery', 'Budget adherence'],
  NOW(),
  NOW()
) ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "legalName" = EXCLUDED."legalName",
  "tradingName" = EXCLUDED."tradingName",
  "website" = EXCLUDED."website",
  "email" = EXCLUDED."email",
  "phone" = EXCLUDED."phone",
  "address" = EXCLUDED."address",
  "city" = EXCLUDED."city",
  "state" = EXCLUDED."state",
  "country" = EXCLUDED."country",
  "postalCode" = EXCLUDED."postalCode",
  "industry" = EXCLUDED."industry",
  "sector" = EXCLUDED."sector",
  "size" = EXCLUDED."size",
  "description" = EXCLUDED."description",
  "notes" = EXCLUDED."notes",
  "tags" = EXCLUDED."tags",
  "accountType" = EXCLUDED."accountType",
  "tier" = EXCLUDED."tier",
  "vertical" = EXCLUDED."vertical",
  "businessChallenges" = EXCLUDED."businessChallenges",
  "businessPriorities" = EXCLUDED."businessPriorities",
  "competitiveAdvantages" = EXCLUDED."competitiveAdvantages",
  "growthOpportunities" = EXCLUDED."growthOpportunities",
  "marketPosition" = EXCLUDED."marketPosition",
  "strategicInitiatives" = EXCLUDED."strategicInitiatives",
  "successMetrics" = EXCLUDED."successMetrics",
  "updatedAt" = NOW();

-- Update existing companies in the workspace to have proper industry classification
UPDATE "companies" 
SET 
  "industry" = 'Communications Engineering',
  "sector" = 'Professional Services',
  "tags" = ARRAY['Communications Engineering', 'Utility Infrastructure', 'Critical Infrastructure', 'Broadband Deployment'],
  "updatedAt" = NOW()
WHERE "workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1' 
  AND ("industry" IS NULL OR "industry" = 'Engineering');

-- Create a summary of the enrichment
SELECT 
  'TOP Engineers Plus Data Enrichment Complete' as status,
  COUNT(*) as companies_updated,
  (SELECT COUNT(*) FROM "companies" WHERE "workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1') as total_companies,
  (SELECT COUNT(*) FROM "people" WHERE "workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1') as total_people
FROM "companies" 
WHERE "workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1';
