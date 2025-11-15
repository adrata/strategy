# TOP Engineering Plus: Actions and Prospects Audit

**Date:** November 15, 2025  
**Workspace:** TOP Engineering Plus (01K75ZD7DWHG1XF16HAF2YVKCK)

## Executive Summary

This audit examined how actions are stored and linked to people/companies, whether email engagement properly converts leads to prospects, and whether action counts are synced between people and companies.

## Key Findings

### 1. Email Engagement Storage

- **Total email_messages:** 916
  - Linked to people: 317
  - Linked to companies: 177
- **Total actions:** 412
  - EMAIL type actions: 392 (most actions are EMAIL type)
  - Actions with personId only: 249
  - Actions with companyId only: 59
  - Actions with both: 104
  - Actions with neither: 0 ✅

### 2. Prospect Classification Issue ⚠️

**CRITICAL:** 15 leads have email engagement but are NOT classified as prospects:

1. Aaron Staas
2. Raul Magana
3. Tyler Spindler
4. Anthony Suppa
5. Mark Maroney
6. Kirt Mayson
7. Eric Barnes
8. Hilary Tristan
9. Dean McDowell
10. Victoria Leland
11. (5 more)

**Rule:** Any person or company with email engagement should be a prospect.

### 3. Action Count Sync Issue ⚠️

**Problem:** Action counts are NOT synced between people and companies.

- **People with actions:** 25
- **Companies with direct actions:** 14
- **Companies with people actions but no direct actions:** 8 companies

**Examples:**
- Actelant: 0 direct actions, 1 person with actions
- M&S Engineering: 0 direct actions, 1 person with actions
- GAC Enterprises, LLC: 0 direct actions, 1 person with actions
- Central Electric Power Cooperative: 0 direct actions, 1 person with actions
- ArchComm: 0 direct actions, 1 person with actions
- Hawaiian Electric Company, Inc.: 0 direct actions, 1 person with actions
- NTest, Inc.: 0 direct actions, 1 person with actions
- XIT RURAL TELEPHONE: 0 direct actions, 1 person with actions

**Root Cause:** When actions are created with only a `personId` (not also a `companyId`), the company doesn't get a direct action count. The companies API doesn't aggregate actions from people.

### 4. People Without Company Links ⚠️

3 people have actions but no company link:
- These people need their `companyId` set based on their email domain or other matching logic.

## Recommendations

### Immediate Actions Required

1. **Convert leads with email engagement to prospects**
   - Any person/company with email_messages or EMAIL actions should be PROSPECT status
   - Script needed: `scripts/fix-top-leads-to-prospects.js`

2. **Sync action counts between people and companies**
   - When actions are created with `personId`, also link to `companyId` if person has a company
   - Update companies API to aggregate actions from people OR ensure actions are always linked to both
   - Script needed: `scripts/sync-top-action-counts.js`

3. **Link people without companies**
   - Match people with actions but no companyId to companies based on email domain
   - Script needed: `scripts/link-top-people-to-companies.js`

### Long-term Improvements

1. **Action Creation Logic**
   - Always link actions to both `personId` and `companyId` when person has a company
   - Update action creation endpoints to enforce this

2. **Companies API Enhancement**
   - Option A: Aggregate action counts from people (current approach shows "-")
   - Option B: Ensure all person actions also have companyId (preferred)

3. **Prospect Classification Automation**
   - Automatically convert leads to prospects when email engagement is detected
   - Add background job to check and convert leads with email engagement

## Data Statistics

### People
- Total: 1,881
- With actions: 25
- With email engagement: 18
- Leads with email engagement: 15 ⚠️
- Prospects without email engagement: 8

### Companies
- Total: 403
- With direct actions: 14
- With email engagement (direct or via people): 21
- Leads with email engagement: 17 ⚠️
- Prospects with email engagement: 4 ✅

## Next Steps

1. Review and approve recommendations
2. Create fix scripts for identified issues
3. Test fixes on development environment
4. Deploy fixes to production
5. Monitor for proper classification and sync

