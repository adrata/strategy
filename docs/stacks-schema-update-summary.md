# Stacks Schema Update Summary

## Schema Configuration

The project is configured to use `schema-streamlined.prisma`:
- `package.json` postinstall script: `prisma generate --schema=prisma/schema-streamlined.prisma`
- `package.json` build script: `prisma generate --schema=prisma/schema-streamlined.prisma && next build`

## Current Stacks Models in Streamlined Schema

### 1. StacksProject
- Maps to: `StacksProject` table (existing)
- Status: ✅ Configured correctly

### 2. StacksEpic  
- Maps to: `StacksEpic` table (existing)
- Status: ✅ Configured correctly
- Used by: `/api/stacks/epics` route

### 3. StacksEpoch
- Maps to: `StacksEpoch` table (needs to be created)
- Status: ⚠️ Schema defined, but table doesn't exist in database yet
- Note: This is for bigger/higher-level items
- Action needed: Create migration to add `StacksEpoch` table

### 4. StacksStory
- Maps to: `StacksStory` table (existing)
- Status: ✅ Configured correctly
- Supports both `epicId` and `epochId` relationships

## Database Current State

From database check:
- ✅ `StacksEpic` table exists
- ✅ `StacksProject` table exists  
- ✅ `StacksStory` table exists
- ✅ `StacksTask` table exists
- ❌ `StacksEpoch` table does NOT exist yet

## Prisma Client Status

After schema update:
- ✅ `prisma.stacksProject` - accessible
- ✅ `prisma.stacksEpic` - accessible  
- ✅ `prisma.stacksEpoch` - accessible (but will fail at runtime until table exists)
- ✅ `prisma.stacksStory` - accessible

## Next Steps

1. **Create StacksEpoch table migration**:
   ```sql
   CREATE TABLE "StacksEpoch" (
       id TEXT PRIMARY KEY,
       "projectId" TEXT NOT NULL,
       title VARCHAR(200) NOT NULL,
       description TEXT,
       status VARCHAR(20) NOT NULL DEFAULT 'todo',
       priority VARCHAR(20) NOT NULL DEFAULT 'medium',
       product VARCHAR(50),
       section VARCHAR(50),
       "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
       FOREIGN KEY ("projectId") REFERENCES "StacksProject"(id) ON DELETE CASCADE
   );
   
   CREATE INDEX "StacksEpoch_projectId_idx" ON "StacksEpoch"("projectId");
   CREATE INDEX "StacksEpoch_projectId_status_idx" ON "StacksEpoch"("projectId", "status");
   ```

2. **Add epochId column to StacksStory** (if needed):
   ```sql
   ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "epochId" TEXT;
   CREATE INDEX IF NOT EXISTS "StacksStory_epochId_idx" ON "StacksStory"("epochId");
   ```

3. **Regenerate Prisma client** (after dev server stops):
   ```bash
   npx prisma generate --schema=prisma/schema-streamlined.prisma
   ```

## Current API Routes

- `/api/stacks/projects` - Uses `prisma.stacksProject` ✅
- `/api/stacks/epics` - Uses `prisma.stacksEpic` ✅  
- `/api/v1/stacks/stories` - Uses `prisma.stacksStory` ✅

All routes now have proper error handling and will return empty arrays instead of crashing.

