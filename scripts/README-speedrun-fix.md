# Speedrun Ranking Fix Scripts

This directory contains scripts to diagnose and fix speedrun ranking issues where production shows "in 7d" instead of "Now" or "Today" for top-ranked prospects.

## Problem Summary

After investigating git history, the issue was identified as **data staleness** in production:

- **Development**: Fresh `nextActionDate` values showing "Now" and "Today" correctly
- **Production**: Stale `nextActionDate` values showing "in 7d" instead of proper timing

The code logic is correct - the problem is that `nextActionDate` values in the database are not being updated when rankings change.

## Scripts Overview

### 1. `diagnose-speedrun-data.ts` - Diagnostic Script
**Purpose**: Check the current state of speedrun data in the database

**Usage**:
```bash
tsx scripts/diagnose-speedrun-data.ts <workspace-id-1> [workspace-id-2] ...
```

**Example**:
```bash
tsx scripts/diagnose-speedrun-data.ts 01K7464TNANHQXPCZT1FYX205V
```

**What it checks**:
- Total people in workspace
- How many have `globalRank` values (1-50)
- How many have `nextActionDate` values
- How many top 50 people have stale `nextActionDate` values
- Shows top 10 people with their current timing

### 2. `fix-speedrun-next-actions.ts` - Next Actions Fix
**Purpose**: Regenerate `nextActionDate` values for all people based on their current `globalRank`

**Usage**:
```bash
# Dry run (no changes)
tsx scripts/fix-speedrun-next-actions.ts --dry-run <workspace-id-1> [workspace-id-2] ...

# Apply changes
tsx scripts/fix-speedrun-next-actions.ts <workspace-id-1> [workspace-id-2] ...
```

**Example**:
```bash
# Check what would be changed
tsx scripts/fix-speedrun-next-actions.ts --dry-run 01K7464TNANHQXPCZT1FYX205V

# Apply the fix
tsx scripts/fix-speedrun-next-actions.ts 01K7464TNANHQXPCZT1FYX205V
```

**What it does**:
- Calculates new `nextActionDate` based on `globalRank`:
  - Rank 1-50: TODAY (or tomorrow if action already today)
  - Rank 51-200: 2-3 days out
  - Rank 201-500: 7 days out
  - Rank 500+: 14 days out
- Generates appropriate `nextAction` text
- Updates database with new values

### 3. `fix-speedrun-complete.ts` - Complete Fix
**Purpose**: Performs a complete fix including re-ranking and next action date updates

**Usage**:
```bash
# Dry run (no changes)
tsx scripts/fix-speedrun-complete.ts --dry-run <workspace-id> <user-id>

# Apply changes
tsx scripts/fix-speedrun-complete.ts <workspace-id> <user-id>
```

**Example**:
```bash
# Check what would be changed
tsx scripts/fix-speedrun-complete.ts --dry-run 01K7464TNANHQXPCZT1FYX205V 01K7469230N74BVGK2PABPNNZ9

# Apply the complete fix
tsx scripts/fix-speedrun-complete.ts 01K7464TNANHQXPCZT1FYX205V 01K7469230N74BVGK2PABPNNZ9
```

**What it does**:
1. Diagnoses current state
2. Re-ranks people if needed (assigns sequential ranks 1-N)
3. Updates `nextActionDate` values based on new ranks
4. Verifies the fix worked
5. Shows before/after comparison

### 4. `test-speedrun-api.ts` - API Testing
**Purpose**: Test the speedrun API endpoints to verify they're working correctly

**Usage**:
```bash
tsx scripts/test-speedrun-api.ts <workspace-id> <user-id>
```

**Example**:
```bash
tsx scripts/test-speedrun-api.ts 01K7464TNANHQXPCZT1FYX205V 01K7469230N74BVGK2PABPNNZ9
```

**What it tests**:
- Speedrun API endpoint (`/api/v1/speedrun`)
- Re-rank API endpoint (`/api/v1/speedrun/re-rank`)
- Analyzes response data for timing distribution
- Shows top 10 people with their timing
- Compares before/after re-ranking

## Quick Fix Workflow

### For Production Issues:

1. **Diagnose the problem**:
   ```bash
   tsx scripts/diagnose-speedrun-data.ts YOUR_WORKSPACE_ID
   ```

2. **Apply the complete fix**:
   ```bash
   tsx scripts/fix-speedrun-complete.ts YOUR_WORKSPACE_ID YOUR_USER_ID
   ```

3. **Test the API**:
   ```bash
   tsx scripts/test-speedrun-api.ts YOUR_WORKSPACE_ID YOUR_USER_ID
   ```

4. **Clear browser cache and refresh the speedrun page**

### For Development/Testing:

1. **Dry run first**:
   ```bash
   tsx scripts/fix-speedrun-complete.ts --dry-run YOUR_WORKSPACE_ID YOUR_USER_ID
   ```

2. **Apply if results look good**:
   ```bash
   tsx scripts/fix-speedrun-complete.ts YOUR_WORKSPACE_ID YOUR_USER_ID
   ```

## Expected Results

After running the fix scripts, you should see:

- **Top 10 people** showing "Now" or "Tomorrow" timing instead of "in 7d"
- **API responses** with proper timing distribution
- **Database records** with `nextActionDate` set to today for top 50 people

## Code Changes Made

### 1. Updated Re-Rank API (`src/app/api/v1/speedrun/re-rank/route.ts`)
- Added `calculateRankBasedDate()` function
- Modified update logic to also update `nextActionDate` when re-ranking
- Ensures `nextActionDate` stays in sync with `globalRank`

### 2. Created Diagnostic Scripts
- `diagnose-speedrun-data.ts` - Database state analysis
- `fix-speedrun-next-actions.ts` - Next action date regeneration
- `fix-speedrun-complete.ts` - Complete system fix
- `test-speedrun-api.ts` - API endpoint testing

## Troubleshooting

### Issue: Scripts show "No changes needed"
**Cause**: Data is already correct
**Solution**: Check if the issue is in the frontend cache - try hard refresh

### Issue: Still seeing "in 7d" after fix
**Cause**: Browser cache or API cache
**Solution**: 
1. Clear browser cache (Ctrl+Shift+R)
2. Add `?refresh=true` to API calls
3. Wait 5 minutes for API cache to expire

### Issue: API returns no data
**Cause**: Authentication or workspace issues
**Solution**: 
1. Check workspace ID and user ID are correct
2. Ensure user has access to the workspace
3. Check if the API server is running

### Issue: Database connection errors
**Cause**: Prisma client configuration
**Solution**: 
1. Check database connection string
2. Ensure database is accessible
3. Run `npx prisma generate` to update client

## Prevention

To prevent this issue in the future:

1. **The re-rank API now updates `nextActionDate`** - this should prevent staleness
2. **Monitor the diagnostic script** - run it periodically to check data health
3. **Set up alerts** - if top 50 people show "in 7d" timing, something is wrong

## Files Modified

- `src/app/api/v1/speedrun/re-rank/route.ts` - Added nextActionDate calculation
- `scripts/diagnose-speedrun-data.ts` - New diagnostic script
- `scripts/fix-speedrun-next-actions.ts` - New next actions fix script
- `scripts/fix-speedrun-complete.ts` - New complete fix script
- `scripts/test-speedrun-api.ts` - New API testing script
- `scripts/README-speedrun-fix.md` - This documentation
