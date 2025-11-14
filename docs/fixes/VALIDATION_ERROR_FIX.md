# Validation Error Fix - 400 Bad Request

## Issue Discovered

Browser console showed:
```
❌ API call failed: /api/v1/people?companyId=...&sortBy=updatedAt&sortOrder=desc&includeAllUsers=true
Status: 400
```

## Root Cause

The People API was rejecting requests with **400 Bad Request** because:
- API call used `sortBy=updatedAt` parameter
- API only allows these sort fields: `['globalRank', 'fullName', 'firstName', 'lastName', 'email', 'jobTitle', 'lastActionDate', 'createdAt', 'status', 'priority']`
- `updatedAt` is NOT in the valid fields list

**Source:** `src/app/api/v1/people/route.ts` line 111

## Fix Applied

**File:** `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx` (line ~312)

Changed from:
```typescript
const apiUrl = `/api/v1/people?companyId=${companyId}&limit=200&sortBy=updatedAt&sortOrder=desc&includeAllUsers=true`;
```

To:
```typescript
const apiUrl = `/api/v1/people?companyId=${companyId}&limit=200&sortBy=createdAt&sortOrder=desc&includeAllUsers=true`;
```

Using `createdAt` instead of `updatedAt` for sorting.

## Status

✅ Fix applied
⏳ Ready for testing

Next step: Hard refresh browser and test again.

