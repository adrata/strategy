# Company Record Save Persistence Fix

## Problem
When saving a company field, the user sees a success message and the update in the UI, but when they navigate away and return to the same company record, the saved update is not showing - old data appears instead.

## Root Cause
The `useFastSectionData` hook was using a local `loadedSections` Set that persisted across renders. Once a section was marked as "loaded", it would skip fetching fresh data even when updates were made to records and force-refresh flags were set in sessionStorage.

## Solution Applied
Updated the cache validation logic in `src/platform/hooks/useFastSectionData.ts` (lines 93-119) to:

1. **Check for force-refresh flags**: Before trusting the cache, the hook now checks sessionStorage for any keys matching `force-refresh-{section}-*` pattern
2. **Clear cache when force-refresh detected**: If force-refresh flags are found, it removes them from sessionStorage and clears the section from the `loadedSections` Set
3. **Continue to fetch fresh data**: After clearing the cache, it continues to the API fetch logic to get fresh data

## Code Changes

### Before:
```typescript
if (!forceRefresh && loadedSections.has(section)) {
  console.log(`⚡ [FAST SECTION DATA] Skipping fetch - section ${section} already loaded`);
  setLoading(false);
  return;
}
```

### After:
```typescript
if (!forceRefresh && loadedSections.has(section)) {
  // Check if a force refresh was requested via sessionStorage
  if (typeof window !== 'undefined') {
    const forceRefreshKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('force-refresh-') && key.includes(section)
    );
    
    if (forceRefreshKeys.length > 0) {
      console.log(`🔄 [FAST SECTION DATA] Force refresh flag detected for ${section}, clearing cache and refetching`);
      forceRefreshKeys.forEach(key => sessionStorage.removeItem(key));
      setLoadedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(section);
        return newSet;
      });
      // Continue to fetch below
    } else {
      console.log(`⚡ [FAST SECTION DATA] Skipping fetch - section ${section} already loaded`);
      setLoading(false);
      return;
    }
  } else {
    console.log(`⚡ [FAST SECTION DATA] Skipping fetch - section ${section} already loaded`);
    setLoading(false);
    return;
  }
}
```

## How It Works

1. **When saving a company field**: The `handleInlineFieldSave` function in `UniversalRecordTemplate.tsx` sets a `force-refresh-companies-{companyId}` flag in sessionStorage (line 2168)

2. **When loading company data**: The `useFastSectionData` hook checks for any `force-refresh-companies-*` keys in sessionStorage

3. **If force-refresh detected**: It clears the flag, removes 'companies' from the `loadedSections` Set, and fetches fresh data from the API

4. **Result**: The company record page shows the updated data instead of stale cached data

## Testing Steps

1. Open a company record in the browser
2. Edit a field (e.g., company name, website, industry) 
3. Verify success message appears and update shows in UI
4. Navigate to a different company or back to companies list
5. Return to the edited company record
6. **Verify the saved changes are now showing**

## Console Logs to Watch For

When the fix is working, you should see these console messages:
- `🔄 [FAST SECTION DATA] Force refresh flag detected for companies, clearing cache and refetching`
- `🧹 [FAST SECTION DATA] Removed companies from loaded sections`
- `🔄 [FAST SECTION DATA] Force refetching after cache clear for: companies`

## Files Modified

- `src/platform/hooks/useFastSectionData.ts` - Added force-refresh flag detection and cache invalidation logic

## Related Commits

This fix is based on the same pattern used to fix leads records in commit `f0d5e2a3` ("fix: resolve page reloads and API endpoint issues + staging improvements").
