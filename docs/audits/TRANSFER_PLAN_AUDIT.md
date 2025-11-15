# Transfer Plan Audit: Top-Temp to TOP Engineering Plus

## Audit Date
2025-01-XX

## Plan Status
⚠️ **REQUIRES UPDATES BEFORE EXECUTION**

## Critical Issues Found

### 1. ❌ Missing workspace_users Setup
**Issue**: New users (Justin, Judy, Hilary) must be added to `workspace_users` table to access TOP Engineering Plus workspace.

**Impact**: Users won't be able to access the workspace even if they exist in `users` table.

**Fix Required**: After creating users, add entries to `workspace_users` table with appropriate roles.

### 2. ❌ Incorrect Transfer Order
**Issue**: Plan transfers people before companies, but `people.companyId` references `companies.id`.

**Impact**: Foreign key violations when updating people with companyId that doesn't exist in new workspace yet.

**Fix Required**: Transfer companies FIRST, then people. Store company ID mappings for updating people.companyId.

### 3. ❌ Missing Related Tables
**Issue**: Plan doesn't address:
- `person_co_sellers` (co-seller relationships)
- `reminders` (reminders for people/companies)
- `documents` (proposals, contracts)
- `meeting_transcripts` (meeting notes)
- `workshopDocument` (workshop documents)

**Impact**: Related data will be orphaned or lost.

**Fix Required**: Add steps to transfer these tables with proper ID mappings.

### 4. ⚠️ Email Reconnection Logic Too Vague
**Issue**: Plan says "find matching company by name/domain" but doesn't specify exact matching logic.

**Impact**: Emails may not reconnect properly, or wrong matches could occur.

**Fix Required**: Define exact matching criteria:
- Company: Match by domain extracted from email "from" field, or company email field
- Person: Match by exact email match (from/to fields) with person email/workEmail/personalEmail

### 5. ⚠️ No Duplicate Handling Strategy
**Issue**: Plan doesn't specify what to do if person/company with same email/name already exists in TOP Engineering Plus.

**Impact**: Could create duplicates or fail on unique constraints.

**Fix Required**: Define strategy:
- Option A: Skip duplicates (don't transfer)
- Option B: Merge duplicates (combine data)
- Option C: Transfer with suffix/identifier

### 6. ⚠️ No Transaction Wrapper
**Issue**: Plan mentions "use transactions" but doesn't specify how to structure them.

**Impact**: Partial failures could leave data in inconsistent state.

**Fix Required**: Wrap entire migration in `prisma.$transaction()` with proper error handling and rollback.

### 7. ⚠️ Missing Validation Steps
**Issue**: No pre-flight checks for:
- User existence verification
- Foreign key constraint validation
- Duplicate detection
- Workspace existence

**Impact**: Migration could fail mid-way, leaving partial data.

**Fix Required**: Add comprehensive validation step before starting migration.

### 8. ⚠️ No Dry-Run Mode
**Issue**: Plan doesn't include dry-run mode for testing.

**Impact**: Can't test migration safely before running on production data.

**Fix Required**: Add `--dry-run` flag that shows what would happen without making changes.

## Foreign Key Constraints Analysis

### Safe Operations
- ✅ Updating `workspaceId` on people/companies/actions (no cascade issues)
- ✅ Soft deleting (setting `deletedAt`) preserves foreign keys
- ✅ Email messages have `SET NULL` on delete, so safe to reconnect

### Risky Operations
- ⚠️ Updating `people.companyId` - must ensure company exists in new workspace first
- ⚠️ Updating `mainSellerId` - must ensure user exists and is in workspace
- ⚠️ Updating `actions.userId` - has CASCADE, so if user deleted, actions deleted
- ⚠️ Updating `actions.companyId/personId` - must match transferred records

## Recommended Fixes

### Priority 1 (Critical - Must Fix)
1. Add `workspace_users` entries for all users
2. Change order: Transfer companies before people
3. Add transaction wrapper with rollback
4. Add comprehensive validation step

### Priority 2 (Important - Should Fix)
5. Add related tables transfer (person_co_sellers, reminders, documents, etc.)
6. Define exact email reconnection logic
7. Add duplicate handling strategy
8. Add dry-run mode

### Priority 3 (Nice to Have)
9. Add progress logging for large datasets
10. Add batch processing for performance
11. Add detailed error reporting
12. Add rollback script

## Updated Implementation Order

1. **Pre-Flight Validation**
   - Verify workspaces exist
   - Verify Victoria user exists
   - Check for duplicates
   - Validate foreign key constraints

2. **User Setup**
   - Find/create users
   - Add to `workspace_users` table
   - Build user ID mapping

3. **Clean TOP Engineering Plus**
   - Soft delete people/companies
   - Preserve actions, emails, related data

4. **Transfer Companies** (FIRST)
   - Transfer all companies
   - Store company ID mapping

5. **Transfer People** (AFTER COMPANIES)
   - Transfer all people
   - Update `companyId` using mapping
   - Store person ID mapping

6. **Transfer Related Data**
   - person_co_sellers
   - reminders
   - documents
   - meeting_transcripts
   - workshopDocuments

7. **Transfer Actions**
   - Update workspaceId, userId, companyId, personId

8. **Reconnect Emails**
   - Match and reconnect using ID mappings

9. **Clean Up Top-Temp**
   - Soft delete transferred records

10. **Verification**
    - Count records
    - Verify relationships
    - Check for orphans

## Safety Score: 6/10

**Current State**: Plan has good foundation but missing critical safety measures.

**After Fixes**: Should be 9/10 (10/10 with rollback script).

## Recommendation

**DO NOT EXECUTE** until Priority 1 fixes are implemented. Plan needs significant updates before it's safe to run on production data.


