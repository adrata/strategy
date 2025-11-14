# Companies API Performance Fix - November 14, 2025

## Problem
Companies API taking 10-13 seconds to load 302 records.

## Root Cause (Audit Results)
**Data Over-Fetching**: Transferring 54 MB (302 records × 183 KB each) because all 125 fields were being fetched when only ~20 are needed for list views.

### Audit Evidence
```
SQL Execution: 0.9ms ✅
Data Transfer: 10+ seconds ❌
Data Size: 53.92 MB for 302 records
Per Record: 183 KB (125 fields)
Network Speed: 5.4 MB/s
```

## Solution Implemented
Added `select` clause to `src/app/api/v1/companies/route.ts` (lines 318-358) to fetch only necessary fields for list views.

### Fields Selected (25 fields vs 125)
- Core: id, name, workspaceId
- Display: industry, status, priority, globalRank
- Actions: lastAction, lastActionDate, nextAction, nextActionDate
- Contact: email, website, linkedinUrl
- Location: hqState, size
- Assignment: mainSellerId, mainSeller (relation)
- Metadata: createdAt, updatedAt, deletedAt

### Data Reduction
- Before: 54 MB (125 fields)
- After: ~6 MB (25 fields)
- **Reduction: 90%**

## Expected Performance
- **Before**: 10-13 seconds
- **After**: 1-2 seconds
- **Improvement**: 90% faster

## Files Modified
- `src/app/api/v1/companies/route.ts` (lines 310-361)

## Testing
1. Refresh browser
2. Navigate to companies page
3. Check console for load time
4. Should see: `GET /api/v1/companies/... 200 in ~1000-2000ms`

## Related Documentation
- `docs/audits/api-performance-audit-2025-11-14.md` - Full audit results
- `docs/performance/PERFORMANCE_FIX_RECOMMENDATION.md` - Detailed analysis and recommendations

## Next Steps (If Needed)
If still slow after this fix:
1. Apply same `select` optimization to People API
2. Reduce `limit` from 10000 to 100 (pagination)
3. Implement virtual scrolling in UI


