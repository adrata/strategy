-- Insert new permission record for DESKTOP_DOWNLOAD
INSERT INTO "permissions" ("id", "name", "description", "resource", "action", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::text, 'DESKTOP_DOWNLOAD_ACCESS', 'Access to desktop download feature', 'desktop', 'download', true, NOW(), NOW());
