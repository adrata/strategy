-- Grant the new role membership in neon_superuser
-- This gives it the same privileges as roles created via Neon Console
GRANT neon_superuser TO adrata_app_2025;

-- Now try the ownership transfer again
ALTER DATABASE neondb OWNER TO adrata_app_2025;

-- Grant all privileges (if not already done)
GRANT ALL PRIVILEGES ON DATABASE neondb TO adrata_app_2025;
GRANT ALL ON SCHEMA public TO adrata_app_2025;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO adrata_app_2025;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO adrata_app_2025;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO adrata_app_2025;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO adrata_app_2025;

