# Engagement Classification Summary

## Overview
The system now automatically classifies people and companies as PROSPECT or OPPORTUNITY based on email and meeting engagement.

## Classification Logic

### PROSPECT Classification
A person/company is classified as PROSPECT when:
1. **They reply to an email** (subject starts with "Re:", "RE:", "Fwd:", or has threadId/inReplyTo)
2. **They initiate contact** (email FROM them, not a reply)

Both scenarios indicate engagement - they've actively communicated with us.

### OPPORTUNITY Classification
A person/company is upgraded to OPPORTUNITY when:
- They are already a PROSPECT (or higher)
- **AND** their email/meeting content suggests business discussion (2+ business keywords found)

Business keywords include: proposal, quote, pricing, contract, deal, project, demo, meeting, requirements, solution, etc.

## Email Processing

### What We Read
- **Subject line**: Always read for reply detection and keyword matching
- **Email body**: Read for business keyword detection (both plain text and HTML)
- **Both subject and body** are analyzed together for business discussion detection

### First Contact Detection
- Previously only classified replies
- Now also classifies when prospects email us first (not a reply)
- This catches cold outreach and inbound inquiries

## Ranking Integration

### Speedrun/Global Rank
The ranking system now heavily prioritizes PROSPECT and OPPORTUNITY status:

- **OPPORTUNITY**: Rank 10 (highest priority)
- **PROSPECT**: Rank 8 (high priority)
- **CLIENT**: Rank 7
- **SUPERFAN**: Rank 6
- **PARTNER**: Rank 5
- **LEAD**: Rank 2 (low priority - no engagement yet)

Status difference is multiplied by 100 to ensure it overrides small score differences, meaning PROSPECT/OPPORTUNITY will rank significantly higher than LEADS.

## Data Quality

### Email Linking
- Emails are automatically linked to people and companies based on:
  - Email address matching (FROM field)
  - Domain matching (company website)
- Classification happens automatically after linking

### Action Creation
- EMAIL actions are created for linked emails
- MEETING actions are created for calendar events
- Actions reflect the engagement type

## Current Status

### Classification Counts (TOP Engineering Plus)
- **Leads**: 2,135 (people + companies)
- **Prospects**: 14 (people + companies)
- **Opportunities**: 135 (people + companies)

### Automatic Processing
- ✅ New emails are classified in real-time
- ✅ New meetings are classified in real-time
- ✅ Historical data can be backfilled using `scripts/backfill-engagement-classification.ts`
- ✅ Ranking automatically prioritizes engaged contacts

## Files Modified

1. `src/platform/services/engagement-classification-service.ts`
   - Added first-contact detection
   - Uses both subject and body for analysis
   - Handles both replies and first contacts

2. `src/app/api/v1/speedrun/re-rank/route.ts`
   - Enhanced status priority weighting
   - PROSPECT/OPPORTUNITY rank significantly higher

3. `src/platform/services/UnifiedEmailSyncService.ts`
   - Passes `to` and `inReplyTo` fields to classification
   - Classifies after email linking

4. `src/platform/services/calendar-sync-service.ts`
   - Classifies meetings based on title/description
   - Creates meeting actions

## Verification

Run `scripts/audit-engagement-data.ts` to verify:
- Email body vs subject usage
- First contact detection
- Status distribution
- Ranking prioritization
- Email linking quality
- Action creation

