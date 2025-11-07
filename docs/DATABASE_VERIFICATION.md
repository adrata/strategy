# Database Verification & Migration Guide

## Current Status ✅

Your Prisma schema is **valid and formatted**.

```bash
✅ Schema validation: PASSED
✅ Schema formatting: PASSED
✅ All relations: CORRECT
✅ All indexes: DEFINED
```

## New Tables Added

### 1. meeting_transcripts
Stores meeting intelligence from Zoom, Fireflies, Otter, Microsoft Teams:
- ✅ All foreign keys defined
- ✅ Cascade deletes configured
- ✅ Indexes for performance
- ✅ Unique constraint (provider + externalMeetingId + workspaceId)

### 2. documents  
Tracks proposals, contracts, quotes with engagement:
- ✅ All foreign keys defined
- ✅ Cascade deletes configured
- ✅ Indexes for performance
- ✅ Status tracking (draft → sent → viewed → signed)

## Relations Verified ✅

### meeting_transcripts relations:
```prisma
workspace  → workspaces (CASCADE DELETE)
user       → users (SET NULL)
company    → companies (SET NULL)
connection → grand_central_connections (CASCADE DELETE)
```

### documents relations:
```prisma
workspace → workspaces (CASCADE DELETE)
user      → users (CASCADE DELETE)
company   → companies (CASCADE DELETE)
person    → people (SET NULL)
```

### Reverse relations added to:
- ✅ workspaces.meeting_transcripts
- ✅ workspaces.documents
- ✅ users.meeting_transcripts
- ✅ users.documents
- ✅ companies.meeting_transcripts
- ✅ companies.documents
- ✅ people.documents
- ✅ grand_central_connections.meeting_transcripts

## Indexes for Performance ✅

### meeting_transcripts indexes:
```sql
- workspaceId, meetingDate (time-series queries)
- workspaceId, provider (filter by integration)
- linkedCompanyId (company timeline)
- userId (user's meetings)
- connectionId (integration queries)
- UNIQUE (provider, externalMeetingId, workspaceId) (deduplication)
```

### documents indexes:
```sql
- workspaceId, sentAt (sent documents timeline)
- companyId, status (company proposals by status)
- documentType, status (all proposals, all contracts, etc.)
- status (global status filtering)
- workspaceId, documentType (workspace document types)
```

## Migration Options

### Option 1: Using Prisma Migrate (Recommended for Production)

```bash
# Generate migration
npx prisma migrate dev --name add_meeting_transcripts_and_documents

# Or for production
npx prisma migrate deploy
```

### Option 2: Direct SQL Migration (If migrate fails)

The SQL migration file is ready at:
```
prisma/migrations/20250120000000_add_meeting_transcripts_and_documents.sql
```

Apply manually in Neon console or via npx:
```bash
# Using Neon SQL Editor (web console):
# 1. Go to console.neon.tech
# 2. Select your project
# 3. Open SQL Editor
# 4. Copy/paste the SQL file contents
# 5. Run

# Or using prisma db execute:
npx prisma db execute --file prisma/migrations/20250120000000_add_meeting_transcripts_and_documents.sql --schema prisma/schema.prisma
```

### Option 3: Let Prisma Introspect After Manual Changes

```bash
# If you manually add tables via Neon console:
npx prisma db pull  # Pull changes from database
npx prisma generate # Regenerate Prisma Client
```

## Verification Steps

### 1. Verify Prisma Schema
```bash
npx prisma validate
# Should output: "The schema at prisma/schema.prisma is valid 🚀"
```

### 2. Check Migration Status
```bash
npx prisma migrate status
# Shows pending migrations
```

### 3. Generate Prisma Client
```bash
npx prisma generate
# Generates TypeScript types for new tables
```

### 4. Test Database Connection
```bash
npx prisma db pull
# Should succeed without changes if schema matches DB
```

## Schema Correctness Checklist

- [x] meeting_transcripts table defined
- [x] documents table defined
- [x] All foreign key relations defined
- [x] CASCADE DELETE where appropriate
- [x] SET NULL for optional relations
- [x] All indexes created for performance
- [x] Unique constraints for deduplication
- [x] Default values set correctly
- [x] JSONB fields for flexible data
- [x] Timestamp fields (createdAt, updatedAt)
- [x] Reverse relations on parent models
- [x] Schema validates without errors
- [x] Schema formatted consistently

## Streamlined Approach ✅

Following your request for a streamlined approach:

### What We KEPT (Essential):
1. ✅ **actions** - Already perfect, handles all activities
2. ✅ **meeting_transcripts** - New, captures meeting intelligence
3. ✅ **documents** - New, tracks proposals/contracts

### What We REMOVED (Duplicates):
1. ❌ calls table - Use actions with call types
2. ❌ buying_signals table - Use actions with signal type
3. ❌ revenue_activities table - Use actions

### Result:
- **Simple**: 3 models instead of 6
- **Clean**: No duplication
- **Powerful**: Full functionality
- **Steve Jobs approved**: Just the essentials ✨

## API Routes Verified ✅

All API routes use proper Prisma queries:

### Grand Central Integrations:
- `POST /api/v1/integrations/api-key/connect` ✅
  - Uses Prisma to create grand_central_connections
  - Validates API keys before storing
  - Encrypts sensitive data
  
- `POST /api/v1/integrations/nango/connect` ✅
  - Uses Prisma to create grand_central_connections
  - Handles OAuth flows
  - Proper error handling

### Meeting Transcripts:
```typescript
// Ready to use after migration
await prisma.meeting_transcripts.create({
  data: {
    workspaceId,
    userId,
    connectionId,
    provider: 'fireflies',
    externalMeetingId: 'ff-123',
    meetingTitle: 'Product Demo',
    transcript: '...',
    summary: '...',
    linkedCompanyId: companyId
  }
});
```

### Documents:
```typescript
// Ready to use after migration
await prisma.documents.create({
  data: {
    workspaceId,
    userId,
    companyId,
    documentType: 'proposal',
    title: 'Q1 2025 Proposal',
    status: 'draft'
  }
});
```

## Testing Your Changes

```bash
# 1. Run unit tests
npm test tests/unit/models/documents.test.ts

# 2. Run integration tests
npm test tests/integration/grand-central/meeting-integrations.test.ts

# 3. Run E2E tests
npm run test:e2e tests/e2e/grand-central/meeting-integrations-flow.spec.ts
```

## Next Steps

### 1. Run Migration
Choose one of the migration options above based on your environment.

### 2. Generate Client
```bash
npx prisma generate
```

### 3. Restart Dev Server
```bash
# Your dev server to pick up new Prisma Client
```

### 4. Test in UI
- Navigate to Grand Central → Integrations
- Connect Fireflies or Otter
- Verify connection is stored in database

## Database is Ready! 🚀

Your schema is:
- ✅ Valid
- ✅ Well-indexed
- ✅ Properly related
- ✅ Streamlined
- ✅ Production-ready

All you need to do is run the migration!

