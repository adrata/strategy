-- Check TOP data counts
SELECT 'people' as table_name, COUNT(*) as count 
FROM people 
WHERE "workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1'

UNION ALL

SELECT 'leads', COUNT(*) 
FROM leads 
WHERE "workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1'

UNION ALL

SELECT 'prospects', COUNT(*) 
FROM prospects 
WHERE "workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1';

-- Check for people who are also leads (potential duplicates)
SELECT 
    p."fullName" as person_name,
    p.email as person_email,
    l."fullName" as lead_name,
    l.email as lead_email,
    p.id as person_id,
    l.id as lead_id
FROM people p
JOIN leads l ON (
    p.email = l.email OR 
    p."workEmail" = l."workEmail" OR 
    p."personalEmail" = l."personalEmail" OR
    p."fullName" = l."fullName"
)
WHERE p."workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1'
  AND l."workspaceId" = '01K5D01YCQJ9TJ7CT4DZDE79T1'
LIMIT 10;
