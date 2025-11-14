# LinkedIn Navigator URL Data Recovery Guide

## Background

The `linkedinNavigatorUrl` field is a critical piece of data for both `companies` and `people` tables, used for LinkedIn Sales Navigator integration.

## What Happened

1. **Commit b387e686** (Nov 13, 2025): Removed `linkedinNavigatorUrl` from the companies Prisma schema because it was thought to not exist in the production database and was causing 500 errors.

2. **Commit 1a2aada9** (Nov 13, 2025): Re-added `linkedinNavigatorUrl` to the companies schema.

3. **Today**: Confirmed that `linkedinNavigatorUrl` should exist for BOTH companies and people tables.

## Current Status

### Schema
- ✅ `companies.linkedinNavigatorUrl` - Present in schema
- ✅ `people.linkedinNavigatorUrl` - Present in schema

### APIs
- ✅ Companies API `/api/v1/companies/[id]` - Includes linkedinNavigatorUrl in GET/PATCH responses
- ✅ People API `/api/v1/people/[id]` - Includes linkedinNavigatorUrl (already had it)
- ✅ Speedrun API - Includes linkedinNavigatorUrl for people
- ✅ Section API - Includes linkedinNavigatorUrl for people

## Potential Data Loss

**IMPORTANT**: If the production database actually HAD the `linkedinNavigatorUrl` column for companies and commit b387e686 triggered a migration that dropped it, data may have been lost.

## Recovery Steps

### Step 1: Check Current State

Run the diagnostic script to see what data we currently have:

```bash
# Connect to production database and run:
psql $DATABASE_URL -f scripts/recover-linkedin-navigator-urls.sql
```

This will show:
- How many companies have `linkedinNavigatorUrl` data
- How many people have `linkedinNavigatorUrl` data
- Companies that have `linkedinUrl` but missing `linkedinNavigatorUrl`

### Step 2: Check if Column Exists in Production

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name = 'linkedinNavigatorUrl';
```

**If the column doesn't exist**: Run the migration to create it:
```bash
psql $DATABASE_URL -f prisma/migrations/add_linkedin_navigator_url_to_companies.sql
```

### Step 3: Recover Data from Backup (if needed)

If you have a database snapshot from before Nov 13, 2025, you can recover the data:

```sql
-- Assuming you have restored a backup to a separate database/schema
-- Replace 'backup_schema' with your actual backup location

UPDATE companies c
SET "linkedinNavigatorUrl" = backup."linkedinNavigatorUrl"
FROM backup_schema.companies backup
WHERE c.id = backup.id
    AND backup."linkedinNavigatorUrl" IS NOT NULL
    AND backup."linkedinNavigatorUrl" != ''
    AND (c."linkedinNavigatorUrl" IS NULL OR c."linkedinNavigatorUrl" = '');

-- Verify recovery
SELECT COUNT(*) as recovered_count
FROM companies
WHERE "linkedinNavigatorUrl" IS NOT NULL
    AND "linkedinNavigatorUrl" != ''
    AND "deletedAt" IS NULL;
```

### Step 4: Deploy Updated Code

After confirming data integrity:

1. **Regenerate Prisma Client** (already done):
   ```bash
   npx prisma generate
   ```

2. **Deploy the application** to get the updated APIs and schema

## Verification Checklist

- [ ] Run diagnostic script on production database
- [ ] Verify `linkedinNavigatorUrl` column exists for companies table
- [ ] Check data count - do we have linkedinNavigatorUrl data?
- [ ] If data is missing, restore from backup
- [ ] Deploy updated code with proper schema and APIs
- [ ] Test that linkedinNavigatorUrl can be read and written via APIs

## Notes

- The `people` table should already have this column and data (was never removed)
- The migration `20250113120000_remove_linkedinnavigatorurl_duplicate` cleaned up a lowercase typo version but preserved data
- LinkedIn Sales Navigator URLs are critical for sales workflows - this data should be preserved

## Contact

If data was lost and cannot be recovered from backups, you may need to:
1. Re-enrich companies from LinkedIn Sales Navigator
2. Import fresh data from external sources
3. Have sales team manually re-enter key URLs

