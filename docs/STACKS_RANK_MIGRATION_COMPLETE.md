# Stacks Rank Migration - Complete

## Summary

The rank field has been successfully added to the StacksStory table to enable persistent backlog ordering. This allows users to reorder items in the backlog and have that order persist across page refreshes and sessions.

## Migration Status: ✅ COMPLETE

### Database Changes
- ✅ `rank` column added to `StacksStory` table (INTEGER, nullable)
- ✅ Index created on `(projectId, rank)` for efficient ordering queries
- ✅ Migration file: `prisma/migrations/20251105000000_add_stacks_story_rank.sql`
- ✅ Migration verified: Column and index exist in database

### Code Changes

#### Schema Updates
- ✅ `prisma/schema-streamlined.prisma`: Added `rank Int?` field to StacksStory model
- ✅ Added index on `[projectId, rank]`

#### API Updates
- ✅ `src/app/api/v1/stacks/stories/[id]/route.ts`:
  - GET endpoint: Returns `rank` in response
  - PATCH endpoint: Handles `rank` updates
- ✅ `src/app/api/v1/stacks/stories/route.ts`:
  - GET list endpoint: Orders by `rank` first (ascending), then `createdAt` and `priority`
  - Returns `rank` in all story responses

#### Frontend Updates
- ✅ `src/frontend/components/stacks/StacksBacklogTable.tsx`:
  - Uses `rank` from API responses instead of recalculating
  - Preserves database rank values when refreshing
  - Sends rank updates to API when items are reordered

## Verification

Run the verification script to confirm everything is set up:
```bash
node scripts/apply-stacks-rank-migration.js
```

Expected output:
- ✅ rank column exists in StacksStory table
- ✅ Index StacksStory_projectId_rank_idx exists
- ✅ Migration verification complete

## Next Steps

1. **Generate Prisma Client** (if not already done):
   ```bash
   npx prisma generate --schema=prisma/schema-streamlined.prisma
   ```
   Note: If this fails with a file permission error, restart your dev server first.

2. **Restart Dev Server**:
   ```bash
   npm run dev
   ```

3. **Test the Feature**:
   - Open the backlog view
   - Drag and drop items to reorder them
   - Refresh the page - order should persist
   - Check browser console for any errors

## How It Works

1. When items are first loaded, they have no rank (null). The frontend assigns sequential ranks based on array index.

2. When a user drags and drops items:
   - Frontend calculates new ranks for all affected items
   - Sends PATCH requests to update each item's rank
   - API saves ranks to database

3. When items are fetched:
   - API orders by rank (ascending), then createdAt, then priority
   - Frontend uses the rank from the API response
   - If rank is null, frontend falls back to index-based calculation

## Current Status

- **Total Stories**: 152
- **Stories with rank**: 0 (ranks will be assigned as users reorder items)
- **Stories without rank**: 152

## Notes

- Tasks don't have rank support yet (they're always appended after stories)
- Rank is 1-based (first item = 1, second item = 2, etc.)
- Rank is nullable - existing stories without rank will use index-based ordering
- The index on `(projectId, rank)` ensures efficient queries when filtering by project

