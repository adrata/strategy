-- Apply Oasis Migration to Production Database
-- This script should be run on the production database to ensure all Oasis tables exist
-- 
-- Run with: psql $DATABASE_URL -f scripts/apply-oasis-migration.sql
-- Or through Prisma: npx prisma db execute --file scripts/apply-oasis-migration.sql --schema prisma/schema.prisma

BEGIN;

-- Source the migration file
\i prisma/migrations/20251106000000_ensure_all_oasis_tables_exist.sql

-- Verify all tables exist
SELECT 
    CASE 
        WHEN COUNT(*) = 8 THEN 'SUCCESS: All 8 Oasis tables exist'
        ELSE 'ERROR: Only ' || COUNT(*) || ' of 8 Oasis tables exist'
    END as verification_status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'OasisChannel',
    'OasisChannelMember',
    'OasisDirectMessage',
    'OasisDMParticipant',
    'OasisMessage',
    'OasisReaction',
    'OasisReadReceipt',
    'OasisExternalConnection'
);

-- List all Oasis tables with row counts
SELECT 
    schemaname,
    tablename,
    (xpath('/row/cnt/text()', 
        query_to_xml(
            format('SELECT COUNT(*) as cnt FROM %I.%I', schemaname, tablename),
            false, true, ''
        )
    ))[1]::text::int AS row_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'Oasis%'
ORDER BY tablename;

COMMIT;

