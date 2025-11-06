# Stacks Schema Analysis - Data Requirements

## Summary
Analysis of Stacks data models in streamlined schema vs. production schema to ensure all required fields exist.

## Schema Files Analyzed
- `prisma/schema.prisma` (Production schema)
- `prisma/schema-streamlined.prisma` (Streamlined schema with all fields)

## Stacks Models Architecture

### 1. StacksProject
**Purpose**: Top-level container for all Stacks items in a workspace

**Fields (Both Schemas)**:
- `id`: String (cuid)
- `workspaceId`: String (VarChar 30)
- `name`: String (VarChar 200)
- `description`: String? (optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relations**:
- `workspace`: workspaces (belongs to)
- `epochs`: StacksEpoch[] (has many)
- `epics`: StacksEpic[] (has many)
- `stories`: StacksStory[] (has many)
- `tasks`: StacksTask[] (has many)

**Indexes**:
- `workspaceId`
- `workspaceId, name` (compound)

---

### 2. StacksEpoch
**Purpose**: Largest/highest-level container (bigger than epics)

**Fields (Both Schemas)**:
- `id`: String (cuid)
- `projectId`: String
- `title`: String (VarChar 200)
- `description`: String? (optional)
- `status`: String (default "todo", VarChar 20)
- `priority`: String (default "medium", VarChar 20)
- `product`: String? (VarChar 50)
- `section`: String? (VarChar 50)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relations**:
- `project`: StacksProject (belongs to)
- `epics`: StacksEpic[] (has many epics)
- `stories`: StacksStory[] (has many stories directly)

**Indexes**:
- `projectId`
- `projectId, status` (compound)

---

### 3. StacksEpic
**Purpose**: Large work items (bigger than stories, contained in epochs)

**Fields (Both Schemas)**:
- `id`: String (cuid)
- `projectId`: String
- `epochId`: String? (optional - epics can belong to epoch)
- `title`: String (VarChar 200)
- `description`: String? (optional)
- `status`: String (default "todo", VarChar 20)
- `priority`: String (default "medium", VarChar 20)
- `rank`: Int? (ordering/position, 1-based, lower = more important)
- `product`: String? (VarChar 50)
- `section`: String? (VarChar 50)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relations**:
- `project`: StacksProject (belongs to)
- `epoch`: StacksEpoch? (optional belongs to)
- `stories`: StacksStory[] (has many)

**Indexes**:
- `projectId`
- `epochId`
- `projectId, status` (compound)
- `projectId, rank` (compound)

---

### 4. StacksStory
**Purpose**: User stories/features (contained in epics or epochs)

**Fields in Streamlined Schema** (Complete):
- `id`: String (cuid)
- `epicId`: String? (optional - can belong to epic)
- `epochId`: String? (optional - can belong to epoch)
- `projectId`: String (required)
- `title`: String (VarChar 200)
- `description`: String? (optional)
- `acceptanceCriteria`: String? (Text) ✅ **ADDED**
- `status`: String (default "todo", VarChar 20)
- `priority`: String (default "medium", VarChar 20)
- `assigneeId`: String? (VarChar 30)
- `viewType`: String? (VarChar 20)
- `product`: String? (VarChar 50)
- `section`: String? (VarChar 50)
- `statusChangedAt`: DateTime? (optional)
- `isFlagged`: Boolean (default false) ✅ **ADDED**
- `points`: Int? (optional) ✅ **ADDED**
- `rank`: Int? (ordering/position, 1-based) ✅ **ADDED**
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Fields in Production Schema** (Missing some):
- ❌ Missing: `acceptanceCriteria` (Text)
- ❌ Missing: `isFlagged` (Boolean, default false)
- ❌ Missing: `points` (Int?)
- ❌ Missing: `rank` (Int?)

**Relations**:
- `assignee`: users? (optional belongs to)
- `epic`: StacksEpic? (optional belongs to)
- `epoch`: StacksEpoch? (optional belongs to)
- `project`: StacksProject (belongs to)
- `tasks`: StacksTask[] (has many)
- `comments`: StacksComment[] (has many) ✅ **ADDED**

**Indexes**:
- `epicId`
- `epochId`
- `projectId`
- `assigneeId`
- `projectId, status` (compound)
- `projectId, rank` (compound) ✅ **ADDED**

---

### 5. StacksTask
**Purpose**: Individual tasks (contained in stories or standalone)

**Fields (Both Schemas)**:
- `id`: String (cuid)
- `storyId`: String? (optional - can belong to story)
- `projectId`: String (required)
- `title`: String (VarChar 200)
- `description`: String? (optional)
- `status`: String (default "todo", VarChar 20)
- `priority`: String (default "medium", VarChar 20)
- `type`: String (default "task", VarChar 20)
- `assigneeId`: String? (VarChar 30)
- `product`: String? (VarChar 50)
- `section`: String? (VarChar 50)
- `rank`: Int? (ordering/position, 1-based)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Note**: Production schema has `attachments` (Json?) field that streamlined schema doesn't have.

**Relations**:
- `assignee`: users? (optional belongs to)
- `project`: StacksProject (belongs to)
- `story`: StacksStory? (optional belongs to)

**Indexes**:
- `storyId`
- `projectId`
- `assigneeId`
- `projectId, status` (compound)
- `projectId, type` (compound)
- `projectId, rank` (compound)

---

### 6. StacksComment
**Purpose**: Comments on stories (supports nested replies)

**Fields (Both Schemas)**:
- `id`: String (ulid)
- `storyId`: String (VarChar 30)
- `parentId`: String? (optional - for nested comments)
- `content`: String (Text)
- `createdById`: String (VarChar 30)
- `createdAt`: DateTime
- `updatedAt`: DateTime
- `deletedAt`: DateTime? (soft delete)

**Relations**:
- `story`: StacksStory (belongs to)
- `parent`: StacksComment? (optional parent comment)
- `replies`: StacksComment[] (nested replies)
- `createdBy`: users (belongs to)

**Indexes**:
- `storyId`
- `parentId`
- `createdAt`
- `deletedAt`

---

## Migration Files Available

The following migration files exist to add missing fields:

1. **20250115000000_add_stacks_flag_and_comments.sql**
   - Adds `isFlagged` field to StacksStory
   - Creates `StacksComment` table with all indexes and foreign keys

2. **20250115000001_add_stacks_acceptance_criteria.sql**
   - Adds `acceptanceCriteria` field to StacksStory

3. **20250115000003_add_stacks_points.sql**
   - Adds `points` field to StacksStory

4. **20251105000000_add_stacks_story_rank.sql**
   - Adds `rank` field to StacksStory
   - Creates index on `projectId, rank`

5. **20251105000001_add_stacks_task_rank.sql**
   - Adds `rank` field to StacksTask
   - Creates index for ordering

6. **20251105132937_add_epic_rank.sql**
   - Adds `rank` field to StacksEpic
   - Creates index for ordering

---

## Discrepancies Between Schemas

### Streamlined Schema Has (Production Schema Missing):
**StacksStory**:
1. ✅ `acceptanceCriteria` (Text) - **Migration exists**
2. ✅ `isFlagged` (Boolean, default false) - **Migration exists**
3. ✅ `points` (Int?) - **Migration exists**
4. ✅ `rank` (Int?) - **Migration exists**
5. ✅ `comments` relation to StacksComment - **Migration exists**
6. ✅ Index on `projectId, rank` - **Migration exists**

### Production Schema Has (Streamlined Schema Missing):
**StacksTask**:
1. `attachments` (Json?) - Extra field in production

---

## Verification Required

### To ensure production database has all required fields:

1. **Run migrations** if not already applied:
   ```bash
   npx prisma migrate deploy
   ```

2. **Verify StacksStory table** has all fields:
   - acceptanceCriteria (TEXT)
   - isFlagged (BOOLEAN DEFAULT false)
   - points (INTEGER)
   - rank (INTEGER)

3. **Verify StacksComment table** exists with all fields and indexes

4. **Verify indexes** exist:
   - StacksStory: `projectId, rank`
   - StacksEpic: `projectId, rank`
   - StacksTask: `projectId, rank`
   - StacksComment: `storyId`, `parentId`, `createdAt`, `deletedAt`

---

## Recommendations

1. **Update schema.prisma** to match streamlined schema:
   - Add missing fields to StacksStory model
   - Add StacksComment relation to StacksStory
   - Ensure all indexes are properly defined

2. **Ensure migrations are applied** to production database

3. **Update API endpoints** to support new fields:
   - Accept `acceptanceCriteria` when creating/updating stories
   - Accept `isFlagged` for flagging important stories
   - Accept `points` for story point estimation
   - Use `rank` for backlog ordering
   - Support comments CRUD operations

4. **Update frontend** to utilize new fields:
   - Display/edit acceptance criteria
   - Show flag indicator for flagged stories
   - Support story points input
   - Implement drag-and-drop ordering using rank
   - Show/add/edit comments on stories

---

## Conclusion

**Status**: ✅ All required Stacks fields have corresponding migration files

**Action Required**: 
1. Update `prisma/schema.prisma` to match `prisma/schema-streamlined.prisma` for StacksStory model
2. Ensure all migrations are applied to production database
3. Verify database schema matches streamlined schema

**Safety**: All migrations use `IF NOT EXISTS` clauses, making them safe to run multiple times.

