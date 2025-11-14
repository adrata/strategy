# YUBA Water Agency - Complete Audit Report

**Date**: November 13, 2025  
**Auditor**: AI Assistant  
**Issue**: People and buyer group members not initially displaying on company page, but later populated  
**Company**: YUBA Water Agency  
**User**: Victoria Leland (vleland@topengineersplus.com)  
**Workspace**: TOP Engineering Plus (top-temp)

---

## Executive Summary

Comprehensive audit of YUBA Water Agency company page revealing **the primary root cause is a wrong company ID in the reported URL**, combined with several caching and validation bugs that amplify the impact of such errors.

**Database Status**: ✅ All data is correct and properly assigned  
**Seller Ownership**: ✅ Victoria is correctly assigned  
**API Logic**: ✅ Filtering logic works as designed  
**Code Flow**: ⚠️ Multiple validation gaps allow silent failures  
**Caching**: ❌ Critical bugs in cache key generation

---

## Investigation Summary

### Phase 1: Database Verification ✅

**Audit Script**: `scripts/audit-yuba-water-agency.js`

#### Key Findings

**YUBA Water Agency Company**:
- **Database ID**: `01K7DW5DX0WBRYZW0K5VHXHAK1`
- **Name**: Yuba Water Agency
- **Main Seller**: Victoria Leland ✅
- **Status**: ACTIVE
- **Priority**: MEDIUM

**People at YUBA Water Agency**: 19 total
- **16 people** with Victoria as mainSeller ✅
- **3 people** with NULL mainSeller ⚠️
  - Aaron Esselman (Senior Hydro Engineer Mechanical)
  - David DeVore (Information Systems And Security Manager)
  - Keane Sommers (Director Of Power Systems)
  - All added Nov 12, 2025 at 17:50 UTC

**Warren Frederickson** (Reported Prospect):
- **Status**: FOUND ✅
- **Main Seller**: Victoria Leland ✅
- **Company ID**: Matches YUBA Water Agency ✅
- **Status**: LEAD
- **Job Title**: Communications Technician Supervisor
- **Buyer Group Role**: Champion
- **Last Updated**: Nov 12, 2025 at 22:09:54 UTC

**API Filter Simulation**:
```sql
WHERE mainSellerId = Victoria.id OR mainSellerId IS NULL
```
**Result**: All 19 people WOULD be returned by API ✅

**Workspace-Wide Stats**:
- Total People: 2,469
  - Victoria's: 1,917 (77.6%)
  - Unassigned: 552 (22.4%)
  - Other Sellers: 0 (0.0%)
- Total Companies: 342
  - Victoria's: 342 (100.0%)
  - No other sellers in workspace

**Conclusion**: Database is healthy, all data exists and is properly assigned.

---

### Phase 2: Code Flow Analysis ⚠️

**Documentation**: `docs/audit-yuba-code-flow-analysis.md`

#### Critical Discovery: Wrong Company ID in URL ❌

**Reported URL**:
```
https://action.adrata.com/toptemp/companies/yuba-water-agency-01K9QD502AV44DR2XSE80WHTWQ/
```

**URL Company ID**: `01K9QD502AV44DR2XSE80WHTWQ` ❌  
**Database Company ID**: `01K7DW5DX0WBRYZW0K5VHXHAK1` ✅

**Impact**: The IDs are DIFFERENT! This is the PRIMARY ROOT CAUSE.

#### Data Loading Flow

```
1. URL: /companies/yuba-water-agency-01K9QD502AV44DR2XSE80WHTWQ
   ↓
2. extractIdFromSlug() extracts: 01K9QD502AV44DR2XSE80WHTWQ
   ↓
3. PipelineDetailPage loads companies list
   ↓
4. Find record with ID: 01K9QD502AV44DR2XSE80WHTWQ
   ↓
5. Record NOT FOUND (ID doesn't exist in database)
   ↓
6. record = undefined
   ↓
7. UniversalPeopleTab receives record = undefined
   ↓
8. companyId = undefined
   ↓
9. API call: /api/v1/people?companyId=undefined
   ↓
10. Returns empty or error
   ↓
11. User sees "No people" ❌
```

#### Code Flow Issues

**Issue 1**: No validation that extracted ID matches a real record
```typescript
// src/frontend/components/pipeline/PipelineDetailPage.tsx
const recordId = extractIdFromSlug(slug);
const record = currentSectionData?.find(r => r.id === recordId);
// record can be undefined - no error shown!
```

**Issue 2**: No error handling for undefined companyId
```typescript
// src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx
const companyId = record?.id || record?.companyId;
// If record is undefined, companyId is undefined - continues anyway!
```

**Issue 3**: API accepts undefined companyId without error
```typescript
// API call with undefined companyId
await authFetch(`/api/v1/people?companyId=undefined&limit=200`);
// Server doesn't reject this, returns empty or all people
```

---

### Phase 3: Seller Ownership Analysis ✅

**Documentation**: `docs/audit-yuba-seller-ownership.md`

#### Verification Results

**Victoria Assignment**: CORRECT ✅
- Company: Victoria is main seller ✅
- Warren Frederickson: Victoria is main seller ✅
- 16 other people: Victoria is main seller ✅
- 3 new people: NULL (but still visible via API filter) ✅

#### Timeline Evidence

**Nov 12, 2025 - 17:50 UTC**:
- 3 new people added with NULL mainSeller

**Nov 12, 2025 - 22:03-22:09 UTC**:
- **Bulk update of 16 people records**
- All timestamps updated simultaneously
- Strong evidence of `set-victoria-main-seller-top.js` script execution
- Warren Frederickson updated at 22:09:54 UTC

#### Script Analysis

The Victoria assignment script performs bulk updates:
```javascript
await prisma.people.updateMany({
  where: { 
    workspaceId: workspace.id,
    OR: [
      { mainSellerId: null },
      { mainSellerId: { not: victoria.id } }
    ]
  },
  data: { 
    mainSellerId: victoria.id,
    updatedAt: new Date()
  }
});
```

**Timing**: If this script ran during active user session, it could cause:
1. User loads page with pre-script data
2. Cache stores that data
3. Script updates database
4. User still sees cached old data
5. Cache expires
6. Fresh data loads → "later populated"

**Conclusion**: Seller ownership is NOT the issue. Configuration is correct.

---

### Phase 4: Caching Investigation ❌

**Documentation**: `docs/audit-yuba-caching-analysis.md`

#### Cache Architecture

**Frontend Caching** (`localStorage`):
1. Company-specific cache: `people-company-${companyId}-v1` (5 min TTL)
2. General people cache: `people-${companyId}-${user.id}-v1` (2 min TTL)

**API Caching** (Redis):
- Cache key: `people-${workspaceId}-${userId}-${section}-${status}-...`
- **CRITICAL BUG**: Does NOT include `companyId` in key! ❌

#### Identified Cache Bugs

**Bug #1: API Cache Key Missing companyId** ❌ CRITICAL
```typescript
// Current (WRONG):
const cacheKey = `people-${workspaceId}-${userId}-${section}-${status}-${limit}-${page}`;

// When called with different companyIds:
// /api/v1/people?companyId=COMPANY_A  → Cache: people-workspace-user-people-...
// /api/v1/people?companyId=COMPANY_B  → Cache: people-workspace-user-people-...
// Same cache key! Returns COMPANY_A's data for COMPANY_B! ❌
```

**Impact**: Different companies can get each other's cached data!

**Bug #2: Frontend Caches undefined companyId** ❌
```typescript
const cacheKey = `people-${companyId}-${user.id}-v1`;
// If companyId is undefined:
// Cache key: "people-undefined-01K75ZD7NKC33EDSDADF5X0WD7-v1"
// Stores empty results under broken key
```

**Bug #3: Missing mainSellerId in Cached Data** ⚠️
```typescript
const essentialData = peopleData.map(person => ({
  id, fullName, firstName, lastName,
  company, companyId, jobTitle, email
  // mainSellerId NOT included!
}));
```

**Impact**: If seller assignment changes, cache doesn't reflect it.

**Bug #4: No Cache Invalidation** ⚠️
- Seller assignment scripts update database
- Caches NOT cleared
- Users see stale data until TTL expires (2-5 minutes)

**Bug #5: Long TTL During Data Migration** ⚠️
- TTL: 2-5 minutes
- During active script execution, users see inconsistent state

#### Cache Timing Scenario

**Most Likely Timeline**:

**User's First Visit** (hypothetical earlier time):
- Visits with wrong URL: `/companies/yuba-water-agency-01K9QD502AV44DR2XSE80WHTWQ`
- Extracts wrong ID
- Record not found
- `companyId = undefined`
- Cache key: `people-undefined-{userId}-v1`
- API returns empty
- Frontend caches empty result
- **Sees: No people** ❌

**User's Later Visit** (after correction):
- Visits with correct URL or ID fixed
- Extracts correct ID: `01K7DW5DX0WBRYZW0K5VHXHAK1`
- Record found
- `companyId = 01K7DW5DX0WBRYZW0K5VHXHAK1`
- Cache key: `people-01K7DW5DX0WBRYZW0K5VHXHAK1-{userId}-v1`
- Cache MISS (different key!)
- Fresh API call with correct ID
- Returns all 19 people
- **Sees: All people** ✅
- **User reports: "Later populated"** ✓

---

## Root Cause Analysis

### PRIMARY ROOT CAUSE ❌

**Wrong Company ID in URL**

**Evidence**:
- URL contains: `01K9QD502AV44DR2XSE80WHTWQ`
- Database contains: `01K7DW5DX0WBRYZW0K5VHXHAK1`
- IDs are different ULIDs
- Wrong ID → no record found → no people displayed

**How It Happens**:
1. URL is generated or typed with wrong company ID
2. `extractIdFromSlug` extracts the wrong ID
3. Record lookup fails silently
4. `record` prop is undefined
5. `companyId` is undefined
6. API call fails or returns empty
7. Empty result cached
8. User sees "no people"

**Why It "Fixed Itself"**:
1. User navigated using different link/route with correct ID
2. Or URL was manually corrected
3. Different cache key used
4. Fresh API call with correct ID succeeds
5. Data appears → "later populated"

### CONTRIBUTING FACTORS

**Factor 1: No Error Feedback** ⚠️
- System fails silently when ID is wrong
- No error message shown to user
- No indication that company wasn't found

**Factor 2: Undefined Value Propagation** ⚠️
- `companyId = undefined` is allowed to propagate
- No validation at component boundaries
- API accepts `companyId=undefined` without rejection

**Factor 3: Caching Amplifies Impact** ❌
- Wrong result gets cached
- Cache has long TTL (2-5 minutes)
- Cache key includes wrong/undefined value
- Bug persists until cache expires or different URL used

**Factor 4: API Cache Key Bug** ❌ CRITICAL
- Missing `companyId` in API cache key
- Can return wrong company's data
- Unrelated to this specific issue, but dangerous

### NOT ROOT CAUSES

**✅ Seller Ownership**: Victoria IS correctly assigned  
**✅ API Filtering**: Filter logic is correct  
**✅ Database Data**: All 19 people exist and are accessible  
**✅ Warren Frederickson**: He exists with correct assignment  
**✅ Buyer Group Assignment**: Properly configured

---

## Impact Assessment

### Severity: HIGH ⚠️

**User Impact**:
- Users see empty data when they expect to see people
- No error message explains the problem
- Issue appears intermittent (works sometimes, not others)
- Creates confusion and loss of trust in system

**Data Integrity**: Not affected (database is correct)

**Security**: Not affected (no unauthorized access)

**Frequency**: 
- Occurs whenever wrong URL is used
- Can happen from:
  - Bookmarked URLs with old IDs
  - Shared links from before company ID changes
  - Programmatically generated URLs with bugs
  - Copy/paste errors

---

## Recommendations

### CRITICAL FIXES (Implement Immediately)

#### 1. Fix API Cache Key to Include companyId ❌ CRITICAL

**File**: `src/app/api/v1/people/route.ts`

**Current Code** (line ~137):
```typescript
const cacheKey = `people-${context.workspaceId}-${context.userId}-${section}-${status}-${excludeCompanyId}-${includeAllUsers}-${isPartnerOS}-${limit}-${page}`;
```

**Fixed Code**:
```typescript
const cacheKey = `people-${context.workspaceId}-${context.userId}-${companyId || 'all'}-${section}-${status}-${excludeCompanyId}-${includeAllUsers}-${isPartnerOS}-${limit}-${page}`;
```

**Priority**: CRITICAL  
**Impact**: Prevents cross-company data leakage in cache  
**Risk**: HIGH - Current bug could show Company A's people to Company B

#### 2. Validate Company ID and Show Error

**File**: `src/frontend/components/pipeline/PipelineDetailPage.tsx`

**Add After ID Extraction** (line ~155):
```typescript
const recordId = extractIdFromSlug(slug);

// VALIDATION: Check if ID is valid
if (!recordId || recordId === 'undefined' || recordId === 'null') {
  return (
    <ErrorState
      title="Invalid Company ID"
      message="The URL contains an invalid company identifier. Please check the link and try again."
      action={{
        label: "Go to Companies List",
        onClick: () => router.push(`/${workspaceSlug}/companies`)
      }}
    />
  );
}

// Load section data
const currentSectionHook = useFastSectionData(section, limit);
const { data: currentSectionData, loading: currentSectionLoading } = currentSectionHook;

// Find record
const record = currentSectionData?.find(r => r.id === recordId);

// VALIDATION: Check if record was found
if (!loading && !record && currentSectionData?.length > 0) {
  return (
    <ErrorState
      title="Company Not Found"
      message={`Could not find company with ID: ${recordId}`}
      details="This company may have been deleted or the URL may be incorrect."
      action={{
        label: "Go to Companies List",
        onClick: () => router.push(`/${workspaceSlug}/companies`)
      }}
    />
  );
}
```

**Priority**: HIGH  
**Impact**: Users see helpful error instead of silent failure  
**Risk**: LOW - Improves UX

#### 3. Validate companyId in UniversalPeopleTab

**File**: `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx`

**Add Before API Call** (line ~151):
```typescript
useEffect(() => {
  const fetchPeople = async () => {
    console.log('🔍 [PEOPLE DEBUG] Starting fetchPeople');
    console.log('🔍 [PEOPLE DEBUG] Record:', record);
    console.log('🔍 [PEOPLE DEBUG] Company ID:', companyId);
    
    // VALIDATION: Reject invalid companyIds
    if (!companyId || companyId === 'undefined' || companyId === 'null') {
      console.warn('⚠️ [PEOPLE] Invalid companyId, cannot fetch people');
      setPeople([]);
      setError('Unable to load people: Invalid company identifier');
      setLoading(false);
      return;
    }
    
    // ... rest of fetch logic
  };
  
  fetchPeople();
}, [companyId, companyName, user.id]);
```

**Priority**: HIGH  
**Impact**: Prevents API calls with invalid IDs  
**Risk**: LOW - Prevents cache pollution

### HIGH PRIORITY FIXES

#### 4. Include mainSellerId in Cached Data

**File**: `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx`

**Update Cache Storage** (line ~309):
```typescript
const essentialData = peopleData.map(person => ({
  id: person.id,
  fullName: person.fullName,
  firstName: person.firstName,
  lastName: person.lastName,
  company: person.company,
  companyId: person.companyId,
  jobTitle: person.jobTitle,
  email: person.email,
  mainSellerId: person.mainSellerId, // ADD THIS
  status: person.status, // ADD THIS
  updatedAt: person.updatedAt // ADD THIS for cache freshness
}));

safeSetItem(cacheKey, essentialData);
```

**Priority**: HIGH  
**Impact**: Cache reflects seller assignment changes  
**Risk**: LOW - Just adds data to cache

#### 5. Add Cache Invalidation to Seller Assignment Script

**File**: `scripts/set-victoria-main-seller-top.js`

**Add Before Running Updates**:
```typescript
// Clear caches before bulk update
console.log('🗑️ Clearing people caches...');
try {
  // Clear Redis cache patterns
  await cache.deletePattern(`people-${workspace.id}-*`);
  console.log('✅ Cleared API caches');
} catch (cacheError) {
  console.warn('⚠️ Failed to clear caches (non-blocking):', cacheError);
}

// Then run the updates
await prisma.people.updateMany({ /* ... */ });
```

**Priority**: MEDIUM  
**Impact**: Users see fresh data immediately after script runs  
**Risk**: LOW - Cache will rebuild naturally

#### 6. Add URL Audit Script

**New File**: `scripts/audit-company-urls.js`

```javascript
// Find companies whose URLs might have wrong IDs
// Check generated slugs vs database IDs
// Report discrepancies
```

**Priority**: MEDIUM  
**Impact**: Proactively find and fix URL issues  
**Risk**: LOW - Read-only audit

### MEDIUM PRIORITY IMPROVEMENTS

#### 7. Add Logging for ID Mismatches

**File**: `src/platform/utils/url-utils.ts`

**Add After Extraction**:
```typescript
export function extractIdFromSlug(slug: string): string {
  // ... existing logic ...
  
  const extractedId = /* ... extraction logic ... */;
  
  // Log extraction for debugging
  if (isDevelopment) {
    console.log(`🔍 [URL UTILS] Extracted ID: ${extractedId} from slug: ${slug}`);
  }
  
  return extractedId;
}
```

#### 8. Add Performance Monitoring

Track metrics:
- Company page load times
- People API call durations
- Cache hit/miss rates
- Invalid ID frequency

#### 9. Reduce Cache TTL During Maintenance

Document in runbooks:
- Clear all caches before running seller assignment scripts
- Or reduce TTL to 30 seconds during maintenance windows
- Or run during off-hours when usage is low

### LOW PRIORITY (Future Improvements)

#### 10. Implement Optimistic URL Correction

If ID doesn't match, attempt to find company by name and redirect:
```typescript
if (!record && companyName) {
  const matchByName = currentSectionData?.find(r => 
    r.name?.toLowerCase() === companyName.toLowerCase()
  );
  if (matchByName) {
    router.replace(`/${workspaceSlug}/companies/${generateSlug(matchByName.name, matchByName.id)}`);
  }
}
```

#### 11. Add URL Health Monitoring

- Monitor for 404s and failed lookups
- Alert when invalid IDs are accessed frequently
- Generate reports on URL discrepancies

#### 12. Implement Cache Versioning

Instead of `-v1` suffix, use semantic versioning:
```typescript
const CACHE_VERSION = '2025.11.13.1';
const cacheKey = `people-${companyId}-${userId}-${CACHE_VERSION}`;
```

Bump version when data model changes to auto-invalidate old caches.

---

## Testing Checklist

### Verify Fixes

- [ ] Test with correct company ID → should show all people
- [ ] Test with wrong company ID → should show error message
- [ ] Test with undefined companyId → should show error, not crash
- [ ] Test seller assignment script → verify cache invalidation
- [ ] Test API cache with different companyIds → verify separate cache entries
- [ ] Test cache expiration → verify fresh data after TTL
- [ ] Load test → verify performance with cache fixes

### Regression Testing

- [ ] Test people tab on other companies
- [ ] Test buyer group tab
- [ ] Test with NULL mainSeller people
- [ ] Test with multiple sellers
- [ ] Test cache persistence across page reloads
- [ ] Test force refresh functionality

---

## Monitoring & Alerts

### Metrics to Track

1. **Invalid Company ID Rate**: Count of 404s or failed lookups
2. **Cache Hit Ratio**: Percentage of API cache hits vs misses
3. **People Tab Load Time**: P50, P95, P99 latencies
4. **Empty Results Rate**: How often people tab shows 0 results

### Alerts to Configure

1. **High Invalid ID Rate**: Alert if >5% of company page loads have invalid IDs
2. **Low Cache Hit Ratio**: Alert if API cache hit ratio <70%
3. **Slow API Calls**: Alert if P95 latency >2 seconds
4. **High Error Rate**: Alert if error boundary triggers >1% of loads

---

## Conclusion

### What We Learned

1. **Database is Healthy**: All data exists and is correctly assigned ✅
2. **Primary Issue**: Wrong company ID in URL causes silent failure ❌
3. **Critical Bug Found**: API cache key missing companyId ❌
4. **Validation Gaps**: System allows undefined values to propagate ⚠️
5. **Cache Issues**: Multiple caching bugs amplify impact ⚠️

### Expected Behavior

**When Working Correctly**:
1. User navigates to company page with correct ID
2. ID extracted from URL matches database record
3. People tab loads with valid companyId
4. API call: `/api/v1/people?companyId=01K7DW5DX...`
5. Filter: `WHERE (mainSellerId = Victoria OR mainSellerId IS NULL) AND companyId = ...`
6. Returns all 19 people
7. Displayed immediately

**What Actually Happened**:
1. User navigated with wrong ID in URL
2. ID extracted doesn't match any database record
3. Record lookup fails silently
4. companyId undefined
5. API call with undefined companyId
6. Returns empty or error
7. Empty result cached
8. User sees "no people"
9. Later, correct URL used → data loads → "later populated"

### Next Steps

1. **Immediate**: Implement critical fixes (items 1-3)
2. **This Week**: Implement high priority fixes (items 4-6)
3. **This Month**: Implement medium priority improvements (items 7-9)
4. **Backlog**: Consider future improvements (items 10-12)

### Sign-Off

This audit confirms:
- ✅ YUBA Water Agency data is correct
- ✅ Warren Frederickson exists as a prospect
- ✅ Victoria has proper access
- ✅ API filtering works correctly
- ❌ URL contains wrong company ID (root cause)
- ❌ Multiple validation and caching bugs found

**Recommendation**: Implement critical fixes immediately to prevent this issue from recurring with other companies.

---

**Audit Complete**

**Generated**: November 13, 2025  
**Files Created**:
- `YUBA_WATER_AGENCY_AUDIT_REPORT.md` (this file)
- `scripts/audit-yuba-water-agency.js` (database audit script)
- `docs/audit-yuba-code-flow-analysis.md` (code flow documentation)
- `docs/audit-yuba-seller-ownership.md` (seller ownership analysis)
- `docs/audit-yuba-caching-analysis.md` (caching investigation)

**Data**:
- Database audit output (console logs from script execution)
- Timeline reconstruction
- Cache behavior analysis
- Recommendations with code snippets

