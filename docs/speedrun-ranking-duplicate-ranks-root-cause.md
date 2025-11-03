# Speedrun Ranking Duplicate Ranks Root Cause Analysis

## Problem Summary
Multiple records showing rank "1" (and potentially other duplicate ranks) in the Speedrun table.

## Root Cause Identified

### Issue 1: Separate Ranking Sequences for Companies and People
**Location**: `src/app/api/v1/speedrun/re-rank/route.ts`

**Problem**: The re-ranking API ranks companies and people in **separate, independent sequences**:
- Companies get ranks: 1, 2, 3, ..., N (where N = number of companies)
- People get ranks: 1, 2, 3, ..., M (where M = number of people)

**Code Evidence**:
```typescript
// Line 215-220: Companies ranked sequentially starting at 1
for (let i = 0; i < sortedCompanies.length; i++) {
  await prisma.companies.update({
    where: { id: company.id },
    data: { globalRank: i + 1 }  // ✅ Companies: 1, 2, 3, ...
  });
}

// Line 253-290: People ranked sequentially starting at 1
let globalPersonRank = 1;
for (const [companyName, companyPeople] of sortedPeopleByCompany) {
  for (const person of sortedCompanyPeople) {
    rankedPeople.push({
      ...person,
      globalRank: globalPersonRank,  // ✅ People: 1, 2, 3, ...
    });
    globalPersonRank++;
  }
}
```

**Result**: Both companies and people can have `globalRank = 1`, `globalRank = 2`, etc.

### Issue 2: Speedrun API Combines Both Sequences
**Location**: `src/app/api/v1/speedrun/route.ts`

**Problem**: The Speedrun API queries both companies and people with `globalRank: { not: null, gte: 1, lte: 50 }` and combines them:

```typescript
// Line 116-149: Get companies with globalRank 1-50
const companiesWithoutPeople = await prisma.companies.findMany({
  where: {
    globalRank: { not: null, gte: 1, lte: 50 },  // ✅ Gets companies with rank 1-50
  },
  orderBy: { globalRank: 'asc' }
});

// Line 152-201: Get people with globalRank 1-50
const peopleFromCompaniesWithPeople = await prisma.people.findMany({
  where: {
    globalRank: { not: null, gte: 1, lte: 50 },  // ✅ Gets people with rank 1-50
  },
  orderBy: { globalRank: 'asc' }
});

// Line 234: Combine both arrays
allRecords.sort((a, b) => a.globalRank - b.globalRank);  // ❌ Multiple records with same rank!
```

**Result**: When sorting by `globalRank`, you get:
- Rank 1: Company A
- Rank 1: Company B  
- Rank 1: Person C
- Rank 2: Company D
- Rank 2: Person E
- etc.

### Issue 3: Initial Ranking Script Bug (Potential Secondary Issue)
**Location**: `scripts/create-unified-speedrun-ranking.js` (line 99)

**Problem**: Uses `indexOf()` which could theoretically cause issues if records are duplicated in the array:

```javascript
data: { globalRank: top50Records.indexOf(record) + 1 }
```

However, this is less likely to be the primary cause since records should be unique objects.

## Evidence from Database Query

The diagnostic script found:
- **8 companies** with `globalRank = 1`
- **1 person** with `globalRank = 1`

This confirms that companies and people have overlapping rank sequences.

## Why This Happened

1. **Re-ranking API Design Flaw**: The API was designed to rank companies and people separately, assuming they would be displayed separately
2. **Speedrun API Combines Both**: The Speedrun API combines both into a unified list, exposing the duplicate ranks
3. **No Uniqueness Constraint**: There's no database constraint preventing duplicate ranks across different entity types
4. **Initial Ranking**: When records were initially ranked, companies and people were assigned ranks independently

## Solution Required

The re-ranking API needs to be updated to assign **unified, sequential ranks** across both companies and people:
1. Combine companies and people into a single list
2. Sort by priority (people first, then companies)
3. Assign sequential ranks 1-50 (or 1-N) to the combined list
4. Ensure no duplicate ranks exist

This matches the fix script (`fix-speedrun-ranking-dano.ts`) which already implements this correctly.

## Prevention

1. Add validation to prevent duplicate ranks in the same workspace/user scope
2. Update re-ranking API to use unified ranking logic
3. Add database constraint (if possible) or application-level validation
4. Update all ranking scripts to use unified ranking approach

