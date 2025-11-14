# Testing Guide: Intelligence Summary Technology/SaaS Fix

## Overview

This guide explains how to test the fixes for incorrect Technology/SaaS classifications in company Intelligence Summaries.

## Problem Fixed

Previously, some companies (like Minnesota Power, a utilities company) were incorrectly showing as "Technology/SaaS company" in their Intelligence Summaries. This has been fixed to correctly classify companies based on their actual industry.

## What Was Fixed

1. **Claude AI Prompt**: Updated to explicitly use the company's actual industry and prevent Technology/SaaS assumptions
2. **Industry Inference Logic**: Improved to correctly identify utilities/energy companies and check company names
3. **Removed Defaults**: Eliminated Technology/SaaS as a default fallback when industry is unknown
4. **Better Classification**: Utilities/Energy companies are now correctly identified from industry, sector, or company name

## Testing Steps

### Step 1: Run the Test Script

First, identify which companies have incorrect classifications:

```bash
npm run test:intelligence-fixes
```

This will:
- Scan all companies with cached intelligence summaries
- Identify companies incorrectly classified as Technology/SaaS
- Generate a detailed report in `logs/intelligence-fix-test-report-[timestamp].json`
- Show specific test results for Minnesota Power

**Expected Output:**
- List of companies with issues
- Summary statistics
- Specific test for Minnesota Power showing it should be "Utilities/Energy" not "Technology/SaaS"

### Step 2: Review the Test Results

The script will show:
- Total companies tested
- Number of companies with incorrect classifications
- Detailed list of each company and what it should be

**Example Output:**
```
📊 Found 169 companies with cached strategy data
Companies with incorrect classifications: 9
Companies needing regeneration: 9

⚠️  Companies with Issues:
1. Minnesota Power
   Issue: Target industry mismatch: has "Technology/SaaS" but should be "Utilities/Energy"
   Current Industry: Utilities
   Current Target Industry: Technology/SaaS
   Inferred Target Industry: Utilities/Energy
```

### Step 3: Preview the Fix (Dry Run)

Before applying fixes, preview what will be changed:

```bash
npm run fix:intelligence-classifications:dry-run
```

This shows which companies will be fixed without making any changes.

### Step 4: Apply the Fixes

Clear cached intelligence data for affected companies:

```bash
npm run fix:intelligence-classifications
```

This will:
- Clear cached strategy data for incorrectly classified companies
- Update their targetIndustry to the correct value
- Intelligence summaries will regenerate automatically when users view these companies

**Note:** The intelligence summaries will regenerate with the correct classification when:
- A user views the company's Intelligence tab
- The intelligence is manually regenerated via the UI
- The API is called to regenerate intelligence

### Step 5: Verify the Fix

#### Option A: Test via UI

1. Navigate to a company that was fixed (e.g., Minnesota Power)
2. Go to the Intelligence tab
3. Verify the Intelligence Summary shows:
   - Correct industry classification (e.g., "utilities company" or "energy company")
   - NOT "Technology/SaaS company"
   - Target industry shows "Utilities/Energy" (if displayed)

#### Option B: Test via API

For Minnesota Power (or any fixed company):

```bash
# Get the company ID from the test results
# Then call the API to regenerate intelligence
curl -X POST https://staging.adrata.com/api/v1/strategy/company/[COMPANY_ID] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -d '{"forceRegenerate": true}'
```

#### Option C: Re-run Test Script

After fixes are applied and intelligence regenerates, run the test script again:

```bash
npm run test:intelligence-fixes
```

**Expected Result:** The number of companies with issues should decrease or be zero.

## Specific Test Cases

### Test Case 1: Minnesota Power

**Company:** Minnesota Power  
**Expected Industry:** Utilities/Energy  
**Previous Issue:** Showed as Technology/SaaS

**Verification:**
1. Navigate to: `https://staging.adrata.com/top-temp/companies/minnesota-power-01K9QD382T5FKBSF0AS72RAFAT/?tab=intelligence`
2. Check Intelligence Summary
3. Should say "utilities company" or "energy company"
4. Should NOT say "Technology/SaaS company"

### Test Case 2: Other Utilities Companies

Test these companies (all should be Utilities/Energy, not Technology/SaaS):
- Eversource Energy
- CenterPoint Energy
- National Grid USA
- Bartlett Electric Cooperative, Inc.
- Alpine Power Systems

### Test Case 3: Financial Services Companies

Test companies like:
- Avista Corp. Credit Union (should be Financial Services, not Technology/SaaS)

### Test Case 4: Real Estate Companies

Test companies like:
- 1st Nationwide Mortgage & 1st Nationwide Real Estate (should be Real Estate, not Technology/SaaS)

## What to Look For

### ✅ Correct Behavior

- Utilities/Energy companies show as "utilities company" or "energy company"
- Financial Services companies show as "financial services company"
- Real Estate companies show as "real estate company"
- Companies with unknown industry show generic descriptions (not Technology/SaaS)

### ❌ Incorrect Behavior (Should Not Happen)

- Utilities companies showing as "Technology/SaaS company"
- Any non-tech company showing as "Technology/SaaS company" when their industry is clearly different
- Generic "Technology/SaaS" classification when industry data is missing

## Troubleshooting

### Issue: Test script shows companies still need fixing

**Solution:** 
1. Run the fix script to clear cached data
2. Regenerate intelligence for those companies (via UI or API)
3. Re-run test script to verify

### Issue: Intelligence Summary still shows Technology/SaaS

**Possible Causes:**
1. Cached intelligence hasn't been regenerated yet
2. Company's industry field is not set correctly in database
3. Company name doesn't contain industry keywords

**Solution:**
1. Force regenerate intelligence for that company
2. Check company's industry field in database
3. Verify company name contains industry keywords (e.g., "Power", "Energy")

### Issue: Script errors or doesn't run

**Solution:**
1. Ensure database connection is configured
2. Check that `tsx` is installed: `npm install -g tsx`
3. Verify you're in the project root directory

## Files Modified

The following files were updated to fix the issue:

1. `src/platform/services/claude-strategy-service.ts` - Updated AI prompt
2. `src/app/api/v1/strategy/company/[id]/route.ts` - Improved industry inference
3. `src/platform/services/auto-strategy-population-service.ts` - Removed Technology/SaaS default
4. `src/platform/services/company-strategy-service.ts` - Improved industry category matching

## Test Scripts

- **Test Script:** `scripts/test-intelligence-summary-fixes.ts`
- **Fix Script:** `scripts/fix-incorrect-intelligence-classifications.ts`

## Report Files

Test reports are saved to: `logs/intelligence-fix-test-report-[timestamp].json`

## Questions or Issues?

If you encounter any issues during testing:
1. Check the test report JSON file for detailed information
2. Verify the company's industry field is set correctly
3. Ensure intelligence has been regenerated after running the fix script

