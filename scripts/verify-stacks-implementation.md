# Stacks Implementation Verification Checklist

## Overview
This document lists all changes made in this chat session and how to verify they're fully implemented.

## New Database Columns/Tables

### 1. `isFlagged` Column (StacksStory table)
- **Type**: BOOLEAN
- **Default**: false
- **Purpose**: Allows users to flag stories for attention
- **Migration**: `20250115000000_add_stacks_flag_and_comments.sql`

### 2. `acceptanceCriteria` Column (StacksStory table)
- **Type**: TEXT (nullable)
- **Purpose**: Stores acceptance criteria for stories
- **Migration**: `20250115000001_add_stacks_acceptance_criteria.sql`

### 3. `StacksComment` Table (NEW)
- **Purpose**: Threaded comment system for stories
- **Fields**: id, storyId, parentId, content, createdById, createdAt, updatedAt, deletedAt
- **Migration**: `20250115000000_add_stacks_flag_and_comments.sql`

## Frontend Features Added

### 1. Split Description/Acceptance Criteria Boxes
- **File**: `src/frontend/components/stacks/story-views/StoryMainView.tsx`
- **Change**: Split single description box into two side-by-side boxes
- **Verification**: Open any story detail view, should see "Description" on left, "Acceptance Criteria" on right

### 2. Priority Dropdown Ordering
- **File**: `src/frontend/components/stacks/story-views/StoryMainView.tsx`
- **Change**: Priority options now ordered: Urgent → High → Medium → Low
- **Verification**: Open story detail, check Priority dropdown order

### 3. Alphanumeric Rank Display (1A, 2B, etc.)
- **File**: `src/frontend/components/stacks/StoryDetailView.tsx`
- **Change**: Rank displayed as alphanumeric (e.g., 1A, 2B) based on priority grouping
- **Verification**: Open story detail, check rank squircle in header shows format like "1A"

### 4. Dynamic Button Text
- **File**: `src/frontend/components/stacks/StoryDetailView.tsx`
- **Change**: "Update" button now shows "Update Story", "Update Bug", or "Update Task" based on viewType
- **Verification**: Open different story types, check button text changes

### 5. Italicized Status in Advance Button
- **File**: `src/frontend/components/stacks/StoryDetailView.tsx`
- **Change**: Status label in "Advance to..." button is now italicized
- **Verification**: Open story with status "up-next", check "Advance to *In Progress*" button

### 6. Flag Icon on Kanban Cards
- **File**: `src/frontend/components/stacks/StacksBoard.tsx`
- **Change**: Red flag icon appears on cards when isFlagged is true
- **Verification**: Flag a story, check workstream board shows flag icon

### 7. Comments Section with Threading
- **File**: `src/frontend/components/stacks/story-views/StacksCommentsSection.tsx`
- **Change**: Full threaded comments system at bottom of story detail view
- **Verification**: Open story detail, scroll to bottom, see comments section

### 8. Workstream Board Shows 'todo' Status
- **File**: `src/frontend/components/stacks/StacksBoard.tsx`
- **Change**: Stories with 'todo' status now appear in "UP NEXT" column
- **Verification**: Check workstream board shows all stories (including 'todo' status)

## API Changes

### 1. Updated GET Routes
- **Files**: 
  - `src/app/api/v1/stacks/stories/route.ts`
  - `src/app/api/v1/stacks/stories/[id]/route.ts`
- **Changes**: Include `acceptanceCriteria` and `isFlagged` in responses
- **Fallback**: Gracefully handles missing columns if migrations not applied

### 2. Updated PATCH Routes
- **Files**: Same as above
- **Changes**: Accept and update `acceptanceCriteria` and `isFlagged` fields

### 3. New Comments API
- **File**: `src/app/api/v1/stacks/stories/[id]/comments/route.ts`
- **Endpoints**: GET, POST, PATCH, DELETE for comments
- **Features**: Threaded replies, soft delete, user authentication

## How to Apply Migrations

### Option 1: Run Migration Script (Recommended)
```bash
node scripts/apply-stacks-migrations.js
```

### Option 2: Run SQL Files Directly
```bash
# Using psql
psql $DATABASE_URL -f prisma/migrations/20250115000000_add_stacks_flag_and_comments.sql
psql $DATABASE_URL -f prisma/migrations/20250115000001_add_stacks_acceptance_criteria.sql
psql $DATABASE_URL -f prisma/migrations/20250115000002_verify_stacks_updates.sql
```

### Option 3: Use Verification Migration (Idempotent)
```bash
# This one checks and creates everything safely
psql $DATABASE_URL -f prisma/migrations/20250115000002_verify_stacks_updates.sql
```

## After Migrations

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate --schema=prisma/schema-streamlined.prisma
   ```

2. **Restart Dev Server**:
   ```bash
   npm run dev
   ```

3. **Verify Everything Works**:
   - Open workstream board - should see all stacks
   - Open a story detail - should see all new features
   - Try flagging a story - should see flag icon
   - Try adding acceptance criteria - should save
   - Try adding a comment - should work with threading

