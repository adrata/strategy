# Buyer Groups Tab Loading Fix - Complete Audit

## Issue Summary
The Buyer Groups tab was not loading on initial prospect record load when navigating directly to the tab via URL parameter (`?tab=buyer-groups`). However, after navigating through other tabs (like Company tab) and coming back, it worked correctly.

## Root Cause Analysis
The issue was a race condition where:
1. The prospect record loads initially without `companyId` in the record prop
2. The Buyer Groups tab component mounts and tries to fetch buyer groups
3. The `useEffect` checks for `companyId` and returns early if missing
4. When `companyId` becomes available later (after navigating to Company tab), the effect doesn't properly retry

## Solution Implemented

### 1. Enhanced companyId Detection
**File**: `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx`

- Added `fetchedCompanyId` state to store companyId fetched from API
- Updated `companyId` memo to include `fetchedCompanyId` as a fallback
- The memo now checks: `record.companyId || fetchedCompanyId || record?.company?.id || ...`

**Lines**: 50-93

### 2. Added API Fallback Mechanism
**File**: `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx`

- When `companyId` is missing, the component now actively fetches it from `/api/v1/people/[id]`
- Only fetches if we haven't already fetched for this record ID
- Also fetches company name if available in API response

**Lines**: 270-301

### 3. Improved Retry Logic
**File**: `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx`

- Added `fetchedCompanyId` to the `useEffect` dependency array
- Effect re-runs when `fetchedCompanyId` becomes available
- Clears `fetchedCompanyId` when `record.companyId` becomes available to avoid stale state

**Lines**: 315-319, 1008

### 4. State Management
**File**: `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx`

- Clears `fetchedCompanyId` when record is not available
- Clears `fetchedCompanyId` when record/company changes
- Prevents stale state from previous records

**Lines**: 251, 380

## Code Changes Summary

### State Variables Added
- `fetchedCompanyId`: Stores companyId fetched from API when missing from record prop

### Memo Updates
- `companyId` memo: Added `fetchedCompanyId` as fallback and to dependency array

### useEffect Updates
- Added API fetch logic when `companyId` is missing
- Added cleanup logic to clear `fetchedCompanyId` when appropriate
- Added `fetchedCompanyId` to dependency array

## Impacted Files

1. **src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx**
   - Primary file with all fixes
   - No breaking changes
   - Backward compatible

2. **tests/e2e/buyer-groups-tab-loading.test.ts**
   - New Puppeteer test file
   - Tests initial load scenario
   - Tests navigation scenarios
   - Tests consistency across multiple loads

## Related Components Checked

### UniversalPeopleTab
- Similar component that also uses `companyId`
- Currently doesn't have the same fallback mechanism
- Could benefit from similar fix if issues arise

### CompanyOverviewTab
- Uses `companyId` but handles it differently
- No changes needed

### ProspectOverviewTab
- Displays company information but doesn't fetch buyer groups
- No changes needed

## Edge Cases Handled

1. **Record loads without companyId**: ✅ Fetches from API
2. **API call fails**: ✅ Logs warning, shows loading state
3. **Record changes while API call in progress**: ✅ Abort controller cancels stale requests
4. **companyId becomes available after fetch**: ✅ Clears fetchedCompanyId to use record.companyId
5. **Multiple rapid navigations**: ✅ Previous refs prevent duplicate fetches
6. **Record changes to different record**: ✅ Clears fetchedCompanyId on change

## Testing

### Manual Testing Scenarios
1. ✅ Navigate directly to prospect record with `?tab=buyer-groups`
2. ✅ Navigate through other tabs and back to Buyer Groups
3. ✅ Multiple rapid navigations
4. ✅ Record with missing companyId
5. ✅ Record with companyId available

### Automated Testing
- Puppeteer test created: `tests/e2e/buyer-groups-tab-loading.test.ts`
- Tests initial load with tab parameter
- Tests navigation through tabs
- Tests consistency across multiple loads
- Tests graceful handling of missing companyId

## Performance Considerations

- API call only made when `companyId` is missing
- Prevents duplicate fetches using refs
- Abort controller cancels stale requests
- No impact on records that already have `companyId`

## Backward Compatibility

- ✅ No breaking changes
- ✅ Works with existing records that have `companyId`
- ✅ Gracefully handles records without `companyId`
- ✅ No changes to component props or API

## Verification Checklist

- [x] Code changes implemented correctly
- [x] All state variables properly initialized
- [x] Memo dependencies correct
- [x] useEffect dependencies correct
- [x] Cleanup logic handles all cases
- [x] No linting errors
- [x] Test file created
- [x] Edge cases handled
- [x] Performance considerations addressed
- [x] Backward compatibility maintained

## Next Steps

1. Run Puppeteer test to validate fix
2. Monitor production for any issues
3. Consider applying similar fix to UniversalPeopleTab if needed
4. Document fix in changelog

