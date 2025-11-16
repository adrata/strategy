# Calendar/Meeting Sync Setup

## Status: Ready to Deploy

All code changes are complete. You need to run the SQL migration manually.

## What's Been Done

1. ✅ Added `calendar` and `events` models to `prisma/schema-streamlined.prisma`
2. ✅ Enabled calendar sync service (removed disabled check)
3. ✅ Created calendar sync cron endpoint (`/api/cron/calendar-sync`)
4. ✅ Added calendar sync cron to `vercel.json` (runs every 5 minutes)
5. ✅ Created SQL migration file

## What You Need to Do

### Step 1: Run SQL Migration

Run the SQL migration file in your Neon database console:

**File:** `prisma/migrations/add_calendar_tables_manual.sql`

You can:
1. Copy the SQL from the file
2. Paste it into your Neon database console
3. Execute it

Or use psql:
```bash
psql $DATABASE_URL -f prisma/migrations/add_calendar_tables_manual.sql
```

### Step 2: Generate Prisma Client

After running the migration:
```bash
npx prisma generate --schema=prisma/schema-streamlined.prisma
```

### Step 3: Test Calendar Sync

Once deployed, the calendar sync will:
- Run automatically every 5 minutes via cron
- Sync meetings from Outlook/Gmail
- Link meetings to people and companies
- Create action records for meetings

## How It Works

- **Outlook**: Uses the same connection as email (provides both email and calendar access)
- **Gmail**: Requires separate `google-calendar` connection
- **Sync Frequency**: Every 5 minutes (same as email sync)
- **Date Range**: Syncs meetings from today to 30 days in the future
- **Linking**: Automatically links meetings to people/companies based on attendees

## Files Changed

- `prisma/schema-streamlined.prisma` - Added calendar and events models
- `src/platform/services/calendar-sync-service.ts` - Enabled sync
- `src/app/api/cron/calendar-sync/route.ts` - New cron endpoint
- `vercel.json` - Added calendar sync cron job

## Next Steps

1. Run the SQL migration
2. Generate Prisma client
3. Deploy to production
4. Calendar sync will start automatically


