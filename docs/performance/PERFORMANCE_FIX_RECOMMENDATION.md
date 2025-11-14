# Performance Fix Recommendation - Companies & People APIs

## Problem Statement

Companies and People APIs are taking 10-20 seconds to load despite having proper database indexes and optimized queries.

## Root Cause (CONFIRMED)

**Data Over-Fetching**: Each company record contains 125 fields (183 KB per record). Fetching 302 companies transfers 54 MB of data over the network, taking 10+ seconds.

## Audit Evidence

### Query Performance
- SQL execution: **0.9ms** ✅
- Data transfer: **10+ seconds** ❌
- Network speed: 5.4 MB/s

### Data Analysis
- Records: 302 companies
- Total size: **53.92 MB**
- Per record: **183 KB** (125 fields)
- Most fields unused in list views

## Solution: Use Selective Field Fetching

### Implementation

Modify `src/app/api/v1/companies/route.ts` (lines 310-331) and `src/app/api/v1/people/route.ts` (lines 447-551) to use `select` instead of fetching all fields.

**Change from:**
```typescript
prisma.companies.findMany({
  where,
  orderBy,
  take: limit,
  include: { coreCompany: true, _count: {...} }
})
```

**Change to:**
```typescript
prisma.companies.findMany({
  where,
  orderBy,
  take: limit,
  select: {
    // Core identification
    id: true,
    name: true,
    workspaceId: true,
    
    // List display fields
    industry: true,
    status: true,
    priority: true,
    globalRank: true,
    
    // Action tracking
    lastAction: true,
    lastActionDate: true,
    nextAction: true,
    nextActionDate: true,
    
    // Assignment
    mainSellerId: true,
    mainSeller: {
      select: {
        id: true,
        name: true,
        email: true
      }
    },
    
    // Metadata
    createdAt: true,
    updatedAt: true,
    deletedAt: true
  }
})
```

### Expected Results

**Current:**
- Data transfer: 54 MB
- Load time: 10-13 seconds

**After fix:**
- Data transfer: ~6 MB (90% reduction)
- Load time: **1-2 seconds (90% faster)**

### Additional Optimizations

1. **Remove `_count` subqueries** - These don't add much value in list views
2. **Remove `include: { coreCompany: true }`** - Rarely needed in lists
3. **Add `take: 100`** default - Don't fetch all 302 at once, use pagination

## Implementation Priority

### Priority 1: Add `select` clause (CRITICAL)
- **Impact**: 90% improvement
- **Risk**: Low (just limiting fields)
- **Effort**: 30 minutes

### Priority 2: Remove N+1 queries (if still slow)
- **Impact**: Additional 50% on top of Priority 1
- **Risk**: Medium (code refactoring)
- **Effort**: 2 hours

### Priority 3: Implement proper pagination
- **Impact**: Better UX, faster initial loads
- **Risk**: Low
- **Effort**: 1 hour

## Files to Modify

1. `src/app/api/v1/companies/route.ts` (lines 310-331)
2. `src/app/api/v1/people/route.ts` (lines 447-551)

## Testing Plan

1. Apply `select` clause to companies API
2. Test load time (should be 1-2s)
3. Verify UI displays correctly
4. Apply same fix to people API
5. Monitor production performance

## Trade-offs

**Pros:**
- 90% performance improvement
- No database changes needed
- Low risk, easy to revert
- Reduces network costs

**Cons:**
- If detail views need removed fields, need separate queries
- Slightly more code to maintain field lists

## Conclusion

The audit conclusively proves the issue is **data over-fetching**, not query execution. Using `select` to fetch only necessary fields will provide immediate, dramatic performance improvements.

**Recommendation: Implement Priority 1 immediately for 90% improvement.**

