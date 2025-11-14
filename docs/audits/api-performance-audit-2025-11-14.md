# API Performance Audit - November 14, 2025

## Executive Summary

**Root Cause:** Companies API transfers **54 MB** of unnecessary data (302 records × 183 KB each) because it fetches all 125 fields per company when only ~15 are needed for list views.

**Impact:** 10-13 second load times despite sub-millisecond SQL execution.

**Solution:** Use Prisma `select` to fetch only required fields → **Expected improvement: 10-13s → 1-2s (90% reduction)**

## Audit Results

### Test 1: Query Execution Plan
```sql
EXPLAIN ANALYZE: 0.9ms execution time
✓ Index being used: idx_companies_workspace_seller
✓ Bitmap Index Scan (efficient)
```

### Test 2: Data Transfer Analysis
```
Total data: 53.92 MB
Records: 302
Per record: 183 KB
Fields per record: 125
Transfer time: ~10 seconds
Network speed: 5.39 MB/s
```

### Test 3: Query Performance Breakdown
```
Raw SQL query:              10.6 seconds
Prisma findMany (no joins): 9.9 seconds
Prisma ORM overhead:        -0.7 seconds (actually faster!)

Conclusion: 10 seconds is pure data transfer, not query execution
```

### Test 4: JOIN Performance
```
Minimal query (no relations):  11.1 seconds
With coreCompany JOIN:          9.3 seconds

Conclusion: JOIN doesn't add significant overhead
            The base transfer is the bottleneck
```

## Root Cause Analysis

### Problem: Over-fetching Data

The companies table has 125 fields including:
- Large text fields (descriptions, notes, summaries)
- JSON fields (customFields, tags, buyerGroupData)
- Unused fields (old schema columns)

**For list views, we only need ~15 fields:**
- id, name, industry, status, priority
- globalRank, lastAction, lastActionDate
- nextAction, nextActionDate
- mainSellerId, createdAt, updatedAt

### Impact Calculation

**Current state:**
- Fetching 125 fields × 302 records = 54 MB
- Transfer time: ~10 seconds at 5.4 MB/s

**With selective fields (15 fields):**
- Fetching 15 fields × 302 records = ~6 MB (estimated)
- Transfer time: ~1 second
- **Improvement: 90% faster**

## Recommendations

### Immediate Fix (High Impact, Low Risk)

**Modify `src/app/api/v1/companies/route.ts` line 310-331:**

Replace:
```typescript
prisma.companies.findMany({
  where,
  orderBy: { [sortBy]: sortOrder },
  skip: offset,
  take: limit,
  include: {
    coreCompany: true,
    _count: { ... }
  }
})
```

With:
```typescript
prisma.companies.findMany({
  where,
  orderBy: { [sortBy]: sortOrder },
  skip: offset,
  take: limit,
  select: {
    // Essential fields for list view
    id: true,
    name: true,
    industry: true,
    status: true,
    priority: true,
    globalRank: true,
    lastAction: true,
    lastActionDate: true,
    nextAction: true,
    nextActionDate: true,
    mainSellerId: true,
    workspaceId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    // Optional: Add mainSeller relation if needed
    mainSeller: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
})
```

**Expected Result:** 10-13s → 1-2s (90% improvement)

### Medium-term Optimization

1. **Remove N+1 queries** for last actions (batch fetch)
2. **Remove `_count`** subqueries
3. **Implement cursor-based pagination** instead of fetching all 302 at once

### Long-term Architecture

1. **Materialize computed fields** (lastAction, nextAction) in the database
2. **Implement GraphQL** for client-specified field selection
3. **Add Redis caching** for frequently accessed data
4. **Consider read replicas** closer to application servers

## Files Analyzed

- `src/app/api/v1/companies/route.ts` - Companies API endpoint
- `src/app/api/v1/people/route.ts` - People API endpoint (same issue)
- Database indexes: All present and being used correctly
- Network: 5.4 MB/s transfer speed to Neon

## Conclusion

The slowness is caused by **data over-fetching**, not query execution. Using `select` to fetch only necessary fields will provide immediate ~90% performance improvement without any database changes or complex refactoring.

**Quick win:** Change one line of code (add `select` clause) → 10× faster!

