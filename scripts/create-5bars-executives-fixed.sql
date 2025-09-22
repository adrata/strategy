-- Direct SQL script to create John Delisi and Dustin Stephens records
-- Company: 5 Bars Services, LLC (ID: 01K5D5VGQ35SXGBPK5F2WSMFM2)
-- Workspace: TOP Engineering Plus (ID: 01K5D01YCQJ9TJ7CT4DZDE79T1)

-- First, let's check if the records already exist
SELECT 'Checking existing records...' as status;

-- Check for existing people records
SELECT id, "fullName", email, "companyId" 
FROM people 
WHERE "companyId" = '01K5D5VGQ35SXGBPK5F2WSMFM2' 
   OR "fullName" IN ('John Delisi', 'Dustin Stephens');

-- Check for existing prospect records
SELECT id, "fullName", email, company 
FROM prospects 
WHERE company = '5 Bars Services, LLC' 
   OR "fullName" IN ('John Delisi', 'Dustin Stephens');

-- Create John Delisi (CEO) - People record
INSERT INTO people (
    id,
    "workspaceId",
    "companyId",
    "assignedUserId",
    "firstName",
    "lastName",
    "fullName",
    "jobTitle",
    department,
    email,
    "workEmail",
    phone,
    "workPhone",
    tags,
    "customFields",
    status,
    "createdAt",
    "updatedAt"
) VALUES (
    'contact_5bars_john_delisi_2025',
    '01K5D01YCQJ9TJ7CT4DZDE79T1',
    '01K5D5VGQ35SXGBPK5F2WSMFM2',
    '01K1VBYZG41K9QA0D9CF06KNRG',
    'John',
    'Delisi',
    'John Delisi',
    'Chief Executive Officer',
    'Executive',
    'john.delisi@5bars.net',
    'john.delisi@5bars.net',
    '800.905.7221',
    '800.905.7221',
    ARRAY['External Data Source', 'Buyer Group Member'],
    '{"coresignalId": "770302196", "buyerGroupRole": "Decision Maker", "influenceLevel": "High", "engagementPriority": "High", "dataSource": "External"}'::jsonb,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    "jobTitle" = EXCLUDED."jobTitle",
    email = EXCLUDED.email,
    "workEmail" = EXCLUDED."workEmail",
    phone = EXCLUDED.phone,
    "workPhone" = EXCLUDED."workPhone",
    "customFields" = EXCLUDED."customFields",
    "updatedAt" = NOW();

-- Create Dustin Stephens (Project Director) - People record
INSERT INTO people (
    id,
    "workspaceId",
    "companyId",
    "assignedUserId",
    "firstName",
    "lastName",
    "fullName",
    "jobTitle",
    department,
    email,
    "workEmail",
    phone,
    "workPhone",
    tags,
    "customFields",
    status,
    "createdAt",
    "updatedAt"
) VALUES (
    'contact_5bars_dustin_stephens_2025',
    '01K5D01YCQJ9TJ7CT4DZDE79T1',
    '01K5D5VGQ35SXGBPK5F2WSMFM2',
    '01K1VBYZG41K9QA0D9CF06KNRG',
    'Dustin',
    'Stephens',
    'Dustin Stephens',
    'Project Director',
    'Operations',
    'dustin.stephens@5bars.net',
    'dustin.stephens@5bars.net',
    '800.905.7221',
    '800.905.7221',
    ARRAY['External Data Source', 'Buyer Group Member'],
    '{"coresignalId": "447442560", "buyerGroupRole": "Champion", "influenceLevel": "High", "engagementPriority": "High", "dataSource": "External"}'::jsonb,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    "jobTitle" = EXCLUDED."jobTitle",
    email = EXCLUDED.email,
    "workEmail" = EXCLUDED."workEmail",
    phone = EXCLUDED.phone,
    "workPhone" = EXCLUDED."workPhone",
    "customFields" = EXCLUDED."customFields",
    "updatedAt" = NOW();

-- Create John Delisi - Prospect record
INSERT INTO prospects (
    id,
    "workspaceId",
    "assignedUserId",
    "firstName",
    "lastName",
    "fullName",
    email,
    "workEmail",
    phone,
    "workPhone",
    company,
    "companyDomain",
    "jobTitle",
    title,
    department,
    status,
    priority,
    source,
    tags,
    "customFields",
    "engagementLevel",
    "createdAt",
    "updatedAt"
) VALUES (
    'prospect_5bars_john_delisi_2025',
    '01K5D01YCQJ9TJ7CT4DZDE79T1',
    '01K1VBYZG41K9QA0D9CF06KNRG',
    'John',
    'Delisi',
    'John Delisi',
    'john.delisi@5bars.net',
    'john.delisi@5bars.net',
    '800.905.7221',
    '800.905.7221',
    '5 Bars Services, LLC',
    '5bars.net',
    'Chief Executive Officer',
    'Chief Executive Officer',
    'Executive',
    'engaged',
    'high',
    'External Data Source',
    ARRAY['External Data Source', 'Buyer Group Member', 'Cold Relationship'],
    '{"coresignalId": "770302196", "buyerGroupRole": "Decision Maker", "influenceLevel": "High", "engagementPriority": "High", "dataSource": "External"}'::jsonb,
    'initial',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    "jobTitle" = EXCLUDED."jobTitle",
    title = EXCLUDED.title,
    email = EXCLUDED.email,
    "workEmail" = EXCLUDED."workEmail",
    phone = EXCLUDED.phone,
    "workPhone" = EXCLUDED."workPhone",
    "customFields" = EXCLUDED."customFields",
    "updatedAt" = NOW();

-- Create Dustin Stephens - Prospect record
INSERT INTO prospects (
    id,
    "workspaceId",
    "assignedUserId",
    "firstName",
    "lastName",
    "fullName",
    email,
    "workEmail",
    phone,
    "workPhone",
    company,
    "companyDomain",
    "jobTitle",
    title,
    department,
    status,
    priority,
    source,
    tags,
    "customFields",
    "engagementLevel",
    "createdAt",
    "updatedAt"
) VALUES (
    'prospect_5bars_dustin_stephens_2025',
    '01K5D01YCQJ9TJ7CT4DZDE79T1',
    '01K1VBYZG41K9QA0D9CF06KNRG',
    'Dustin',
    'Stephens',
    'Dustin Stephens',
    'dustin.stephens@5bars.net',
    'dustin.stephens@5bars.net',
    '800.905.7221',
    '800.905.7221',
    '5 Bars Services, LLC',
    '5bars.net',
    'Project Director',
    'Project Director',
    'Operations',
    'engaged',
    'high',
    'External Data Source',
    ARRAY['External Data Source', 'Buyer Group Member', 'Cold Relationship'],
    '{"coresignalId": "447442560", "buyerGroupRole": "Champion", "influenceLevel": "High", "engagementPriority": "High", "dataSource": "External"}'::jsonb,
    'initial',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    "jobTitle" = EXCLUDED."jobTitle",
    title = EXCLUDED.title,
    email = EXCLUDED.email,
    "workEmail" = EXCLUDED."workEmail",
    phone = EXCLUDED.phone,
    "workPhone" = EXCLUDED."workPhone",
    "customFields" = EXCLUDED."customFields",
    "updatedAt" = NOW();

-- Verify the records were created
SELECT 'Verification - People records:' as status;
SELECT id, "fullName", "jobTitle", email, "companyId", "customFields"->>'buyerGroupRole' as role
FROM people 
WHERE "companyId" = '01K5D5VGQ35SXGBPK5F2WSMFM2'
ORDER BY "fullName";

SELECT 'Verification - Prospect records:' as status;
SELECT id, "fullName", title, email, company, "customFields"->>'buyerGroupRole' as role
FROM prospects 
WHERE company = '5 Bars Services, LLC'
ORDER BY "fullName";

SELECT 'Records created successfully!' as status;
