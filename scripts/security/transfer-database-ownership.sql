-- Transfer database ownership from neondb_owner to adrata
-- This script should be run as the current database owner

-- First, grant all privileges to the new user
GRANT ALL PRIVILEGES ON DATABASE neondb TO adrata;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO adrata;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO adrata;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO adrata;

-- Grant future privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO adrata;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO adrata;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO adrata;

-- CRITICAL: Transfer actual database ownership
ALTER DATABASE neondb OWNER TO adrata;

-- Make adrata a superuser (equivalent to owner privileges)
ALTER USER adrata WITH SUPERUSER;

-- Verify the transfer
SELECT 
    usename as username,
    usesuper as is_superuser,
    usecreatedb as can_create_db
FROM pg_user 
WHERE usename IN ('neondb_owner', 'adrata');

-- Show current database owner
SELECT 
    d.datname as database_name,
    u.usename as owner
FROM pg_database d
JOIN pg_user u ON d.datdba = u.usesysid
WHERE d.datname = 'neondb';
