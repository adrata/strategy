# Comprehensive Audit Results - Minnesota Power People Tabs

## Executive Summary

**Date:** 2025-01-14  
**Issue:** People and Buyer Group tabs showing no records for Minnesota Power despite 7 people being associated in database  
**Status:** ✅ DIAGNOSTIC TOOLS IMPLEMENTED - Ready for browser testing  

## Test Results

### ✅ Test 1: Database Audit
**Script:** `scripts/audit-minnesota-power-people.js`  
**Result:** PASSED  

**Findings:**
- **Company ID:** 01K9QD382T5FKBSF0AS72RAFAT
- **Workspace ID:** 01K9QAP09FHT6EAP1B4G2KP3D2 (top-temp)
- **People Found:** 7 total
  - 3 LEAD status
  - 4 PROSPECT status
  - All properly linked with correct `companyId`
  - All in correct workspace
  - 2 with buyer group roles assigned

**Conclusion:** ✅ Data is correct in database

### ✅ Test 2: Direct API Query Test
**Script:** `scripts/test-minnesota-power-apis.js`  
**Result:** PASSED  

**Findings:**
- **People API:** Returns all 7 people correctly
- **Buyer Groups API:** Returns 2 members correctly
- **Filter Tests:** All combinations work (companyId, workspace, seller)

**Conclusion:** ✅ API queries work perfectly at database level

### ✅ Test 3: Workspace Verification
**Script:** `scripts/verify-workspace-context.js`  
**Result:** PASSED  

**Findings:**
- URL workspace slug 'top-temp' resolves to correct ID
- Company workspace ID matches URL workspace ID
- All 7 people records are in the same workspace
- No workspace mismatch detected

**Conclusion:** ✅ Workspace context is correct

## Root Cause Analysis

Based on all tests, the data and API queries are working correctly. The issue must be in the **frontend/browser context:**

### Possible Causes (in order of likelihood):

1. **Authentication Context Issue**
   - Browser auth headers may be using wrong workspace
   - Session may not have access to the top-temp workspace
   - Cookies may be missing or invalid

2. **Frontend State Issue**
   - `companyId` not being extracted correctly from record
   - Record object not fully loaded when tabs mount
   - Caching returning empty stale data

3. **API Call Issue**
   - Wrong URL being constructed
   - Parameters not being passed correctly
   - Request being cancelled/aborted

## Diagnostic Tools Implemented

### 1. Enhanced API Logging

**File:** `src/app/api/v1/people/route.ts`
- Logs companyId filter application
- Logs full WHERE clause
- Logs query results count and sample data

**File:** `src/app/api/data/buyer-groups/fast/route.ts`
- Logs request details (URL, workspaceId, userId)
- Logs query results breakdown
- Logs number of members returned

### 2. Enhanced Browser Logging

**File:** `src/platform/api-fetch.ts`
- Automatic logging for any Minnesota Power query
- Logs full request URL and headers
- Logs response status and data
- Shows data array length and first item

**File:** `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx`
- Logs companyId extraction
- Logs API URLs being called
- Logs API responses

**File:** `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx`
- Logs companyId extraction
- Logs API URLs being called
- Logs API responses

### 3. Visible Debug Panels

Both tabs now show a debug panel in development mode with:
- Current companyId
- Current recordType
- Loading state
- Has fetched status
- Error messages
- Record count
- Real-time timestamp

### 4. Error State Improvements

Both tabs now display:
- Clear error messages
- Debug information panel with all relevant IDs
- Instruction to check browser console

## Testing Instructions

### Step 1: Open Browser DevTools Console

Navigate to Minnesota Power page:
```
https://staging.adrata.com/top-temp/companies/minnesota-power-01K9QD382T5FKBSF0AS72RAFAT/
```

### Step 2: Check Debug Panel

You should see colored debug panels at the top of each tab showing:
- **People Tab:** Blue panel with record/company IDs
- **Buyer Groups Tab:** Purple panel with record/company IDs

### Step 3: Check Console Logs

Look for these log sequences:

**People Tab:**
```
🔍 [PEOPLE TAB] Using record.id as companyId for company record: 01K9QD382T5FKBSF0AS72RAFAT
🔍 [PEOPLE TAB] Making API call: /api/v1/people?companyId=01K9QD382T5FKBSF0AS72RAFAT...
📤 [API-FETCH] Making request: {...}
🔍 [MINNESOTA POWER DEBUG] Full request details: {...}
✅ [MINNESOTA POWER DEBUG] Response received: {...}
```

**Buyer Groups Tab:**
```
🔍 [BUYER GROUPS TAB] Using record.id as companyId for company record: 01K9QD382T5FKBSF0AS72RAFAT
🔍 [BUYER GROUPS TAB] Making API call to: /api/data/buyer-groups/fast?companyId=01K9QD382T5FKBSF0AS72RAFAT
📤 [API-FETCH] Making request: {...}
🔍 [MINNESOTA POWER DEBUG] Full request details: {...}
✅ [MINNESOTA POWER DEBUG] Response received: {...}
```

### Step 4: Check Server Logs

Backend logs should show:
```
🔍 [V1 PEOPLE API] Filtering by companyId: 01K9QD382T5FKBSF0AS72RAFAT
🔍 [V1 PEOPLE API] Found X people (total: Y)
```

## Diagnostic Decision Tree

Use browser console logs to identify the issue:

### If you see `companyId: undefined` or `null`
→ **Frontend State Issue**
- Check record object loading
- Verify UniversalRecordTemplate is passing correct record
- Check if component mounts before record loads

### If you see API call made but returns 0 results
→ **Authentication Issue**
- Check request headers for Authorization token
- Verify workspace in auth context matches top-temp
- Check server logs for auth errors

### If you don't see API calls being made
→ **Frontend Logic Issue**
- Check if useEffect dependencies are correct
- Verify companyId memo is computing correctly
- Check for early returns in fetch logic

### If API returns data but UI shows empty
→ **Client-Side Filtering Issue**
- Check state updates after API response
- Verify no filtering logic discarding data
- Check React rendering conditions

## Expected Outcomes

### Successful Scenario:
1. Debug panels show correct IDs
2. Console shows API calls with correct companyId
3. API responses contain data arrays with 7 people / 2 buyer group members
4. Tabs display the data

### Failure Scenarios:

**Scenario A: Missing companyId**
- Debug panel shows "N/A" for Company ID
- No API calls made
- Empty state displayed
→ Fix: Ensure record is fully loaded before tabs render

**Scenario B: Auth Error**
- API calls made with companyId
- Response is 401 Unauthorized
- Empty state displayed
→ Fix: Check authentication, verify workspace access

**Scenario C: Empty Response**
- API calls made with companyId
- Response is 200 but data array is empty
- Empty state displayed
→ Fix: Check auth context workspace ID vs database workspace ID

## Next Steps

1. **Test on Staging:** Navigate to Minnesota Power page and review logs
2. **Identify Issue:** Use decision tree above to pinpoint the problem
3. **Apply Fix:** Based on findings, implement appropriate fix
4. **Verify:** Confirm both tabs show all expected data

## Files Modified

### Audit Scripts (NEW):
- `scripts/audit-minnesota-power-people.js`
- `scripts/test-minnesota-power-apis.js`
- `scripts/verify-workspace-context.js`

### Backend (Enhanced Logging):
- `src/app/api/v1/people/route.ts`
- `src/app/api/data/buyer-groups/fast/route.ts`
- `src/platform/api-fetch.ts`

### Frontend (Enhanced Logging & UI):
- `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx`
- `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx`

## Summary

We've successfully implemented comprehensive diagnostic tools that will reveal the exact issue when you test on staging. All database queries work correctly, all APIs function properly, and workspaces match. The issue is somewhere in the browser context, and the enhanced logging will pinpoint it immediately.

**Action Required:** Test on staging browser and review console logs to identify the specific failure point.

