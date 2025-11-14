# Buyer Group Tab Loading Fix

## Problem

When navigating to a company record and clicking the "Buyer Group" tab before clicking the "People" tab, the tab would display "No Buyer Group Members Found" even though members existed. The data would only load correctly after first visiting the People tab and then returning to the Buyer Group tab.

## Root Cause

The `UniversalBuyerGroupsTab` component had a timing issue where:

1. The component would initialize with `loading = false` and `buyerGroups = []`
2. This caused the empty state to render immediately
3. The `useEffect` hook would then start fetching data, but by the time it completed, the user already saw the empty state
4. More critically, the `companyId` and `companyName` were not tracked as separate dependencies, so when they became available from the record object, the effect wouldn't re-run
5. The People tab worked because it would populate data in localStorage that the Buyer Group tab would then read on subsequent visits

## Solution

Applied the same pattern used in the working `UniversalPeopleTab` component:

### 1. Memoized Company Data Extraction

Added memoized values for `companyId` and `companyName` to track them separately:

```typescript
const companyId = React.useMemo(() => {
  if (!record) return '';
  
  if (recordType === 'people') {
    return record.companyId || '';
  } else {
    return record.id || '';
  }
}, [record?.id, record?.companyId, recordType]);

const companyName = React.useMemo(() => {
  if (!record) return '';
  
  if (recordType === 'people') {
    return (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
           record.companyName || '';
  } else {
    return record.name || 
           (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 
           record.companyName || '';
  }
}, [record?.id, record?.name, record?.company, record?.companyName, recordType]);
```

### 2. Early Loading State When Waiting for Data

Added checks at the start of the `useEffect` to set `loading = true` when waiting for record or companyId:

```typescript
// Show loading while waiting for record
if (!record?.id) {
  setBuyerGroups([]);
  setLoading(true);
  setIsFetching(false);
  return;
}

// Show loading while waiting for companyId
if (!companyId || companyId.trim() === '') {
  setBuyerGroups([]);
  setLoading(true);
  setIsFetching(false);
  return;
}
```

### 3. Updated Dependencies

Changed the `useEffect` dependency array to include the memoized `companyId` and `companyName`:

```typescript
}, [record?.id, recordType, companyId, companyName]);
```

This ensures the effect re-runs when:
- The record ID changes
- The record type changes
- The companyId becomes available or changes
- The companyName becomes available or changes

## Testing

To verify the fix:

1. Navigate to any company record directly (e.g., via URL or from companies list)
2. Click the "Buyer Group" tab first (without clicking People tab)
3. The tab should now show a loading state briefly, then display the buyer group members
4. The empty state should only appear if there are genuinely no buyer group members

## Files Changed

- `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx`

## Impact

This fix ensures consistent behavior across all tabs on company records. Users can now navigate directly to the Buyer Group tab from any entry point without needing to visit the People tab first.

