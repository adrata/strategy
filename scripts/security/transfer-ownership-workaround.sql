-- WORKAROUND: Transfer Ownership to New User
-- Run this in Neon Console SQL Editor
-- 
-- The issue: We need to grant the new user to the current admin first
-- Then we can transfer ownership

-- Step 1: Check current database owner
SELECT datname, pg_get_userbyid(datdba) as owner 
FROM pg_database 
WHERE datname = 'neondb';

-- Step 2: Grant the new user to current user (allows SET ROLE)
-- Note: You may need to run this as a superuser/admin
GRANT adrata_app_2025 TO CURRENT_USER;

-- Step 3: Now transfer ownership
ALTER DATABASE neondb OWNER TO adrata_app_2025;

-- Step 4: Verify ownership was transferred
SELECT datname, pg_get_userbyid(datdba) as owner 
FROM pg_database 
WHERE datname = 'neondb';

-- Step 5: After ownership is transferred, you can delete neondb_owner in Neon Console

