-- Insert new permission records
INSERT INTO "permissions" ("id", "name", "description", "resource", "action", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::text, 'OASIS_ACCESS', 'Access to Oasis communication features', 'oasis', 'access', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'STACKS_ACCESS', 'Access to Stacks project management', 'stacks', 'access', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ATRIUM_ACCESS', 'Access to Atrium features', 'atrium', 'access', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'REVENUEOS_ACCESS', 'Access to RevenueOS features', 'revenueos', 'access', true, NOW(), NOW());

-- Update existing workspaces to have all features enabled by default for backward compatibility
UPDATE "workspaces" 
SET "enabledFeatures" = ARRAY['OASIS', 'STACKS', 'ATRIUM', 'REVENUEOS']
WHERE "enabledFeatures" IS NULL OR array_length("enabledFeatures", 1) IS NULL;
