# Bugfix: Speedrun Ranking Display & Styling

## Issues Reported

### Issue 1: Multiple Records Showing Rank #1
User reported: "rank numbering on List View of Speedrun is off. Displaying 29 results but multiple are labeled as #1"

### Issue 2: Ugly Green Styling
User reported: Green highlighting for completed items is too harsh/ugly

## Root Causes

### Ranking Issue
**Problem**: The data loader was only setting `winningScore.rank` (nested property), but the table rendering looked for `globalRank` or `rank` at the top level. When those didn't exist, it fell back to array index `(index + 1)`, causing multiple items at the same position to show the same rank.

**Code Path**:
1. `useSpeedrunDataLoader.tsx` creates ranked data with only `winningScore.rank`
2. Table renders and checks: `record['globalRank'] || record['rank'] || (index + 1)`
3. Both globalRank and rank are undefined → falls back to index
4. Multiple records could have same index after filtering/pagination

### Styling Issue
**Problem**: Completed rows used `bg-green-100` which is a bright, harsh green that doesn't match modern UI design principles.

## Solutions

### Fix 1: Proper Rank Assignment

**File**: `src/products/speedrun/hooks/useSpeedrunDataLoader.tsx` (lines 204-217)

Added `globalRank` and `rank` at the top level:

```typescript
const rankedData: RankedSpeedrunPerson[] = transformedData.map((person, index) => ({
  ...person,
  globalRank: index + 1, // ✅ Set at top level for table display
  rank: index + 1, // ✅ Also set as fallback
  winningScore: {
    totalScore: index + 1,
    rank: (index + 1).toString(), // Keep for other uses
    confidence: 0.9,
    // ...
  }
}));
```

### Fix 2: Better Rank Fallback

Changed fallback from array index to '-' to prevent displaying incorrect ranks:

**Files**:
- `src/frontend/components/pipeline/PipelineTableRefactored.tsx` (line 469)
- `src/frontend/components/pipeline/table/TableRow.tsx` (line 1168)

**Before**:
```typescript
displayRank = record['globalRank'] || record['rank'] || (index + 1); // ❌ Bad fallback
```

**After**:
```typescript
displayRank = record['globalRank'] || record['rank'] || record['winningScore']?.rank || '-'; // ✅ Safe fallback
```

### Fix 3: Modern Success Pill Styling

Replaced harsh green with subtle, modern success colors with proper dark mode support:

**Files**:
- `src/frontend/components/pipeline/PipelineTableRefactored.tsx` (line 442)
- `src/frontend/components/pipeline/table/TableRow.tsx` (lines 198, 1150)

**Before**:
```typescript
className={`... ${
  isCompleted 
    ? 'bg-green-100 border-green-300 hover:bg-green-100' // ❌ Harsh, bright
    : 'hover:bg-panel-background border-border'
}`}
```

**After**:
```typescript
className={`... ${
  isCompleted 
    ? 'bg-green-50/50 border-green-200/50 hover:bg-green-50/70 dark:bg-green-950/20 dark:border-green-900/30 dark:hover:bg-green-950/30' // ✅ Subtle, professional
    : 'hover:bg-panel-background border-border'
}`}
```

## Visual Improvements

### Before (Ugly)
- Bright `bg-green-100` - very saturated
- High contrast with white background
- No opacity control
- No dark mode consideration

### After (Professional)
- Light `bg-green-50` with 50% opacity
- Subtle success indication
- Smooth hover transitions (70% opacity)
- Full dark mode support with `green-950/20`
- Matches success pill style from design system

## Changes Made

### Files Modified

1. **src/products/speedrun/hooks/useSpeedrunDataLoader.tsx**
   - Added `globalRank` and `rank` fields at top level
   - Ensures proper ranking display in tables

2. **src/frontend/components/pipeline/PipelineTableRefactored.tsx**
   - Fixed rank fallback logic (no more array index)
   - Updated completed row styling to success pill style

3. **src/frontend/components/pipeline/table/TableRow.tsx**
   - Fixed rank fallback logic (both rendering paths)
   - Updated completed row styling to success pill style

## Testing

### Rank Display Test
1. Open Speedrun in list view
2. Verify each record shows unique rank (1, 2, 3, 12, 15, etc.)
3. No duplicate rank #1 should appear
4. Completed items show ✓ instead of rank
5. If rank is missing, shows '-' instead of wrong number

### Styling Test
1. Complete an action in Speedrun
2. Row should highlight with subtle light green
3. Hover should slightly increase opacity
4. In dark mode, should use very dark green tint
5. Should feel professional, not harsh

## Impact

### Ranking
- ✅ Each record now has proper unique rank
- ✅ No more duplicate #1 ranks
- ✅ Graceful handling of missing ranks (shows '-')
- ✅ Maintains checkmark for completed items

### Styling
- ✅ Professional, subtle success indication
- ✅ Better visual hierarchy
- ✅ Dark mode support
- ✅ Matches design system (success pills)
- ✅ Better user experience

## Edge Cases Handled

1. **Missing Rank Data**: Shows '-' instead of wrong number
2. **Completed Items**: Still show ✓ in rank column
3. **Dark Mode**: Proper dark mode green tints
4. **Hover States**: Smooth opacity transitions
5. **Multiple Data Sources**: Checks globalRank, rank, and winningScore.rank

## Date

November 7, 2025

## Status

✅ **Fixed and Ready for Testing**

