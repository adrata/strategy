# Stacks Updates Verification Checklist

## ✅ Schema Verification (`prisma/schema-streamlined.prisma`)

### StacksStory Model
- [x] `acceptanceCriteria String? @db.Text` - Line 1068
- [x] `isFlagged Boolean @default(false)` - Line 1076
- [x] `comments StacksComment[]` relation - Line 1084

### StacksComment Model
- [x] Model exists - Line 1118
- [x] `id String @id @default(ulid())` - Line 1119
- [x] `storyId String @db.VarChar(30)` - Line 1120
- [x] `parentId String? @db.Text` - Line 1121 (matches migration)
- [x] `content String @db.Text` - Line 1122
- [x] `createdById String @db.VarChar(30)` - Line 1123
- [x] `createdAt DateTime @default(now())` - Line 1124
- [x] `updatedAt DateTime @updatedAt` - Line 1125
- [x] `deletedAt DateTime?` - Line 1126
- [x] Relations defined correctly - Lines 1129-1132
- [x] Indexes defined - Lines 1134-1137

### Users Model
- [x] `stacks_comments StacksComment[]` relation - Line 156

## ✅ Migration Files

### 1. `20250115000000_add_stacks_flag_and_comments.sql`
- [x] Adds `isFlagged` column to StacksStory
- [x] Creates StacksComment table
- [x] Creates all indexes
- [x] Creates all foreign key constraints

### 2. `20250115000001_add_stacks_acceptance_criteria.sql`
- [x] Adds `acceptanceCriteria` column to StacksStory

### 3. `20250115000002_verify_stacks_updates.sql`
- [x] Idempotent verification migration
- [x] Checks for all fields and tables

## ✅ Schema Validation
- [x] `npx prisma validate` - ✅ PASSED
- [x] `npx prisma format` - ✅ PASSED

## 🔄 Next Steps

### To Apply Migrations to Database:

1. **Stop any running Prisma processes** (to avoid file locks)

2. **Apply migrations** (choose one method):

   **Method A: Direct SQL execution**
   ```bash
   psql $DATABASE_URL -f prisma/migrations/20250115000000_add_stacks_flag_and_comments.sql
   psql $DATABASE_URL -f prisma/migrations/20250115000001_add_stacks_acceptance_criteria.sql
   psql $DATABASE_URL -f prisma/migrations/20250115000002_verify_stacks_updates.sql
   ```

   **Method B: Using verification migration only** (idempotent)
   ```bash
   psql $DATABASE_URL -f prisma/migrations/20250115000002_verify_stacks_updates.sql
   ```

3. **Generate Prisma Client** (after migrations are applied)
   ```bash
   npx prisma generate --schema=prisma/schema-streamlined.prisma
   ```
   
   Note: If you get a file lock error (EPERM), close any running Node processes or restart your terminal.

4. **Verify Database State**
   ```sql
   -- Check columns
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'StacksStory'
   AND column_name IN ('isFlagged', 'acceptanceCriteria');
   
   -- Check table exists
   SELECT table_name
   FROM information_schema.tables
   WHERE table_name = 'StacksComment';
   
   -- Check indexes
   SELECT indexname
   FROM pg_indexes
   WHERE tablename = 'StacksComment';
   ```

## ✅ API Route Updates

All API routes have been updated:
- [x] `src/app/api/v1/stacks/stories/route.ts` - Includes acceptanceCriteria
- [x] `src/app/api/v1/stacks/stories/[id]/route.ts` - Includes acceptanceCriteria
- [x] `src/app/api/v1/stacks/stories/[id]/comments/route.ts` - Full CRUD for comments

## ✅ Frontend Component Updates

- [x] `StoryMainView.tsx` - Split description/acceptance criteria
- [x] `StoryDetailView.tsx` - Alphanumeric ranks, dynamic button text
- [x] `StacksBoard.tsx` - Flag icon display
- [x] `StacksCommentsSection.tsx` - Comments with threading

## ✅ Test Coverage

- [x] Component tests created
- [x] API route tests created
- [x] Rank calculation tests created

---

**Status: All schema and code updates are complete. Migrations are ready to apply to the database.**

