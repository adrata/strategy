# StacksEpoch Migration Summary

## Overview
This migration creates the `StacksEpoch` table and establishes the proper hierarchy:
- **Project** → **Epoch** → **Epic** → **Story** → **Task**

## Safety Features
- ✅ Uses `IF NOT EXISTS` checks to prevent errors on re-run
- ✅ Does not delete or modify existing data
- ✅ All foreign keys use appropriate cascade rules:
  - `ON DELETE CASCADE` for project relationships (if project is deleted)
  - `ON DELETE SET NULL` for epoch/epic relationships (preserves stories/tasks)
- ✅ Indexes created with `IF NOT EXISTS` to prevent duplicates
- ✅ Verifies existing tables before modifying them

## Changes Made

### 1. Create StacksEpoch Table
- Creates new `StacksEpoch` table with all required fields
- Adds foreign key to `StacksProject`
- Creates indexes for performance (`projectId`, `projectId + status`)

### 2. Add epochId to StacksEpic
- Adds `epochId` column to `StacksEpic` table (allows epics to belong to epochs)
- Creates foreign key constraint with `ON DELETE SET NULL`
- Creates index on `epochId` for query performance

### 3. Ensure StacksStory Relationships
- Verifies `epochId` column exists in `StacksStory` (allows stories to belong directly to epochs)
- Verifies `epicId` column exists in `StacksStory` (preserves epic → story relationship)
- Creates indexes if they don't exist

### 4. Safety Check for StacksEpic Table
- Verifies `StacksEpic` table exists (should always exist, but included as safety check)
- Creates table with epochId column if it doesn't exist (shouldn't happen)

## Schema Updates
- Updated `StacksEpic` model to include `epochId` field
- Enabled `epics` relation in `StacksEpoch` model
- Added `epochId` index to `StacksEpic` model

## Hierarchy Structure
```
StacksProject
  ├── StacksEpoch (new table)
  │   ├── StacksEpic (via epochId)
  │   │   └── StacksStory (via epicId)
  │   └── StacksStory (direct, via epochId)
  └── StacksStory (direct to project)
```

## Testing Checklist
- [ ] Migration runs without errors
- [ ] StacksEpoch table created successfully
- [ ] StacksEpic.epochId column added
- [ ] Foreign key constraints work correctly
- [ ] Indexes created for performance
- [ ] Existing data preserved
- [ ] Prisma client generates correctly

## Rollback Plan
If needed, rollback can be done by:
1. Dropping the `StacksEpoch` table
2. Removing `epochId` column from `StacksEpic` (if no data depends on it)
3. This migration is designed to be reversible if no epoch data exists

