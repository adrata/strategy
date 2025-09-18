-- Test enrichment script
INSERT INTO "companies" (
  "id",
  "workspaceId",
  "name",
  "createdAt",
  "updatedAt"
) VALUES (
  '01K5D01YCQJ9TJ7CT4DZDE79T1_TEST',
  '01K5D01YCQJ9TJ7CT4DZDE79T1',
  'TOP Engineers Plus Test',
  NOW(),
  NOW()
) ON CONFLICT ("id") DO NOTHING;

SELECT 'Test enrichment complete' as status;
