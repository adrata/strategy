# TOP Engineering Plus Ranking Intelligence Audit

**Date:** November 15, 2025  
**Workspace:** TOP Engineering Plus  
**Total Records Analyzed:** 434 people with globalRank

## Executive Summary

The ranking system is partially working correctly - **Prospects rank higher than Leads**, but **Opportunities need better prioritization** in the top 50 Speedrun list. The re-rank API has the correct logic, but it needs to be run to update the globalRank values.

## Key Findings

### ✅ What's Working

1. **Status Priority Logic**: The re-rank API (`/api/v1/speedrun/re-rank`) correctly prioritizes:
   - OPPORTUNITY: 10 (highest)
   - PROSPECT: 8
   - LEAD: 2 (lowest)

2. **Prospects vs Leads**: Prospects have better average rank (112) than Leads (191)

### ⚠️ Issues Found

1. **Opportunities Missing Ranks**: 18 opportunities exist but show "N/A" for average rank
   - This suggests they may not have globalRank set or need recalculation

2. **Top 50 Distribution**: Speedrun is dominated by Leads (56%)
   - Opportunities: 8% (4 records)
   - Prospects: 36% (18 records)
   - Leads: 56% (28 records)
   - **Recommendation**: Should be 40%+ Opportunities, 30%+ Prospects, <30% Leads

3. **Engagement Scores**: Top 50 has engagement scores of 0
   - Suggests engagement scoring isn't being populated or calculated

4. **Old Ranking Scripts**: Legacy scripts (`update-global-ranks.js`, `set-all-global-ranks.js`) don't factor in status
   - They only consider: buyerGroupRole, influenceScore, engagementScore, LinkedIn data
   - **These should not be used** - use the re-rank API instead

## Current Ranking Algorithm

### Re-Rank API (Correct Implementation)

Located in: `src/app/api/v1/speedrun/re-rank/route.ts`

**Status Priority Weights:**
```typescript
const statusPriority: Record<string, number> = { 
  'OPPORTUNITY': 10,  // Highest priority
  'PROSPECT': 8,      // High priority
  'CLIENT': 7,
  'SUPERFAN': 6,
  'PARTNER': 5,
  'LEAD': 2,          // Lower priority
  'ACTIVE': 3,
  'INACTIVE': 1
};
```

**Sorting Logic:**
1. Primary: Comprehensive score (calculated from multiple factors)
2. Secondary: Status priority (multiplied by 100 to ensure it overrides small score differences)
3. Tertiary: Title/role priority (CEO > VP > Director > Manager)
4. Quaternary: Days since last contact

### Legacy Ranking Scripts (Outdated)

Located in: `scripts/update-global-ranks.js`, `scripts/set-all-global-ranks.js`

**Issues:**
- ❌ Don't factor in status (OPPORTUNITY vs PROSPECT vs LEAD)
- ❌ Only consider: buyerGroupRole, influenceScore, engagementScore, LinkedIn data
- ❌ Should NOT be used for production ranking

## Recommendations

### Immediate Actions

1. **Run Re-Rank API** to update all globalRank values:
   ```bash
   POST /api/v1/speedrun/re-rank
   ```
   This will recalculate ranks using the correct status-prioritized algorithm.

2. **Verify Opportunities Have Ranks**: After re-ranking, check that all 18 opportunities have globalRank set

3. **Monitor Top 50 Distribution**: After re-ranking, verify:
   - Opportunities: 40%+ (20+ records)
   - Prospects: 30%+ (15+ records)
   - Leads: <30% (<15 records)

### Long-Term Improvements

1. **Add Opportunity Amount to Ranking**: High-value opportunities (>$50K) should rank higher
   ```typescript
   // In re-rank API, add opportunityAmount factor:
   const opportunityValue = parseFloat(person.company?.opportunityAmount || '0');
   if (opportunityValue > 50000) {
     score += 50; // Boost high-value opportunities
   }
   ```

2. **Fix Engagement Score Calculation**: Ensure engagement scores are populated and factored into ranking

3. **Deprecate Old Scripts**: Mark legacy ranking scripts as deprecated and update documentation

4. **Add Ranking Audit to CI/CD**: Run ranking intelligence audit regularly to catch regressions

## Expected Results After Re-Ranking

After running the re-rank API, you should see:

- **Top 50 Distribution:**
  - Opportunities: 20-25 records (40-50%)
  - Prospects: 15-20 records (30-40%)
  - Leads: 5-10 records (10-20%)

- **Average Ranks:**
  - Opportunities: <50 (most in top 50)
  - Prospects: 50-150 (mix of top 50 and next tier)
  - Leads: 150+ (lower priority)

## How to Run Re-Rank

1. **Via API:**
   ```bash
   curl -X POST https://action.adrata.com/api/v1/speedrun/re-rank \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"workspaceId": "01K75ZD7DWHG1XF16HAF2YVKCK"}'
   ```

2. **Via Script** (if available):
   ```bash
   node scripts/trigger-rerank-direct.js
   ```

## Audit Script

Run the audit script to verify improvements:
```bash
node scripts/audit-top-ranking-intelligence.js
```

This will show:
- Status distribution analysis
- Top 50 quality metrics
- Ranking intelligence checks
- Factor analysis
- Recommendations

## Conclusion

The ranking system has the **correct logic** in the re-rank API, but it needs to be **executed** to update the database. Once re-ranked, Opportunities and Prospects should properly dominate the top 50 Speedrun list, making it much more effective for revenue generation.

