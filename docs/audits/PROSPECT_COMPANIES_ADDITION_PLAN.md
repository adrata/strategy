# Prospect Companies Addition Plan

**Date:** 2025-01-XX  
**Status:** ✅ Ready to Execute

## Overview

This script adds identified utility/energy companies and people as Prospects, links emails and actions, and runs buyer group analysis.

## Companies to Add (4 total)

1. **Rosenbergernetworks** (rosenbergernetworks.com) - 7 emails - Utility company
2. **Stec** (stec.org) - 1 email - Utility company  
3. **Truvisionsolutions** (truvisionsolutions.com) - 2 emails - Utility company (works with CPS Energy)
4. **Fiberbroadband** (fiberbroadband.org) - 25 emails - Energy/Industry association

## People to Add (5 total)

1. **Nikhil Gogate** (nikhil.gogate@rosenbergernetworks.com) - 4 emails
2. **Kimarley Thorpe** (kimarley.thorpe@pens.com) - 3 emails
3. **Yareli Gardea** (yareli.gardea@rlmunderground.com) - 3 emails
4. **Joshua Whaley** (joshua.whaley@hdrinc.com) - 2 emails
5. **Randal Neck** (randal.neck@rosenbergernetworks.com) - 2 emails

## Process Flow

For each company:

1. **Create Company** as Prospect
   - Status: `PROSPECT`
   - Tags: `['from-email-analysis', 'utility-energy-focus']`
   - Domain and website set

2. **Link Emails** to company
   - Find all unlinked emails matching domain
   - Update `companyId` and `personId` fields

3. **Add People** as Prospects
   - Status: `PROSPECT`
   - Link to company
   - Link their emails

4. **Create Action Records**
   - Create EMAIL actions for linked emails
   - Status: `COMPLETED`
   - Linked to company and person

5. **Run Buyer Group Analysis**
   - Uses SmartBuyerGroupPipeline
   - 5-minute timeout per company
   - Identifies buyer group members
   - Enriches with buyer group data

## Timeout Protection

- **Batch size:** 2-3 companies (configurable)
- **Delay between companies:** 2 seconds
- **Delay between batches:** 5 seconds
- **Buyer group timeout:** 5 minutes per company
- **Progress tracking:** Shows current company number

## Expected Results

- 4 companies added as Prospects
- 5 people added as Prospects
- ~35 emails linked
- ~35 action records created
- 4 buyer group analyses completed

## Execution

```bash
# Dry run first
node scripts/add-prospect-companies-with-buyer-groups.js --dry-run --batch-size=2

# Execute for real
node scripts/add-prospect-companies-with-buyer-groups.js --batch-size=2
```

## Notes

- Script processes in batches to avoid timeouts
- Buyer group analysis has 5-minute timeout
- Errors are logged but don't stop processing
- All companies/people are tagged for tracking

