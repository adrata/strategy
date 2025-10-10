-- Add performance indexes for globalRank sorting
-- This will dramatically improve query performance for speedrun and other sorted queries

-- Add index for people table globalRank sorting
CREATE INDEX IF NOT EXISTS "people_workspaceId_globalRank_idx" ON "people"("workspaceId", "globalRank");

-- Add composite index for people table with status and globalRank
CREATE INDEX IF NOT EXISTS "people_workspaceId_status_globalRank_idx" ON "people"("workspaceId", "status", "globalRank");

-- Add index for companies table globalRank sorting  
CREATE INDEX IF NOT EXISTS "companies_workspaceId_globalRank_idx" ON "companies"("workspaceId", "globalRank");

-- Add composite index for companies table with status and globalRank
CREATE INDEX IF NOT EXISTS "companies_workspaceId_status_globalRank_idx" ON "companies"("workspaceId", "status", "globalRank");
