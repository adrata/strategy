# Speedrun Ranking Fix - Testing Guide

## Quick Test Procedure

### Test 1: Verify Recently Contacted Person Moves Down

1. **Before Action**:
   - Open speedrun view
   - Note the person at rank #1 (name, company)
   - Take a screenshot

2. **Complete Action**:
   - Click on person #1
   - Add an action (call, email, meeting, etc.)
   - Mark it as completed
   - Save the action

3. **Wait for Re-Ranking**:
   - Auto re-ranking triggers automatically (watch console logs)
   - Wait 5-10 seconds for re-ranking to complete
   - Refresh the page (to clear cache if needed)

4. **Verify Results**:
   - Person #1 should now be at rank #30-50 (bottom of list)
   - Person #1 should still be visible in the list
   - A different person should now be at rank #1
   - Take a screenshot

### Test 2: Verify Uncontacted People Move Up

1. **Identify Uncontacted Person**:
   - Find a person with "Never" in the "Last Action" column
   - Note their current rank

2. **Complete Actions on Top Ranks**:
   - Complete actions on ranks #1, #2, #3
   - Wait for re-ranking after each action

3. **Verify Results**:
   - Uncontacted person should move up significantly
   - People with recent actions should move down

### Test 3: Verify Ranking Persistence

1. **Complete Action on Rank #1**:
   - Add action to person at rank #1
   - Wait for re-ranking

2. **Navigate Away and Back**:
   - Go to a different section (Leads, Prospects, etc.)
   - Come back to Speedrun
   - Verify ranking is still correct

3. **Refresh Page**:
   - Hard refresh the browser (Ctrl+Shift+R)
   - Verify ranking persists

## Console Log Verification

Watch for these console logs to verify the fix is working:

### 1. Re-Ranking Triggered
```
🎯 [AUTO RE-RANKING] Triggered by: action_completion
```

### 2. All People Included
```
🔄 [RE-RANK] Found 150 people to rank (including recently contacted)
```
Should show total count including recently contacted people.

### 3. Top 10 After Re-Ranking
```
🔄 [RE-RANK] Top 10 after re-ranking:
[
  { rank: 1, name: "John Doe", company: "Acme Corp", lastActionDate: undefined, rankingScore: 45.2 },
  { rank: 2, name: "Jane Smith", company: "Tech Inc", lastActionDate: "2025-10-15", rankingScore: 42.8 },
  ...
]
```
- People with `lastActionDate: undefined` or old dates should be at top
- People with recent `lastActionDate` should be at bottom

### 4. Ranking Update Success
```
✅ Successfully re-ranked and updated 50 records
```

## Expected Scoring Patterns

### High Rank (1-10)
- `lastActionDate`: `undefined` or 30+ days ago
- `rankingScore`: 40-50+
- Status: "Never contacted" or "Contacted 30+ days ago"

### Mid Rank (11-30)
- `lastActionDate`: 7-30 days ago
- `rankingScore`: 20-40
- Status: "Contacted 1-4 weeks ago"

### Low Rank (31-50)
- `lastActionDate`: 0-7 days ago (especially today)
- `rankingScore`: 0-20 (can be negative)
- Status: "Contacted today" or "Contacted this week"

## Troubleshooting

### Issue: Person doesn't move down after action
**Possible Causes**:
1. Cache not cleared - wait 5 minutes or force refresh
2. Action not marked as "completed" - check action status
3. Action type not "meaningful" - check `isMeaningfulAction()` function

**Solution**: Hard refresh browser, check console logs for errors

### Issue: Person disappears from list
**Possible Causes**:
1. Old code still running - clear browser cache
2. Database not updated - check database directly

**Solution**: This should NOT happen with the fix. If it does, the fix didn't deploy correctly.

### Issue: Ranking seems random
**Possible Causes**:
1. Multiple factors affecting score (company size, deal stage, etc.)
2. Scores are very close together

**Solution**: Check console logs for `rankingScore` values to understand why

## Success Criteria

✅ **Fix is working correctly if**:
1. Recently contacted people move to bottom of list (rank 30-50)
2. Recently contacted people stay visible in the list
3. Uncontacted people move to top of list (rank 1-10)
4. Console logs show all people being ranked (not excluded)
5. Rankings persist after page refresh

❌ **Fix is NOT working if**:
1. Recently contacted people stay at top of list
2. Recently contacted people disappear from list
3. Console logs show people being excluded
4. Rankings reset after page refresh

## Performance Notes

- Re-ranking happens automatically after each action completion
- Results are cached for 5 minutes
- Use `?refresh=true` query parameter to force cache refresh
- Re-ranking typically completes in <1 second

## Database Verification

To verify rankings in database:

```sql
SELECT 
  id,
  full_name,
  global_rank,
  last_action_date,
  updated_at
FROM people
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
  AND is_active = true
  AND global_rank IS NOT NULL
ORDER BY global_rank ASC
LIMIT 50;
```

Expected results:
- Ranks 1-10: `last_action_date` is NULL or 30+ days old
- Ranks 30-50: `last_action_date` is today or within last 7 days

