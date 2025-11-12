# Add RelationshipType Migration

This migration adds a `relationshipType` field to both `companies` and `people` tables, allowing you to tag records as:
- `CLIENT` - Current client
- `FUTURE_CLIENT` - Future client
- `PARTNER` - Current partner  
- `FUTURE_PARTNER` - Future partner

## What This Migration Does

1. Creates the `RelationshipType` enum type
2. Adds `relationshipType` column to `companies` table
3. Adds `relationshipType` column to `people` table
4. Sets all existing records to `FUTURE_CLIENT` by default
5. Creates indexes for efficient filtering

## Safety

- ✅ **No data deletion** - Only adds new columns
- ✅ **Idempotent** - Can be run multiple times safely (uses IF NOT EXISTS)
- ✅ **Non-breaking** - Existing queries continue to work

## How to Run

### Option 1: Using psql (Recommended)

```bash
psql $DATABASE_URL -f scripts/migration/add_relationship_type.sql
```

### Option 2: Using Database Client

1. Open your database client (pgAdmin, DBeaver, etc.)
2. Connect to your database
3. Open `scripts/migration/add_relationship_type.sql`
4. Execute the script

### Option 3: Using Prisma Studio (if you have DB admin access)

1. Open Prisma Studio: `npx prisma studio`
2. Navigate to the SQL editor
3. Copy and paste the contents of `scripts/migration/add_relationship_type.sql`
4. Execute

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

Once the migration is complete:

1. **Update Prisma Client**: Run `npx prisma generate` to regenerate the Prisma client with the new field
2. **Update Records**: You can now update individual records:
   - Set partners: `UPDATE people SET relationshipType = 'PARTNER' WHERE ...`
   - Set clients: `UPDATE people SET relationshipType = 'CLIENT' WHERE ...`
   - Set future partners: `UPDATE people SET relationshipType = 'FUTURE_PARTNER' WHERE ...`

## Notes

- All existing companies and people will be set to `FUTURE_CLIENT` by default
- You can update them individually through the UI or via SQL
- The `status` field (pipeline stage) remains independent and unchanged
- PartnerOS will show records with `relationshipType IN ('PARTNER', 'FUTURE_PARTNER')`
- RevenueOS will show records with `relationshipType IN ('CLIENT', 'FUTURE_CLIENT')`

