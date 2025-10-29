-- Add phone enrichment fields to people table
-- This migration adds fields for Lusha phone enrichment data

ALTER TABLE people ADD COLUMN phone1 VARCHAR(50);
ALTER TABLE people ADD COLUMN phone1Type VARCHAR(50);
ALTER TABLE people ADD COLUMN phone1Verified BOOLEAN DEFAULT FALSE;
ALTER TABLE people ADD COLUMN phone1Extension VARCHAR(20);
ALTER TABLE people ADD COLUMN phone2 VARCHAR(50);
ALTER TABLE people ADD COLUMN phone2Type VARCHAR(50);
ALTER TABLE people ADD COLUMN phone2Verified BOOLEAN DEFAULT FALSE;
ALTER TABLE people ADD COLUMN phone2Extension VARCHAR(20);
ALTER TABLE people ADD COLUMN directDialPhone VARCHAR(50);
ALTER TABLE people ADD COLUMN phoneEnrichmentSource VARCHAR(100);
ALTER TABLE people ADD COLUMN phoneEnrichmentDate TIMESTAMP;
ALTER TABLE people ADD COLUMN phoneDataQuality INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN people.phone1 IS 'Primary phone number from Lusha enrichment';
COMMENT ON COLUMN people.phone1Type IS 'Type of primary phone (mobile, work, direct, etc.)';
COMMENT ON COLUMN people.phone1Verified IS 'Whether primary phone is verified by Lusha';
COMMENT ON COLUMN people.phone1Extension IS 'Extension for primary phone if applicable';
COMMENT ON COLUMN people.phone2 IS 'Secondary phone number from Lusha enrichment';
COMMENT ON COLUMN people.phone2Type IS 'Type of secondary phone (mobile, work, direct, etc.)';
COMMENT ON COLUMN people.phone2Verified IS 'Whether secondary phone is verified by Lusha';
COMMENT ON COLUMN people.phone2Extension IS 'Extension for secondary phone if applicable';
COMMENT ON COLUMN people.directDialPhone IS 'Direct dial phone number for quick access';
COMMENT ON COLUMN people.phoneEnrichmentSource IS 'Source of phone enrichment (lusha_v2_linkedin, etc.)';
COMMENT ON COLUMN people.phoneEnrichmentDate IS 'Date when phone enrichment was performed';
COMMENT ON COLUMN people.phoneDataQuality IS 'Quality score of phone data (0-100)';
