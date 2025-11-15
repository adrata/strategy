# Comprehensive Data Transfer Audit Report

**Date:** [Date of Audit]  
**Transfer Date:** [Date Transfer Was Executed]  
**Status:** [PENDING/IN PROGRESS/COMPLETE]

## Executive Summary

This report documents the comprehensive audit of data transfer from top-temp workspace to TOP Engineering Plus workspace. The audit verifies 100% data transfer completeness, including all records, fields, relationships, and related data.

## Audit Scope

The audit covers the following areas:

1. **Record Count Verification** - Verifies all companies and people were transferred
2. **Field Preservation Audit** - Verifies all fields, especially intelligence data, were preserved
3. **Related Data Transfer Verification** - Verifies person_co_sellers, reminders, documents, and meeting_transcripts
4. **Actions & Emails Reconnection Verification** - Verifies actions and emails were properly reconnected
5. **Data Integrity Checks** - Verifies workspaceId, mainSellerId, and relationships are correct
6. **Intelligence Data Deep Dive** - Verifies intelligence fields match exactly

## Audit Results

### Record Counts

#### Companies
- **Expected:** 399 companies
- **Transferred:** [Number] companies
- **Missing:** [Number] companies
- **Status:** [PASS/FAIL]

#### People
- **Expected:** 1,873 people
- **Transferred:** [Number] people
- **Missing:** [Number] people
- **Status:** [PASS/FAIL]

### Field Preservation

#### Companies
- **Verified:** [Number] companies checked
- **Field Mismatches:** [Number]
- **Intelligence Fields Preserved:** [YES/NO]
- **Status:** [PASS/FAIL]

#### People
- **Verified:** [Number] people checked
- **Field Mismatches:** [Number]
- **Intelligence Fields Preserved:** [YES/NO]
- **Status:** [PASS/FAIL]

### Related Data Transfer

#### Person Co-Sellers
- **Transferred:** [Number]
- **Status:** [PASS/FAIL]

#### Reminders
- **Transferred:** [Number]
- **Status:** [PASS/FAIL]

#### Documents
- **Transferred:** [Number]
- **Status:** [PASS/FAIL]

#### Meeting Transcripts
- **Transferred:** [Number]
- **Status:** [PASS/FAIL]

### Actions & Emails Reconnection

#### Actions
- **Reconnected:** [Number]
- **Orphaned:** [Number]
- **Status:** [PASS/FAIL]

#### Emails
- **Reconnected:** [Number]
- **Orphaned:** [Number]
- **Status:** [PASS/FAIL]

### Data Integrity

#### WorkspaceId Verification
- **Status:** [PASS/FAIL]
- **Issues:** [Description]

#### Relationship Integrity
- **Orphaned Records:** [Number]
- **Status:** [PASS/FAIL]

#### Duplicate Records
- **Found:** [Number]
- **Status:** [PASS/FAIL]

### Intelligence Data Verification

#### Companies
- **Samples Checked:** [Number]
- **Matches:** [Number]
- **Mismatches:** [Number]
- **Status:** [PASS/FAIL]

#### People
- **Samples Checked:** [Number]
- **Matches:** [Number]
- **Mismatches:** [Number]
- **Status:** [PASS/FAIL]

## Issues Found

### Critical Issues
[List any critical issues that prevent the transfer from being considered complete]

### Warning Issues
[List any warning issues that should be addressed but don't prevent completion]

### Recommendations
[List recommendations for fixing any issues found]

## Overall Assessment

### Transfer Completeness
- **Percentage:** [XX]%
- **Status:** [PASS/FAIL]

### Overall Success
- **Status:** [YES/NO]
- **Issues Found:** [Number]

## Conclusion

[Summary of audit findings and overall assessment]

## Next Steps

1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

## Audit Execution

### Command Used
```bash
node scripts/audit-transfer-completeness-full.js [--verbose]
```

### Audit Script Location
`scripts/audit-transfer-completeness-full.js`

### Audit Date
[Date and time of audit execution]

### Auditor
[Name/System]

---

**Note:** This report should be updated after each audit execution with the actual results.

