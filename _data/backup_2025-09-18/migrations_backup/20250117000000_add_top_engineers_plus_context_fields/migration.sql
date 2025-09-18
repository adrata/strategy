-- Add TOP Engineers Plus specific context fields to companies model
-- These fields will help Adrata understand TOP's business model and positioning

-- Add service offerings and capabilities fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "serviceOfferings" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "technicalCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "deliveryCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "expertiseAreas" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add client engagement and methodology fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "clientEngagementModel" VARCHAR(100);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "projectMethodology" VARCHAR(100);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "communicationStyle" VARCHAR(50) DEFAULT 'Professional';

-- Add market positioning and value proposition fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "uniqueValuePropositions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "marketPositioning" VARCHAR(100);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "targetSegments" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add quality standards and business approach fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "qualityStandards" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "businessApproach" VARCHAR(200);

-- Add industry specialization fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "industrySpecializations" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "targetMarkets" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create indexes for performance on new fields
CREATE INDEX IF NOT EXISTS "idx_companies_service_offerings" ON "companies" USING GIN("serviceOfferings");
CREATE INDEX IF NOT EXISTS "idx_companies_technical_capabilities" ON "companies" USING GIN("technicalCapabilities");
CREATE INDEX IF NOT EXISTS "idx_companies_expertise_areas" ON "companies" USING GIN("expertiseAreas");
CREATE INDEX IF NOT EXISTS "idx_companies_target_segments" ON "companies" USING GIN("targetSegments");
CREATE INDEX IF NOT EXISTS "idx_companies_industry_specializations" ON "companies" USING GIN("industrySpecializations");
CREATE INDEX IF NOT EXISTS "idx_companies_target_markets" ON "companies" USING GIN("targetMarkets");

-- Add workspace context fields to workspaces model
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "companyContext" JSONB;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "businessModel" VARCHAR(100);
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "serviceFocus" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "stakeholderApproach" VARCHAR(50) DEFAULT 'Client-Centric';
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "projectDeliveryStyle" VARCHAR(50) DEFAULT 'Strategic Clarity';

-- Create indexes for workspace context fields
CREATE INDEX IF NOT EXISTS "idx_workspaces_business_model" ON "workspaces"("businessModel") WHERE "businessModel" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_workspaces_service_focus" ON "workspaces" USING GIN("serviceFocus");
CREATE INDEX IF NOT EXISTS "idx_workspaces_company_context" ON "workspaces" USING GIN("companyContext");
