-- Migration: Add Directional Intelligence field for strategic guidance
-- Date: 2025-01-29
-- Description: Adds directionalIntelligence field to people and companies for strategic next action guidance

-- Add directionalIntelligence field to people table
ALTER TABLE "people" 
  ADD COLUMN IF NOT EXISTS "directionalIntelligence" TEXT;

-- Add directionalIntelligence field to companies table  
ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "directionalIntelligence" TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS "idx_people_directional_intelligence" 
  ON "people"("directionalIntelligence") 
  WHERE "directionalIntelligence" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_companies_directional_intelligence" 
  ON "companies"("directionalIntelligence") 
  WHERE "directionalIntelligence" IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "people"."directionalIntelligence" IS 'Strategic guidance (2-4 sentences) aligned with AcquisitionOS framework - more comprehensive than nextAction';
COMMENT ON COLUMN "companies"."directionalIntelligence" IS 'Strategic guidance (2-4 sentences) aligned with AcquisitionOS framework - more comprehensive than nextAction';

