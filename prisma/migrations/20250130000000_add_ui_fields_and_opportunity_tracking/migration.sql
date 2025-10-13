-- Add UI fields and opportunity tracking
-- Migration: 20250130000000_add_ui_fields_and_opportunity_tracking

-- Add vertical field to people table
ALTER TABLE "people" ADD COLUMN "vertical" VARCHAR(100);

-- Change notes from JSONB to TEXT in people table
-- First, migrate existing JSON notes to text
UPDATE "people" 
SET "notes" = CASE 
  WHEN "notes" IS NULL THEN NULL
  WHEN jsonb_typeof("notes") = 'string' THEN "notes"::text
  WHEN "notes" ? 'content' THEN "notes"->>'content'
  WHEN "notes" ? 'text' THEN "notes"->>'text'
  ELSE ''
END::text;

-- Drop the old JSONB column and recreate as TEXT
ALTER TABLE "people" DROP COLUMN "notes";
ALTER TABLE "people" ADD COLUMN "notes" TEXT;

-- Change notes from JSONB to TEXT in companies table
-- First, migrate existing JSON notes to text
UPDATE "companies" 
SET "notes" = CASE 
  WHEN "notes" IS NULL THEN NULL
  WHEN jsonb_typeof("notes") = 'string' THEN "notes"::text
  WHEN "notes" ? 'content' THEN "notes"->>'content'
  WHEN "notes" ? 'text' THEN "notes"->>'text'
  ELSE ''
END::text;

-- Drop the old JSONB column and recreate as TEXT
ALTER TABLE "companies" DROP COLUMN "notes";
ALTER TABLE "companies" ADD COLUMN "notes" TEXT;

-- Add opportunity tracking fields to companies table
ALTER TABLE "companies" ADD COLUMN "opportunityStage" VARCHAR(50);
ALTER TABLE "companies" ADD COLUMN "opportunityAmount" DECIMAL(15,2);
ALTER TABLE "companies" ADD COLUMN "opportunityProbability" DOUBLE PRECISION;
ALTER TABLE "companies" ADD COLUMN "expectedCloseDate" TIMESTAMP(3);
ALTER TABLE "companies" ADD COLUMN "actualCloseDate" TIMESTAMP(3);
