-- Add missing fields to BuyerGroups table for enhanced buyer group functionality
-- This migration adds fields that are referenced in the code but missing from the current schema

-- Add companyTier field (S1-S7, M1-M7, L1-L7 tier classification)
ALTER TABLE "BuyerGroups" 
ADD COLUMN IF NOT EXISTS "companyTier" VARCHAR(10);

-- Add dealSize field (deal size context in USD)
ALTER TABLE "BuyerGroups" 
ADD COLUMN IF NOT EXISTS "dealSize" DECIMAL(15,2);

-- Add totalEmployeesFound field (research breadth metric)
ALTER TABLE "BuyerGroups" 
ADD COLUMN IF NOT EXISTS "totalEmployeesFound" INTEGER DEFAULT 0;

-- Add totalCost field (cost tracking for API usage)
ALTER TABLE "BuyerGroups" 
ADD COLUMN IF NOT EXISTS "totalCost" DECIMAL(10,2) DEFAULT 0;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_buyer_groups_company_tier" ON "BuyerGroups"("companyTier");
CREATE INDEX IF NOT EXISTS "idx_buyer_groups_deal_size" ON "BuyerGroups"("dealSize");
CREATE INDEX IF NOT EXISTS "idx_buyer_groups_total_employees" ON "BuyerGroups"("totalEmployeesFound");

-- Add comments for documentation
COMMENT ON COLUMN "BuyerGroups"."companyTier" IS 'Company size tier classification (S1-S7, M1-M7, L1-L7)';
COMMENT ON COLUMN "BuyerGroups"."dealSize" IS 'Deal size context in USD for buyer group optimization';
COMMENT ON COLUMN "BuyerGroups"."totalEmployeesFound" IS 'Total number of employees found during research';
COMMENT ON COLUMN "BuyerGroups"."totalCost" IS 'Total cost of API calls and data enrichment';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'BuyerGroups' 
AND column_name IN ('companyTier', 'dealSize', 'totalEmployeesFound', 'totalCost')
ORDER BY column_name;
