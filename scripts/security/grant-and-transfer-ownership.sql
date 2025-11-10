-- Step 1: Grant the new user to the current admin user
-- This allows the admin to SET ROLE to the new user
GRANT adrata_app_2025 TO CURRENT_USER;

-- Step 2: Now transfer ownership (this should work after step 1)
ALTER DATABASE neondb OWNER TO adrata_app_2025;

-- Step 3: Grant all privileges (if not already done)
GRANT ALL PRIVILEGES ON DATABASE neondb TO adrata_app_2025;
GRANT ALL ON SCHEMA public TO adrata_app_2025;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO adrata_app_2025;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO adrata_app_2025;

-- Step 4: Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO adrata_app_2025;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO adrata_app_2025;

