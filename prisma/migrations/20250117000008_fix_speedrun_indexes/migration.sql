-- Fix speedrun indexes with correct column names (camelCase)
-- The previous migration used snake_case which doesn't match the schema

-- Drop the incorrect indexes first
DROP INDEX IF EXISTS idx_people_workspace_company_rank_updated;
DROP INDEX IF EXISTS idx_companies_workspace_rank_updated;
DROP INDEX IF EXISTS idx_people_workspace_assigned_updated;
DROP INDEX IF EXISTS idx_people_speedrun_optimized;

-- Create correct indexes with camelCase column names
-- Index for people with company relationships (speedrun core query)
CREATE INDEX IF NOT EXISTS idx_people_workspace_company_rank_updated 
ON people (workspaceId, companyId, updatedAt DESC)
WHERE deletedAt IS NULL AND companyId IS NOT NULL;

-- Index for company ranking in speedrun
CREATE INDEX IF NOT EXISTS idx_companies_workspace_rank_updated 
ON companies (workspaceId, rank ASC, updatedAt DESC)
WHERE deletedAt IS NULL;

-- Index for people assigned to users (speedrun filtering)
CREATE INDEX IF NOT EXISTS idx_people_workspace_assigned_updated 
ON people (workspaceId, assignedUserId, updatedAt DESC)
WHERE deletedAt IS NULL;

-- Composite index for speedrun query optimization
CREATE INDEX IF NOT EXISTS idx_people_speedrun_optimized 
ON people (workspaceId, companyId, assignedUserId, updatedAt DESC)
WHERE deletedAt IS NULL AND companyId IS NOT NULL;
