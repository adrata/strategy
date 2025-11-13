# Schema Streamlining Migration Guide

## Overview

This guide documents the schema streamlining changes that remove duplicate and redundant fields from the database.

## Changes Made

### 1. Remove `linkedinnavigatorurl` duplicate from companies table
- **Field removed**: `linkedinnavigatorurl` (lowercase typo)
- **Field kept**: `linkedinNavigatorUrl` (camelCase - correct)
- **Status**: No data migration needed (0 rows had data in the duplicate field)

### 2. Remove `title` field from people table
- **Field removed**: `title`
- **Field kept**: `jobTitle` (standardized field)
- **Status**: No data migration needed (0 rows had data in title that wasn't in jobTitle)

## Migration Status

The automated migration script has been run and completed successfully:
- ✅ Data migration completed (0 rows needed migration)
- ⚠️  Column drops require database admin permissions

## Manual SQL Required

Due to database permission restrictions, the following SQL statements must be run manually by a database admin:

### Remove linkedinnavigatorurl from companies

```sql
ALTER TABLE companies DROP COLUMN IF EXISTS linkedinnavigatorurl;
```

### Remove title from people

```sql
ALTER TABLE people DROP COLUMN IF EXISTS title;
```

## Verification

After running the manual SQL, verify the changes:

```sql
-- Verify linkedinnavigatorurl is removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND column_name IN ('linkedinnavigatorurl', 'linkedinNavigatorUrl');
-- Should show only 'linkedinNavigatorUrl'

-- Verify title is removed from people
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'people' 
  AND column_name IN ('title', 'jobTitle');
-- Should show only 'jobTitle'
```

## Code Updates Completed

All code references have been updated:
- ✅ API routes updated to use `jobTitle` only
- ✅ Desktop app (Rust) updated to remove `title` field
- ✅ Scripts updated to use `jobTitle` only
- ✅ Prisma schema updated (fields removed)

## Files Modified

### Migration Scripts
- `scripts/apply-schema-streamlining-migrations.js` - Automated migration script
- `scripts/manual-schema-streamlining.sql` - Manual SQL for database admin

### Schema
- `prisma/schema.prisma` - Updated to remove duplicate fields

### Code Updates
- All API routes using `title` field
- Desktop app Rust code
- Enrichment and data refresh scripts

## Next Steps

1. **Run manual SQL** (database admin required):
   - Execute the SQL statements in `scripts/manual-schema-streamlining.sql`
   - Or run the individual DROP COLUMN statements shown above

2. **Verify schema**:
   - Run the verification queries to confirm columns are removed
   - Run `npx prisma generate` to regenerate Prisma client

3. **Test application**:
   - Test all API endpoints that use people/companies data
   - Verify no errors related to missing fields

4. **Deploy**:
   - Deploy code changes to staging
   - Run migrations in staging
   - Test thoroughly
   - Deploy to production

## Rollback Plan

If issues occur, the removed columns can be re-added:

```sql
-- Re-add linkedinnavigatorurl (if needed)
ALTER TABLE companies ADD COLUMN linkedinnavigatorurl VARCHAR(500);

-- Re-add title (if needed)
ALTER TABLE people ADD COLUMN title VARCHAR(300);
```

However, data that was in these fields will be lost if the columns were already dropped.

