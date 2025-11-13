# Missing Tabs and Blank Page Fix

## Issues Fixed
1. **Missing People Tab** - Leads and prospects were missing the "People" (co-workers) tab
2. **Missing Buyer Group Tab** - Leads and prospects were missing the "Buyer Group" tab
3. **Blank Page Rendering** - Intermittent blank page when viewing lead records

## Problem Details

### Issue 1: Missing Tabs for Leads
When viewing Aaron Wunderlich's lead record at:
```
https://action.adrata.com/toptemp/leads/aaron-wunderlich-01K9QDJF94P7YRH0JJ948V3ZA6/?tab=overview
```

The page was missing:
- **People tab** (to see co-workers at Salt River Project)
- **Buyer Group tab** (to see buyer group members)

**Root Cause**: The tab configuration in `tab-registry.tsx` only included these tabs for `people` records, not for `leads` or `prospects` records.

### Issue 2: Blank Page Rendering
Sometimes Aaron's page would render as completely blank with no error messages.

**Root Cause**: Tab filtering logic was trying to access record data before it finished loading, causing rendering failures that weren't caught by error boundaries.

## Solution Implemented

### Part 1: Add Missing Tabs

**File**: `src/frontend/components/pipeline/config/tab-registry.tsx`

Added People and Buyer Group tabs to both `leads` and `prospects` configurations:

```typescript
leads: [
  { id: 'overview', label: 'Overview', component: UniversalOverviewTab },
  { id: 'company', label: 'Company', component: CompanyOverviewTab },
  { id: 'actions', label: 'Actions', component: UniversalActionsTab },
  { id: 'intelligence', label: 'Intelligence', component: UniversalInsightsTab },
  { id: 'buyer-groups', label: 'Buyer Group', component: UniversalBuyerGroupsTab }, // ✅ ADDED
  { id: 'co-workers', label: 'People', component: UniversalPeopleTab },              // ✅ ADDED
  { id: 'career', label: 'Career', component: ComprehensiveCareerTab },
  { id: 'notes', label: 'Notes', component: NotesTab }
],

prospects: [
  { id: 'overview', label: 'Overview', component: ProspectOverviewTab },
  { id: 'company', label: 'Company', component: CompanyOverviewTab },
  { id: 'actions', label: 'Actions', component: UniversalActionsTab },
  { id: 'intelligence', label: 'Intelligence', component: UniversalInsightsTab },
  { id: 'buyer-groups', label: 'Buyer Group', component: UniversalBuyerGroupsTab }, // ✅ ADDED
  { id: 'co-workers', label: 'People', component: UniversalPeopleTab },              // ✅ ADDED
  { id: 'career', label: 'Career', component: ComprehensiveCareerTab },
  { id: 'notes', label: 'Notes', component: NotesTab }
],
```

### Part 2: Extend Tab Filtering Logic

Updated the conditional tab filtering to apply to `leads` and `prospects` in addition to `people`:

```typescript
// Before - only applied to people records
if (recordType === 'people' && record) {
  const isInBuyerGroup = record.isBuyerGroupMember || record.buyerGroupRole || record.customFields?.buyerGroupRole;
  // ... filtering logic
}

// After - applies to leads, prospects, and people
if ((recordType === 'people' || recordType === 'leads' || recordType === 'prospects') && record && record.id) {
  const isInBuyerGroup = record.isBuyerGroupMember || record.buyerGroupRole || record.customFields?.buyerGroupRole;
  filteredTabs = filteredTabs.filter(tab => {
    if (tab.id === 'buyer-groups' && !isInBuyerGroup) return false;
    if (tab.id === 'co-workers' && isInBuyerGroup) return false;
    return true;
  });
}
```

**Key Safety Improvement**: Added `record.id` check to ensure data is fully loaded before filtering tabs, preventing blank page issues.

## How Tab Filtering Works

The system now intelligently shows either **People** or **Buyer Group** tabs based on the person's status:

### For Regular People (Not in Buyer Group)
Shows **"People"** tab to view co-workers at their company:
- Overview
- Company
- Actions
- Intelligence
- **People** ← Shows co-workers
- Career
- Notes

### For Buyer Group Members
Shows **"Buyer Group"** tab instead of People:
- Overview
- Company
- Actions
- Intelligence
- **Buyer Group** ← Shows buyer group details
- Career
- Notes

## Testing

### Test Case 1: Aaron Wunderlich (Regular Lead)
1. Navigate to: `https://action.adrata.com/toptemp/leads/aaron-wunderlich-01K9QDJF94P7YRH0JJ948V3ZA6/?tab=overview`
2. Verify tabs appear: Overview, Company, Actions, Intelligence, **People**, Career, Notes
3. Click **People** tab
4. Should see co-workers from Salt River Project (Mike Unser, Andrew Teneriello, etc.)

### Test Case 2: Lead with Buyer Group Role
1. Find a lead that is marked as a buyer group member
2. Verify tabs show: Overview, Company, Actions, Intelligence, **Buyer Group**, Career, Notes
3. **People** tab should NOT appear (replaced by Buyer Group)

### Test Case 3: Blank Page Prevention
1. Open multiple lead records in quick succession
2. Refresh pages multiple times
3. Verify no blank pages appear
4. If loading takes time, skeleton loader should show instead of blank page

## Impact

**Fixed for all record types:**
- ✅ Leads now show People/Buyer Group tabs
- ✅ Prospects now show People/Buyer Group tabs
- ✅ People records continue to work as before
- ✅ Blank page issues prevented with safety checks

**User Experience Improvements:**
- Can now view co-workers directly from lead records
- Can now view buyer groups directly from lead records
- No more intermittent blank pages
- Faster navigation with proper loading states

## Error Handling

The system includes multiple layers of error handling:

1. **TabErrorBoundary** - Catches tab-specific rendering errors
2. **Loading States** - Shows skeleton loaders during data fetching
3. **Blank Page Detection** - Shows "Record Not Found" message with retry button
4. **Safety Checks** - Validates data before filtering to prevent crashes

If a tab fails to render, users see:
- Error message with tab name
- Debug information (in development mode)
- "Retry Tab" button
- "Reload Page" button

## Related Files
- `src/frontend/components/pipeline/config/tab-registry.tsx` - Tab configuration and filtering
- `src/frontend/components/pipeline/TabErrorBoundary.tsx` - Error handling
- `src/frontend/components/pipeline/PipelineDetailPage.tsx` - Blank page detection
- `src/app/[workspace]/(revenue-os)/leads/[id]/page.tsx` - Lead detail page wrapper

## Prevention

To prevent similar issues in the future:

1. **Always add tabs to all relevant record types** when creating new tabs
2. **Test tab filtering with null/undefined data** to catch loading race conditions
3. **Use safety checks (`record && record.id`)** before accessing record properties
4. **Wrap tab content in error boundaries** to prevent full page crashes
5. **Monitor console logs** for tab rendering errors during development

