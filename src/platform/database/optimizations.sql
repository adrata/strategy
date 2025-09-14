-- PRODUCTION DATABASE OPTIMIZATIONS - SCALABILITY & PERFORMANCE
-- Execute these optimizations for lightning-fast production performance

-- =====================================================
-- WORKSPACE ISOLATION & PERFORMANCE INDEXES
-- =====================================================

-- Critical: Workspace-based composite indexes for data isolation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_workspace_created 
ON "Lead" (workspaceId, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_workspace_status 
ON "Lead" (workspaceId, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_workspace_created 
ON "Account" (workspaceId, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_workspace_created 
ON "Contact" (workspaceId, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunity_workspace_created 
ON "Opportunity" (workspaceId, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunity_workspace_status 
ON "Opportunity" (workspaceId, status);

-- User workspace relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_workspace_created 
ON "UserWorkspace" (workspaceId, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_workspace_user 
ON "UserWorkspace" (userId, workspaceId);

-- =====================================================
-- ENRICHMENT PIPELINE OPTIMIZATION INDEXES
-- =====================================================

-- Monaco pipeline performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_workspace_domain 
ON "Company" (workspaceId, domain) WHERE domain IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_workspace_enriched 
ON "Company" (workspaceId, lastEnrichedAt DESC) WHERE lastEnrichedAt IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_person_workspace_email 
ON "Person" (workspaceId, email) WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_person_workspace_enriched 
ON "Person" (workspaceId, lastEnrichedAt DESC) WHERE lastEnrichedAt IS NOT NULL;

-- =====================================================
-- CHAT & REAL-TIME FEATURES OPTIMIZATION
-- =====================================================

-- Chat performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_workspace_created 
ON "Chat" (workspaceId, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_workspace_active 
ON "Chat" (workspaceId, isActive) WHERE isActive = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_chat_created 
ON "Message" (chatId, createdAt DESC);

-- =====================================================
-- BUNDLE & IMPORT OPTIMIZATION INDEXES
-- =====================================================

-- Bundle processing performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bundle_workspace_status 
ON "Bundle" (workspaceId, status, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bundle_workspace_processed 
ON "Bundle" (workspaceId, processedAt DESC) WHERE processedAt IS NOT NULL;

-- =====================================================
-- SEARCH & FILTERING OPTIMIZATION
-- =====================================================

-- Full-text search indexes (PostgreSQL specific)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_name_search 
ON "Lead" USING gin(to_tsvector('english', name)) WHERE workspaceId IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_name_search 
ON "Account" USING gin(to_tsvector('english', name)) WHERE workspaceId IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_name_search 
ON "Contact" USING gin(to_tsvector('english', name)) WHERE workspaceId IS NOT NULL;

-- =====================================================
-- PERFORMANCE CONSTRAINTS & OPTIMIZATIONS
-- =====================================================

-- Add check constraints for data validation
ALTER TABLE "Lead" ADD CONSTRAINT check_lead_email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

ALTER TABLE "Contact" ADD CONSTRAINT check_contact_email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

-- Ensure workspace isolation at database level
ALTER TABLE "Lead" ADD CONSTRAINT check_lead_workspace_not_null 
CHECK (workspaceId IS NOT NULL);

ALTER TABLE "Account" ADD CONSTRAINT check_account_workspace_not_null 
CHECK (workspaceId IS NOT NULL);

ALTER TABLE "Contact" ADD CONSTRAINT check_contact_workspace_not_null 
CHECK (workspaceId IS NOT NULL);

ALTER TABLE "Opportunity" ADD CONSTRAINT check_opportunity_workspace_not_null 
CHECK (workspaceId IS NOT NULL);

-- =====================================================
-- PRODUCTION DATA CLEANUP
-- =====================================================

-- Remove any demo/test data markers (if they exist)
UPDATE "Lead" SET 
  name = CASE 
    WHEN name LIKE '%demo%' OR name LIKE '%test%' THEN CONCAT('Customer-', id)
    ELSE name 
  END
WHERE workspaceId IS NOT NULL;

UPDATE "Account" SET 
  name = CASE 
    WHEN name LIKE '%demo%' OR name LIKE '%test%' THEN CONCAT('Account-', id)
    ELSE name 
  END
WHERE workspaceId IS NOT NULL;

-- =====================================================
-- DATABASE PERFORMANCE SETTINGS
-- =====================================================

-- Optimize PostgreSQL settings for production (requires superuser)
-- These should be set in your database configuration:

/*
-- Connection and memory settings
shared_buffers = '256MB'                    -- 25% of available RAM
effective_cache_size = '1GB'               -- 75% of available RAM
work_mem = '4MB'                           -- Per-connection work memory
maintenance_work_mem = '64MB'              -- For maintenance operations

-- Performance settings
random_page_cost = 1.1                    -- For SSD storage
effective_io_concurrency = 200            -- For SSD storage
max_connections = 100                     -- Based on expected load
shared_preload_libraries = 'pg_stat_statements'

-- WAL settings for better write performance
wal_buffers = '16MB'
checkpoint_completion_target = 0.9
wal_compression = on

-- Query planner settings
default_statistics_target = 100
*/

-- =====================================================
-- MONITORING & MAINTENANCE
-- =====================================================

-- Create function to analyze table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    ANALYZE "Lead";
    ANALYZE "Account";
    ANALYZE "Contact";
    ANALYZE "Opportunity";
    ANALYZE "Company";
    ANALYZE "Person";
    ANALYZE "Chat";
    ANALYZE "Message";
    ANALYZE "Bundle";
    ANALYZE "UserWorkspace";
END;
$$ LANGUAGE plpgsql;

-- Create function to get performance statistics
CREATE OR REPLACE FUNCTION get_performance_stats()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    table_size text,
    index_size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        n_tup_ins + n_tup_upd + n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- WORKSPACE ISOLATION VERIFICATION
-- =====================================================

-- Create function to verify workspace isolation
CREATE OR REPLACE FUNCTION verify_workspace_isolation()
RETURNS TABLE(
    table_name text,
    rows_without_workspace bigint,
    isolation_status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Lead'::text, 
           COUNT(*)::bigint, 
           CASE WHEN COUNT(*) = 0 THEN 'SECURE' ELSE 'NEEDS_ATTENTION' END
    FROM "Lead" WHERE workspaceId IS NULL
    
    UNION ALL
    
    SELECT 'Account'::text, 
           COUNT(*)::bigint, 
           CASE WHEN COUNT(*) = 0 THEN 'SECURE' ELSE 'NEEDS_ATTENTION' END
    FROM "Account" WHERE workspaceId IS NULL
    
    UNION ALL
    
    SELECT 'Contact'::text, 
           COUNT(*)::bigint, 
           CASE WHEN COUNT(*) = 0 THEN 'SECURE' ELSE 'NEEDS_ATTENTION' END
    FROM "Contact" WHERE workspaceId IS NULL
    
    UNION ALL
    
    SELECT 'Opportunity'::text, 
           COUNT(*)::bigint, 
           CASE WHEN COUNT(*) = 0 THEN 'SECURE' ELSE 'NEEDS_ATTENTION' END
    FROM "Opportunity" WHERE workspaceId IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
-- To apply these optimizations:

1. Run the indexes (they create concurrently so no downtime):
   \i /path/to/optimizations.sql

2. Update table statistics for optimal query planning:
   SELECT update_table_statistics();

3. Check performance stats:
   SELECT * FROM get_performance_stats();

4. Verify workspace isolation:
   SELECT * FROM verify_workspace_isolation();

5. Monitor query performance:
   SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY total_time DESC LIMIT 10;

-- Set up automated maintenance (run weekly):
-- SELECT update_table_statistics();

-- For production monitoring, consider:
-- - pg_stat_statements for query analysis
-- - pgbadger for log analysis  
-- - pg_stat_activity for connection monitoring
*/ 