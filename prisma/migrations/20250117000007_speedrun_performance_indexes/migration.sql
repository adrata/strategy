-- Add indexes for speedrun performance optimization
-- These indexes will significantly speed up speedrun queries

-- Index for people with company relationships (speedrun core query)
CREATE INDEX IF NOT EXISTS idx_people_workspace_company_rank_updated 
ON people (workspace_id, company_id, updated_at DESC);

-- Index for company ranking in speedrun
CREATE INDEX IF NOT EXISTS idx_companies_workspace_rank_updated 
ON companies (workspace_id, rank ASC, updated_at DESC);

-- Index for people assigned to users (speedrun filtering)
CREATE INDEX IF NOT EXISTS idx_people_workspace_assigned_updated 
ON people (workspace_id, assigned_user_id, updated_at DESC);

-- Composite index for speedrun query optimization
CREATE INDEX IF NOT EXISTS idx_people_speedrun_optimized 
ON people (workspace_id, company_id, assigned_user_id, updated_at DESC);
