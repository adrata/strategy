# API Returns Zero Results Fix

## Issue Identified

Browser console logs show the API is being called correctly but returning 0 results:

```
✅ [MINNESOTA POWER DEBUG] Response received: {length: 0, firstItem: 'no items'}
⚡ [BUYER GROUPS] Fast API returned: 0 members
🔍 [BUYER GROUPS] No people found in database for this company
```

However, our direct database test scripts confirm:
- 7 people exist with correct `companyId` linkage
- 2 people have buyer group roles
- All workspace IDs match
- All queries work at database level

## Root Cause

The API queries work in isolation but fail when called via HTTP. This indicates **additional runtime filtering** is being applied that differs from our test scripts.

## Diagnostic Logging Added

### Buyer Groups API (`src/app/api/data/buyer-groups/fast/route.ts`)

Added comprehensive debugging that triggers when query returns 0 results:

1. **Test 1:** Query all people for company without buyer group filter
   - Checks if ANY people exist for the company
   - Shows count and sample data

2. **Test 2:** Query without workspace filter
   - Identifies if workspace mismatch is causing the issue
   - Lists all workspaces where matching people exist
   - Compares against expected workspace

This will pinpoint whether the issue is:
- **Buyer group filter too restrictive** (Test 1 shows people, Test 2 shows people)
- **Workspace mismatch** (Test 1 shows 0, Test 2 shows people)
- **CompanyId mismatch** (Both tests show 0)

### People API Fix

Added `includeAllUsers=true` flag to bypass mainSeller filtering:

**File:** `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx` (line ~309)

**Before:**
```typescript
const apiUrl = `/api/v1/people?companyId=${companyId}&limit=200&sortBy=updatedAt&sortOrder=desc`;
```

**After:**
```typescript
const apiUrl = `/api/v1/people?companyId=${companyId}&limit=200&sortBy=updatedAt&sortOrder=desc&includeAllUsers=true`;
```

This ensures the People tab shows ALL people associated with the company, regardless of seller assignment.

## Testing Instructions

1. **Hard refresh** the Minnesota Power page: Ctrl+Shift+R
2. **Click on Buyer Groups tab** and check:
   - Browser console for new debug logs
   - Server logs for Test 1 and Test 2 results
3. **Click on People tab** and check:
   - Should now show all 7 people (if seller filtering was the issue)
   - Browser console for API response

## Expected Server Logs

When Buyer Groups API returns 0, you should now see:

```
❌ [FAST BUYER GROUPS] ZERO RESULTS - Debugging why...
🔍 [FAST BUYER GROUPS] Test 1 - All people for company (no buyer group filter): X
🔍 [FAST BUYER GROUPS] Test 2 - Without workspace filter: Y
```

### Interpretation:

**If Test 1 = 7, Test 2 = 2:**
- All 7 people exist in correct workspace
- Only 2 have buyer group roles (expected behavior)
- **Issue:** Frontend should show all 7 in People tab, only 2 in Buyer Groups tab

**If Test 1 = 0, Test 2 = 2:**
- Workspace mismatch! Auth context has wrong workspace
- **Issue:** Fix workspace resolution in `getSecureApiContext`

**If Test 1 = 0, Test 2 = 0:**
- CompanyId mismatch or data deleted
- **Issue:** Investigate data integrity

## Files Modified

1. `src/app/api/data/buyer-groups/fast/route.ts` - Added zero-results debugging
2. `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx` - Added includeAllUsers flag

## Next Steps

1. Test on staging and review server logs
2. Based on Test 1/Test 2 results, apply appropriate fix
3. Document findings and permanent solution

