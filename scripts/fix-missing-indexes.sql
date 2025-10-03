-- ===== FIX MISSING INDEXES =====
-- Create the indexes that were incorrectly claimed to exist

-- 🚀 LEADS TABLE - Missing indexes
-- Index for leads workspace + assignedUserId filtering
CREATE INDEX IF NOT EXISTS "idx_leads_workspace_assigned" 
ON "leads" ("workspaceId", "assignedUserId") 
WHERE "deletedAt" IS NULL;

-- Index for leads workspace + rank ordering
CREATE INDEX IF NOT EXISTS "idx_leads_workspace_rank" 
ON "leads" ("workspaceId", "rank" ASC, "updatedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- 🚀 OPPORTUNITIES TABLE - Missing indexes
-- Index for opportunities workspace + assignedUserId filtering
CREATE INDEX IF NOT EXISTS "idx_opportunities_workspace_assigned" 
ON "opportunities" ("workspaceId", "assignedUserId") 
WHERE "deletedAt" IS NULL;

-- 🚀 PROSPECTS TABLE - Additional optimization indexes
-- Index for prospects workspace + assignedUserId + rank
CREATE INDEX IF NOT EXISTS "idx_prospects_workspace_assigned_rank" 
ON "prospects" ("workspaceId", "assignedUserId", "rank" ASC, "updatedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- Index for prospects workspace + rank ordering
CREATE INDEX IF NOT EXISTS "idx_prospects_workspace_rank" 
ON "prospects" ("workspaceId", "rank" ASC, "updatedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- 🎯 VERIFICATION: Check that all indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname IN (
    'idx_leads_workspace_assigned',
    'idx_leads_workspace_rank', 
    'idx_opportunities_workspace_assigned',
    'idx_prospects_workspace_assigned_rank',
    'idx_prospects_workspace_rank'
)
ORDER BY tablename, indexname;
