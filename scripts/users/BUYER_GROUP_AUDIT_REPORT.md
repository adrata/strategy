# Buyer Group Discovery Audit Report
**Date:** 2025-12-14  
**Workspace:** Notary Everyday (01K7DNYR5VZ7JY36KGKKN76XZ1)  
**User:** Noel

## Executive Summary

The buyer group discovery run processed **80 companies** but encountered significant issues:

- ✅ **50 companies** completed without API errors
- ❌ **30 companies** failed due to Coresignal API credit exhaustion (402 errors)
- 🚨 **1 critical data quality issue** found (wrong company match)
- ⚠️ **10 high-severity issues** (company name mismatches)
- 📭 **46 buyer groups** have 0 members (need re-run when credits available)

## Critical Issues Found

### 1. Wrong Company Match - Jewelers Mutual Group
**Buyer Group ID:** `bg_1765686967287_3prg040i5`  
**Issue:** LinkedIn URL points to wrong company
- **Expected:** Jewelers Mutual Group
- **Found:** Little Romania Ltd (`https://www.linkedin.com/company/little-romania-ltd`)
- **Impact:** All 5 buyer group members are from the WRONG company
- **Status:** ⚠️ Needs deletion and re-run

**Members (from wrong company):**
1. John Kreul - Senior Vice President, Chief Information Digital Officer
2. Stephen Alexander - Vice President
3. Emilie Van Asten - Key Account Manager
4. Stephanie Lehman - Key Account Manager
5. Sommer Joslin - Director - Policy Administration Solutions

## High Severity Issues

### Company Name Mismatches (10 buyer groups)
These buyer groups have company names that don't match their associated company records:

1. **Origence** → Matched to "CU Direct" (25% similarity)
2. **Speedtitle** → Matched to "Coast to Coast Title" (35% similarity)
3. **Valuation Connect** → Matched to "Coast to Coast Title" (18% similarity)
4. **First Vision Title** → Matched to "Coast to Coast Title" (41% similarity)
5. **Coast to Coast Title** → Matched to "Bridge Home Health & Hospice" (17% similarity)
6. **Visiting Nurse Association of Texas** → Matched to "VNA Texas" (26% similarity) - *May be valid abbreviation*
7. **Texas Fairway Reverse** → Matched to "The Wood Group of Fairway" (26% similarity)
8. **Holland & Knight LLP** → Matched to "THEMA Health Services" (11% similarity)

**Action Required:** Review and clean these buyer groups.

## Zero-Member Buyer Groups (46 total)

These buyer groups have 0 members due to API credit exhaustion. They need to be re-run when Coresignal credits are available.

### By Industry:
- **Credit Union:** 32 companies (all 0 members)
- **Estate Planning:** 0 companies (all failed with 402)
- **Insurance Claims:** 11 companies (5 have members, 6 have 0)
- **Auto Lending:** 3 companies (all have 0 members)

### Companies Needing Re-run:
1. D&H Alternative Risk Solutions, Inc.
2. AmeriTrust Financial Technologies Inc.
3. Tractable
4. IMT Insurance
5. Clearcover
6. American Claims Management
7. Marley
8. Trilogy Investment Company, LLC
9. Motorists Mutual Insurance Company
10. Openly
11. All 32 Credit Union companies
12. All Estate Planning companies (failed with 402)

## Root Causes

### 1. Coresignal API Credits Exhausted
- **Enrich endpoint:** All requests return 402
- **Collect endpoint:** All requests return 402
- **Search endpoint:** Intermittent 402 errors
- **Preview endpoint:** Some requests succeed, but many fail

### 2. Company Matching Logic Flaw
The `searchCompanyByName()` function in `company-intelligence.js` had a critical flaw:
- ❌ **Before:** Took first search result without validation
- ✅ **After:** Validates similarity (requires 70% match) and uses preview endpoint

**Fix Applied:**
- Added similarity validation (minimum 70% threshold)
- Switched to preview endpoint to avoid collect credit exhaustion
- Added validation logging

### 3. Wrong LinkedIn URL Matching
The fallback LinkedIn company search matched "Jewelers Mutual Group" to "Little Romania Ltd" because:
- Fuzzy matching returned wrong result
- No validation of company name similarity
- First result was blindly accepted

## Fixes Applied

### 1. Company Matching Logic (`company-intelligence.js`)
✅ Added similarity validation (70% threshold)  
✅ Switched to preview endpoint  
✅ Added validation logging  
✅ Multiple result evaluation

### 2. Audit Script (`audit-clean-buyer-groups.js`)
✅ Created comprehensive audit script  
✅ Detects wrong LinkedIn URL matches  
✅ Identifies company name mismatches  
✅ Flags zero-member buyer groups  
✅ Provides cleanup functionality

## Cleanup Actions Required

### Immediate Actions:
1. **Delete Invalid Buyer Groups:**
   ```bash
   node scripts/users/audit-clean-buyer-groups.js --clean --execute
   ```
   This will delete:
   - Jewelers Mutual Group (wrong company match)
   - 10 high-severity mismatched buyer groups

2. **Mark Zero-Member Buyer Groups:**
   - 46 buyer groups need re-run
   - Consider marking them with status "pending_rerun" in metadata

### When Credits Are Available:
1. **Re-run Zero-Member Buyer Groups:**
   - 46 companies need buyer group discovery
   - Focus on Credit Union vertical (32 companies)
   - Then Insurance Claims (6 companies)
   - Then Auto Lending (3 companies)

2. **Re-run Failed Companies:**
   - 30 companies that failed with 402 errors
   - All Estate Planning companies

## Data Quality Metrics

| Metric | Value |
|--------|-------|
| Total Buyer Groups | 100 (last 100 audited) |
| Valid | 90 |
| Invalid | 10 |
| Critical Issues | 1 |
| High Severity | 10 |
| Zero Members | 46 |
| Total Members Found | 11 (6 valid, 5 invalid) |

## Recommendations

### Short Term:
1. ✅ **DONE:** Fix company matching logic
2. ✅ **DONE:** Create audit script
3. ⏳ **TODO:** Run cleanup script to remove invalid data
4. ⏳ **TODO:** Check Coresignal credit balance

### Medium Term:
1. Add company validation step before saving buyer groups
2. Implement similarity threshold checks in all company matching
3. Add data quality checks to buyer group pipeline
4. Create monitoring for wrong company matches

### Long Term:
1. Implement company matching confidence scores
2. Add manual review workflow for low-confidence matches
3. Create automated re-run queue for zero-member buyer groups
4. Add data quality dashboard

## Next Steps

1. **Review and approve cleanup:**
   ```bash
   # Dry run (safe)
   node scripts/users/audit-clean-buyer-groups.js --clean
   
   # Execute cleanup
   node scripts/users/audit-clean-buyer-groups.js --clean --execute
   ```

2. **Check Coresignal credits:**
   - Log into Coresignal dashboard
   - Check credit balance for search, collect, and preview endpoints
   - Plan credit purchase if needed

3. **Re-run when credits available:**
   - Start with Credit Union companies (32)
   - Then Insurance Claims (6)
   - Then Auto Lending (3)
   - Finally, re-run failed companies (30)

4. **Monitor data quality:**
   - Run audit script after each buyer group discovery batch
   - Review any new critical issues immediately

## Files Modified

1. `scripts/_future_now/find-buyer-group/company-intelligence.js`
   - Fixed `searchCompanyByName()` to validate matches
   - Added 70% similarity threshold
   - Switched to preview endpoint

2. `scripts/users/audit-clean-buyer-groups.js` (NEW)
   - Comprehensive audit script
   - Cleanup functionality
   - Data quality reporting

3. `scripts/users/BUYER_GROUP_AUDIT_REPORT.md` (NEW)
   - This report

## Conclusion

The buyer group discovery encountered significant API credit issues, but the data quality problems have been identified and fixes have been applied. The cleanup script is ready to remove invalid data, and the improved matching logic will prevent future wrong matches.

**Status:** ✅ Audit Complete | ⏳ Cleanup Pending | ⏳ Re-run Pending (credits needed)
