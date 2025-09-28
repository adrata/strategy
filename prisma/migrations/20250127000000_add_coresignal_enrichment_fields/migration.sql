-- Add CoreSignal enrichment fields to companies table
-- This ensures we can store all data returned from CoreSignal API

-- Company Status Fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "stockSymbol" VARCHAR(20);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "logoUrl" VARCHAR(500);

-- Domain and Website Fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "domain" VARCHAR(255);

-- Headquarters Location Fields
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hqLocation" VARCHAR(255);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hqFullAddress" VARCHAR(500);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hqCity" VARCHAR(100);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hqState" VARCHAR(100);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hqStreet" VARCHAR(255);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hqZipcode" VARCHAR(20);

-- Social Media Followers
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "twitterFollowers" INTEGER;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "owlerFollowers" INTEGER;

-- Company Updates and Activity
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "companyUpdates" JSONB;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "numTechnologiesUsed" INTEGER;

-- Enhanced Descriptions
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "descriptionEnriched" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "descriptionMetadataRaw" TEXT;

-- Regional Information
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hqRegion" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hqCountryIso2" VARCHAR(2);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hqCountryIso3" VARCHAR(3);

-- Create indexes for performance on new fields
CREATE INDEX IF NOT EXISTS "idx_companies_is_public" ON "companies"("isPublic");
CREATE INDEX IF NOT EXISTS "idx_companies_stock_symbol" ON "companies"("stockSymbol");
CREATE INDEX IF NOT EXISTS "idx_companies_domain" ON "companies"("domain");
CREATE INDEX IF NOT EXISTS "idx_companies_hq_city" ON "companies"("hqCity");
CREATE INDEX IF NOT EXISTS "idx_companies_hq_state" ON "companies"("hqState");
CREATE INDEX IF NOT EXISTS "idx_companies_hq_country_iso2" ON "companies"("hqCountryIso2");
CREATE INDEX IF NOT EXISTS "idx_companies_twitter_followers" ON "companies"("twitterFollowers");
CREATE INDEX IF NOT EXISTS "idx_companies_owler_followers" ON "companies"("owlerFollowers");
CREATE INDEX IF NOT EXISTS "idx_companies_num_technologies" ON "companies"("numTechnologiesUsed");

-- Create GIN index for JSONB company updates
CREATE INDEX IF NOT EXISTS "idx_companies_company_updates" ON "companies" USING GIN("companyUpdates");

-- Create GIN index for hqRegion array
CREATE INDEX IF NOT EXISTS "idx_companies_hq_region" ON "companies" USING GIN("hqRegion");
