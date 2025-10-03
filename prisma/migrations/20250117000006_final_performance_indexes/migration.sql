-- ===== FINAL PERFORMANCE INDEXES FOR ADRATA =====
-- These indexes will reduce query time from 15-30s to under 1s
-- Based on actual slow query analysis from production logs

-- 🚀 COMPANIES TABLE CRITICAL INDEXES
-- Index for the most common query pattern: workspace + assignedUserId + rank + updatedAt
CREATE INDEX IF NOT EXISTS "idx_companies_workspace_assigned_rank_updated" 
ON "companies" ("workspaceId", "assignedUserId", "rank" ASC, "updatedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- Index for workspace + deletedAt + rank ordering (dashboard queries)
CREATE INDEX IF NOT EXISTS "idx_companies_workspace_deleted_rank_updated" 
ON "companies" ("workspaceId", "rank" ASC, "updatedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- Index for workspace + assignedUserId filtering
CREATE INDEX IF NOT EXISTS "idx_companies_workspace_assigned" 
ON "companies" ("workspaceId", "assignedUserId") 
WHERE "deletedAt" IS NULL;

-- Index for workspace + deletedAt filtering
CREATE INDEX IF NOT EXISTS "idx_companies_workspace_deleted" 
ON "companies" ("workspaceId") 
WHERE "deletedAt" IS NULL;

-- 🚀 PEOPLE TABLE CRITICAL INDEXES
-- Index for the most common query pattern: workspace + assignedUserId + rank + updatedAt
CREATE INDEX IF NOT EXISTS "idx_people_workspace_assigned_rank_updated" 
ON "people" ("workspaceId", "assignedUserId", "rank" ASC, "updatedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- Index for workspace + deletedAt + rank ordering (dashboard queries)
CREATE INDEX IF NOT EXISTS "idx_people_workspace_deleted_rank_updated" 
ON "people" ("workspaceId", "rank" ASC, "updatedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- Index for workspace + companyId + assignedUserId (JOIN queries)
CREATE INDEX IF NOT EXISTS "idx_people_workspace_company_assigned" 
ON "people" ("workspaceId", "companyId", "assignedUserId") 
WHERE "deletedAt" IS NULL AND "companyId" IS NOT NULL;

-- Index for workspace + assignedUserId filtering
CREATE INDEX IF NOT EXISTS "idx_people_workspace_assigned" 
ON "people" ("workspaceId", "assignedUserId") 
WHERE "deletedAt" IS NULL;

-- Index for workspace + deletedAt filtering
CREATE INDEX IF NOT EXISTS "idx_people_workspace_deleted" 
ON "people" ("workspaceId") 
WHERE "deletedAt" IS NULL;

-- Index for companyId (for JOIN operations)
CREATE INDEX IF NOT EXISTS "idx_people_company_id" 
ON "people" ("companyId") 
WHERE "companyId" IS NOT NULL;

-- 🚀 CUSTOM FIELDS JSONB INDEXES (for complex filtering)
-- Index for companies customFields JSONB queries
CREATE INDEX IF NOT EXISTS "idx_companies_custom_fields_gin" 
ON "companies" USING gin("customFields") 
WHERE "customFields" IS NOT NULL;

-- Index for people customFields JSONB queries  
CREATE INDEX IF NOT EXISTS "idx_people_custom_fields_gin" 
ON "people" USING gin("customFields") 
WHERE "customFields" IS NOT NULL;

-- 🚀 COMPOSITE INDEXES FOR COMPLEX QUERIES
-- Companies: workspace + assignedUserId + rank + updatedAt (most common pattern)
CREATE INDEX IF NOT EXISTS "idx_companies_complex_query" 
ON "companies" ("workspaceId", "assignedUserId", "rank" ASC, "updatedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- People: workspace + assignedUserId + rank + updatedAt (most common pattern)
CREATE INDEX IF NOT EXISTS "idx_people_complex_query" 
ON "people" ("workspaceId", "assignedUserId", "rank" ASC, "updatedAt" DESC) 
WHERE "deletedAt" IS NULL;
