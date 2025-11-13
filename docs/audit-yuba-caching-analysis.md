# YUBA Water Agency - Caching Analysis

## Overview

Analysis of frontend and API caching mechanisms that could explain why people weren't initially displayed but later populated.

## Frontend Caching System

### Location
`src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx` (lines 263-320)

### Cache Keys

#### 1. Company-Specific Cache
```typescript
const companyCacheKey = `people-company-${companyId}-v1`;
```

**Configuration**:
- **Storage**: `localStorage`
- **TTL**: 5 minutes (300,000ms)
- **Scope**: All people for specific company
- **Purpose**: Fast company page loads

**Access Pattern**:
```typescript
const cachedCompanyData = safeGetItem(companyCacheKey, 5 * 60 * 1000);
if (cachedCompanyData && Array.isArray(cachedCompanyData)) {
  if (cachedCompanyData.some(p => p.companyId === companyId)) {
    peopleData = cachedCompanyData;
    console.log('📦 [PEOPLE] Using company-specific cached data');
  }
}
```

#### 2. General People Cache
```typescript
const cacheKey = `people-${companyId}-${user.id}-v1`;
```

**Configuration**:
- **Storage**: `localStorage`
- **TTL**: 2 minutes (120,000ms)
- **Scope**: People for specific company + user combination
- **Purpose**: User-specific caching

**Access Pattern**:
```typescript
const cachedData = safeGetItem(cacheKey, 2 * 60 * 1000);
if (cachedData) {
  peopleData = cachedData;
  console.log('📦 [PEOPLE] Using cached people data');
}
```

### Cache Storage Format

Only essential fields are cached to reduce storage size:

```typescript
const essentialData = peopleData.map(person => ({
  id: person.id,
  fullName: person.fullName,
  firstName: person.firstName,
  lastName: person.lastName,
  company: person.company,
  companyId: person.companyId,
  jobTitle: person.jobTitle,
  email: person.email
}));

safeSetItem(cacheKey, essentialData);
```

**Missing Fields**:
- `mainSellerId` - NOT cached ⚠️
- `buyerGroupRole` - NOT cached
- `status` - NOT cached
- `updatedAt` - NOT cached

### Cache Invalidation

**Automatic Invalidation**:
- After TTL expires (2-5 minutes)
- When `companyId` changes
- When `user.id` changes

**No Manual Invalidation**:
- No cache clear on data updates
- No cache versioning beyond `-v1` suffix
- No invalidation when seller assignments change

## API Caching System

### Location
`src/app/api/v1/people/route.ts` (lines 137-1250)

### Cache Key
```typescript
const cacheKey = `people-${context.workspaceId}-${context.userId}-${section}-${status}-${excludeCompanyId}-${includeAllUsers}-${isPartnerOS}-${limit}-${page}`;
```

**Note**: Does NOT include `companyId` in the cache key! ⚠️

### Cache Configuration

**Storage**: Redis (via custom cache utility)
**TTLs**:
- Speedrun section: `SPEEDRUN_CACHE_TTL` (shorter)
- People section: `PEOPLE_CACHE_TTL` (longer)

**Access Pattern**:
```typescript
if (!forceRefresh) {
  try {
    const result = await cache.get(cacheKey, fetchPeopleData, {
      ttl: section === 'speedrun' ? SPEEDRUN_CACHE_TTL : PEOPLE_CACHE_TTL,
      priority: 'high',
      tags: ['people', section, context.workspaceId, context.userId]
    });
    console.log(`⚡ [PEOPLE API] Cache hit - returning cached data`);
    return NextResponse.json(result);
  } catch (error) {
    // Cache corruption handling
  }
}
```

### Force Refresh
```typescript
const forceRefresh = searchParams.get('refresh') === 'true';
```

**Usage**: Add `?refresh=true` to API URL to bypass cache

## Cache Hierarchy

### Request Flow with Caching

```
1. UniversalPeopleTab mounts
   ↓
2. Check company-specific cache (5 min TTL)
   ├─ HIT: Use cached data, skip API
   └─ MISS: Continue to next cache
      ↓
3. Check general people cache (2 min TTL)
   ├─ HIT: Use cached data, skip API
   └─ MISS: Make API call
      ↓
4. API checks Redis cache
   ├─ HIT: Return cached data
   └─ MISS: Query database
      ↓
5. Cache response in both layers
   ├─ Redis (API layer)
   └─ localStorage (Frontend layer)
```

## Identified Cache Issues

### Issue #1: Missing companyId in API Cache Key ⚠️

**API Cache Key**:
```
people-{workspaceId}-{userId}-{section}-{status}-{excludeCompanyId}-{includeAllUsers}-{isPartnerOS}-{limit}-{page}
```

**Problem**: When API is called with `?companyId=01K7DW5DX...`, the `companyId` parameter is NOT part of the cache key!

**Impact**:
- First request: `?companyId=COMPANY_A` → cached with generic key
- Second request: `?companyId=COMPANY_B` → returns COMPANY_A's data from cache ❌
- Cache collision between different companies

**Evidence**: This is a CRITICAL BUG that could cause wrong data to be returned!

### Issue #2: Frontend Cache Doesn't Include mainSellerId

**Cached Data**:
```typescript
{
  id, fullName, firstName, lastName, 
  company, companyId, jobTitle, email
}
```

**Missing**: `mainSellerId`

**Problem**: If seller assignment changes in database:
- Frontend cache still has old data (without mainSellerId)
- API would return updated data with new mainSellerId
- But frontend serves stale cache and never makes API call
- User sees old data until cache expires

**Scenario**:
1. User loads page when Warren has no mainSeller
2. API returns empty (filtered out)
3. Frontend caches empty result
4. Script assigns Victoria as mainSeller
5. User refreshes - frontend serves empty cache
6. After 2-5 minutes, cache expires
7. Fresh API call returns Warren with Victoria
8. User sees "later populated"

### Issue #3: Long TTL with Critical Data Changes

**TTLs**:
- Company-specific: 5 minutes
- General people: 2 minutes
- API Redis: Unknown (likely longer)

**Problem**: During active data migration or seller assignment:
- Script updates database
- Caches retain old data for minutes
- Users see inconsistent state

### Issue #4: No Cache Invalidation on Updates

When seller assignment script runs:
- Database updated instantly
- API cache NOT invalidated
- Frontend cache NOT invalidated
- Users see stale data until TTL expires

**Missing Invalidation Events**:
- Seller assignment changes
- People import/update
- Company changes
- Status changes

### Issue #5: Race Condition with Empty Companyld

```typescript
const companyId = record?.id || record?.companyId;

// If record is undefined initially...
const cacheKey = `people-${companyId}-${user.id}-v1`;
// Results in: `people-undefined-01K75ZD7...-v1`
```

**Problem**:
1. Component mounts before record loads
2. `companyId` is undefined
3. Cache key created with "undefined"
4. API called with `companyId=undefined`
5. Returns empty/error
6. Empty result cached with broken key
7. Record loads with valid ID
8. New cache key with real companyId
9. Cache miss → fresh API call succeeds
10. User sees "later populated"

## Cache Timing Analysis

### Scenario: User Reports "Not Initially Displaying"

**Timeline Reconstruction**:

**Nov 12, 2025 - 17:50 UTC**:
- 3 new people added with NULL mainSeller
- If Victoria visited page here, she would see only 16 people
- These 3 cached in frontend (5 min TTL) and API

**Nov 12, 2025 - 17:51 UTC** (hypothetical):
- Victoria loads YUBA Water Agency page
- Frontend checks cache: MISS (new company for her)
- API call: Returns 16 people (3 new ones have NULL, pass filter)
- Frontend caches 16 people for 5 minutes
- Displays 16 people ✓

**Nov 12, 2025 - 22:03-22:09 UTC**:
- Seller assignment script runs
- Updates all people to Victoria
- **Cache NOT invalidated**
- Victoria's cached data still shows 16 people

**Nov 12, 2025 - 22:10 UTC**:
- Victoria refreshes page
- Frontend cache: HIT (still valid, 5 min from 17:51 = 17:56)
- Displays cached 16 people ❌
- Expects 19 people ❌

**Nov 12, 2025 - 22:56 UTC**:
- Frontend cache expires (5 min from last load)
- Victoria visits page again
- Cache MISS
- Fresh API call
- Returns all 19 people ✓
- "Later populated" ✓

### Scenario: Wrong Company ID in URL

**Timeline**:

**Initial Load**:
- URL: `/companies/yuba-water-agency-01K9QD502AV44DR2XSE80WHTWQ` (wrong ID)
- Extract ID: `01K9QD502AV44DR2XSE80WHTWQ`
- Record lookup: FAIL (ID doesn't exist)
- `record` is undefined
- `companyId` is undefined
- Cache key: `people-undefined-{userId}-v1`
- API call: `/api/v1/people?companyId=undefined`
- API returns empty or error
- Frontend caches empty result with broken key
- Displays "No people" ❌

**After Correction**:
- URL corrected: `/companies/yuba-water-agency-01K7DW5DX...` (correct ID)
- Extract ID: `01K7DW5DX0WBRYZW0K5VHXHAK1`
- Record lookup: SUCCESS
- `companyId` is valid
- Cache key: `people-01K7DW5DX0WBRYZW0K5VHXHAK1-{userId}-v1`
- Cache MISS (different key)
- Fresh API call with correct ID
- Returns all 19 people
- "Later populated" ✓

## Evidence from URL

**Reported URL**:
```
https://action.adrata.com/toptemp/companies/yuba-water-agency-01K9QD502AV44DR2XSE80WHTWQ/
```

**Extracted ID**: `01K9QD502AV44DR2XSE80WHTWQ`

**Database ID**: `01K7DW5DX0WBRYZW0K5VHXHAK1`

**Mismatch Confirmed**: ✅ IDs are different

This explains:
- Initial page load uses wrong ID
- No record found
- Empty people list
- Later (with correct URL/ID), data loads fine

## Root Cause Determination

Based on caching analysis, the most likely root cause is:

### Primary Cause: Wrong Company ID in URL
- URL contains `01K9QD502AV44DR2XSE80WHTWQ`
- Database has `01K7DW5DX0WBRYZW0K5VHXHAK1`
- Wrong ID → no data
- Correct ID → data loads

### Contributing Factors:
1. **No error feedback** when ID doesn't match
2. **Silent failure** with undefined companyId
3. **Caching empty results** prolongs the issue
4. **Long TTL** delays correction

### NOT the Root Cause:
- ❌ Seller ownership (Victoria IS assigned)
- ❌ API filtering (filter is correct)
- ❌ Database missing data (all 19 people exist)

## Recommendations

### 1. Fix API Cache Key to Include companyId
```typescript
const cacheKey = `people-${context.workspaceId}-${context.userId}-${companyId}-${section}-${status}-${limit}-${page}`;
```

### 2. Validate companyId Before Caching
```typescript
if (!companyId || companyId === 'undefined') {
  console.warn('[PEOPLE] Invalid companyId, skipping cache');
  setLoading(false);
  return;
}
```

### 3. Add Cache Invalidation on Seller Assignment
```typescript
// In seller assignment script
await cache.deletePattern(`people-${workspaceId}-*`);
```

### 4. Include mainSellerId in Cached Data
```typescript
const essentialData = peopleData.map(person => ({
  // ... existing fields ...
  mainSellerId: person.mainSellerId, // ADD THIS
}));
```

### 5. Add URL Validation
```typescript
// In PipelineDetailPage
const recordId = extractIdFromSlug(slug);
if (!recordId || recordId === 'undefined') {
  return <ErrorPage message="Invalid company ID in URL" />;
}
```

### 6. Reduce TTL During Active Data Migration
When running maintenance scripts:
- Reduce cache TTL to 30 seconds
- Or clear all caches before running
- Or run during off-hours

## Conclusion

**Cache System Health**: ⚠️ HAS ISSUES

The caching system has several bugs that could cause the reported behavior:
1. API cache key missing companyId (critical bug)
2. Frontend caching undefined companyId values
3. No cache invalidation on seller assignment changes
4. Long TTL masks underlying data issues

**Most Likely Scenario**: Wrong company ID in URL combined with aggressive caching of the failed lookup result.

