# Company Association Debugging Guide

## Current Issue
1. Company creates successfully (appears in company list)
2. No success message appears
3. Company appears on record but not in breadcrumb
4. Company disappears after refresh (association not persisting)

## What This Means
The company creation works, but the PATCH request to associate it with the person is either:
- Not being called
- Failing silently
- Returning an error that's not being shown

## Debug Steps

### 1. Open Browser Console
Open the record where you want to add a company: http://localhost:3000/ne/leads/bill-primo-01K815H9AZJ8C7XHN9GP69Q90R

### 2. Check Console Logs
When you click "Add Company" and create a company, look for these log messages:

```
🔄 [UNIVERSAL] Updating record with company: { recordId, recordType, updateData, newCompany }
🔍 [UNIVERSAL] API call details: { url, method, updateData, responseData, ... }
✅ [UNIVERSAL] Company association response: {...}
```

### 3. Expected Behavior

**If successful:**
- You should see: `✅ [UNIVERSAL] Company association response:` with `success: true`
- Success message should appear
- Company should persist after refresh

**If failing:**
- You should see: `❌ [UNIVERSAL] Error associating company:` with error details
- Error message should appear
- Company won't persist after refresh

### 4. Common Issues

**Issue: No API call logs**
- The `handleCompanyAdded` function might not be called
- Check if modal is properly connected

**Issue: API returns error**
- Check server logs for database errors
- Verify person exists and has correct workspaceId
- Check if companyId is valid

**Issue: API succeeds but company doesn't persist**
- Check database directly
- Verify transaction committed
- Check if there's a foreign key constraint issue

### 5. Manual Test

Run this in browser console:
```javascript
// Test the association directly
async function testAssociation() {
  const response = await fetch('/api/v1/people/01K815H9AZJ8C7XHN9GP69Q90R', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company: 'Testers' })
  });
  const data = await response.json();
  console.log('Direct API test:', data);
}
testAssociation();
```

This will tell us if the API endpoint is working at all.

### 6. Next Steps Based on Results

**If API test succeeds:**
- The issue is in the UI logic
- Check if `handleCompanyAdded` is being called
- Check if modal callback is connected

**If API test fails:**
- The issue is in the backend
- Check server logs for detailed error
- Verify database schema and constraints
- Check if person record is valid

