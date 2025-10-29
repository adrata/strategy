# Speedrun Ranking Analysis

## Current Implementation

### Overview
The speedrun ranking system currently combines companies and people into a unified ranking system based on `globalRank` (1-50).

### Current Behavior

**Location**: `src/app/api/v1/speedrun/route.ts`

1. **Companies without people**:
   - Queried with `globalRank: { not: null, gte: 1, lte: 50 }`
   - Only companies with 0 people (`people: { none: {} }`)
   - Ordered by `globalRank: 'asc'`

2. **People with companies**:
   - Queried with `globalRank: { not: null, gte: 1, lte: 50 }`
   - Only people with `companyId: { not: null }`
   - Ordered by `globalRank: 'asc'`

3. **Combined Ranking**:
   - Both arrays are combined: `[...companiesWithoutPeople, ...peopleFromCompaniesWithPeople]`
   - Sorted by `globalRank` ascending
   - Limited to top 50: `.slice(0, 50)`

### Ranking Algorithm Reference

**Location**: `src/products/speedrun/ranking.ts`

The ranking algorithm uses a hierarchical system:
- **Companies ranked 1-400** by value and potential
- **People ranked 1-4000 within each company**
- Final ranking combines company score (60%) + individual score (40%)

However, the speedrun API currently uses `globalRank` directly from the database rather than recalculating using this algorithm.

## Desired Behavior

Based on requirements:

1. **People ranked first** (top 50):
   - People should be ranked 1-50
   - People ranked within their company
   - Example: Person 1 (Company 1), Person 2 (Company 1), Person 3 (Company 2)

2. **Companies ranked lower** (after top 50 people):
   - Companies should not appear in top 50
   - Companies should be ranked after people
   - Example: After Person 1-50, then Company 51, Company 52, etc.

### Example Desired Output:
```
Rank 1: Person 1 (Company 1)
Rank 2: Person 2 (Company 1)
Rank 3: Person 3 (Company 2)
Rank 4: Company 3 (no people)
Rank 5: Person 4 (Company 4)
...
Rank 50: Person 50 (Company X)
Rank 51: Company Y (no people)
Rank 52: Company Z (no people)
```

## Implementation Changes Needed

### Option 1: Modify Speedrun API Query Logic

1. **Query people first** (top 50):
   - Get people with `globalRank: { not: null, gte: 1, lte: 50 }`
   - Group by company and rank within company
   - Take top 50 people

2. **Query companies separately** (after top 50):
   - Get companies with `globalRank: { not: null, gte: 51 }` OR
   - Get all companies with 0 people, rank them separately
   - Limit to reasonable number (e.g., next 50)

3. **Combine results**:
   - People first (ranks 1-50)
   - Companies second (ranks 51+)

### Option 2: Modify Ranking Algorithm

Modify the ranking system to:
1. Calculate people ranks first (1-50)
2. Calculate company ranks starting from 51+
3. Ensure people are ranked within their company

## Current Ranking Logic Gaps

1. **No within-company ranking**: Currently people are ranked globally, not within their company
2. **Companies mixed with people**: Companies can appear in top 50 alongside people
3. **No explicit priority**: No clear rule that people always rank higher than companies

## Recommendations

1. **Immediate fix**: Modify speedrun API to:
   - Query people first (top 50)
   - Query companies separately (ranks 51+)
   - Ensure people are ordered by company, then by rank within company

2. **Long-term fix**: Update ranking algorithm to:
   - Explicitly rank people first (1-50)
   - Rank companies after people (51+)
   - Implement within-company ranking for people

## Files to Modify

1. `src/app/api/v1/speedrun/route.ts` - Modify query logic to separate people and companies
2. `src/products/speedrun/ranking.ts` - Potentially update ranking algorithm for within-company ranking

