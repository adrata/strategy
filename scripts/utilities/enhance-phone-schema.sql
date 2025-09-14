-- Enhance contacts table for comprehensive phone number support
-- Based on Lusha API phone number capabilities

-- Add phone number type and verification fields
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone1" VARCHAR(50);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone1Type" VARCHAR(20);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone1Verified" BOOLEAN DEFAULT false;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone1Extension" VARCHAR(10);

ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone2" VARCHAR(50);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone2Type" VARCHAR(20);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone2Verified" BOOLEAN DEFAULT false;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone2Extension" VARCHAR(10);

-- Add specific phone type fields for quick access
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "directDialPhone" VARCHAR(50);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "mobilePhoneVerified" BOOLEAN DEFAULT false;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "workPhoneVerified" BOOLEAN DEFAULT false;

-- Add phone enrichment tracking
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phoneEnrichmentSource" VARCHAR(50);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phoneEnrichmentDate" TIMESTAMP;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phoneDataQuality" INTEGER DEFAULT 0;

-- Create indexes for phone-based queries
CREATE INDEX IF NOT EXISTS "idx_contacts_phone1" ON "contacts"("phone1");
CREATE INDEX IF NOT EXISTS "idx_contacts_phone2" ON "contacts"("phone2");
CREATE INDEX IF NOT EXISTS "idx_contacts_direct_dial" ON "contacts"("directDialPhone");
CREATE INDEX IF NOT EXISTS "idx_contacts_phone_verified" ON "contacts"("phone1Verified", "phone2Verified");

-- Create a view for high-quality phone contacts
CREATE OR REPLACE VIEW "contacts_with_verified_phones" AS
SELECT 
  id,
  "fullName",
  "jobTitle",
  "buyerGroupRole",
  "seniorityScore",
  "targetPriority",
  email,
  phone1,
  phone1Type,
  phone1Verified,
  phone2,
  phone2Type,
  phone2Verified,
  "directDialPhone",
  "mobilePhone",
  "workPhone",
  "phoneDataQuality",
  "accountId",
  "linkedinUrl"
FROM "contacts"
WHERE 
  (phone1 IS NOT NULL AND phone1Verified = true)
  OR (phone2 IS NOT NULL AND phone2Verified = true)
  OR "directDialPhone" IS NOT NULL
ORDER BY 
  "seniorityScore" DESC,
  "targetPriority" DESC,
  "phoneDataQuality" DESC;
