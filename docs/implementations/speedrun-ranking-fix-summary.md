# Speedrun Ranking Fix - Implementation Summary

## Date
October 26, 2025

## Problem Statement
People who just had an action completed against them were appearing at the **top** of the speedrun 1-50 list when they should move **down** in rank. This was causing confusion as recently contacted people were being prioritized over uncontacted prospects.

## Root Causes Identified

### 1. Re-Ranking API Excluded Recently Contacted People ❌
**File**: `src/app/api/v1/speedrun/re-rank/route.ts` (lines 71-92)

**Problem**: The re-ranking endpoint was filtering out people who had actions completed today using:
```typescript
const completedPersonIds = completedToday.map(action => action.personId);
const allPeople = await prisma.people.findMany({
  where: {
    id: { notIn: completedPersonIds }  // ❌ REMOVED THEM ENTIRELY
  }
});
```

This caused recently contacted people to **disappear** from the speedrun list instead of moving down in rank.

### 2. Timing Urgency Scoring Was Backwards ❌
**File**: `src/products/speedrun/scoring.ts` (lines 264-268)

**Problem**: The `calculateTimingUrgency()` function gave **positive** points for recent contact:
```typescript
// BACKWARDS LOGIC:
if (daysSinceContact >= 30) urgencyScore += 10;  // Not contacted = +10
else if (daysSinceContact >= 1) urgencyScore += 2;  // Contacted recently = +2
```

This rewarded recent contact instead of penalizing it.

### 3. Speed Scoring Was Backwards ❌
**File**: `src/products/speedrun/scoring.ts` (lines 307-308)

**Problem**: The `calculateSpeedScore()` function gave **bonus** points for recent contact:
```typescript
// BACKWARDS LOGIC:
if (contact.daysSinceLastContact <= 7) speedScore += 10;  // Recent contact = +10 bonus
```

### 4. Email Engagement Scoring Overrode Penalties ❌
**File**: `src/products/speedrun/scoring.ts` (lines 236-246)

**Problem**: Recent activity bonuses were applied even for same-day contact, overriding the intended penalties.

## Solutions Implemented

### Fix 1: Keep All People in Ranking Pool ✅
**File**: `src/app/api/v1/speedrun/re-rank/route.ts`

**Changed**:
- Removed the `completedToday` query that filtered out recently contacted people
- Removed the `completedPersonIds` exclusion from the people query
- Now fetches ALL active people in the workspace
- Let the scoring algorithm naturally rank recently contacted people lower

**Result**: Recently contacted people now stay in the list and move down in rank based on their scores.

### Fix 2: Penalize Recent Contact in Timing Urgency ✅
**File**: `src/products/speedrun/scoring.ts` (lines 264-272)

**Changed**:
```typescript
// NEW LOGIC - Penalize recent contact, reward people who need attention:
if (daysSinceContact === 0) urgencyScore -= 30;        // Contacted today = -30
else if (daysSinceContact === 1) urgencyScore -= 20;   // Yesterday = -20
else if (daysSinceContact <= 3) urgencyScore -= 15;    // 2-3 days ago = -15
else if (daysSinceContact <= 7) urgencyScore -= 10;    // This week = -10
// BONUS for people who need attention:
else if (daysSinceContact >= 30) urgencyScore += 15;   // 30+ days = +15
else if (daysSinceContact >= 14) urgencyScore += 10;   // 14-29 days = +10
else if (daysSinceContact >= 7) urgencyScore += 5;     // 7-13 days = +5
```

**Result**: People contacted today get a -30 penalty, pushing them down significantly.

### Fix 3: Penalize Recent Contact in Speed Score ✅
**File**: `src/products/speedrun/scoring.ts` (lines 311-316)

**Changed**:
```typescript
// NEW LOGIC - Penalize recent contact, reward people who need attention:
if (contact.daysSinceLastContact === 0) speedScore -= 25;      // Contacted today = -25
else if (contact.daysSinceLastContact === 1) speedScore -= 15; // Yesterday = -15
else if (contact.daysSinceLastContact <= 7) speedScore -= 10;  // This week = -10
else if (contact.daysSinceLastContact >= 30) speedScore += 10; // 30+ days = +10
else if (contact.daysSinceLastContact >= 14) speedScore += 5;  // 14-29 days = +5
```

**Result**: Additional penalty for recently contacted people in speed-focused scoring.

### Fix 4: Adjust Email Engagement Bonus ✅
**File**: `src/products/speedrun/scoring.ts` (lines 236-248)

**Changed**:
```typescript
// Only give bonus if contacted 7-30 days ago (not too recent)
if (daysSince > 7 && daysSince <= 14) {
  emailScore += 10;
  readyToBuyScore += 10;
} else if (daysSince > 14 && daysSince <= 30) {
  emailScore += 5;
  readyToBuyScore += 5;
}
// No bonus for very recent contact (0-7 days) - let the penalty apply
```

**Result**: Email engagement bonuses no longer override the penalties for recent contact.

### Fix 5: Improved Data Mapping ✅
**File**: `src/app/api/v1/speedrun/re-rank/route.ts` (lines 116-118)

**Changed**:
- Added explicit `lastActionDate` field mapping from database
- Ensures the scoring algorithm receives the correct date for penalty calculations

### Fix 6: Enhanced Debug Logging ✅
**File**: `src/app/api/v1/speedrun/re-rank/route.ts` (lines 101, 143-152)

**Added**:
- Log total people being ranked (including recently contacted)
- Log top 10 after re-ranking with scores and last action dates
- Helps verify the fix is working correctly

## Expected Behavior After Fix

1. ✅ **Person contacted today**: Moves to rank #40-50 (bottom of list)
2. ✅ **Person contacted yesterday**: Moves to rank #30-40
3. ✅ **Person contacted this week**: Moves to rank #20-30
4. ✅ **Person not contacted in 14+ days**: Moves to top ranks (#1-10)
5. ✅ **Person not contacted in 30+ days**: Gets highest priority (rank #1-5)
6. ✅ **All people stay visible**: No one disappears from the list

## Testing Verification

To verify the fix works:

1. Complete an action against person ranked #1
2. Wait for auto re-ranking to trigger (happens automatically)
3. Refresh the speedrun list
4. Verify person #1 moved down to rank #30-50
5. Verify they're still visible in the list
6. Verify uncontacted people moved up to top ranks

## Files Modified

1. `src/app/api/v1/speedrun/re-rank/route.ts` - Removed exclusion filter, improved logging
2. `src/products/speedrun/scoring.ts` - Fixed timing urgency, speed score, and email engagement scoring

## Impact

- **User Experience**: Users will now see uncontacted prospects at the top of their speedrun list
- **Productivity**: Prevents wasting time on recently contacted people
- **Accuracy**: Ranking now correctly reflects who needs attention most
- **Transparency**: Debug logging helps verify the system is working correctly

## Notes

- The auto re-ranking still triggers after every action completion (this is correct behavior)
- The 5-minute cache on speedrun data means changes may take up to 5 minutes to appear
- The scoring penalties are cumulative across multiple scoring functions for stronger effect

