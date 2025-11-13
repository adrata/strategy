# People Tab Loading State Fix - Implementation Summary

## Issue Fixed
The People tab was showing "No People (Employees) Found" before attempting to fetch data when the company record was still loading. This created a confusing user experience where the empty state would flash briefly before people data appeared.

## Root Cause
The component was setting `loading = false` when waiting for `record.id` or `companyId` to become available, causing the UI to render the empty state instead of a loading state.

## Solution Implemented
Added a `hasFetchedOnce` flag to distinguish between:
- **Not yet attempted** → Show loading state
- **Attempted and found none** → Show empty state

## Changes Made

### File: `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx`

1. **Added fetch tracking state (line 23)**
   - Added `const [hasFetchedOnce, setHasFetchedOnce] = useState(false);`

2. **Updated early return when record.id is missing (line 159-167)**
   - Changed `setLoading(false)` to `setLoading(true)`
   - Now shows loading spinner while waiting for record

3. **Updated early return when companyId is missing (line 185-197)**
   - Changed to `setLoading(true)` 
   - Shows loading spinner while waiting for companyId

4. **Set hasFetchedOnce flag after fetch completes with no people (line 342-348)**
   - Added `setHasFetchedOnce(true)` after determining no people exist

5. **Updated successful fetch to set flag (line 490-495)**
   - Added `setHasFetchedOnce(true)` after successfully loading people

6. **Updated error handling to set flag (line 497-503)**
   - Added `setHasFetchedOnce(true)` in the catch block

7. **Updated empty state condition (line 545)**
   - Changed from `{!loading && people.length === 0 && (`
   - To `{!loading && people.length === 0 && hasFetchedOnce && (`
   - Ensures empty state only shows after we've actually attempted to fetch data

## Testing Recommendations

1. Navigate to a company page (e.g., YUBA Water Agency)
2. Click People tab immediately
3. Should see loading spinner/skeleton (not "No People Found")
4. After data loads, should see people list
5. For companies with no people, should see "No People Found" only after fetch completes

## Impact

- Better UX: No more confusing empty state flash
- More accurate loading states
- Consistent with user expectations
- Fixes the reported bug for YUBA Water Agency and similar cases

## Technical Details

The fix uses a boolean flag pattern to track whether the component has attempted to fetch data at least once. This allows us to differentiate between:
- Initial load state (show loading)
- Waiting for dependencies (show loading)
- Confirmed empty data (show empty state)

This pattern is more reliable than trying to infer state from the absence of data alone.

