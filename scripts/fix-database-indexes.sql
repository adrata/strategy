-- ===== DIRECT DATABASE INDEX FIXES =====
-- This script fixes the broken speedrun indexes and adds missing optimizations
-- Run this directly against the database when connection is available

-- 🚨 FIX 1: Drop incorrect speedrun indexes (wrong column names)
DROP INDEX IF EXISTS idx_people_workspace_company_rank_updated;
DROP INDEX IF EXISTS idx_companies_workspace_rank_updated;
DROP INDEX IF EXISTS idx_people_workspace_assigned_updated;
DROP INDEX IF EXISTS idx_people_speedrun_optimized;

-- 🚀 FIX 2: Create correct speedrun indexes with camelCase column names
-- Index for people with company relationships (speedrun core query)
CREATE INDEX IF NOT EXISTS idx_people_workspace_company_rank_updated 
ON people ("workspaceId", "companyId", "updatedAt" DESC)
WHERE "deletedAt" IS NULL AND "companyId" IS NOT NULL;

-- Index for company ranking in speedrun
CREATE INDEX IF NOT EXISTS idx_companies_workspace_rank_updated 
ON companies ("workspaceId", "rank" ASC, "updatedAt" DESC)
WHERE "deletedAt" IS NULL;

-- Index for people assigned to users (speedrun filtering)
CREATE INDEX IF NOT EXISTS idx_people_workspace_assigned_updated 
ON people ("workspaceId", "assignedUserId", "updatedAt" DESC)
WHERE "deletedAt" IS NULL;

-- Composite index for speedrun query optimization
CREATE INDEX IF NOT EXISTS idx_people_speedrun_optimized 
ON people ("workspaceId", "companyId", "assignedUserId", "updatedAt" DESC)
WHERE "deletedAt" IS NULL AND "companyId" IS NOT NULL;

-- 🚀 FIX 3: Add missing composite indexes for better performance
-- Index for prospects filtering by status
CREATE INDEX IF NOT EXISTS idx_people_workspace_status_rank 
ON people ("workspaceId", "status", "rank" ASC, "updatedAt" DESC)
WHERE "deletedAt" IS NULL;

-- Index for prospects filtering by funnel stage
CREATE INDEX IF NOT EXISTS idx_people_workspace_funnel_rank 
ON people ("workspaceId", "funnelStage", "rank" ASC, "updatedAt" DESC)
WHERE "deletedAt" IS NULL;

-- Index for complex OR queries (assignedUserId OR NULL)
CREATE INDEX IF NOT EXISTS idx_people_workspace_assigned_or_null 
ON people ("workspaceId", "assignedUserId", "rank" ASC, "updatedAt" DESC)
WHERE "deletedAt" IS NULL;

-- 🚀 FIX 4: Add JSONB indexes for custom fields queries
-- Index for people custom fields JSONB queries
CREATE INDEX IF NOT EXISTS idx_people_custom_fields_gin 
ON people USING gin("customFields") 
WHERE "customFields" IS NOT NULL;

-- Index for companies custom fields JSONB queries
CREATE INDEX IF NOT EXISTS idx_companies_custom_fields_gin 
ON companies USING gin("customFields") 
WHERE "customFields" IS NOT NULL;

-- 🎯 VERIFICATION: Check that indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%' 
    AND tablename IN ('people', 'companies', 'leads', 'prospects', 'opportunities')
ORDER BY tablename, indexname;
