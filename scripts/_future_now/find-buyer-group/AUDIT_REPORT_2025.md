# Buyer Group Discovery - Full Audit Report
**Date:** 2025-01-XX  
**Scope:** Complete audit of find-buyer-group scripts before running for all top-temp companies

## Executive Summary

The buyer group discovery system is **mostly ready** but has **critical gaps** that must be fixed before production use:

1. **CRITICAL:** LinkedIn URL search missing in company lookup methods
2. **CRITICAL:** Company LinkedIn URL not saved when creating companies
3. **IMPORTANT:** Tagging logic is correct but needs verification
4. **GOOD:** MainSellerId assignment is properly handled
5. **GOOD:** Error handling and fallback mechanisms are robust

## Critical Issues Found

### 1. Missing LinkedIn URL Search in Company Lookup

**Location:** `run-top-temp-buyer-group.js` - `findCompany()` method (lines 496-529)

**Problem:** The `findCompany()` method only searches by website domain and company name. It does NOT search by LinkedIn URL, even though:
- Users are providing LinkedIn URLs as input
- The intelligence object contains `linkedinUrl`
- Companies may have LinkedIn URLs stored in the database

**Impact:** If a company exists in the database with only a LinkedIn URL (no website), the tagging process will fail because it can't find the company.

**Fix Required:** Add LinkedIn URL search to `findCompany()` method.

### 2. LinkedIn URL Not Saved When Creating Companies

**Location:** `index.js` - `findOrCreateCompany()` method (lines 2477-2719)

**Problem:** When creating a new company, the `linkedinUrl` field from intelligence is NOT saved to the database. The method only saves:
- name
- website
- industry
- employeeCount
- revenue
- description
- domain
- mainSellerId

**Impact:** LinkedIn URLs are lost when creating new companies, making future lookups harder.

**Fix Required:** Add `linkedinUrl` field to company creation.

### 3. Missing LinkedIn URL Search in Main Pipeline

**Location:** `index.js` - `findOrCreateCompany()` method (lines 2477-2719)

**Problem:** The `findOrCreateCompany()` method searches by:
1. Website domain
2. Company name

But it does NOT search by LinkedIn URL, even though companies may be stored with LinkedIn URLs.

**Impact:** May create duplicate companies if one exists with LinkedIn URL but different website/name.

**Fix Required:** Add LinkedIn URL search before creating new companies.

## Important Observations

### Tagging Logic - CORRECT ✅

The `tagExistingPeople()` method in `run-top-temp-buyer-group.js` correctly:
- Gets all existing people for the company
- Matches them against buyer group members by email, LinkedIn URL, and name
- Tags people as `in_buyer_group` or `out_of_buyer_group`
- Sets `buyerGroupStatus` field
- Creates missing people who are in buyer group
- Properly handles mainSellerId assignment

**Status:** No changes needed for tagging logic.

### MainSellerId Assignment - CORRECT ✅

Both companies and people properly handle mainSellerId:
- Companies: Set from company record or provided parameter
- People: Set from company.mainSellerId or provided parameter
- Existing records preserve mainSellerId if not provided

**Status:** No changes needed.

### Error Handling - ROBUST ✅

The code has excellent error handling:
- Multiple fallback strategies for company search
- Prisma validation error handling with raw SQL fallbacks
- Employee company validation before saving
- Graceful degradation when APIs fail

**Status:** No changes needed.

## Recommended Fixes

### Fix 1: Add LinkedIn URL Search to `findCompany()` in run-top-temp-buyer-group.js

```javascript
async findCompany(intelligence) {
  try {
    // Try by LinkedIn URL first (most reliable)
    if (intelligence.linkedinUrl) {
      const linkedinId = intelligence.linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
      if (linkedinId) {
        const company = await this.prisma.companies.findFirst({
          where: {
            workspaceId: this.workspaceId,
            linkedinUrl: { contains: linkedinId }
          }
        });
        if (company) return company;
      }
    }
    
    // Try by website domain
    if (intelligence.website) {
      // ... existing code ...
    }

    // Try by name
    if (intelligence.companyName) {
      // ... existing code ...
    }

    return null;
  } catch (error) {
    console.error('Error finding company:', error.message);
    return null;
  }
}
```

### Fix 2: Add LinkedIn URL to Company Creation in index.js

In `findOrCreateCompany()` method, add `linkedinUrl` to company creation:

```javascript
company = await this.prisma.companies.create({
  data: {
    workspaceId: this.workspaceId,
    name: intelligence.companyName || 'Unknown Company',
    website: intelligence.website,
    linkedinUrl: intelligence.linkedinUrl, // ADD THIS
    industry: intelligence.industry,
    // ... rest of fields ...
  }
});
```

Also add to raw SQL fallback creation.

### Fix 3: Add LinkedIn URL Search to `findOrCreateCompany()` in index.js

Add LinkedIn URL search before creating new companies:

```javascript
// After website search, before name search:
if (!company && intelligence.linkedinUrl) {
  const linkedinId = intelligence.linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
  if (linkedinId) {
    try {
      company = await this.prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          linkedinUrl: { contains: linkedinId }
        }
      });
    } catch (error) {
      // Handle Prisma validation errors
    }
  }
}
```

## Testing Checklist

Before running for all top-temp companies:

- [ ] Test with company that has LinkedIn URL but no website
- [ ] Test with company that exists in DB with LinkedIn URL
- [ ] Verify all existing people get tagged (in or out)
- [ ] Verify LinkedIn URLs are saved to companies table
- [ ] Verify mainSellerId is set correctly for companies and people
- [ ] Test error handling when company not found
- [ ] Test error handling when Coresignal API fails
- [ ] Verify buyer group members are created with correct tags

## Files Requiring Changes

1. `scripts/_future_now/find-buyer-group/run-top-temp-buyer-group.js`
   - Add LinkedIn URL search to `findCompany()` method

2. `scripts/_future_now/find-buyer-group/index.js`
   - Add LinkedIn URL search to `findOrCreateCompany()` method
   - Add `linkedinUrl` field to company creation

## Conclusion

The system is **90% ready** but requires the LinkedIn URL fixes before production use. Once these fixes are applied, the system should work correctly for all top-temp companies.

**Priority:** HIGH - Fix LinkedIn URL handling before running for all companies.

