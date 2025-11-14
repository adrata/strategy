# Olga Lev Buyer Group Issue - Root Cause Analysis & Fix

## Issue Summary

**Problem**: Olga Lev (olga.lev@underline.cz) from the Czech company "Underline" was incorrectly listed as an active buyer group member and decision maker for the US company "Underline" (underline.com).

**Status**: ✅ FIXED

## Root Cause Analysis

### Why This Happened

1. **Historical Data**: Olga Lev was added to the buyer group before domain validation was implemented. The validation logic exists in `scripts/_future_now/find-buyer-group/index.js` but was added after some buyer groups were created.

2. **Manual Addition Path**: The API endpoint `src/app/api/data/buyer-groups/route.ts` allows manual addition of buyer group members without domain validation:
   ```typescript
   async function addBuyerGroupMember(data: any) {
     // No domain validation before adding member
     const updatedContact = await prisma.people.update({
       where: { id: lead_id },
       data: {
         companyId: buyer_group_id,
         // ... sets buyer group fields without validation
       }
     });
   }
   ```

3. **Company Name Matching**: The system may have matched people by company name similarity ("Underline" = "Underline") without checking email domains, leading to cross-company contamination.

4. **Scale of Issue**: The diagnostic script found **767 domain mismatches** across all workspaces, indicating this is a systemic issue, not isolated to Olga Lev.

### When It Happened

- **Created**: November 11, 2025
- **Last Updated**: November 13, 2025
- **Fixed**: January 2025

## Fix Applied

### For Olga Lev Specifically

1. ✅ Removed from buyer group (`isBuyerGroupMember = false`)
2. ✅ Cleared buyer group role (`buyerGroupRole = null`)
3. ✅ Cleared buyer group status (`buyerGroupStatus = null`)
4. ✅ Added note documenting the fix

### Scripts Created

1. **`scripts/fix-olga-lev-buyer-group.js`** - Diagnostic and fix script for Olga Lev
2. **`scripts/check-all-domain-mismatches.js`** - Scans all buyer group members for domain mismatches

## Prevention Measures

### Existing Validation

The buyer group creation pipeline (`scripts/_future_now/find-buyer-group/index.js`) includes domain validation:

```javascript
validateEmployeeCompany(member, intelligence, company) {
  // Check 5: Email domain validation (CRITICAL for preventing mismatches)
  const memberEmail = member.email || member.workEmail;
  if (memberEmail && memberEmail.includes('@')) {
    const emailDomain = memberEmail.split('@')[1]?.toLowerCase();
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

### Missing Validation

**Critical Gap**: The manual buyer group member addition API (`addBuyerGroupMember`) does NOT validate domains before adding members.

### Recommended Fixes

1. **Add Domain Validation to API**:
   - Update `src/app/api/data/buyer-groups/route.ts` to validate email domain before adding members
   - Reject additions where email domain doesn't match company domain

2. **Add Validation to Buyer Group Sync Service**:
   - Update `src/platform/services/buyer-group-sync-service.ts` to check domain matches when syncing

3. **Add Pre-Save Hook**:
   - Consider adding a Prisma middleware or database trigger to validate domain matches before saving buyer group memberships

4. **Regular Cleanup Job**:
   - Run `scripts/check-all-domain-mismatches.js` periodically to catch and fix mismatches

## Domain Matching Rules

The system uses strict domain matching:
- **Different TLDs are rejected**: underline.com ≠ underline.cz ✅
- **Subdomains are allowed**: mail.company.com === company.com ✅
- **Root domain must match exactly**: company.com === company.com ✅

## Verification

### Before Fix:
```
Underline (underline.com)
  └─ Olga Lev ❌ (olga.lev@underline.cz - WRONG COMPANY)
     - Role: Decision Maker
     - Status: Active buyer group member
```

### After Fix:
```
Underline (underline.com)
  └─ No buyer group members (correctly empty)

Olga Lev
  - Email: olga.lev@underline.cz
  - Company: Underline (underline.com) - may need reassignment
  - Buyer Group: Removed
```

## Related Issues

The diagnostic found **767 domain mismatches** across workspaces:
- **Notary Everyday**: 51 mismatches
- **TOP Engineering Plus**: 547 mismatches  
- **Top Temp**: 169 mismatches (including Olga Lev)
- **Adrata**: 17 mismatches

These should be reviewed and fixed using the same validation logic.

## Next Steps

1. ✅ Fix Olga Lev (completed)
2. ⏳ Add domain validation to `addBuyerGroupMember` API endpoint
3. ⏳ Create bulk fix script for all 767 mismatches
4. ⏳ Add validation to buyer group sync service
5. ⏳ Set up periodic cleanup job

## Files Modified

1. `scripts/fix-olga-lev-buyer-group.js` - Created diagnostic and fix script
2. `scripts/check-all-domain-mismatches.js` - Created bulk checker script
3. `docs/fixes/OLGA_LEV_BUYER_GROUP_ISSUE.md` - This document

## References

- Previous fix: `docs/fixes/BUYER_GROUP_DOMAIN_FIX_SUMMARY.md`
- Validation logic: `scripts/_future_now/find-buyer-group/index.js` (line 2525-2697)
- API endpoint: `src/app/api/data/buyer-groups/route.ts` (line 307-345)

