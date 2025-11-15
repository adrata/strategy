# Opportunity Pipeline Fixes

## Issues Identified

1. **Prospects with actions but "Last Action: Never"**
   - Actions exist but `lastAction`/`lastActionDate` fields not synced
   - Fix: `scripts/fix-prospects-last-action.ts`

2. **Prospects with 0 actions but have emails/meetings**
   - Emails and meetings exist but no action records created
   - Fix: `scripts/create-missing-prospect-actions.ts`

3. **Opportunities showing "Send initial email" instead of smart next action**
   - Next action generation doesn't read last email/action
   - Fix: Integrated `OpportunityStageDetectionService` for intelligent next actions

4. **No smart pipeline stage detection**
   - Opportunities don't automatically detect what stage/gate they're in
   - Fix: `src/platform/services/OpportunityStageDetectionService.ts`

## Opportunity Structure

**Opportunities are per PERSON, not per company:**
- Each person with `status='OPPORTUNITY'` is an opportunity
- Multiple people at the same company can each be opportunities
- This allows tracking individual deal progress per stakeholder

## Pipeline Stages

The system now detects these stages automatically:

1. **QUALIFICATION** - Initial qualification, determining fit
2. **DISCOVERY** - Understanding needs and pain points  
3. **PROPOSAL** - Proposal/demo delivered
4. **NEGOTIATION** - Negotiating terms and pricing
5. **CLOSING** - Final decision stage
6. **CLOSED_WON** - Deal won
7. **CLOSED_LOST** - Deal lost

## Stage Detection Logic

The `OpportunityStageDetectionService` analyzes:
- **Recent actions** (emails, calls, meetings, proposals)
- **Email engagement** (replies, business discussion keywords)
- **Meeting history** (discovery calls, demos, decision meetings)
- **Proposal status** (sent, reviewed, negotiated)

### Stage Detection Rules

- **CLOSED_WON**: Person status is CLIENT or has CLOSED_WON action
- **CLOSED_LOST**: Has CLOSED_LOST action
- **NEGOTIATION**: Proposal sent + negotiation activities detected
- **PROPOSAL**: Proposal or demo delivered, awaiting response
- **DISCOVERY**: Discovery call completed OR business discussion in meetings/emails
- **QUALIFICATION**: Initial contact made, prospect has engaged
- **Default**: QUALIFICATION (no clear indicators)

## Smart Next Action Generation

Instead of generic "Send initial email", the system now:
1. Detects current pipeline stage
2. Analyzes last action type
3. Generates stage-appropriate next action
4. Avoids repeating same action type

### Examples

- **After email sent**: "Schedule discovery call to validate pain"
- **After discovery call**: "Send follow-up email with pain validation insights"
- **After proposal**: "Follow up on proposal feedback"
- **In negotiation**: "Address concerns and schedule decision meeting"

## Next Steps

1. Run `scripts/audit-prospects-actions.ts` to see current state
2. Run `scripts/fix-prospects-last-action.ts` to sync lastAction fields
3. Run `scripts/create-missing-prospect-actions.ts` to create missing actions
4. Integrate `OpportunityStageDetectionService` into people API to auto-detect stages
5. Update next action generation to use stage detection

