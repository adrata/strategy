# Speedrun Add Action Modal Fix

## Issue
When clicking the "Add Action" button in the speedrun list view, users encountered issues where:
1. The submit button appeared disabled and wouldn't work
2. The Command+Enter keyboard shortcut wouldn't work
3. It wasn't clear what needed to be done to enable submission

## Root Cause
When the "Add Action" button is clicked in the list view, it opens the `CompleteActionModal` with no person pre-selected (`setSelectedRecord(null)` is called first). This meant:
1. The `personName` prop was undefined/empty
2. The modal opened with an empty person field
3. The submit button was disabled because validation requires a person to be selected
4. Users didn't realize they needed to search for and select a person first

## Solution
Enhanced the `CompleteActionModal` component with the following improvements:

### 1. Auto-Focus Person Search Field
Added a new `useEffect` hook that automatically focuses the person search input field when the modal opens with no person selected. This immediately directs the user's attention to the search field.

```typescript
// Auto-focus person search field when modal opens with no person selected
useEffect(() => {
  if (isOpen && !formData.person && personSearchRef.current) {
    setTimeout(() => {
      personSearchRef.current?.focus();
    }, 100);
  }
}, [isOpen, formData.person]);
```

### 2. Helpful Label Hint
Added an inline hint in the "Person" label that appears when no person is selected:
```typescript
<label className="block text-sm font-medium text-[var(--foreground)] mb-2">
  Person * {!formData.person && <span className="text-xs font-normal text-[var(--muted)]">(Search and select a person to continue)</span>}
</label>
```

### 3. Enhanced Validation
Updated all validation checks to ensure both person AND notes are filled before enabling submission:

**Keyboard Shortcuts:**
- Form-level handler: `!isLoading && formData.person.trim() && formData.action.trim()`
- Document-level handler: `!isLoading && formData.person.trim() && formData.action.trim()`

**Submit Button:**
- Disabled state: `isLoading || !formData.person.trim() || !formData.action.trim()`
- Visual feedback: Button style changes based on both fields being filled

### 4. Improved Submit Button Tooltips
Added contextual tooltips that explain why the button is disabled:
```typescript
title={
  !formData.person.trim() 
    ? 'Please select a person first' 
    : !formData.action.trim()
    ? 'Please add notes before submitting'
    : `Add action (${getCommonShortcut('SUBMIT')})`
}
```

## Impact
This fix applies automatically to all uses of `CompleteActionModal` throughout the application:
- Speedrun list view (where the issue was reported)
- Pipeline tables
- Company details
- Sprint view
- Any other location using this modal

## User Flow
The improved flow when clicking "Add Action" with no person selected:

1. Modal opens with person search field auto-focused
2. User sees hint: "Person * (Search and select a person to continue)"
3. User types to search for a person
4. User selects a person from search results
5. Focus automatically moves to notes field
6. User fills in notes
7. Submit button becomes enabled with tooltip showing "Add action (⌘↩)"
8. User can click submit button OR press Command+Enter to submit

## Files Modified
- `src/platform/ui/components/CompleteActionModal.tsx`
  - Added `personSearchRef` ref for auto-focusing person search field
  - Added auto-focus hook for person search field when no person is selected
  - Added inline hint in person label to guide users
  - Enhanced validation to require both person and notes fields
  - Updated keyboard shortcuts to validate both fields before submission
  - Improved submit button tooltips with contextual messages
  - Fixed missing `formData.person` dependency in useEffect hook (prevents stale closure bug)

## Testing Recommendations
1. Open speedrun list view
2. Click "Add Action" button
3. Verify person search field is auto-focused
4. Search for and select a person
5. Fill in notes
6. Verify submit button is enabled
7. Test both clicking submit button and using Command+Enter
8. Verify action is saved successfully

