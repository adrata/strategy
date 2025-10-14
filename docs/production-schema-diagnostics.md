# Production Schema Diagnostics

This document describes the tools and procedures for diagnosing and fixing database schema issues in production, specifically the P2022 error that occurs when creating companies.

## Problem Description

The error `Database operation failed (P2022)` indicates that a column referenced in the Prisma schema doesn't exist in the production database. This is a schema drift issue where the production database hasn't been fully migrated to match the streamlined schema.

## Root Cause Analysis

The project uses `prisma/schema-streamlined.prisma`, but the production database may:
1. Not have all migrations applied from the streamlined schema
2. Have missing columns that were added in recent migrations
3. Have a mismatch between the schema definition and actual database structure

Key migrations that affect company creation:
- `20251009004916_baseline_streamlined_schema` - Baseline schema
- `20251012140945_rename_to_main_seller` - Renames `assignedUserId` to `mainSellerId`
- `20250130000000_add_ui_fields_and_opportunity_tracking` - Adds opportunity fields

## Diagnostic Tools

### 1. Enhanced Error Logging

The companies API (`src/app/api/v1/companies/route.ts`) now includes enhanced error logging that will:
- Log all fields being sent to the database
- Capture detailed P2022 error information including the specific missing column
- Provide better debugging information

### 2. Schema Diagnostics Endpoint

**Endpoint:** `GET /api/v1/diagnostics/schema`

This endpoint provides:
- Complete list of columns in the companies table
- Comparison with expected columns from the streamlined schema
- Test company creation to identify specific issues
- Recommendations for fixing schema drift

**Usage:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://action.adrata.com/api/v1/diagnostics/schema
```

### 3. Migration Diagnostics Endpoint

**Endpoint:** `GET /api/v1/diagnostics/migrations`

This endpoint provides:
- List of applied migrations
- Comparison with expected migrations
- Identification of missing critical migrations
- Migration status and recommendations

**Usage:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://action.adrata.com/api/v1/diagnostics/migrations
```

### 4. Diagnostic Scripts

#### Schema Diagnostic Script
```bash
node scripts/diagnose-production-schema.js
```

This script:
- Tests database connection
- Checks companies table schema
- Compares with expected columns
- Tests company creation with minimal and full data
- Provides specific recommendations

#### Migration Status Script
```bash
node scripts/check-migration-status.js
```

This script:
- Lists all applied migrations
- Compares with migration files
- Identifies missing critical migrations
- Provides migration recommendations

## Troubleshooting Steps

### Step 1: Run Diagnostics

1. **Check the enhanced error logs** in production to see the specific missing column
2. **Run the schema diagnostic script** to get a complete picture
3. **Check migration status** to see which migrations are missing

### Step 2: Identify the Issue

Based on the diagnostics, you'll see one of these scenarios:

#### Scenario A: Missing Critical Migrations
- **Symptoms:** Missing columns like `mainSellerId`, `opportunityStage`, etc.
- **Solution:** Run `npx prisma migrate deploy` on production

#### Scenario B: Schema Drift
- **Symptoms:** Database has different columns than expected
- **Solution:** Apply missing migrations or create a sync migration

#### Scenario C: Wrong Schema File
- **Symptoms:** Using wrong schema file in production
- **Solution:** Ensure production uses `schema-streamlined.prisma`

### Step 3: Apply the Fix

#### Option A: Run Missing Migrations (Recommended)
```bash
# On production server
npx prisma migrate deploy
```

#### Option B: Temporary API Fix
The API has been modified to only include opportunity fields if they have values, which should prevent P2022 errors for undefined fields.

#### Option C: Schema Introspection and Sync
```bash
# Generate a migration to sync the schema
npx prisma db pull
npx prisma migrate dev --name sync_production_schema
```

## Prevention

To prevent this issue in the future:

1. **Always run migrations on production** after deploying schema changes
2. **Use the diagnostic tools** before deploying to production
3. **Test company creation** in staging environment that matches production
4. **Monitor error logs** for P2022 errors after deployments

## Emergency Fix

If you need to fix the issue immediately:

1. **Deploy the enhanced error logging** to see the specific missing column
2. **Use the temporary API fix** that only includes fields with values
3. **Run the diagnostic scripts** to identify the root cause
4. **Apply the appropriate migration** based on the findings

## Files Modified

- `src/app/api/v1/companies/route.ts` - Enhanced error logging and conditional field inclusion
- `src/app/api/v1/diagnostics/schema/route.ts` - Schema diagnostic endpoint
- `src/app/api/v1/diagnostics/migrations/route.ts` - Migration diagnostic endpoint
- `scripts/diagnose-production-schema.js` - Schema diagnostic script
- `scripts/check-migration-status.js` - Migration status script

## Next Steps

1. Deploy these changes to production
2. Run the diagnostic tools to identify the specific issue
3. Apply the appropriate fix based on the findings
4. Monitor the error logs to confirm the fix works
5. Remove the temporary API modifications once the schema is fixed
