# AI Context Fix - Testing Guide

## Overview

This guide helps verify that the AI assistant properly receives company record context when users view company pages.

## Test Scenario

Navigate to HCI Energy company page:
```
https://action.adrata.com/toptemp/companies/hci-energy-01K9QD58EAS24GBWCJ5NE9AVYJ/?search=HCI+Energy&tab=buyer-groups
```

## Testing Steps

### 1. Open Browser Console

1. Navigate to the HCI Energy page
2. Open browser DevTools (F12 or Cmd+Option+I)
3. Go to the Console tab
4. Clear the console (Cmd+K or Ctrl+K)

### 2. Send AI Query

1. In the right panel, click on the AI assistant (if not already open)
2. Type a question about HCI Energy, such as:
   - "What can you tell me about HCI Energy?"
   - "What does HCI Energy do?"
   - "Who are the key people at HCI Energy?"

### 3. Check Console Logs

Look for the following log entries in sequence:

#### Log 1: Frontend Request (RightPanel)
```
🤖 [AI CHAT REQUEST] Sending context to AI: {
  hasCurrentRecord: true,  // Should be TRUE
  recordType: "companies",
  recordId: "01K9QD58EAS24GBWCJ5NE9AVYJ",
  recordName: "HCI Energy",
  recordWebsite: "https://hcienergy.com",
  recordIndustry: "Professional Services",
  hasDescription: true/false,
  ...
}
```

#### Log 2: API Receipt
```
🎯 [AI CHAT] Current record context received: {
  recordType: "companies",
  id: "01K9QD58EAS24GBWCJ5NE9AVYJ",
  name: "HCI Energy",
  website: "https://hcienergy.com",
  hasDescription: true/false,
  totalFieldsPopulated: [number],
  ...
}
```

#### Log 3: Context Building
```
🎯 [AIContextService] Building record context: {
  hasCurrentRecord: true,
  recordType: "companies",
  recordId: "01K9QD58EAS24GBWCJ5NE9AVYJ",
  recordName: "HCI Energy",
  recordFieldCount: [number]
}
```

```
🔍 [AIContextService] Record data completeness: {
  hasName: true,
  hasCompany: true,
  hasIndustry: true/false,
  hasDescription: true/false,
  hasWebsite: true,
  ...
}
```

### 4. Check AI Response

The AI should respond with:

**✅ GOOD (With Context):**
- Specific information about HCI Energy
- References to the company's industry, size, or location
- Insights based on the actual company data
- NO warning banner visible

**❌ BAD (Without Context):**
- Generic response saying "I don't have access to detailed business context"
- Offers general guidance only
- Yellow warning banner appears: "Limited Context Available"
- Console warning: `⚠️ [AI CHAT] User is on a record page but no record context is available`

## Expected Results

### Scenario A: Context Working Properly

1. **Console Logs Show:**
   - `hasCurrentRecord: true` in all three logs
   - Record fields populated (name, company, website, etc.)
   - `totalFieldsPopulated` > 5

2. **Visual Feedback:**
   - No warning banner in AI panel
   - AI responds with specific insights about HCI Energy

3. **AI Response Quality:**
   - References specific company details
   - Provides targeted advice based on company profile
   - May mention industry, company size, or other specific attributes

### Scenario B: Context Missing (Issue Present)

1. **Console Logs Show:**
   - `hasCurrentRecord: false` OR
   - `recordFieldCount: 1` (only ID present) OR
   - Most enriched fields missing (no description, industry, etc.)

2. **Visual Feedback:**
   - Yellow warning banner appears: "Limited Context Available"
   - Banner message: "The AI is responding without full record context. For better insights about this specific record, try refreshing the page or asking about general strategies."

3. **Console Warnings:**
   ```
   ⚠️ [AI CHAT] User is on a record page but no record context is available
   ⚠️ [AIContextService] No record context available - returning general guidance
   ```

4. **AI Response Quality:**
   - Generic response about methodology
   - No specific company references
   - Apologizes for lack of detailed context

## Debugging Steps

If context is missing (Scenario B), check:

### 1. Record Context Provider
```
🎯 [RecordContext] Setting current record: {
  id: "...",
  name: "HCI Energy",
  type: "companies"
}
```

This should appear when navigating to the company page. If missing:
- Check `UniversalRecordTemplate` component
- Verify `setCurrentRecord` is called in useEffect

### 2. Record Data Completeness

Check if the record has all required fields:
```javascript
// In console, type:
console.log('Current Record:', currentRecord);
```

Look for:
- `name` or `fullName`
- `industry`
- `description`
- `website`
- `employeeCount` or `size`

If fields are missing:
- Check `PipelineDetailPage` data fetching
- Verify full record is loaded (not just cached partial data)
- Check database record has enriched data

### 3. Timing Issues

If logs show context is set but AI doesn't receive it:
- Check timing between record loading and AI query
- Add delay or loading state before allowing queries
- Clear session storage cache: `sessionStorage.clear()`

## Additional Test Cases

### Test Case 1: Multiple Companies
1. Navigate to HCI Energy
2. Send AI query
3. Navigate to another company
4. Send AI query
5. Verify context updates for each company

### Test Case 2: Tab Navigation
1. Navigate to HCI Energy
2. Switch to "People" tab
3. Switch back to "Buyer Group" tab
4. Send AI query
5. Verify context is maintained

### Test Case 3: Direct URL Access
1. Copy HCI Energy URL
2. Open in new tab (or refresh page)
3. Wait for page to load completely
4. Send AI query
5. Verify context loads from direct URL access

### Test Case 4: Other Record Types
Test with:
- People record: `/toptemp/people/[person-slug]`
- Lead record: `/toptemp/leads/[lead-slug]`
- Opportunity record: `/toptemp/opportunities/[opportunity-slug]`

Verify context warning appears if context missing for any record type.

## Success Criteria

The fix is successful when:

1. ✅ Console logs show `hasCurrentRecord: true` for all three checkpoints
2. ✅ Record has > 5 populated fields
3. ✅ AI response includes specific company information
4. ✅ No warning banner appears (when context is present)
5. ✅ Warning banner appears when context is genuinely missing
6. ✅ Logs provide clear diagnostic information for troubleshooting

## Reporting Results

When testing, please report:

1. **Console Log Screenshots** showing the three key log entries
2. **AI Response** (copy/paste the response)
3. **Warning Banner Status** (appeared or not)
4. **Record Data Completeness** from console logs
5. **Any Errors** in console (red errors)

This information helps identify:
- Whether fix is working
- Where in the pipeline context is being lost
- What additional fixes may be needed

