-- Legacy Email Tables Cleanup Script
-- This script removes the old email integration tables that are no longer needed
-- Run this after confirming the new email_messages table is working correctly

-- Drop junction tables first (they reference the main tables)
DROP TABLE IF EXISTS "_EmailToPipelineExecution" CASCADE;
DROP TABLE IF EXISTS "_EmailToContact" CASCADE;
DROP TABLE IF EXISTS "_EmailToAction" CASCADE;
DROP TABLE IF EXISTS "_EmailToCompany" CASCADE;
DROP TABLE IF EXISTS "_EmailToLead" CASCADE;

-- Drop the main legacy tables
DROP TABLE IF EXISTS "Email" CASCADE;
DROP TABLE IF EXISTS "ConnectedProvider" CASCADE;
DROP TABLE IF EXISTS "ProviderToken" CASCADE;

-- Drop any email-related indexes that might exist
DROP INDEX IF EXISTS "Email_workspaceId_idx";
DROP INDEX IF EXISTS "Email_providerId_idx";
DROP INDEX IF EXISTS "Email_receivedAt_idx";
DROP INDEX IF EXISTS "ConnectedProvider_workspaceId_idx";
DROP INDEX IF EXISTS "ConnectedProvider_provider_email_idx";

-- Clean up any remaining email-related sequences
DROP SEQUENCE IF EXISTS "Email_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "ConnectedProvider_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS "ProviderToken_id_seq" CASCADE;

-- Verify cleanup
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE tablename LIKE '%email%' 
   OR tablename LIKE '%Email%'
   OR tablename LIKE '%Provider%'
ORDER BY tablename;
