-- ===== LEADS & PEOPLE PERFORMANCE INDEXES =====
-- Optimized for queries loading 1000+ records on leads and people pages
-- These indexes target the actual query patterns used in /api/v1/people

-- 🚀 PEOPLE TABLE: Core query patterns for leads/people pages
-- Most common: workspaceId + status + fullName (default sort)
CREATE INDEX IF NOT EXISTS "idx_people_workspace_status_fullname" 
ON "people" ("workspaceId", "status", "fullName" ASC) 
WHERE "deletedAt" IS NULL;

-- For queries with mainSellerId filter: workspaceId + mainSellerId + status + fullName
CREATE INDEX IF NOT EXISTS "idx_people_workspace_seller_status_fullname" 
ON "people" ("workspaceId", "mainSellerId", "status", "fullName" ASC) 
WHERE "deletedAt" IS NULL;

-- For queries without mainSellerId filter (OR condition): workspaceId + status + fullName
-- This covers the OR: [{mainSellerId: userId}, {mainSellerId: null}] pattern
CREATE INDEX IF NOT EXISTS "idx_people_workspace_status_fullname_nulls" 
ON "people" ("workspaceId", "status", "fullName" ASC, "mainSellerId") 
WHERE "deletedAt" IS NULL;

-- For sorting by globalRank (speedrun, opportunities)
CREATE INDEX IF NOT EXISTS "idx_people_workspace_status_globalrank" 
ON "people" ("workspaceId", "status", "globalRank" DESC) 
WHERE "deletedAt" IS NULL;

-- For sorting by createdAt
CREATE INDEX IF NOT EXISTS "idx_people_workspace_status_createdat" 
ON "people" ("workspaceId", "status", "createdAt" DESC) 
WHERE "deletedAt" IS NULL;

-- For sorting by lastActionDate
CREATE INDEX IF NOT EXISTS "idx_people_workspace_status_lastactiondate" 
ON "people" ("workspaceId", "status", "lastActionDate" DESC NULLS LAST) 
WHERE "deletedAt" IS NULL;

-- For email search queries
CREATE INDEX IF NOT EXISTS "idx_people_workspace_email" 
ON "people" ("workspaceId", "email") 
WHERE "deletedAt" IS NULL AND "email" IS NOT NULL;

-- For workEmail search queries
CREATE INDEX IF NOT EXISTS "idx_people_workspace_workemail" 
ON "people" ("workspaceId", "workEmail") 
WHERE "deletedAt" IS NULL AND "workEmail" IS NOT NULL;

-- For fullName search (contains queries) - Note: Requires pg_trgm extension
-- These trigram indexes are very large, so we'll use them only if text search performance is critical
-- Uncomment if you need faster text search (adds significant index size)
-- CREATE INDEX IF NOT EXISTS "idx_people_workspace_fullname_trgm" 
-- ON "people" USING gin("fullName" gin_trgm_ops) 
-- WHERE "deletedAt" IS NULL;

-- 🚀 ACTIONS TABLE: Optimize last action queries
-- For fetching last actions per person (used in people API)
CREATE INDEX IF NOT EXISTS "idx_actions_personid_deleted_status_completed" 
ON "actions" ("personId", "deletedAt", "status", "completedAt" DESC) 
WHERE "personId" IS NOT NULL AND "deletedAt" IS NULL AND "status" = 'COMPLETED';

-- For personId lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS "idx_actions_personid_completedat_desc" 
ON "actions" ("personId", "completedAt" DESC) 
WHERE "personId" IS NOT NULL AND "deletedAt" IS NULL AND "status" = 'COMPLETED';

-- 🚀 COMPANIES TABLE: Optimize company lookups in people queries
-- For company.name lookups (used in include: company select)
CREATE INDEX IF NOT EXISTS "idx_companies_workspace_name" 
ON "companies" ("workspaceId", "name") 
WHERE "deletedAt" IS NULL;

-- For companyId lookups (foreign key)
CREATE INDEX IF NOT EXISTS "idx_companies_id_workspace" 
ON "companies" ("id", "workspaceId") 
WHERE "deletedAt" IS NULL;

-- 🚀 CORE_PEOPLE TABLE: Optimize core person merges
-- For corePersonId lookups
CREATE INDEX IF NOT EXISTS "idx_core_people_id_normalized" 
ON "core_people" ("id", "normalizedFullName");

-- For email lookups in core_people
CREATE INDEX IF NOT EXISTS "idx_core_people_email" 
ON "core_people" ("email") 
WHERE "email" IS NOT NULL;

-- 🚀 USERS TABLE: Optimize mainSeller lookups
-- For mainSellerId lookups (used in include: mainSeller select)
CREATE INDEX IF NOT EXISTS "idx_users_id_name_email" 
ON "users" ("id", "firstName", "lastName", "email");

-- ===== COMMENTS FOR DOCUMENTATION =====
COMMENT ON INDEX "idx_people_workspace_status_fullname" IS 'Critical index for leads/people pages sorted by name (default sort)';
COMMENT ON INDEX "idx_people_workspace_seller_status_fullname" IS 'Index for leads/people queries filtered by mainSellerId';
COMMENT ON INDEX "idx_actions_personid_completedat_desc" IS 'Critical index for fetching last actions per person (N+1 prevention)';

