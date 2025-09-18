# Database Restore Instructions

## What Was Lost
- Dan workspace (`01K1VBYXHD0J895XAN0HGFBKJP`) and all associated data
- Dano workspace (`01K1VBYV8ETM2RCQA4GNN9EG72`) and all associated data  
- Demo workspace (`demo-workspace-2025`) and all associated data
- All leads, prospects, opportunities, clients, partners, actions, notes
- All users except Ross

## What Was Preserved
- TOP Engineering Plus workspace (`01K5D01YCQJ9TJ7CT4DZDE79T1`)
- 1,342 people in TOP Engineering Plus
- 451 companies in TOP Engineering Plus
- Ross user account (`ross@adrata.com`)

## Files in This Backup
- `schema_backup.prisma` - Current Prisma schema
- `migrations_backup/` - All migration files
- `workspaces_export.csv` - Workspace data
- `users_export.csv` - User data
- `companies_export.csv` - Company data
- `people_export.csv` - People data
- `*.json` - Complete JSON exports of all tables

## After Database Reset
1. Restore the Prisma schema from `schema_backup.prisma`
2. Run migrations from `migrations_backup/`
3. Import the CSV data files
4. Recreate missing workspaces and users

## Schema Changes Made
The schema was enhanced with TOP Engineers Plus context fields:
- Added to `companies` table: serviceOfferings, technicalCapabilities, etc.
- Added to `workspaces` table: companyContext, businessModel, etc.

These changes are preserved in the schema backup.
