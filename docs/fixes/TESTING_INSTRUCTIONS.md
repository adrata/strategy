# Testing Instructions for Company Overview Fix

## Prerequisites
The fix has been applied to sanitize the CoreSignal API key and resolve enrichment issues.

## Testing Steps

### Step 1: Restart the Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

This ensures the Next.js server loads the updated code with the API key sanitization fix.

### Step 2: Test with HCI Energy
1. Navigate to HCI Energy's company overview page:
   - URL: `https://action.adrata.com/toptemp/companies/hci-energy-01K9QD58EAS24GBWCJ5NE9AVYJ/?search=HCI%20Energy&tab=overview`
   - Or search for "HCI Energy" in the companies list and open it

2. Watch the Overview tab for auto-enrichment (happens automatically in the background)

3. Expected results within 5-10 seconds:
   - **Industry** - Should populate with company's industry
   - **Employee Count** - Should show number of employees
   - **Founded Year** - Should display founding year
   - **HQ Location** - City, State, Street, Zipcode should populate
   - **Description** - Company description should appear
   - **LinkedIn Followers** - Social media metrics
   - **Phone** - Company phone number (if available)

### Step 3: Check Browser Console
Open DevTools (F12) and check console for enrichment logs:

Expected logs:
```
🔍 [ENRICHMENT] Starting enrichment for company: HCI Energy
✅ [ENRICHMENT] Found CoreSignal match: HCI Energy (ID: XXXXX)
📊 [ENRICHMENT] Retrieved CoreSignal data for HCI Energy
✅ [ENRICHMENT] Successfully enriched company HCI Energy with N fields: [industry, employeeCount, ...]
```

### Step 4: Verify Data Persistence
1. Navigate away from the company
2. Return to HCI Energy's overview page
3. Confirm the data persists and doesn't need to re-enrich

### Step 5: Test with Other Companies
Try opening other companies with missing data:
1. Look for companies with website/LinkedIn but empty fields
2. Open their Overview tab
3. Verify auto-enrichment works

## Troubleshooting

### If enrichment doesn't work:

#### Check 1: API Key Configuration
```bash
# Verify API key is properly set (without trailing \n)
Get-Content .env.local | Select-String "CORESIGNAL"
```

The key should be clean without `\n` at the end.

#### Check 2: CoreSignal API Status
Check browser console for error messages:
- `401` - API key authentication failed
- `429` - Rate limit exceeded
- `404` - Company not found in CoreSignal database

#### Check 3: Manual Enrichment Trigger
If auto-enrichment doesn't trigger, manually trigger it:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:
```javascript
fetch('/api/v1/enrich', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'company',
    entityId: '01K9QD58EAS24GBWCJ5NE9AVYJ',
    options: {
      discoverContacts: true,
      verifyEmail: true,
      verifyPhone: true
    }
  })
}).then(r => r.json()).then(console.log)
```

Expected response:
```json
{
  "success": true,
  "type": "company",
  "entityId": "01K9QD58EAS24GBWCJ5NE9AVYJ",
  "status": "completed",
  "fieldsPopulated": ["industry", "employeeCount", "foundedYear", ...],
  "message": "Successfully enriched N fields from CoreSignal"
}
```

## Known Limitations

### Companies Not in CoreSignal
Some companies may not exist in the CoreSignal database. In these cases:
- Enrichment will return: `status: "failed"`, `error: "NOT_FOUND"`
- Fields will remain empty
- Manual data entry is required

### User-Created Records
As noted, some records might be from the user's own system and not from external sources. These may not be found in CoreSignal either.

### Partial Data
CoreSignal may not have all fields for every company. Missing fields will remain null even after enrichment.

## Success Criteria
The fix is successful if:
1. ✅ HCI Energy fields populate automatically when viewing Overview tab
2. ✅ No console errors related to API authentication
3. ✅ Data persists after page navigation
4. ✅ Other companies with website/LinkedIn also enrich successfully

## Contact
If enrichment is still not working after these steps, check:
1. Server logs for enrichment errors
2. Database to verify company record was updated
3. CoreSignal API dashboard for usage/limits

