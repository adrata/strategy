-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "logoUrl" VARCHAR(255),
ADD COLUMN     "primaryColor" VARCHAR(7),
ADD COLUMN     "secondaryColor" VARCHAR(7);

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

