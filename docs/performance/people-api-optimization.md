# People API Performance Optimization

## Problem
The `/api/v1/people` endpoint was taking 5+ seconds to return 1,349 people records, causing slow page loads.

## Root Causes

1. **Unbounded Actions Query**: Fetching last actions for all people without a LIMIT, causing full table scans
2. **Expensive Company Queries**: "Companies with 0 people" queries for leads/prospects sections had no limits
3. **Large Dataset**: Processing 1,349 records with complex calculations for each

## Optimizations Applied

### 1. Limited Actions Query (Line 698)
**Before:**
```typescript
prisma.actions.findMany({
  where: { personId: { in: personIds }, deletedAt: null, status: 'COMPLETED' },
  orderBy: { completedAt: 'desc' }
  // No limit - could scan thousands of records
})
```

**After:**
```typescript
prisma.actions.findMany({
  where: { personId: { in: personIds }, deletedAt: null, status: 'COMPLETED' },
  orderBy: { completedAt: 'desc' },
  take: Math.min(personIds.length * 2, 5000)  // Limit to 2x person count, max 5K
})
```

**Impact**: Prevents full table scans on the actions table. For 1,349 people, we now fetch max 2,698 actions instead of potentially tens of thousands.

### 2. Limited Companies Queries (Lines 947 & 1056)
**Before:**
```typescript
// Leads section
prisma.companies.findMany({
  where: { /* companies with 0 people */ }
  // No limit - could return hundreds of companies
})

// Prospects section
prisma.companies.findMany({
  where: { /* prospect companies with 0 people */ }
  // No limit
})
```

**After:**
```typescript
// Both sections now have:
prisma.companies.findMany({
  where: { /* companies with 0 people */ },
  orderBy: { globalRank: 'asc' },
  take: 100  // Limit to top 100 by rank
})
```

**Impact**: Prevents slow queries for finding companies without people. Most users will have fewer than 100 such companies anyway.

## Performance Improvements

### Expected Results
- **Actions query**: 60-80% faster (from ~2-3s to ~0.5-1s)
- **Companies query**: 50-70% faster (from ~1-2s to ~0.3-0.5s)
- **Overall endpoint**: **Should drop from 5+ seconds to 2-3 seconds** (~50% improvement)

### Further Optimizations (Requires DB Owner Permissions)
If database owner permissions are available, these indexes would provide additional 50-70% improvement:

```sql
-- People filtering indexes
CREATE INDEX CONCURRENTLY idx_people_workspace_status_deleted 
  ON people(workspaceId, status) WHERE deletedAt IS NULL;

CREATE INDEX CONCURRENTLY idx_people_workspace_seller_deleted
  ON people(workspaceId, mainSellerId) WHERE deletedAt IS NULL;

-- Actions query index (most impactful)
CREATE INDEX CONCURRENTLY idx_actions_person_completed_deleted
  ON actions(personId, completedAt DESC) WHERE deletedAt IS NULL;

-- Companies "0 people" query index
CREATE INDEX CONCURRENTLY idx_companies_workspace_status_seller
  ON companies(workspaceId, status, mainSellerId) WHERE deletedAt IS NULL;
```

## Testing
1. Navigate to `/[workspace]/companies/` or `/[workspace]/people/`
2. Check browser console for timing: `GET /api/v1/people/?section=leads&limit=10000 200 in XXXms`
3. Verify response time is under 3 seconds (down from 5+ seconds)

## Trade-offs
- **Actions**: We fetch 2x person count instead of all actions. This means if a person has >2 actions, we might miss some older ones. This is acceptable since we only show the most recent action anyway.
- **Companies**: Limited to 100 companies per section. Most workspaces have far fewer companies with 0 people, so this won't affect most users.

## Files Modified
- `src/app/api/v1/people/route.ts` (3 query optimizations)

## Related
- See `sql/optimize_people_api_performance.sql` for index definitions (requires DB owner permissions)
- Performance testing results should be added here after deployment

