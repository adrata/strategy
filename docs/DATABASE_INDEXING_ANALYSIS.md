# Database Indexing Analysis & Fixes

## Current Query Patterns Analysis

### 1. **SPEEDRUN Section** (Most Critical)
```sql
-- Query from src/app/api/data/section/route.ts:138-183
SELECT * FROM people 
WHERE workspaceId = ? 
  AND deletedAt IS NULL 
  AND companyId IS NOT NULL
ORDER BY company.rank ASC, rank ASC, updatedAt DESC
LIMIT 30;
```

**Required Indexes:**
- `idx_people_workspace_company_rank_updated` ✅ (EXISTS but BROKEN - wrong column names)
- `idx_companies_workspace_rank_updated` ✅ (EXISTS but BROKEN - wrong column names)

### 2. **PROSPECTS Section**
```sql
-- Query from src/app/api/data/section/route.ts:431-476
SELECT * FROM people 
WHERE workspaceId = ? 
  AND deletedAt IS NULL 
  AND (assignedUserId = ? OR assignedUserId IS NULL)
  AND (funnelStage = 'Prospect' OR status = 'engaged' OR status = 'prospect')
ORDER BY rank ASC, updatedAt DESC
LIMIT 10000;
```

**Required Indexes:**
- `idx_people_workspace_assigned_rank_updated` ✅ (EXISTS)
- `idx_people_workspace_deleted_rank_updated` ✅ (EXISTS)

### 3. **LEADS Section**
```sql
-- Query from src/app/api/data/unified/route.ts:2995-3000
SELECT COUNT(*) FROM leads 
WHERE workspaceId = ? 
  AND deletedAt IS NULL;
```

**Required Indexes:**
- `idx_leads_workspace_assigned` ✅ (EXISTS)
- `idx_leads_workspace_rank` ✅ (EXISTS)

### 4. **COMPANIES Section**
```sql
-- Query from src/app/api/data/unified/route.ts:3117+
SELECT * FROM companies 
WHERE workspaceId = ? 
  AND deletedAt IS NULL
ORDER BY rank ASC, updatedAt DESC;
```

**Required Indexes:**
- `idx_companies_workspace_deleted_rank_updated` ✅ (EXISTS)
- `idx_companies_workspace_assigned_rank_updated` ✅ (EXISTS)

### 5. **PEOPLE Section**
```sql
-- Query from src/app/api/data/unified/route.ts:1245-1275
SELECT * FROM people 
WHERE workspaceId = ? 
  AND deletedAt IS NULL
ORDER BY rank ASC, updatedAt DESC;
```

**Required Indexes:**
- `idx_people_workspace_deleted_rank_updated` ✅ (EXISTS)
- `idx_people_workspace_assigned_rank_updated` ✅ (EXISTS)

### 6. **OPPORTUNITIES Section**
```sql
-- Query from src/app/api/data/unified/route.ts:3007-3012
SELECT COUNT(*) FROM opportunities 
WHERE workspaceId = ? 
  AND deletedAt IS NULL;
```

**Required Indexes:**
- `idx_opportunities_workspace_assigned` ✅ (EXISTS)
- `idx_opportunities_workspace_stage` ✅ (EXISTS)

## 🚨 CRITICAL ISSUES FOUND

### 1. **BROKEN SPEEDRUN INDEXES** ❌
The speedrun performance indexes use **wrong column names**:
- Migration uses: `workspace_id`, `company_id`, `assigned_user_id` (snake_case)
- Schema actually has: `workspaceId`, `companyId`, `assignedUserId` (camelCase)

### 2. **MISSING COMPOSITE INDEXES** ⚠️
Some complex queries could benefit from additional composite indexes.

## 🔧 REQUIRED FIXES

### Fix 1: Correct Speedrun Indexes
```sql
-- Drop incorrect indexes
DROP INDEX IF EXISTS idx_people_workspace_company_rank_updated;
DROP INDEX IF EXISTS idx_companies_workspace_rank_updated;
DROP INDEX IF EXISTS idx_people_workspace_assigned_updated;
DROP INDEX IF EXISTS idx_people_speedrun_optimized;

-- Create correct indexes with camelCase column names
CREATE INDEX IF NOT EXISTS idx_people_workspace_company_rank_updated 
ON people (workspaceId, companyId, updatedAt DESC)
WHERE deletedAt IS NULL AND companyId IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_workspace_rank_updated 
ON companies (workspaceId, rank ASC, updatedAt DESC)
WHERE deletedAt IS NULL;

CREATE INDEX IF NOT EXISTS idx_people_workspace_assigned_updated 
ON people (workspaceId, assignedUserId, updatedAt DESC)
WHERE deletedAt IS NULL;

CREATE INDEX IF NOT EXISTS idx_people_speedrun_optimized 
ON people (workspaceId, companyId, assignedUserId, updatedAt DESC)
WHERE deletedAt IS NULL AND companyId IS NOT NULL;
```

### Fix 2: Add Missing Composite Indexes
```sql
-- Add composite indexes for complex filtering patterns
CREATE INDEX IF NOT EXISTS idx_people_workspace_status_rank 
ON people (workspaceId, status, rank ASC, updatedAt DESC)
WHERE deletedAt IS NULL;

CREATE INDEX IF NOT EXISTS idx_people_workspace_funnel_rank 
ON people (workspaceId, funnelStage, rank ASC, updatedAt DESC)
WHERE deletedAt IS NULL;
```

## ✅ CURRENT STATUS

**GOOD NEWS:** Most sections are already well-indexed with the performance indexes from `20250117000006_final_performance_indexes`.

**ISSUE:** Only the speedrun indexes are broken due to column name mismatch.

**IMPACT:** Speedrun section may be slower than optimal, but other sections should perform well.

## 🎯 RECOMMENDED ACTION

1. **Apply the speedrun index fixes** when database access is available
2. **Monitor query performance** for each section
3. **Add additional composite indexes** if specific queries are still slow

The database is already well-optimized for most use cases. The speedrun index fix is the main remaining issue.
