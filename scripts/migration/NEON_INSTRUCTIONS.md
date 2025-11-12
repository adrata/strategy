# Running Migration in Neon.tech

## Steps to Run Migration in Neon.tech

1. **Log into Neon.tech**
   - Go to https://console.neon.tech
   - Sign in to your account

2. **Open SQL Editor**
   - Select your database project
   - Click on "SQL Editor" in the left sidebar
   - Or click "New Query" button

3. **Copy and Paste the SQL**
   - Copy the entire contents of `scripts/migration/add_relationship_type.sql`
   - Paste it into the SQL editor

4. **Execute the Script**
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - The script will execute all steps

5. **Verify Success**
   - You should see success messages for each step
   - The verification queries at the end will show counts of records updated

## What the Migration Does

1. ✅ Creates `RelationshipType` enum (CLIENT, FUTURE_CLIENT, PARTNER, FUTURE_PARTNER)
2. ✅ Adds `relationshipType` column to `companies` table
3. ✅ Adds `relationshipType` column to `people` table
4. ✅ Sets all existing companies to `FUTURE_CLIENT`
5. ✅ Sets all existing people to `FUTURE_CLIENT`
6. ✅ Creates indexes for efficient filtering

## After Migration

- All existing companies and people will have `relationshipType = 'FUTURE_CLIENT'`
- You can update individual records through the UI or SQL
- PartnerOS will filter by `relationshipType IN ('PARTNER', 'FUTURE_PARTNER')`
- RevenueOS will filter by `relationshipType IN ('CLIENT', 'FUTURE_CLIENT')`

## Notes

- The migration is **safe** - it doesn't delete any data
- It's **idempotent** - can be run multiple times safely (uses IF NOT EXISTS)
- All existing records will be set to `FUTURE_CLIENT` by default

