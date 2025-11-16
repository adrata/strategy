# Testing Guide: Olga Lev Buyer Group Fix

## Overview
This guide provides step-by-step instructions for testing the fix for the Olga Lev buyer group issue.

## Issue Summary
- **Problem**: Olga Lev (olga.lev@underline.cz) from Czech Underline incorrectly showing as buyer group member for US Underline (underline.com)
- **Root Cause**: Domain mismatch + frontend caching
- **Fix**: Database update + cache management + validation improvements

## Testing Steps

### 1. Database Verification

Run the test script to verify database state:

```bash
node scripts/test-olga-lev-fix.js
```

**Expected Output:**
- All tests should pass
- `isBuyerGroupMember` should be `false`
- `buyerGroupRole` should be `null`
- No other similar issues found

### 2. Frontend Cache Clearing

If the tester still sees Olga Lev in the buyer group, they need to clear caches:

#### Option A: Manual Browser Refresh
1. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. This forces a hard refresh bypassing cache

#### Option B: Clear LocalStorage
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Local Storage" in left sidebar
4. Find keys containing "buyer-groups"
5. Delete them
6. Refresh the page

#### Option C: Use Clear Cache Button
1. Navigate to the lead/company page
2. Click on "Buyer Groups" tab
3. Look for "🔄 Clear Cache" button in top right
4. Click it - page will reload automatically

#### Option D: Wait for Auto-Expiry
- Cache automatically expires after 5 minutes
- Just wait and refresh after 5 minutes

### 3. API Testing

Test the cache invalidation API endpoint:

```bash
# Get API info
curl https://staging.adrata.com/api/admin/cache/invalidate

# Invalidate cache for a specific company
curl -X POST https://staging.adrata.com/api/admin/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "01K9QD4CDB45F9Z20AEYQ0PS3B",
    "cacheType": "buyer-groups"
  }'
```

### 4. Domain Validation Testing

Test that domain validation prevents future occurrences:

```bash
# Run audit script to find all domain mismatches
node scripts/audit-domain-mismatches-staging.js

# Run with fix flag to automatically fix HIGH severity issues
node scripts/audit-domain-mismatches-staging.js --fix

# Run for specific workspace
node scripts/audit-domain-mismatches-staging.js --workspace top-temp
```

**Expected Output:**
- Script should identify domain mismatches
- HIGH severity: Same name, different TLD (like underline.cz vs underline.com)
- Should provide option to auto-fix

### 5. Validation Logging Testing

Check that validation logging is working:

1. Try to manually add a person with mismatched domain to a buyer group
2. Check server logs for validation messages:
   - Should see domain comparison logs
   - Should see rejection messages for mismatches
   - Should see specific TLD mismatch warnings

Example log output:
```
🔍 [DOMAIN VALIDATION] Comparing base names: emailBase="underline" vs companyBase="underline"
❌ [DOMAIN VALIDATION] REJECTED - Same base name "underline" but different TLDs: underline.cz vs underline.com
⚠️  [DOMAIN VALIDATION] This indicates different companies with same name in different regions
```

### 6. Monitoring Service Testing

Test the monitoring service:

```typescript
import { BuyerGroupValidationMonitor } from '@/platform/services/buyer-group-validation-monitor';

// Validate a specific person
const result = await BuyerGroupValidationMonitor.validatePerson('01K9T0QZV04EMW54QAYRRSK389');
console.log(result); // Should show mismatch if still in buyer group

// Get metrics
const metrics = BuyerGroupValidationMonitor.getMetrics();
console.log(metrics);

// Generate report
const report = BuyerGroupValidationMonitor.generateReport();
console.log(report);
```

### 7. End-to-End User Testing

Have the tester follow these steps:

1. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`

2. **Navigate to Lead**
   - Go to: https://staging.adrata.com/top-temp/leads/olga-lev-01K9T0QZV04EMW54QAYRRSK389/

3. **Check Buyer Groups Tab**
   - Click "Buyer Groups" tab
   - Verify Olga Lev is NOT listed as a buyer group member
   - If still showing, click "🔄 Clear Cache" button

4. **Verify Company Page**
   - Navigate to Underline company page
   - Check buyer group members
   - Olga Lev should NOT appear

5. **Check Other Pages**
   - Verify she doesn't appear in buyer group lists elsewhere
   - Check reports/dashboards that show buyer groups

## Troubleshooting

### Issue: Tester still sees Olga Lev in buyer group

**Solutions:**
1. Verify database state with test script
2. Clear all browser caches (hard refresh)
3. Use "Clear Cache" button in UI
4. Clear localStorage manually in DevTools
5. Wait 5 minutes for auto-expiry
6. Try incognito/private browsing mode

### Issue: Domain validation not rejecting similar cases

**Solutions:**
1. Check validation logging in server logs
2. Verify validation function is being called
3. Run audit script to find undetected cases
4. Review validation logic for edge cases

### Issue: Audit script finds many issues

**Solutions:**
1. Review HIGH severity issues first
2. Use `--fix` flag to auto-fix HIGH severity
3. Manually review MEDIUM severity before fixing
4. Document patterns in LOW severity cases

## Success Criteria

✅ Test script passes all checks
✅ Olga Lev not visible in buyer group in UI
✅ Cache clear button works correctly
✅ Validation logs show rejection of similar cases
✅ Audit script finds no HIGH severity mismatches
✅ Monitoring service tracks metrics correctly
✅ Tester confirms issue is resolved

## Rollback Plan

If the fix causes issues:

1. **Database Rollback** (not needed - fix is non-destructive)
2. **Code Rollback**: Revert changes in these files:
   - `src/app/api/data/buyer-groups/route.ts`
   - `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx`
   - `src/app/api/admin/cache/invalidate/route.ts`
   - `src/platform/services/buyer-group-validation-monitor.ts`

3. **Cache Clearing**: Have all users clear browser cache

## Additional Resources

- Fix documentation: `docs/fixes/OLGA_LEV_BUYER_GROUP_ISSUE.md`
- Audit logs: `logs/domain-mismatch-audit-*.json`
- Test script: `scripts/test-olga-lev-fix.js`
- Audit script: `scripts/audit-domain-mismatches-staging.js`


