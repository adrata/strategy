# AI Context Missing Fix

## Issue

When users view a company record (e.g., HCI Energy at `/toptemp/companies/hci-energy-...`), the AI assistant in the right panel responds without access to the company's detailed context. The AI returns generic responses saying it doesn't have access to detailed business context, even though the user is viewing a specific company record.

## Root Cause

The issue occurs due to a timing problem where:

1. The AI assistant can be queried before the record context is fully loaded and set by the `UniversalRecordTemplate` component
2. Even when the record context is set, there was insufficient logging to diagnose when and what data was being sent to the AI
3. The record data might not include all enriched fields (description, industry details, etc.) needed for comprehensive AI responses

## Fix Implementation

### 1. Enhanced Logging

Added comprehensive logging at three key points in the data flow:

#### Frontend (RightPanel.tsx)
- Added detailed logging before sending AI requests showing:
  - Whether record context exists
  - Record ID, name, company, title
  - Whether enriched fields are populated (website, industry, employee count, description)
  - Current URL and pathname

```typescript
console.log('🤖 [AI CHAT REQUEST] Sending context to AI:', {
  hasCurrentRecord: !!currentRecord,
  recordType,
  recordId: currentRecord?.id,
  recordName: currentRecord?.name || currentRecord?.fullName,
  recordCompany: currentRecord?.company || currentRecord?.companyName,
  // ... more fields
});
```

#### API Route (ai-chat/route.ts)
- Added logging to show what record data was received by the API
- Shows total fields populated and field completeness

```typescript
console.log('🎯 [AI CHAT] Current record context received:', {
  recordType,
  id: currentRecord.id,
  name: currentRecord.name || currentRecord.fullName,
  // ... detailed field analysis
});
```

#### AI Context Service (AIContextService.ts)
- Added logging in `buildRecordContext` to show:
  - Whether record context is being built
  - Record data completeness (which critical fields are populated)
  - Description length and other enrichment data availability

### 2. Visual Feedback

Added a context warning banner that appears in the AI chat panel when:
- User is on a record page (companies, people, leads, prospects, opportunities)
- No record context is available
- Messages have been sent (doesn't show on welcome screen)

The banner displays:
- Warning icon and "Limited Context Available" heading
- Explanation that AI is responding without full record context
- Suggestion to refresh the page or ask general questions

### 3. Improved Detection

Added logic to detect when user is on a record page:

```typescript
const isOnRecordPage = window.location.pathname.match(/\/(companies|people|leads|prospects|opportunities)\/[^/]+$/);
```

This helps identify when record context should be available but isn't.

## Files Modified

1. `src/platform/ui/components/chat/RightPanel.tsx`
   - Added logging before AI API calls
   - Added context warning banner
   - Added detection for record pages

2. `src/app/api/ai-chat/route.ts`
   - Added detailed logging of received record context
   - Shows field completeness analysis

3. `src/platform/ai/services/AIContextService.ts`
   - Added logging in `buildRecordContext` method
   - Shows record data completeness

## Testing

To test this fix:

1. Navigate to a company record: `/[workspace]/companies/[company-slug]`
2. Open the browser console (F12)
3. Ask the AI assistant a question about the company
4. Check console logs for:
   - `🤖 [AI CHAT REQUEST]` - Shows what's being sent from frontend
   - `🎯 [AI CHAT]` - Shows what API received
   - `🎯 [AIContextService]` - Shows how context is being built
5. If no context is available, a yellow warning banner should appear in the AI panel

### Expected Behavior

**With Context:**
- Logs show `hasCurrentRecord: true`
- Record fields are populated (name, company, industry, etc.)
- No warning banner appears
- AI responds with specific insights about the company

**Without Context:**
- Logs show `hasCurrentRecord: false` or minimal fields
- Warning banner appears: "Limited Context Available"
- Console warning: `⚠️ [AI CHAT] User is on a record page but no record context is available`
- AI responds with general guidance

## Next Steps

If the logging reveals that:

1. **Record context is null:** Check `UniversalRecordTemplate` to ensure `setCurrentRecord` is being called when the component mounts
2. **Record has minimal fields:** Check the data loading logic in `PipelineDetailPage` to ensure full record data is fetched (not just ID)
3. **Timing issue:** May need to add a delay or loading state before allowing AI queries on record pages

## Related Issues

- Company record pages not setting record context in `RecordContextProvider`
- Race condition between record loading and AI assistant initialization
- Incomplete record data being cached (only ID, not full enriched data)

## Prevention

To prevent this issue in the future:

1. Always set record context when navigating to record pages
2. Ensure full record data (with enriched fields) is loaded before setting context
3. Use the logging added in this fix to diagnose similar issues
4. Consider adding a loading state that prevents AI queries until context is ready

