# Company Overview Missing Data Fix

## Problem
Companies were displaying missing data in the Overview tab despite having website and LinkedIn URLs configured. Key fields like industry, employee count, founded year, and HQ location were showing as null.

### Example Company
**HCI Energy** (ID: 01K9QD58EAS24GBWCJ5NE9AVYJ)
- Website: https://hcienergy.com
- LinkedIn: https://www.linkedin.com/company/hci-energy-llc
- Missing fields: industry, employeeCount, foundedYear, hqCity, hqState, hqStreet, hqZipcode, description, phone, email

## Root Cause
The CoreSignal API key in `.env.local` had a **trailing `\n` (newline) character**, which was being sent in the `Authorization` header causing all API requests to fail:

```
CORESIGNAL_API_KEY="hzwQmb13cF21if4arzLpx0SRWyoOUyzP\n"
```

This literal `\n` in the header caused CoreSignal to reject all authentication attempts, preventing enrichment from working.

## Solution
Added API key sanitization in all CoreSignal API integration points to automatically trim whitespace and remove escaped newline characters:

```typescript
// Before
const coresignalApiKey = process.env.CORESIGNAL_API_KEY;

// After
const coresignalApiKey = process.env.CORESIGNAL_API_KEY?.trim().replace(/\\n/g, '');
```

### Files Updated
1. `src/app/api/v1/enrich/route.ts` - Main enrichment endpoint (person and company enrichment)
2. `src/platform/intelligence/buyer-group-v2/config.ts` - Buyer group v2 configuration
3. `src/app/api/intelligence/buyer-group-bulk/route.ts` - Bulk buyer group operations

## How It Works

### Auto-Enrichment Flow
The `CompanyOverviewTab` component automatically triggers enrichment when:
1. Company has a website or LinkedIn URL (hasContactInfo ✅)
2. Company is missing basic data like industry or employeeCount (missingBasicData ✅)
3. Company has NOT been enriched OR data is stale (>90 days) (hasBeenEnriched ❌)

### Enrichment Process
1. Search CoreSignal using company website and name
2. If found, fetch detailed company data from CoreSignal
3. Map CoreSignal fields to database fields:
   - `industry` ← `coresignalData.industry`
   - `employeeCount` ← `coresignalData.employee_count`
   - `size` ← `coresignalData.size_range`
   - `description` ← `coresignalData.description`
   - `foundedYear` ← `coresignalData.founded`
   - `hqCity` ← `coresignalData.hq_city`
   - `hqState` ← `coresignalData.hq_state`
   - `hqStreet` ← `coresignalData.hq_address_line_1`
   - `hqZipcode` ← `coresignalData.hq_postcode`
   - `phone` ← `coresignalData.phone`
   - `linkedinFollowers` ← `coresignalData.follower_count`
4. Update company record with enriched data
5. Store enrichment metadata in `customFields` for tracking

## Testing

### Manual Test
To trigger manual enrichment for a specific company:

```typescript
POST /api/v1/enrich
{
  "type": "company",
  "entityId": "01K9QD58EAS24GBWCJ5NE9AVYJ",
  "options": {
    "discoverContacts": true,
    "verifyEmail": true,
    "verifyPhone": true
  }
}
```

### Expected Results
After the fix:
1. Visit company overview page (e.g., HCI Energy)
2. Auto-enrichment triggers in the background (no UI)
3. Page refreshes with populated fields:
   - Industry
   - Employee Count
   - Founded Year
   - HQ Location
   - Company Description
   - LinkedIn Followers
   - Phone (if available)

## Impact
This fix resolves the enrichment issue for ALL companies affected by the malformed API key. Companies with website/LinkedIn URLs will now automatically enrich when viewed in the Overview tab.

## Prevention
The sanitization code now handles malformed environment variables gracefully by:
- Trimming whitespace
- Removing escaped newlines (`\n`)
- Removing literal backslash-n sequences

This ensures future environment variable formatting issues won't break enrichment.

## User Note
**Note for Ross:** If you see a company with missing data but it has a website or LinkedIn URL, the enrichment should now work automatically. However, be aware that:

1. **Not all companies exist in CoreSignal** - If CoreSignal doesn't have the company, enrichment will fail gracefully
2. **Records may be from user's system** - As you mentioned, some records might be from their own system and not pulled from external sources
3. **Manual data entry** - If auto-enrichment doesn't work, you can manually add the data using inline edit fields

To verify if a company exists in CoreSignal, check the `customFields.coresignalId` field after enrichment attempts.

