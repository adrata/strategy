-- Add V2 enhancement fields to BuyerGroupMembers table
-- All fields are optional to preserve existing data

-- Add new columns to BuyerGroupMembers
ALTER TABLE "BuyerGroupMembers" 
ADD COLUMN "coresignalId" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "seniorityLevel" TEXT,
ADD COLUMN "location" TEXT,
ADD COLUMN "profilePicture" TEXT,
ADD COLUMN "summary" TEXT,
ADD COLUMN "experience" JSONB,
ADD COLUMN "skills" TEXT[] DEFAULT '{}',
ADD COLUMN "priority" INTEGER DEFAULT 5,
ADD COLUMN "customFields" JSONB;

-- Add new columns to BuyerGroups
ALTER TABLE "BuyerGroups" 
ADD COLUMN "companyId" TEXT,
ADD COLUMN "status" TEXT DEFAULT 'active',
ADD COLUMN "enrichmentLevel" TEXT DEFAULT 'enrich',
ADD COLUMN "composition" JSONB,
ADD COLUMN "qualityMetrics" JSONB,
ADD COLUMN "creditsUsed" JSONB;

-- Add indexes for new fields
CREATE INDEX "BuyerGroupMembers_coresignalId_idx" ON "BuyerGroupMembers"("coresignalId");
CREATE INDEX "BuyerGroups_companyId_idx" ON "BuyerGroups"("companyId");
CREATE INDEX "BuyerGroups_status_idx" ON "BuyerGroups"("status");

-- Add comments for documentation
COMMENT ON COLUMN "BuyerGroupMembers"."coresignalId" IS 'Coresignal API ID for external data integration';
COMMENT ON COLUMN "BuyerGroupMembers"."department" IS 'Organizational department for context';
COMMENT ON COLUMN "BuyerGroupMembers"."seniorityLevel" IS 'Seniority level for hierarchy analysis';
COMMENT ON COLUMN "BuyerGroupMembers"."location" IS 'Geographic location';
COMMENT ON COLUMN "BuyerGroupMembers"."profilePicture" IS 'Profile picture URL';
COMMENT ON COLUMN "BuyerGroupMembers"."summary" IS 'Professional summary';
COMMENT ON COLUMN "BuyerGroupMembers"."experience" IS 'Work experience history';
COMMENT ON COLUMN "BuyerGroupMembers"."skills" IS 'Professional skills array';
COMMENT ON COLUMN "BuyerGroupMembers"."priority" IS 'Outreach priority ranking (1-10)';
COMMENT ON COLUMN "BuyerGroupMembers"."customFields" IS 'Extensible custom data';

COMMENT ON COLUMN "BuyerGroups"."companyId" IS 'Foreign key to companies table';
COMMENT ON COLUMN "BuyerGroups"."status" IS 'Buyer group status (active, inactive, archived)';
COMMENT ON COLUMN "BuyerGroups"."enrichmentLevel" IS 'Data enrichment level (identify, enrich, deep_research)';
COMMENT ON COLUMN "BuyerGroups"."composition" IS 'Role distribution and composition data';
COMMENT ON COLUMN "BuyerGroups"."qualityMetrics" IS 'Quality and accuracy metrics';
COMMENT ON COLUMN "BuyerGroups"."creditsUsed" IS 'API credits usage tracking';
