# Minnesota Power People Tabs Fix

## Issue Report

**Problem:** People and Buyer Group tabs on Minnesota Power company page showing no records despite having 3 leads and 4 prospects associated with the company.

**Affected URL:** `https://staging.adrata.com/top-temp/companies/minnesota-power-01K9QD382T5FKBSF0AS72RAFAT/?tab=buyer-groups`

## Investigation Summary

### Audit Results

Created and ran comprehensive audit script (`scripts/audit-minnesota-power-people.js`) which revealed:

**Company Information:**
- ID: `01K9QD382T5FKBSF0AS72RAFAT`
- Name: Minnesota Power
- Website: https://www.mnpower.com
- Workspace: `01K9QAP09FHT6EAP1B4G2KP3D2`
- Status: LEAD

**People Found (7 total):**
1. Chad Highland - PROSPECT - Electronics Technician
2. Jason Oswald - PROSPECT - Electronics Technician
3. Becky Moore - PROSPECT
4. Jeff Orhn - LEAD
5. Ayla Isaacson - LEAD
6. Matthew Tryon - LEAD - Electronics Technician (Buyer Group: Decision Maker)
7. Jon Wirtanen - PROSPECT - Supervising Engineer (Buyer Group: Champion)

**Key Findings:**
- All 7 people are properly linked with correct `companyId`
- All have matching workspace IDs
- Only 2 people have buyer group roles assigned
- Data is correctly structured in database

### Root Cause

The data is correctly linked in the database. The issue is likely one of:
1. Frontend not correctly passing `companyId` to API calls
2. Caching issues preventing data from displaying
3. API query filters being too restrictive

## Fixes Implemented

### 1. Enhanced API Logging

**File:** `src/app/api/v1/people/route.ts`

Added comprehensive logging to track:
- When `companyId` filter is applied
- Full WHERE clause for debugging
- Query results (count and sample data)

```typescript
if (companyId) {
  console.log(`🔍 [V1 PEOPLE API] Filtering by companyId: ${companyId}`);
  where.companyId = companyId;
  console.log(`🔍 [V1 PEOPLE API] Company filter where clause:`, JSON.stringify(where, null, 2));
}
```

**File:** `src/app/api/data/buyer-groups/fast/route.ts`

Added detailed request logging:
- Request URL
- Company ID, Workspace ID, User ID
- Query results breakdown
- Number of members returned

### 2. Frontend Debug Logging

**Files:**
- `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx`
- `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx`

Added logging to track:
- How `companyId` is extracted from record
- API URLs being called
- Parameters being sent
- API responses received

Example:
```typescript
const companyId = React.useMemo(() => {
  if (!record) return '';
  
  if (recordType === 'people') {
    const id = record.companyId || '';
    console.log('🔍 [PEOPLE TAB] Extracted companyId for person record:', id);
    return id;
  } else {
    const id = record.id || '';
    console.log('🔍 [PEOPLE TAB] Using record.id as companyId for company record:', id);
    return id;
  }
}, [record?.id, record?.companyId, recordType]);
```

### 3. Enhanced Error Handling

Added error state display in both tabs showing:
- Clear error messages
- Debug information panel with:
  - Record Type
  - Record ID
  - Company ID
  - Company Name (for Buyer Group tab)
- Instruction to check browser console

**Before:**
- Silent failures with generic "No records found" message

**After:**
- Detailed error states with actionable debug information
- Validation for invalid `companyId` values
- Clear messaging about what went wrong

### 4. Improved Empty State

Updated empty state messages to:
- Differentiate between error states and truly empty data
- Show debug information panel
- Guide users to check browser console for detailed logs

## Testing Instructions

### 1. Open Browser Console

Navigate to the Minnesota Power company page with DevTools open:
```
https://staging.adrata.com/top-temp/companies/minnesota-power-01K9QD382T5FKBSF0AS72RAFAT/
```

### 2. Check People Tab

Expected console logs:
```
🔍 [PEOPLE TAB] Using record.id as companyId for company record: 01K9QD382T5FKBSF0AS72RAFAT
🔍 [PEOPLE TAB] Making API call: /api/v1/people?companyId=01K9QD382T5FKBSF0AS72RAFAT&limit=200&sortBy=updatedAt&sortOrder=desc
```

Expected API response:
- Should show 7 people

### 3. Check Buyer Group Tab

Expected console logs:
```
🔍 [BUYER GROUPS TAB] Using record.id as companyId for company record: 01K9QD382T5FKBSF0AS72RAFAT
🔍 [BUYER GROUPS TAB] Making API call to: /api/data/buyer-groups/fast?companyId=01K9QD382T5FKBSF0AS72RAFAT
```

Expected API response:
- Should show 2 people (Matthew Tryon and Jon Wirtanen)

### 4. Check Server Logs

Look for:
```
🚀 [FAST BUYER GROUPS] Loading buyer group for company: 01K9QD382T5FKBSF0AS72RAFAT
🚀 [FAST BUYER GROUPS] Returning X members to client
```

## Expected Behavior After Fix

### People Tab
- Should display all 7 people associated with Minnesota Power
- 3 with LEAD status
- 4 with PROSPECT status

### Buyer Group Tab
- Should display 2 people with assigned buyer group roles
- Matthew Tryon (Decision Maker)
- Jon Wirtanen (Champion)

## Troubleshooting

If tabs still show no data after these changes:

1. **Check Browser Console** - Look for the debug logs added
   - Verify `companyId` is being extracted correctly
   - Check if API calls are being made
   - Look for any error messages

2. **Check API Responses** - Look for:
   - 200 status codes
   - `success: true` in response
   - `data` array with records

3. **Check Server Logs** - Verify:
   - API requests are reaching the server
   - Queries are executing
   - Data is being returned

4. **Cache Issues** - Try:
   - Hard refresh (Ctrl+Shift+R)
   - Clear localStorage
   - Open in incognito mode

## Files Modified

1. `scripts/audit-minnesota-power-people.js` - NEW audit script
2. `src/app/api/v1/people/route.ts` - Added logging
3. `src/app/api/data/buyer-groups/fast/route.ts` - Added logging
4. `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx` - Added logging and error handling
5. `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx` - Added logging and error handling

## Next Steps

Once the logging reveals the actual issue:

1. If `companyId` is incorrect/missing - Fix the record data loading
2. If API is not being called - Fix the frontend data fetching logic
3. If API returns empty - Investigate database query filters
4. If data is returned but not displayed - Fix the rendering logic

## Related Issues

This fix provides diagnostic tools to identify similar issues with other companies showing missing people/buyer group data.

