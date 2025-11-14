# Buyer Group Domain Validation Testing Guide

## Overview

This document describes how to test the buyer group domain validation fix that prevents cross-company contamination (e.g., underline.cz vs underline.com).

## What Was Fixed

1. **Olga Lev Issue**: Removed Olga Lev (olga.lev@underline.cz) from Underline (underline.com) buyer group
2. **API Validation**: Fixed `addBuyerGroupMember` API to validate email domain against the buyer_group_id company (not the person's current company)

## Quick Test Script

Run the automated test script to verify the fix:

```bash
node scripts/test-buyer-group-domain-validation.js
```

This script will:
- Test domain validation logic with various scenarios
- Verify Olga Lev is no longer in buyer groups
- Confirm all validation rules work correctly

## Manual Testing Steps

### Test 1: Verify Olga Lev Fix

1. Navigate to: https://staging.adrata.com/top-temp/leads/olga-lev-01K9T0QZV04EMW54QAYRRSK389/
2. Check that Olga Lev is **NOT** listed as a buyer group member
3. Verify her email domain: `olga.lev@underline.cz`
4. Verify she's associated with company: Underline (underline.com)
5. **Expected**: She should NOT appear in the buyer group for Underline (underline.com)

### Test 2: Test API Validation (Domain Mismatch Rejection)

Test that the API correctly rejects adding someone with a mismatched email domain:

**Endpoint**: `POST /api/data/buyer-groups`

**Request Body**:
```json
{
  "action": "add_member",
  "data": {
    "buyer_group_id": "<underline.com-company-id>",
    "lead_id": "<person-with-underline.cz-email-id>",
    "role": "decision",
    "influence_level": "high"
  }
}
```

**Expected Response**:
- Status: `400 Bad Request`
- Error code: `DOMAIN_MISMATCH`
- Error message: `Email domain mismatch: underline.cz does not match buyer group company domain underline.com. This person cannot be added to this buyer group.`

### Test 3: Test API Validation (Valid Domain Acceptance)

Test that the API accepts valid domain matches:

**Request Body**:
```json
{
  "action": "add_member",
  "data": {
    "buyer_group_id": "<underline.com-company-id>",
    "lead_id": "<person-with-underline.com-email-id>",
    "role": "decision",
    "influence_level": "high"
  }
}
```

**Expected Response**:
- Status: `200 OK`
- Success: `true`
- Person is added to buyer group

### Test 4: Test Personal Email Rejection

Test that personal email domains are rejected:

**Request Body**:
```json
{
  "action": "add_member",
  "data": {
    "buyer_group_id": "<company-id>",
    "lead_id": "<person-with-gmail.com-email-id>",
    "role": "decision",
    "influence_level": "high"
  }
}
```

**Expected Response**:
- Status: `400 Bad Request`
- Error code: `PERSONAL_EMAIL`
- Error message: `Personal email domain detected: gmail.com. This person cannot be added to this buyer group.`

## Test Scenarios

### Scenario 1: Cross-Company Contamination (underline.cz vs underline.com)
- **Email Domain**: `underline.cz`
- **Company Domain**: `underline.com`
- **Expected**: ❌ REJECTED (different companies)

### Scenario 2: Same Company Exact Match
- **Email Domain**: `underline.com`
- **Company Domain**: `underline.com`
- **Expected**: ✅ ACCEPTED

### Scenario 3: Same Company with Subdomain
- **Email Domain**: `mail.underline.com`
- **Company Domain**: `underline.com`
- **Expected**: ✅ ACCEPTED

### Scenario 4: Personal Email
- **Email Domain**: `gmail.com`
- **Company Domain**: `company.com`
- **Expected**: ❌ REJECTED

### Scenario 5: Different Companies
- **Email Domain**: `apple.com`
- **Company Domain**: `microsoft.com`
- **Expected**: ❌ REJECTED

## Verification Checklist

- [ ] Run automated test script: `node scripts/test-buyer-group-domain-validation.js`
- [ ] Verify Olga Lev is not in buyer group (check UI)
- [ ] Test API rejects underline.cz email for underline.com buyer group
- [ ] Test API accepts valid domain matches
- [ ] Test API rejects personal email domains
- [ ] Verify no BuyerGroupMembers records exist for Olga Lev
- [ ] Check that `isBuyerGroupMember = false` for Olga Lev in database

## Database Verification

To verify the fix in the database:

```sql
-- Check Olga Lev's buyer group status
SELECT id, fullName, email, isBuyerGroupMember, buyerGroupRole, buyerGroupStatus
FROM people
WHERE email LIKE '%olga.lev@underline.cz%' OR id = '01K9T0QZV04EMW54QAYRRSK389';

-- Check for BuyerGroupMembers records
SELECT bgm.*, bg.companyName, bg.website
FROM "BuyerGroupMembers" bgm
JOIN "BuyerGroups" bg ON bgm."buyerGroupId" = bg.id
WHERE bgm.email LIKE '%olga.lev@underline.cz%' OR bgm.name LIKE '%Olga Lev%';
```

**Expected Results**:
- `isBuyerGroupMember` should be `false`
- `buyerGroupRole` should be `null`
- `buyerGroupStatus` should be `null`
- No `BuyerGroupMembers` records should exist

## API Endpoint Details

**Endpoint**: `POST /api/data/buyer-groups`

**Authentication**: Required (Bearer token)

**Request Format**:
```json
{
  "action": "add_member",
  "data": {
    "buyer_group_id": "string",
    "lead_id": "string",
    "role": "string",
    "influence_level": "string"
  }
}
```

**Validation Logic**:
1. Fetches the buyer_group_id company (the company they're being added to)
2. Extracts email domain from person's email
3. Extracts company domain from buyer group company's website/domain
4. Validates using `isLikelySameCompany()` function
5. Rejects if domains don't match (e.g., underline.cz vs underline.com)

## Notes

- The validation now checks against the **buyer_group_id company** (target company), not the person's current company
- This prevents cross-company contamination while allowing legitimate cases
- The `isLikelySameCompany()` function specifically rejects same base name with different TLDs (e.g., underline.com vs underline.cz)

