# Testing Guide: Company Field Fix

## Overview
This document describes how to test the fix for the missing company field issue on person records.

## Issue Fixed
- **Problem**: Person records with `companyId` but null `company` relation were not displaying the company name
- **Solution**: API now fetches company name directly when relation is null, and frontend has fallback logic

## Test Scenarios

### Scenario 1: Person with companyId but null company relation (Soft-deleted company)

**Steps:**
1. Find a person record that has a `companyId` but the company is soft-deleted
   - You can use: `https://staging.adrata.com/top-temp/people/justin-brunell-01K9QDKNYK00FPWPYRDT3CE8SX/`
   - Or find any person with `companyId` set but company relation is null

2. **Verify API Response:**
   ```bash
   # Test the API endpoint directly
   curl -X GET "https://staging.adrata.com/api/v1/people/01K9QDKNYK00FPWPYRDT3CE8SX" \
     -H "Cookie: your-session-cookie"
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "data": {
       "id": "01K9QDKNYK00FPWPYRDT3CE8SX",
       "companyId": "some-company-id",
       "company": {
         "id": "some-company-id",
         "name": "Company Name",
         "deletedAt": "2024-01-01T00:00:00.000Z" // or null if not deleted
       },
       ...
     }
   }
   ```

   **Check:**
   - ✅ `companyId` is present in response
   - ✅ `company` object is present (even if soft-deleted)
   - ✅ `company.name` is present

3. **Verify Frontend Display:**
   - Navigate to the person's overview tab
   - Check that the "Company" field displays the company name
   - If company is soft-deleted, it should show "Archived" badge

4. **Verify Co-workers Tab:**
   - Navigate to the "Co-workers" tab
   - Tab should render (not be hidden)
   - Should show list of co-workers at the same company

### Scenario 2: Person with companyId and existing company relation

**Steps:**
1. Find a person with an active company relation
2. Verify company name displays correctly
3. Verify co-workers tab renders

**Expected:**
- Company name displays in overview
- Co-workers tab renders and shows people

### Scenario 3: Person without companyId

**Steps:**
1. Find a person without a `companyId`
2. Verify co-workers tab is NOT visible

**Expected:**
- Co-workers tab should be filtered out
- Company field should show "-" or empty

## Manual Verification Script

Run the verification script to check your database:

```bash
node scripts/verify-company-field-fix.js [personId]
```

If no personId is provided, it will find a test case automatically.

## Code Changes Summary

### 1. API Route (`src/app/api/v1/people/[id]/route.ts`)
- Added fallback to fetch company directly when relation is null
- Explicitly includes `companyId` in response
- Handles soft-deleted companies

### 2. Frontend Component (`src/frontend/components/pipeline/tabs/PersonOverviewTab.tsx`)
- Added state to track fetched company name
- Added useEffect to fetch company name when needed
- Updated company extraction logic to use fetched name

### 3. Co-workers Tab (`src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx`)
- Already correctly extracts `companyId` from record
- Works even when company relation is null

## Testing Checklist

- [ ] API returns `companyId` when company relation is null
- [ ] API fetches and includes company name when relation is null
- [ ] Company name displays in PersonOverviewTab
- [ ] Co-workers tab renders when `companyId` exists
- [ ] Co-workers tab is hidden when `companyId` is null
- [ ] Soft-deleted companies show "Archived" badge
- [ ] No console errors in browser
- [ ] No API errors in server logs

## Known Test Case

**Person ID**: `01K9QDKNYK00FPWPYRDT3CE8SX` (Justin Brunell)
- Has `companyId` pointing to Northwestern
- Company relation may be null (soft-deleted)
- Should display company name and show co-workers tab

## Troubleshooting

If company name is still missing:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify `companyId` exists in database
4. Verify company exists in database (even if soft-deleted)
5. Check network tab to see API response

If co-workers tab is not rendering:
1. Verify `companyId` is present in API response
2. Check browser console for errors
3. Verify tab filtering logic in UniversalRecordTemplate

