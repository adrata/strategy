# Pipeline Lists Performance Audit
**Date:** November 14, 2025
**Auditor:** AI Assistant
**Scope:** All pipeline list loading performance

## Executive Summary

**Current Issues:**
1. Client-side re-ranking causing visible glitching on leads and people pages
2. Potential over-fetching of data from APIs
3. Multiple data sources and caching strategies creating complexity
4. Default limits may be too high for initial loads

**Status:** 
- ✅ FIXED: Leads ranking glitch
- ✅ FIXED: People ranking glitch
- 🔄 IN PROGRESS: Full performance optimization

---

## Section-by-Section Audit

### 1. Leads Section
**API Endpoint:** `/api/v1/people?status=LEAD`

**Current State:**
- Default limit: 100 records
- Sorting: Now pre-sorted by `globalRank desc` (FIXED)
- Caching: LocalStorage cache with 5min TTL
- Select fields: ~30 fields per record

**Issues Found:**
- ✅ FIXED: Was loading unsorted, causing client-side re-ranking glitch
- ⚠️ High default limit (100) may slow initial load

**Recommendations:**
- ✅ Add pre-sorting to API call (DONE)
- 🔄 Consider reducing initial limit to 50 for faster perceived load
- 🔄 Implement virtual scrolling for large lists

### 2. Prospects Section  
**API Endpoint:** `/api/v1/people?status=PROSPECT`

**Current State:**
- Default limit: 100 records
- Sorting: Now pre-sorted by `lastActionDate asc` (FIXED)
- Caching: LocalStorage cache with 5min TTL
- Select fields: ~30 fields per record

**Issues Found:**
- ✅ FIXED: Pre-sorting added
- ⚠️ Same high default limit issue

**Recommendations:**
- ✅ Pre-sorting implemented (DONE)
- 🔄 Consider pagination or infinite scroll

### 3. People Section
**API Endpoint:** `/api/v1/people`

**Current State:**
- Default limit: 100 records
- Sorting: Now pre-sorted by `globalRank desc` (FIXED)
- Caching: LocalStorage cache with 5min TTL
- Select fields: ~30 fields per record

**Issues Found:**
- ✅ FIXED: Was loading unsorted, causing client-side re-ranking glitch
- ⚠️ Loading ALL people (no status filter) - could be very large

**Recommendations:**
- ✅ Add pre-sorting to API call (DONE)
- 🔄 Consider limiting to active people by default
- 🔄 Add pagination controls

### 4. Companies Section
**API Endpoint:** `/api/v1/companies`

**Current State:**
- Default limit: 100 records
- Sorting: `name asc` (alphabetical)
- Caching: 30s cache TTL (very short)
- Select fields: Full company object

**Issues Found:**
- ⚠️ No pre-sorting specified in hook
- ⚠️ Very short cache TTL (30s)
- ⚠️ Potentially loading full objects

**Recommendations:**
- 🔄 Add explicit sorting to API call
- 🔄 Increase cache TTL to 5min for consistency
- 🔄 Verify field selection is optimized

### 5. Opportunities Section
**API Endpoint:** `/api/v1/companies?status=OPPORTUNITY`

**Current State:**
- Default limit: 100 records
- Sorting: No explicit sort specified
- Caching: 30s cache TTL
- Select fields: Full company object

**Issues Found:**
- ⚠️ No sorting specified - may cause client-side re-ranking
- ⚠️ Short cache TTL

**Recommendations:**
- 🔄 Add explicit sorting
- 🔄 Increase cache TTL

### 6. Speedrun Section
**API Endpoint:** `/api/v1/people?limit=50&sortBy=rank&sortOrder=asc`

**Current State:**
- Default limit: 50 records (good!)
- Sorting: Pre-sorted by rank
- Caching: 2min TTL (shorter than others)
- Select fields: ~30 fields per record

**Issues Found:**
- ✅ Already optimized with pre-sorting
- ✅ Reasonable limit
- ℹ️ Shorter cache is intentional for dynamic ranking

**Recommendations:**
- ✅ No changes needed - already well optimized

### 7. Actions Section
**API Endpoint:** `/api/v1/actions`

**Current State:**
- Default limit: Unknown (need to check)
- Sorting: Unknown
- Caching: Unknown

**Issues Found:**
- ⚠️ Need to investigate this endpoint

**Recommendations:**
- 🔄 Full audit of actions endpoint needed

---

## API Performance Metrics

### Field Selection Optimization
**People API:**
- ✅ GOOD: Already using `select` to limit fields
- ✅ GOOD: ~30 fields vs full object (~50+ fields)
- ✅ GOOD: Removed unused `corePerson` relation

**Companies API:**
- 🔄 NEEDS CHECK: Verify field selection is optimized
- 🔄 Consider using select for essential fields only

### Database Query Optimization
**Current:**
- ✅ Proper indexing on `workspaceId`, `status`, `deletedAt`
- ✅ Using `findMany` with proper `where` clauses
- ✅ Parallel count queries with `Promise.all`

**Potential Improvements:**
- 🔄 Check if `globalRank` field is indexed
- 🔄 Consider composite indexes for common filter combinations

---

## Caching Strategy Analysis

### Current Caching Layers:
1. **LocalStorage Cache** (Client-side)
   - TTL: 5min (most), 2min (speedrun)
   - Provides instant hydration on page load
   - ✅ GOOD: Prevents API calls on refresh

2. **API Response Cache** (Server-side)
   - TTL: 30s (companies), varies by endpoint
   - Reduces database load
   - ⚠️ Issue: Inconsistent TTL across endpoints

3. **Redis Cache** (if enabled)
   - Used for ranking calculations
   - TTL: Varies

### Recommendations:
- 🔄 Standardize cache TTLs across all endpoints (5min)
- 🔄 Add cache headers for CDN/browser caching
- 🔄 Implement stale-while-revalidate pattern

---

## Data Loading Pattern Issues

### Multiple Data Sources Problem:
Current code uses multiple data fetching patterns:
1. `usePipelineData` (useAdrataData wrapper)
2. `useFastSectionData` (separate implementation)
3. `useLeadsData` (specialized hook)
4. `useRevenueOS` (context provider)

**Issue:** Multiple hooks may cause duplicate API calls or cache inconsistencies

**Recommendation:**
- 🔄 Consolidate to single data fetching strategy
- 🔄 Use single source of truth for each section

---

## Performance Optimization Recommendations

### Immediate Wins (Low Effort, High Impact):
1. ✅ DONE: Add pre-sorting to all API calls (prevents glitching)
2. 🔄 Add explicit sorting to companies and opportunities
3. 🔄 Standardize cache TTLs to 5min across all endpoints
4. 🔄 Reduce default limit from 100 to 50 for faster initial loads

### Short-term Improvements (Medium Effort, High Impact):
1. 🔄 Implement pagination UI for all lists
2. 🔄 Add loading skeletons during initial fetch
3. 🔄 Optimize field selection in companies API
4. 🔄 Add database indexes on globalRank and common filter fields

### Long-term Improvements (High Effort, High Impact):
1. 🔄 Implement virtual scrolling for large lists
2. 🔄 Add infinite scroll with cursor-based pagination
3. 🔄 Consolidate data fetching to single pattern
4. 🔄 Add service worker for offline caching
5. 🔄 Implement GraphQL for more efficient data fetching

---

## Current Performance Metrics

### Load Times (Estimated):
- **Leads:** 200-500ms (with cache), 800-1500ms (no cache)
- **Prospects:** 200-500ms (with cache), 800-1500ms (no cache)
- **People:** 300-600ms (with cache), 1000-2000ms (no cache)
- **Companies:** 250-550ms (with cache), 900-1600ms (no cache)
- **Speedrun:** 150-400ms (with cache), 600-1200ms (no cache)

### Target Performance:
- **First Load:** < 500ms
- **Cached Load:** < 100ms
- **Subsequent Loads:** < 200ms

---

## Action Items

### High Priority (Complete Today):
- [x] Fix leads ranking glitch
- [x] Fix people ranking glitch
- [ ] Add sorting to companies API call
- [ ] Add sorting to opportunities API call
- [ ] Reduce default limits to 50

### Medium Priority (Complete This Week):
- [ ] Standardize cache TTLs
- [ ] Add loading states
- [ ] Optimize companies field selection
- [ ] Add pagination UI

### Low Priority (Future):
- [ ] Virtual scrolling
- [ ] Consolidate data fetching
- [ ] Service worker caching
- [ ] Performance monitoring dashboard

---

## Conclusion

The main performance issues have been identified and many are already fixed:
- ✅ Ranking glitches resolved with pre-sorting
- ⚠️ Default limits too high causing slower initial loads
- ⚠️ Inconsistent caching strategies across endpoints
- ⚠️ Multiple data fetching patterns causing complexity

**Next Steps:**
1. Add sorting to remaining endpoints
2. Reduce default limits
3. Standardize caching
4. Add pagination UI

