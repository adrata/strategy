# Plan: Fix Actions Tab Everywhere & Verify Field Persistence

## Overview
Ensure action editing works correctly in all locations where UniversalActionsTab is used, and verify that all company page fields persist correctly (matching the behavior of the leads page).

## Issues Identified

### 1. ✅ FIXED: UniversalRecordTemplate Actions Editing
**Status:** Already fixed - `recordTypeParam === 'action'` check added

### 2. 🔴 BROKEN: UpdateModal Actions Editing  
**Status:** Needs fix - No `onSave` handler provided

## Implementation Plan

### Step 1: Fix UpdateModal Actions Tab
**File:** `src/frontend/components/pipeline/UpdateModal.tsx`

**Current code (line 869-873):**
```typescript
const renderTimelineTab = () => (
  <div className="p-6">
    <UniversalActionsTab record={record} recordType={recordType} />
  </div>
);
```

**Required change:**
```typescript
const renderTimelineTab = () => (
  <div className="p-6">
    <UniversalActionsTab 
      record={record} 
      recordType={recordType}
      onSave={async (field: string, value: string, recordId?: string, recordTypeParam?: string) => {
        // Update the action via API
        const updateData = { [field]: value };
        await onUpdate(updateData);
      }}
    />
  </div>
);
```

### Step 2: Verify All UniversalActionsTab Usages

**Locations to check:**
1. ✅ `UniversalRecordTemplate.tsx` line 3622 (history tab) - HAS onSave
2. ✅ `UniversalRecordTemplate.tsx` line 3626 (actions tab) - HAS onSave
3. ✅ `UniversalRecordTemplate.tsx` line 3630 (timeline tab) - HAS onSave
4. 🔴 `UpdateModal.tsx` line 871 (timeline tab) - MISSING onSave

### Step 3: Test Field Persistence

**Company Page Test Cases:**
- LinkedIn Navigator URL (newly added field)
- All standard company fields (name, website, email, phone)
- Save → Navigate away → Return → Verify persistence

**Leads Page Test Cases:**  
- All standard person fields (name, email, phone, company)
- Save → Navigate away → Return → Verify persistence

**Actions Test Cases:**
- Edit action title in UniversalRecordTemplate → Verify saves
- Edit action description in UniversalRecordTemplate → Verify saves
- Edit action in UpdateModal → Verify saves (after fix)

## Files to Modify

1. `src/frontend/components/pipeline/UpdateModal.tsx`
   - Add `onSave` handler to `UniversalActionsTab` at line 871

## Expected Outcomes

1. ✅ Action editing works in UniversalRecordTemplate (all tabs)
2. ✅ Action editing works in UpdateModal  
3. ✅ Company LinkedIn Navigator field saves and persists
4. ✅ All company fields persist correctly after navigation
5. ✅ Behavior matches leads page field persistence

## Testing Checklist

### UniversalRecordTemplate Actions
- [ ] Open company record → Actions tab → Edit action title → Save → Refresh page → Verify persists
- [ ] Open company record → Actions tab → Edit action description → Save → Navigate away → Return → Verify persists
- [ ] Open leads record → Actions tab → Edit action → Verify saves correctly

### UpdateModal Actions
- [ ] Open UpdateModal for any record → Actions tab → Edit action → Verify saves

### Company Fields
- [ ] Edit LinkedIn Navigator → Save → Reload → Verify persists
- [ ] Edit company name → Navigate away → Return → Verify persists
- [ ] Edit company notes → Refresh page → Verify persists

### Leads Fields (Baseline Comparison)
- [ ] Edit person name → Navigate away → Return → Verify persists
- [ ] Edit person email → Refresh page → Verify persists

## Success Criteria

1. All action inline edits save successfully across all UI contexts
2. No "Company not found" errors when editing actions
3. Company page field persistence matches leads page behavior
4. LinkedIn Navigator field works correctly on company records

