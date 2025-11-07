# Record Creation and Actions Fixes

## Overview

Fixed several issues related to record creation, default field values, action date display, and next action calculations.

## Issues Fixed

### 1. Default Field Values on Record Creation

**Problem**: When creating a record, some fields were showing hardcoded default values instead of being blank.

**Solution**: Updated `UniversalOverviewTab.tsx` to show `null` instead of hardcoded defaults:
- **Buyer Group Role**: Changed from `'Stakeholder'` default to `null`
- **Decision Power**: Changed from `'70'` default to `null` (checks both `customFields.decisionPower` and `decisionPower`)
- **Engagement Level**: Changed from `'Medium'` default to `null` (checks both `customFields.engagementLevel` and `engagementLevel`)

**Files Modified**:
- `/src/frontend/components/pipeline/tabs/UniversalOverviewTab.tsx` (lines 905, 931, 943)

### 2. Action Date Display Consistency

**Problem**: In the table, newly created records showed "Action - Never" and "Record just created", but on the record detail view it showed "Today".

**Solution**: Updated the record detail view to check if there's a meaningful action before showing the date:
- Now checks if lastAction is empty, '-', 'No action', 'Record created', or 'Company record created'
- If empty/placeholder action, shows "Never" instead of the date timing
- This matches the behavior in the table view

**Files Modified**:
- `/src/frontend/components/pipeline/tabs/UniversalOverviewTab.tsx` (lines 1036-1046)

**Logic**:
```typescript
{(() => {
  // Only show timing if there's a meaningful action
  const lastAction = recordData.lastAction || record.lastAction;
  const isEmptyAction = !lastAction || 
    lastAction === '-' || 
    lastAction === 'No action' ||
    lastAction === 'Record created' ||
    lastAction === 'Company record created';
  
  return isEmptyAction ? 'Never' : getTimingLabel(recordData.lastContact);
})()}
```

### 3. Next Action Date Calculation

**Problem**: Next action dates were sometimes showing negative values (e.g., "-14 days") because they were calculated from old last action dates in the past.

**Solution**: Updated the auto-calculation logic to ensure next action dates are always in the future:
- Calculate the next action date from the last action or creation date
- Check if the calculated date is in the past
- If in the past, recalculate from "now" instead
- This ensures all next action dates are future dates

**Files Modified**:
- `/src/app/api/v1/people/route.ts` (lines 506-530)
- `/src/app/api/v1/companies/route.ts` (lines 395-419)
- `/src/app/api/v1/clients/route.ts` (lines 422-446)

**Logic**:
```typescript
// Calculate next action date from last action or creation date
const calculatedDate = addBusinessDays(new Date(lastActionDateForCalc), businessDaysToAdd);

// Ensure next action date is always in the future
const now = new Date();
if (calculatedDate.getTime() < now.getTime()) {
  // If calculated date is in the past, calculate from now instead
  nextActionDate = addBusinessDays(now, businessDaysToAdd);
} else {
  nextActionDate = calculatedDate;
}
```

### 4. Next Action Date Editability

**Problem**: Users couldn't edit the next action date, only the next action text.

**Solution**: Made the nextActionDate field editable in the record detail view:
- Converted the timing pill from a read-only span to an InlineEditField
- Added `fieldType="date"` to enable date picker
- Both nextActionDate and nextAction text are now editable

**Files Modified**:
- `/src/frontend/components/pipeline/tabs/UniversalOverviewTab.tsx` (lines 1062-1071)

**Implementation**:
```typescript
<div className="flex items-center gap-2 flex-wrap">
  <InlineEditField
    value={recordData.nextActionDate || null}
    field="nextActionDate"
    onSave={onSave}
    recordId={record.id}
    recordType={recordType}
    onSuccess={handleSuccess}
    className="px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-hover text-foreground"
    fieldType="date"
  />
  <InlineEditField
    value={recordData.nextAction || null}
    field="nextAction"
    onSave={onSave}
    recordId={record.id}
    recordType={recordType}
    onSuccess={handleSuccess}
    className="text-sm font-medium text-foreground"
  />
</div>
```

## Skip Miller ProActive Selling Timing

The next action date calculation continues to use Skip Miller ProActive Selling methodology based on prospect rank:
- **Rank 1-10 (Hot)**: 2 business days
- **Rank 11-50 (Warm)**: 3 business days
- **Rank 51-100 (Active)**: 5 business days
- **Rank 101-500 (Nurture)**: 7 business days (1 week)
- **Rank 501+ (Cold)**: 14 business days (2 weeks)

The key improvement is that these dates are now always calculated to be in the future, not in the past.

## Testing Recommendations

### Manual Testing
1. **Create a new record** and verify:
   - Buyer Group Role is blank (not "Stakeholder")
   - Decision Power is blank (not "70")
   - Engagement Level is blank (not "Medium")

2. **Check new record action display**:
   - In the table: Should show "Action - Never" and "Record just created"
   - On the record detail: Should show "Never" (not "Today")

3. **Check next action dates**:
   - All next action dates should be in the future
   - No negative day values (e.g., no "-14 days")
   - Dates should follow Skip Miller timing based on rank

4. **Edit next action**:
   - Click on the next action date pill to edit it
   - Should show a date picker
   - Save a new date and verify it persists
   - Edit the next action text and verify it saves

### Edge Cases
1. Very old records with last actions years ago - next action should still be calculated from now
2. Records created today - next action should be calculated from today + business days
3. Records with custom next action dates - should not be overwritten by auto-calculation
4. Records without any actions - should show "Never" consistently

## Related Files

### Frontend
- `/src/frontend/components/pipeline/tabs/UniversalOverviewTab.tsx` - Record detail view
- `/src/frontend/components/pipeline/table/TableRow.tsx` - Table row display (unchanged, already working correctly)

### Backend APIs
- `/src/app/api/v1/people/route.ts` - People API with auto-calculation
- `/src/app/api/v1/companies/route.ts` - Companies API with auto-calculation
- `/src/app/api/v1/clients/route.ts` - Clients API with auto-calculation

### Previous Work
- `/src/platform/constants/buyer-group-roles.ts` - Buyer group role constants (from previous buyer group role dropdown implementation)

## Benefits

1. **Cleaner UI**: No more confusing default values that look like real data
2. **Consistency**: Action date display matches between table and detail view
3. **Future-Focused**: Next actions are always forward-looking, never showing past dates
4. **Flexibility**: Users can now customize both the timing and text of next actions
5. **ProActive Selling**: Continues to follow Skip Miller methodology with improved date calculation

## Notes

- All changes are backward compatible with existing data
- No database migrations required
- Existing records with saved next action dates are preserved
- Auto-calculation only applies when nextActionDate is null/undefined

