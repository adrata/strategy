# Stacks Updates Summary

This document summarizes all database schema updates for the Stacks feature enhancements.

## Migration Files

### 1. `20250115000000_add_stacks_flag_and_comments.sql`
- Adds `isFlagged` boolean field to `StacksStory` table
- Creates `StacksComment` table with threading support
- Adds indexes and foreign key constraints

### 2. `20250115000001_add_stacks_acceptance_criteria.sql`
- Adds `acceptanceCriteria` TEXT field to `StacksStory` table

### 3. `20250115000002_verify_stacks_updates.sql`
- Idempotent verification migration
- Ensures all fields and tables exist
- Safe to run multiple times

## Schema Changes in `prisma/schema-streamlined.prisma`

### StacksStory Model
```prisma
model StacksStory {
  // ... existing fields ...
  description       String?
  acceptanceCriteria String?      @db.Text  // NEW
  // ... other fields ...
  isFlagged         Boolean        @default(false)  // NEW
  // ... relations ...
  comments          StacksComment[]  // NEW relation
}
```

### StacksComment Model (NEW)
```prisma
model StacksComment {
  id          String    @id @default(ulid())
  storyId     String    @db.VarChar(30)
  parentId    String?   @db.Text  // For threading support
  content     String    @db.Text
  createdById String    @db.VarChar(30)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?  // Soft delete support

  // Relations
  story     StacksStory    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  parent    StacksComment? @relation("StacksCommentParent", fields: [parentId], references: [id], onDelete: Cascade)
  replies   StacksComment[] @relation("StacksCommentParent")
  createdBy users           @relation(fields: [createdById], references: [id], onDelete: Cascade)

  @@index([storyId])
  @@index([parentId])
  @@index([createdAt])
  @@index([deletedAt])
}
```

## Database Fields Added

### StacksStory Table
1. `isFlagged` - BOOLEAN, NOT NULL, DEFAULT false
2. `acceptanceCriteria` - TEXT, NULLABLE

### StacksComment Table (New)
1. `id` - TEXT (ULID), PRIMARY KEY
2. `storyId` - VARCHAR(30), NOT NULL
3. `parentId` - TEXT, NULLABLE (for threading)
4. `content` - TEXT, NOT NULL
5. `createdById` - VARCHAR(30), NOT NULL
6. `createdAt` - TIMESTAMP(3), NOT NULL, DEFAULT CURRENT_TIMESTAMP
7. `updatedAt` - TIMESTAMP(3), NOT NULL, DEFAULT CURRENT_TIMESTAMP
8. `deletedAt` - TIMESTAMP(3), NULLABLE (soft delete)

## Indexes Created

### StacksComment Indexes
- `StacksComment_storyId_idx` - For fast story comment queries
- `StacksComment_parentId_idx` - For threading/replies
- `StacksComment_createdAt_idx` - For chronological sorting
- `StacksComment_deletedAt_idx` - For soft delete filtering

## Foreign Key Constraints

### StacksComment Constraints
- `storyId` → `StacksStory.id` (CASCADE DELETE)
- `parentId` → `StacksComment.id` (CASCADE DELETE)
- `createdById` → `users.id` (CASCADE DELETE)

## How to Apply Migrations

### Option 1: Run Individual SQL Files
```bash
# Apply each migration in order
psql $DATABASE_URL -f prisma/migrations/20250115000000_add_stacks_flag_and_comments.sql
psql $DATABASE_URL -f prisma/migrations/20250115000001_add_stacks_acceptance_criteria.sql

# Verify with the verification migration
psql $DATABASE_URL -f prisma/migrations/20250115000002_verify_stacks_updates.sql
```

### Option 2: Use Prisma Migrate (if using migrations folder structure)
```bash
# Generate Prisma client
npx prisma generate --schema=prisma/schema-streamlined.prisma

# Note: The migrations are SQL files, not Prisma migrate format
# They can be applied directly using psql or your database client
```

## Verification

After applying migrations, verify with:

```sql
-- Check StacksStory columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'StacksStory'
AND column_name IN ('isFlagged', 'acceptanceCriteria');

-- Check StacksComment table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'StacksComment';

-- Check StacksComment indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'StacksComment';
```

## API Changes

All API routes have been updated to include:
- `acceptanceCriteria` in GET/PATCH responses
- `isFlagged` in GET/PATCH responses
- Comments endpoints at `/api/v1/stacks/stories/[id]/comments`

## Frontend Changes

- StoryMainView: Split description/acceptance criteria boxes
- StoryDetailView: Alphanumeric rank display (1A, 2B, etc.)
- StacksBoard: Flag icon on kanban cards
- Comments section with threading support

