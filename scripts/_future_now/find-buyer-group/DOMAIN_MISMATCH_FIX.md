# Buyer Group Domain Mismatch Fix

## Problem Summary

People from different companies with similar names were being incorrectly grouped together in buyer groups due to CoreSignal searches returning all companies with matching names globally.

### Example Case
- **Olga Lev** (olga.lev@underline.cz) was incorrectly assigned to **Underline** (underline.com) buyer group
- These are two different companies: underline.com (US) vs underline.cz (Czech Republic)
- **Root Cause**: CoreSignal search for "Underline" returned employees from ALL companies named "Underline" worldwide

## Root Causes Identified

1. **Missing Email Domain Validation**: The `validateEmployeeCompany()` function in index.js didn't validate that email domains match company websites
2. **No Filtering in Preview Search**: The preview-search.js module returned all employees matching company name without domain filtering
3. **Trust in LinkedIn Search**: System trusted CoreSignal LinkedIn search results without validating email domains

## Fixes Implemented

### 1. Email Domain Validation in index.js (Line 2660-2684)

Added strict email domain validation to `validateEmployeeCompany()`:

```javascript
// Check 5: Email domain validation (CRITICAL for preventing mismatches)
const memberEmail = member.email || member.workEmail;
if (memberEmail && memberEmail.includes('@')) {
  const emailDomain = memberEmail.split('@')[1]?.toLowerCase();
  const companyWebsite = intelligence.website || company.website;
  
  if (emailDomain && companyWebsite) {
    const companyDomain = extractDomainHelper(companyWebsite);
    
    if (!this.domainsMatchStrict(emailDomain, companyDomain)) {
      return {
        isValid: false,
        reason: `Email domain mismatch: ${emailDomain} does not match company domain ${companyDomain}`
      };
    }
  }
}
```

### 2. Domain Filtering in preview-search.js (Lines 57-79)

Added email domain filtering to `discoverAllStakeholders()`:

```javascript
// Filter employees by email domain if company website is available
if (companyData.website && allEmployeesRaw.length > 0) {
  const companyDomain = this.extractDomain(companyData.website);
  const beforeDomainFilter = allEmployeesRaw.length;
  
  allEmployeesRaw = allEmployeesRaw.filter(emp => {
    const email = emp.email || emp.work_email;
    if (!email || !email.includes('@')) {
      return true; // Keep employees without email data
    }
    
    const emailDomain = email.split('@')[1].toLowerCase();
    return this.domainsMatchStrict(emailDomain, companyDomain);
  });
  
  const filteredOut = beforeDomainFilter - allEmployeesRaw.length;
  if (filteredOut > 0) {
    console.log(`🔒 Email domain filter: ${beforeDomainFilter} → ${allEmployeesRaw.length} employees (filtered out ${filteredOut} with non-matching domains)`);
  }
}
```

### 3. Strict Domain Matching Function

Added `domainsMatchStrict()` helper function to both files:

```javascript
domainsMatchStrict(emailDomain, companyDomain) {
  if (!emailDomain || !companyDomain) return false;
  
  const parts1 = emailDomain.split('.');
  const parts2 = companyDomain.split('.');
  
  if (parts1.length < 2 || parts2.length < 2) return false;
  
  // Get root domain (last 2 parts: domain.tld)
  const root1 = parts1.slice(-2).join('.');
  const root2 = parts2.slice(-2).join('.');
  
  // Must match exactly (including TLD)
  // underline.com !== underline.cz
  // mail.underline.com === underline.com
  return root1 === root2;
}
```

## Cleanup Performed

### Fixed Cases
1. **Olga Lev** - Removed from Underline (underline.com) buyer group
   - Email: olga.lev@underline.cz
   - Should not have been in underline.com buyer group
   - Status: ✅ Fixed

### Scripts Created
1. `fix-underline-case.js` - Targeted fix for known Underline issue
2. `cleanup-domain-mismatches.js` - General cleanup script for all domain mismatches

## Prevention Strategy

### Future buyer group creation will:
1. ✅ Validate email domains match company website before adding to buyer group
2. ✅ Filter CoreSignal search results by email domain
3. ✅ Reject employees with non-matching email domains
4. ✅ Log all rejections with clear reasoning

### Domain Matching Rules:
- Exact match required including TLD (.com ≠ .cz)
- Subdomain variations allowed (mail.company.com === company.com)
- Personal email domains automatically rejected

## Verification

### Before Fix:
```
Company: Underline (underline.com)
Buyer group members: 1
  - Olga Lev (olga.lev@underline.cz) ❌
```

### After Fix:
```
Company: Underline (underline.com)
Buyer group members: 0 ✅
```

## Files Modified

1. `scripts/_future_now/find-buyer-group/index.js`
   - Added email domain validation to `validateEmployeeCompany()` (line 2660)
   - Added `domainsMatchStrict()` helper method (line 2768)

2. `scripts/_future_now/find-buyer-group/preview-search.js`
   - Added email domain filtering to `discoverAllStakeholders()` (line 57)
   - Added `domainsMatchStrict()` helper method (line 274)

3. `scripts/_future_now/find-buyer-group/cleanup-domain-mismatches.js` (new)
   - General cleanup script for all workspaces

4. `scripts/_future_now/find-buyer-group/fix-underline-case.js` (new)
   - Targeted fix script for Underline case

## Impact

### Data Quality
- Eliminates cross-company contamination in buyer groups
- Ensures buyer group members actually work at the target company
- Improves accuracy of buyer group intelligence

### Production Readiness
- TOP workspace cleaned and ready for production
- Future buyer groups will be validated automatically
- No manual intervention needed going forward

## Status

✅ **COMPLETE** - All fixes implemented and tested
- Email validation: ✅ Added
- Domain filtering: ✅ Added
- Cleanup performed: ✅ Complete
- Verification: ✅ Passed
- Documentation: ✅ Complete

