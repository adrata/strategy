# Database Migration Instructions

## Status
✅ **RelationshipType enum created successfully**  
❌ **Columns cannot be added** - Database user lacks ALTER TABLE permissions

## What Was Done
- The `RelationshipType` enum type was successfully created in your database
- The migration script attempted to add columns but failed due to permission restrictions

## What Needs to Be Done

You need to run the SQL migration script **with database admin permissions**. Here are your options:

### Option 1: Using psql (Recommended)
```bash
psql $DATABASE_URL -f scripts/migration/add_relationship_type.sql
```

### Option 2: Using Database Client (pgAdmin, DBeaver, etc.)
1. Open your database client
2. Connect to your database with admin credentials
3. Open `scripts/migration/add_relationship_type.sql`
4. Execute the entire script

### Option 3: Run Individual Steps
If you prefer to run step-by-step, execute these SQL commands in order:

```sql
-- Step 1: Create enum (already done, but safe to run again)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RelationshipType') THEN
        CREATE TYPE "RelationshipType" AS ENUM ('CLIENT', 'FUTURE_CLIENT', 'PARTNER', 'FUTURE_PARTNER');
    END IF;
END $$;

-- Step 2: Add column to companies
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "relationshipType" "RelationshipType";

-- Step 3: Add column to people
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "relationshipType" "RelationshipType";

-- Step 4: Set all companies to FUTURE_CLIENT
UPDATE "companies" 
SET "relationshipType" = 'FUTURE_CLIENT' 
WHERE "relationshipType" IS NULL;

-- Step 5: Set all people to FUTURE_CLIENT
UPDATE "people" 
SET "relationshipType" = 'FUTURE_CLIENT' 
WHERE "relationshipType" IS NULL;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS "companies_workspaceId_relationshipType_idx" 
ON "companies"("workspaceId", "relationshipType");

CREATE INDEX IF NOT EXISTS "people_workspaceId_relationshipType_idx" 
ON "people"("workspaceId", "relationshipType");
```

## Verification

After running the migration, verify it worked:

```sql
-- Check companies
SELECT 
    COUNT(*) as total,
    COUNT(relationshipType) as with_type,
    COUNT(CASE WHEN relationshipType = 'FUTURE_CLIENT' THEN 1 END) as future_clients
FROM companies;

-- Check people
SELECT 
    COUNT(*) as total,
    COUNT(relationshipType) as with_type,
    COUNT(CASE WHEN relationshipType = 'FUTURE_CLIENT' THEN 1 END) as future_clients
FROM people;
```

## After Migration

Once complete:
1. ✅ The API routes are already updated to handle the new field
2. ✅ PartnerOS will filter by `relationshipType IN ('PARTNER', 'FUTURE_PARTNER')`
3. ✅ RevenueOS will filter by `relationshipType IN ('CLIENT', 'FUTURE_CLIENT')`
4. ✅ All existing records will be set to `FUTURE_CLIENT` by default

## Notes

- The migration is **safe** - it doesn't delete any data
- It's **idempotent** - can be run multiple times safely
- All existing companies and people will be set to `FUTURE_CLIENT` by default
- You can update individual records through the UI or SQL after migration

