# Re-Rank API Enhancement Summary

**Date:** November 15, 2025  
**File Modified:** `src/app/api/v1/speedrun/re-rank/route.ts`

## Enhancements Implemented

### 1. Enhanced Data Fetching

**Companies Query:**
- Added `opportunityAmount` field
- Added `opportunityStage` field
- Added `opportunityProbability` field
- Changed from `include` to `select` for better performance

**People Query:**
- Added `priority` field
- Added `nextActionDate` field
- Added `nextActionPriority` field
- Added `nextActionType` field
- Added `lastAction` field
- Added `actionStatus` field
- Enhanced company include to select `opportunityAmount`, `opportunityStage`, `opportunityProbability`
- Changed from `include` to `select` for better performance

### 2. Enhanced Ranking Algorithm

**Opportunity Value Boost:**
- High-value (>$50K): +50 score boost
- Medium-value ($25K-$50K): +25 boost
- Low-value (<$25K): +10 boost
- Applied to people based on their company's `opportunityAmount`

**Deal Stage Priority Boost:**
- Late-stage (Negotiation, Proposal, Decision, Closed): +30 score
- Mid-stage (Qualified, Demo, Evaluation): +15 score
- Early-stage (Discovery, Initial): +5 score
- Applied based on company's `opportunityStage`

**Next Action Urgency Boost:**
- Overdue `nextActionDate`: +20 score
- Today `nextActionDate`: +10 score
- This week: +5 score
- Applied based on person's `nextActionDate`

**Priority Field Boost:**
- HIGH priority: +15 score
- MEDIUM priority: +5 score
- LOW priority: 0
- Applied based on person's `priority` field

**Meaningful Action Detection:**
- Detects if `lastAction` is meaningful (not "Record created", etc.)
- Stored for potential future use in ranking

### 3. Enhanced Company Ranking

**Company Sorting Priority:**
1. Opportunity Amount (highest first)
2. Opportunity Stage (late-stage first)
3. Industry score
4. Size score
5. People count

### 4. Enhanced Logging

Added detailed logging for top 5 people in each company showing:
- Base score
- Opportunity value boost
- Deal stage boost
- Next action urgency boost
- Priority boost
- Total enhanced score

## Expected Outcomes

After running re-rank:
- Opportunities with high deal value rank higher
- Late-stage opportunities rank higher than early-stage
- Overdue next actions get priority boost
- HIGH priority contacts rank higher
- Top 50 should be: 40%+ Opportunities, 30%+ Prospects, <30% Leads

## Testing Plan

1. Run audit script before re-rank: `node scripts/audit-top-ranking-intelligence.js`
2. Run re-rank API for TOP Engineering Plus workspace
3. Run audit script after re-rank
4. Compare results to verify improvements

## Risk Mitigation

- All enhancements are additive (added to existing score)
- Status priority multiplier (x100) still applies
- Existing logic preserved as fallback
- Detailed logging added for debugging

