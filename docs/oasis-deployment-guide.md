# Oasis Deployment Guide

## Critical Fixes Deployed

### Issues Fixed
1. React error #310 - Hook ordering violation in OasisLeftPanel
2. Missing OasisReadReceipt table causing 503 errors
3. Missing OasisDirectMessage and related tables
4. Graceful error handling for database migration errors

### Files Changed
- `src/products/oasis/components/OasisLeftPanel.tsx` - Fixed hook ordering
- `src/products/oasis/hooks/useOasisDMs.ts` - Added migration error handling
- `src/products/oasis/hooks/useOasisChannels.ts` - Added migration error handling
- `src/app/api/v1/oasis/oasis/dms/route.ts` - Wrapped OasisReadReceipt query in try-catch
- `src/platform/ui/components/ProfilePanel.tsx` - Moved Inbox above Stacks
- `prisma/schema.prisma` - Updated Stacks models to match streamlined schema

## Database Migration Required

### Tables to Create
The following Oasis tables must exist in production:

1. **OasisChannel** - Communication channels within workspaces
2. **OasisChannelMember** - Members of channels
3. **OasisDirectMessage** - Direct message conversations
4. **OasisDMParticipant** - Participants in direct messages
5. **OasisMessage** - Messages in channels and DMs
6. **OasisReaction** - Emoji reactions to messages
7. **OasisReadReceipt** - Track which messages users have read
8. **OasisExternalConnection** - External connections for Oasis

### Migration File
`prisma/migrations/20251106000000_ensure_all_oasis_tables_exist.sql`

### How to Apply Migration

#### Option 1: Using Prisma Migrate (Recommended)
```bash
npx prisma migrate deploy
```

#### Option 2: Direct SQL Execution
```bash
# Using psql
psql $DATABASE_URL -f prisma/migrations/20251106000000_ensure_all_oasis_tables_exist.sql

# Or using the verification script
psql $DATABASE_URL -f scripts/apply-oasis-migration.sql
```

#### Option 3: Through Vercel Dashboard
1. Go to Vercel project settings
2. Navigate to Storage > Postgres
3. Run the SQL from the migration file in the query console

### Verification

After running the migration, verify all tables exist:

```sql
SELECT 
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) as column_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename LIKE 'Oasis%'
ORDER BY tablename;
```

Expected output: 8 tables

```
OasisChannel
OasisChannelMember
OasisDirectMessage
OasisDMParticipant
OasisExternalConnection
OasisMessage
OasisReaction
OasisReadReceipt
```

## Deployment Status

### ✅ Completed
- [x] Fixed React error #310 hook ordering issue
- [x] Added graceful error handling for missing tables
- [x] Created comprehensive migration SQL file
- [x] Updated Stacks schema to match streamlined version
- [x] Deployed to develop branch
- [x] Deployed to staging branch
- [x] Deployed to main branch

### 🔄 Pending (DevOps Required)
- [ ] Run migration on production database
- [ ] Verify all 8 Oasis tables exist in production
- [ ] Test Oasis functionality after migration
- [ ] Monitor for any remaining errors

## Rollback Plan

If issues occur after deployment:

1. The migration is safe to run multiple times (uses IF NOT EXISTS)
2. No data is modified or deleted
3. Tables can be dropped if needed with:
   ```sql
   DROP TABLE IF EXISTS "OasisReadReceipt" CASCADE;
   DROP TABLE IF EXISTS "OasisReaction" CASCADE;
   DROP TABLE IF EXISTS "OasisMessage" CASCADE;
   DROP TABLE IF EXISTS "OasisDMParticipant" CASCADE;
   DROP TABLE IF EXISTS "OasisDirectMessage" CASCADE;
   DROP TABLE IF EXISTS "OasisChannelMember" CASCADE;
   DROP TABLE IF EXISTS "OasisChannel" CASCADE;
   DROP TABLE IF EXISTS "OasisExternalConnection" CASCADE;
   ```

## Testing Checklist

After migration is applied:

- [ ] Navigate to `/[workspace]/oasis/`
- [ ] Verify channels load without errors
- [ ] Verify DMs load without errors
- [ ] Verify no React error #310 appears
- [ ] Send a test message in a channel
- [ ] Send a test DM
- [ ] Verify read receipts work (if implemented in UI)
- [ ] Check browser console for any errors

## Support Contact

If you encounter issues:
1. Check browser console for specific error messages
2. Check server logs for database errors
3. Verify migration was successfully applied
4. Contact development team with error details

