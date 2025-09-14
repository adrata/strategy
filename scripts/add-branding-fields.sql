-- Add branding fields to Workspace table
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "logoUrl" VARCHAR(255);
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "primaryColor" VARCHAR(7);
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "secondaryColor" VARCHAR(7);

-- Update existing workspaces with default branding
UPDATE "Workspace" 
SET "logoUrl" = '/a0.png',
    "primaryColor" = '#1f2937'  -- Default dark gray
WHERE "logoUrl" IS NULL;

-- Set specific colors for known workspaces
UPDATE "Workspace" 
SET "primaryColor" = '#AE3033'  -- Retail product solution color
WHERE "name" ILIKE '%retail%' OR "slug" ILIKE '%retail%';

UPDATE "Workspace" 
SET "primaryColor" = '#0A1F49'  -- Notary everyday color  
WHERE "name" ILIKE '%notary%' OR "slug" ILIKE '%notary%';

-- Show updated workspaces
SELECT id, name, slug, "logoUrl", "primaryColor", "secondaryColor" FROM "Workspace" LIMIT 10;

