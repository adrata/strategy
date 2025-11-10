# Ixia Company List Issue - Audit Report

**Date:** 2025-01-XX  
**Issue:** Ixia appears in Speedrun but is missing from company list, and is "precisely listed twice"

## Executive Summary

The issue has **NOT been fixed**. The root cause is a **filtering inconsistency** between the Speedrun and Companies APIs regarding soft-deleted companies.

## Root Cause Analysis

### Current State

1. **Ixia Company Record:**
   - ID: `01K7DT83B8FJS81DQ1P6XET8X2`
   - Status: **SOFT DELETED** (`deletedAt: 2025-10-29T14:09:07.528Z`)
   - `mainSellerId`: NULL (unassigned)
   - Has 3 people assigned to Dan (mainSellerId: `01K7B327HWN9G6KGWA97S1TK43`)

2. **Ixia People Records:**
   - Todd Watkins (globalRank: 26)
   - Greg Short (globalRank: 50)
   - Harry Kuijs (globalRank: 25)
   - All assigned to Dan (`01K7B327HWN9G6KGWA97S1TK43`)
   - All have `deletedAt: null` (active)

### The Problem

**Speedrun API** (`src/app/api/v1/speedrun/route.ts:147-201`):
- Queries people with `deletedAt: null` and `mainSellerId: context.userId`
- **Does NOT filter by `company.deletedAt`**
- Result: Ixia people appear in Speedrun showing "Ixia" as their company name

**Companies API** (`src/app/api/v1/companies/route.ts:180`):
- Filters companies with `deletedAt: null`
- Result: Ixia company does NOT appear in company list (because it's soft-deleted)

### Why "Listed Twice"

The user sees:
1. **Ixia people in Speedrun** - Each person shows "Ixia" as their company (3 people = 3 mentions of Ixia)
2. **Ixia company missing** from company list

This creates the perception that "Ixia" appears multiple times in Speedrun but is missing from the company list.

## Git History Analysis

### Relevant Commits

1. **`4f8d146e`** (Nov 7, 2025): "fix: Filter speedrun to show only user-assigned records"
   - Removed OR condition that included unassigned records
   - Speedrun now only shows records where `mainSellerId = current user`
   - **Did NOT address soft-deleted company filtering**

2. **`4d4e891a`** (Nov 10, 2025): "Refactor speedrun API and table: remove globalRank filter constraints"
   - Removed globalRank filter constraints
   - Added fallback ordering and displayRank support
   - **Did NOT address soft-deleted company filtering**

3. **`063ccb65`** (Oct 6, 2025): "Implement role-based company viewing for Dan vs sellers"
   - Role-based company viewing
   - **Not directly related to this issue**

### Conclusion

**No commits have addressed the soft-deleted company filtering issue in Speedrun.**

## Filtering Logic Comparison

### Speedrun Query (People)
```typescript
// Line 147-153
const peopleFromCompaniesWithPeople = await prisma.people.findMany({
  where: {
    workspaceId: context.workspaceId,
    deletedAt: null,  // ✅ Filters deleted people
    companyId: { not: null },
    mainSellerId: context.userId
    // ❌ MISSING: company.deletedAt filter
  },
  include: {
    company: {
      select: { id: true, name: true }
      // ❌ MISSING: deletedAt check
    }
  }
});
```

### Companies Query
```typescript
// Line 178-185
const where: any = {
  workspaceId: finalWorkspaceId,
  deletedAt: null,  // ✅ Filters deleted companies
  OR: [
    { mainSellerId: context.userId },
    { mainSellerId: null }
  ]
};
```

## Recommended Fix

### Option 1: Filter People by Company Deleted Status (Recommended)

Update the Speedrun people query to exclude people from soft-deleted companies:

```typescript
const peopleFromCompaniesWithPeople = await prisma.people.findMany({
  where: {
    workspaceId: context.workspaceId,
    deletedAt: null,
    companyId: { not: null },
    mainSellerId: context.userId,
    company: {
      deletedAt: null  // ✅ ADD THIS
    }
  },
  // ... rest of query
});
```

### Option 2: Filter in Post-Processing

Filter out people with deleted companies after the query:

```typescript
const peopleFromCompaniesWithPeople = (await prisma.people.findMany({
  // ... existing query
})).filter(person => !person.company?.deletedAt);
```

### Option 3: Restore Soft-Deleted Company

If Ixia should be active, restore it:

```typescript
await prisma.companies.update({
  where: { id: '01K7DT83B8FJS81DQ1P6XET8X2' },
  data: { deletedAt: null }
});
```

## Impact Assessment

### Current Impact
- Users see people from soft-deleted companies in Speedrun
- Company list doesn't show these companies
- Creates confusion and data inconsistency
- May affect reporting and analytics

### After Fix
- Speedrun will only show people from active companies
- Consistent filtering across both endpoints
- Better data integrity

## Verification Steps

1. Run diagnostic script: `node scripts/audit-ixia-issue.js`
2. Check if Ixia people appear in Speedrun
3. Check if Ixia company appears in company list
4. Verify filtering after fix

## Related Files

- `src/app/api/v1/speedrun/route.ts` - Speedrun API endpoint
- `src/app/api/v1/companies/route.ts` - Companies API endpoint
- `scripts/audit-ixia-issue.js` - Diagnostic script
- `scripts/audit-ixia-issue-extended.js` - Extended diagnostic script

## Conclusion

**Status:** Issue NOT fixed  
**Severity:** Medium (data consistency issue)  
**Priority:** Should be fixed to maintain data integrity  
**Root Cause:** Missing `company.deletedAt` filter in Speedrun people query

