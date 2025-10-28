-- Insert new permission records for METRICS and CHRONICLE
INSERT INTO "permissions" ("id", "name", "description", "resource", "action", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::text, 'METRICS_ACCESS', 'Access to Metrics features', 'metrics', 'access', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'CHRONICLE_ACCESS', 'Access to Chronicle features', 'chronicle', 'access', true, NOW(), NOW());
