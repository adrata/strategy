# Database Indexing Optimization Report

## Executive Summary

This report analyzes the database schema and query patterns to identify missing indexes that could significantly improve query performance, especially for speedrun, leads, companies, and clients tables.

## Current Index Analysis

### Companies Table
**Existing Indexes:**
- `workspaceId`
- `mainSellerId`
- `status`
- `workspaceId + status`
- `workspaceId + mainSellerId + status`
- `workspaceId + globalRank`
- `workspaceId + status + globalRank`
- `deletedAt`
- `relationshipType` (via `workspaceId + relationshipType`)

**Query Patterns:**
- `workspaceId + deletedAt + mainSellerId + globalRank` (speedrun)
- `workspaceId + deletedAt + mainSellerId + status` (section filtering)
- `workspaceId + deletedAt + mainSellerId + relationshipType` (PartnerOS)
- `lastActionDate` (filtering meaningful actions)
- `lastAction` (filtering meaningful actions)

### People Table
**Existing Indexes:**
- `workspaceId`
- `mainSellerId`
- `status`
- `workspaceId + status`
- `workspaceId + mainSellerId + status`
- `workspaceId + globalRank`
- `workspaceId + status + globalRank`
- `companyId`
- `deletedAt`

**Query Patterns:**
- `workspaceId + deletedAt + mainSellerId + globalRank` (speedrun)
- `workspaceId + deletedAt + mainSellerId + companyId` (people with companies)
- `workspaceId + deletedAt + mainSellerId + status` (section filtering)
- `lastActionDate` (sorting/filtering)
- `lastAction` (filtering meaningful actions)
- `workspaceId + lastActionDate` (common sort pattern)

### Actions Table
**Existing Indexes:**
- `workspaceId`
- `userId`
- `companyId`
- `personId`
- `status`
- `workspaceId + status`
- `workspaceId + userId + status`
- `workspaceId + scheduledAt`
- `workspaceId + createdAt`

**Query Patterns:**
- `workspaceId + personId + completedAt` (action history)
- `workspaceId + companyId + completedAt` (action history)
- `completedAt` (date range queries)

## Recommended Indexes

### High Priority (Speedrun Performance)

#### 1. Companies Table
```prisma
// Speedrun query optimization - most critical
@@index([workspaceId, deletedAt, mainSellerId, globalRank])
// Explanation: Speedrun queries filter by workspaceId, deletedAt, mainSellerId, and order by globalRank
// This composite index will dramatically speed up speedrun company queries

// Section filtering optimization
@@index([workspaceId, deletedAt, mainSellerId, status])
// Explanation: Common pattern for filtering companies by section (leads, prospects, opportunities, clients)

// PartnerOS filtering
@@index([workspaceId, deletedAt, mainSellerId, relationshipType])
// Explanation: PartnerOS mode filters by relationshipType

// Action filtering (for meaningful actions check)
@@index([workspaceId, lastActionDate])
@@index([workspaceId, lastAction])
// Explanation: Speedrun filters out records with meaningful actions
```

#### 2. People Table
```prisma
// Speedrun query optimization - most critical
@@index([workspaceId, deletedAt, mainSellerId, globalRank])
// Explanation: Speedrun queries filter by workspaceId, deletedAt, mainSellerId, and order by globalRank
// This composite index will dramatically speed up speedrun people queries

// People with companies (speedrun requirement)
@@index([workspaceId, deletedAt, mainSellerId, companyId])
// Explanation: Speedrun only includes people with companyId not null

// Section filtering optimization
@@index([workspaceId, deletedAt, mainSellerId, status])
// Explanation: Common pattern for filtering people by section (leads, prospects, opportunities)

// Action date sorting/filtering
@@index([workspaceId, lastActionDate])
// Explanation: Common sort pattern and filtering for meaningful actions

// Action filtering
@@index([workspaceId, lastAction])
// Explanation: Speedrun filters out records with meaningful actions
```

#### 3. Actions Table
```prisma
// Action history queries
@@index([workspaceId, personId, completedAt])
@@index([workspaceId, companyId, completedAt])
// Explanation: Common queries for action history by entity
```

### Medium Priority (General Performance)

#### 4. Companies Table
```prisma
// Date-based queries
@@index([workspaceId, createdAt])
// Note: Already exists, but verify it's being used

// Priority filtering
@@index([workspaceId, priority])
// Explanation: If priority filtering becomes common
```

#### 5. People Table
```prisma
// Email/phone lookups (if not already covered by unique constraints)
@@index([workspaceId, email])
// Explanation: If email lookups are common

// Vertical filtering (if used)
@@index([workspaceId, vertical])
// Explanation: If vertical filtering is common
```

## Implementation Plan

### Phase 1: Critical Speedrun Indexes (Immediate Impact)
1. Add `workspaceId + deletedAt + mainSellerId + globalRank` to both `companies` and `people`
2. Add `workspaceId + lastActionDate` to both tables
3. Add `workspaceId + lastAction` to both tables

**Expected Impact:** 50-80% reduction in speedrun query time

### Phase 2: Section Filtering Indexes (High Impact)
1. Add `workspaceId + deletedAt + mainSellerId + status` to both tables
2. Add `workspaceId + deletedAt + mainSellerId + companyId` to `people`

**Expected Impact:** 30-50% reduction in section list query time

### Phase 3: Action History Indexes (Medium Impact)
1. Add action history indexes to `actions` table

**Expected Impact:** 20-40% reduction in action history query time

## Index Maintenance Considerations

1. **Index Size:** Composite indexes will increase storage requirements
2. **Write Performance:** More indexes = slower writes, but reads are much faster
3. **Index Selectivity:** The recommended indexes are highly selective (filter large datasets quickly)

## Query Pattern Analysis

### Most Common Query Patterns

1. **Speedrun (Highest Frequency):**
   ```sql
   WHERE workspaceId = ? 
     AND deletedAt IS NULL 
     AND mainSellerId = ? 
     AND globalRank BETWEEN 1 AND 50
   ORDER BY globalRank ASC
   ```
   **Required Index:** `(workspaceId, deletedAt, mainSellerId, globalRank)`

2. **Section Lists (High Frequency):**
   ```sql
   WHERE workspaceId = ? 
     AND deletedAt IS NULL 
     AND mainSellerId = ? 
     AND status = ?
   ORDER BY globalRank DESC
   ```
   **Required Index:** `(workspaceId, deletedAt, mainSellerId, status)`

3. **Meaningful Actions Filter (Speedrun):**
   ```sql
   WHERE workspaceId = ? 
     AND (lastActionDate IS NULL 
          OR lastAction IN ('No action taken', 'Record created', ...))
   ```
   **Required Index:** `(workspaceId, lastActionDate)` or `(workspaceId, lastAction)`

## Migration SQL

```sql
-- Phase 1: Critical Speedrun Indexes
CREATE INDEX CONCURRENTLY idx_companies_speedrun 
  ON companies(workspace_id, deleted_at, main_seller_id, global_rank) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_people_speedrun 
  ON people(workspace_id, deleted_at, main_seller_id, global_rank) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_companies_last_action_date 
  ON companies(workspace_id, last_action_date) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_people_last_action_date 
  ON people(workspace_id, last_action_date) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_companies_last_action 
  ON companies(workspace_id, last_action) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_people_last_action 
  ON people(workspace_id, last_action) 
  WHERE deleted_at IS NULL;

-- Phase 2: Section Filtering
CREATE INDEX CONCURRENTLY idx_companies_section_filter 
  ON companies(workspace_id, deleted_at, main_seller_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_people_section_filter 
  ON people(workspace_id, deleted_at, main_seller_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_people_with_companies 
  ON people(workspace_id, deleted_at, main_seller_id, company_id) 
  WHERE deleted_at IS NULL AND company_id IS NOT NULL;

-- Phase 3: Action History
CREATE INDEX CONCURRENTLY idx_actions_person_history 
  ON actions(workspace_id, person_id, completed_at) 
  WHERE deleted_at IS NULL AND completed_at IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_actions_company_history 
  ON actions(workspace_id, company_id, completed_at) 
  WHERE deleted_at IS NULL AND completed_at IS NOT NULL;
```

## Performance Monitoring

After implementing indexes, monitor:
1. Query execution times (especially speedrun queries)
2. Index usage statistics
3. Write performance impact
4. Database size increase

## Notes

- Use `CONCURRENTLY` to avoid locking tables during index creation
- Partial indexes (with `WHERE` clauses) are more efficient for filtered queries
- Consider index maintenance during low-traffic periods
- Monitor index bloat and consider periodic `REINDEX` operations

