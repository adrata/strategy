# Speedrun and Companies Column Sorting Fix

## Problem Summary

**Working sections**: Leads, Prospects, People  
**Broken sections**: Speedrun, Companies

Console logs showed that clicks were being detected and sort state was changing, but the data wasn't actually re-sorting for speedrun and companies.

## Root Cause Analysis

The issue was a **double-sorting conflict**:

1. **`PipelineContent`** applies client-side sorting to `filteredData` (lines 527-570)
2. **`PipelineTableRefactored`** passes the already-sorted data to `usePipelineData` hook
3. **`usePipelineData`** tries to sort the data again, but the sort state was not synchronized

### API Sorting Support

- **`/api/v1/people`** (used by leads, prospects, people) **supports sorting** with `sortBy` and `sortOrder` parameters
- **`/api/v1/companies`** (used by companies) **supports sorting** with `sortBy` and `sortOrder` parameters  
- **`/api/v1/speedrun`** (used by speedrun) **does NOT support sorting** - only has `limit` and `refresh` parameters

### DisableSorting Logic

The `disableSorting` flag was:
- `true` for leads, prospects, people, companies → **WORKED** (preserved API ranking)
- `false` for speedrun → **BROKEN** (tried client-side sorting but sort state wasn't synced)

## Solution Implemented

### 1. Added Speedrun to DisableSorting List

```typescript
// Before
disableSorting: section === 'companies' || section === 'people' || section === 'leads' || section === 'prospects'

// After  
disableSorting: section === 'companies' || section === 'people' || section === 'leads' || section === 'prospects' || section === 'speedrun'
```

### 2. Synchronized Sort State Between Components

**Modified `usePipelineData` hook** to accept external sort state:

```typescript
interface UsePipelineDataProps {
  // ... existing props
  externalSortField?: string;
  externalSortDirection?: 'asc' | 'desc';
}
```

**Updated sort state logic**:
```typescript
// Use external values if provided, otherwise use internal state
const sortField = externalSortField || internalSortField;
const sortDirection = externalSortDirection || internalSortDirection;
```

**Updated `PipelineTableRefactored`** to pass sort state:
```typescript
} = usePipelineData({ 
  data, 
  pageSize,
  disableSorting: section === 'companies' || section === 'people' || section === 'leads' || section === 'prospects' || section === 'speedrun',
  searchQuery,
  totalCount,
  externalSortField: sortField, // Pass external sort field
  externalSortDirection: sortDirection // Pass external sort direction
});
```

## How It Works Now

1. **User clicks column header** → `TableHeader.onClick` → `PipelineContent.handleColumnSort`
2. **`PipelineContent` updates sort state** → `setSortField`, `setSortDirection`
3. **`PipelineContent` sorts data client-side** → `filteredData` is sorted
4. **`PipelineTableRefactored` receives sorted data** → passes to `usePipelineData`
5. **`usePipelineData` receives external sort state** → syncs with `PipelineContent` sort state
6. **When `disableSorting: true`** → returns data as-is (preserves `PipelineContent` sorting)
7. **When `disableSorting: false`** → applies additional sorting (for future sections that need it)

## Additional Fix for Companies

After implementing the main fix, companies sorting still didn't work. Investigation revealed:

### Companies Data Structure Issue

The companies API returns data with different field names:
- **Companies API**: Uses `globalRank` and `name` fields
- **Other APIs**: Use `rank` and `company` fields

### Companies-Specific Field Mapping

**Added companies-specific field mapping**:
```typescript
} else if (section === 'companies') {
  return {
    ...baseMap,
    'Rank': 'globalRank', // Companies use globalRank instead of rank
    'Company': 'name', // Companies use name field
  };
}
```

**Updated `getSortableValue` function**:
```typescript
case 'rank':
case 'globalRank': // Added support for globalRank
  const fallbackRank = record.rank || record.globalRank || record.stableIndex || 0;
```

## Result

- ✅ **Speedrun**: Now uses `disableSorting: true` → preserves `PipelineContent` client-side sorting
- ✅ **Companies**: Fixed field mapping + `disableSorting: true` → preserves `PipelineContent` client-side sorting  
- ✅ **Leads, Prospects, People**: Continue to work as before → preserve API ranking

## Files Modified

1. **`src/frontend/components/pipeline/PipelineTableRefactored.tsx`**
   - Added `speedrun` to `disableSorting` list
   - Added `externalSortField` and `externalSortDirection` parameters

2. **`src/platform/hooks/usePipelineData.ts`**
   - Added `externalSortField` and `externalSortDirection` props
   - Updated sort state logic to use external values when provided
   - Cleaned up debug logging

3. **`src/frontend/components/pipeline/PipelineContent.tsx`**
   - Added companies-specific field mapping (`Rank` → `globalRank`, `Company` → `name`)
   - Updated `getSortableValue` function to handle `globalRank` field
   - Added debug logging for companies section troubleshooting

## Testing

The fix should now allow column sorting to work on:
- ✅ Speedrun table (rank, name, company, status, etc.)
- ✅ Companies table (name, industry, size, etc.)
- ✅ All other sections continue to work as before

## Future Improvements

If API-based sorting is needed for speedrun in the future:
1. Add `sortBy` and `sortOrder` parameters to `/api/v1/speedrun` endpoint
2. Remove `speedrun` from the `disableSorting` list
3. The existing client-side sorting will serve as a fallback
