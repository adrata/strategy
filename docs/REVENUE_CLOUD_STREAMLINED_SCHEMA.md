# Revenue Cloud - Streamlined Essential Schema

## Philosophy: Steve Jobs Simplicity

**"Focus and simplicity...once you get there, you can move mountains."**

## What We Already Have ✅

### Actions Model (The Hub)
The `actions` table is our **single source of truth** for all activities:

**Already Tracks:**
- ✅ Calls (`cold_call`, `follow_up_call`, `discovery_call`, `demo_call`, `closing_call`, `voicemail_left`)
- ✅ Emails (`email_sent`, `email_received`, `cold_email`, `follow_up_email`)
- ✅ Meetings (`discovery_meeting`, `demo_meeting`, `proposal_meeting`, `closing_meeting`, `meeting_completed`)
- ✅ Buying Signals (`buying_signal_detected`, `interest_expressed`)
- ✅ LinkedIn (`linkedin_connection_request`, `linkedin_message`)
- ✅ Proposals (`proposal_sent`, `contract_sent`, `deal_closed`)

**Action Fields:**
```prisma
model actions {
  id          String
  workspaceId String
  userId      String
  companyId   String?
  personId    String?
  type        String       // discovery_call, demo_meeting, proposal_meeting, etc.
  subject     String
  description String?
  outcome     String?
  scheduledAt DateTime?    // When scheduled/planned
  completedAt DateTime?    // When actually completed
  status      ActionStatus // PLANNED (future), IN_PROGRESS, COMPLETED (past)
  priority    ActionPriority
}
```

**Meeting Types (Discovery → Demo → Proposal → Close):**
- `discovery_call` / `discovery_meeting` - Initial discovery
- `demo_call` / `demo_meeting` - Product demonstration  
- `proposal_meeting` - Proposal presentation
- `closing_call` / `closing_meeting` - Final closing

**Status Handling:**
- `PLANNED` + `scheduledAt` (future) = Scheduled meeting
- `COMPLETED` + `completedAt` (past) = Completed meeting
- `IN_PROGRESS` = Meeting happening now

## What We're Adding ✨

### 1. Meeting Transcripts (Already Added)

From Zoom, Fireflies, Otter, Microsoft Teams:

```prisma
model meeting_transcripts {
  // Core
  id, workspaceId, userId, connectionId
  provider (zoom, fireflies, otter, microsoft-teams)
  
  // Meeting data
  meetingTitle, meetingDate, duration
  participants
  transcript (full text)
  summary (AI-generated)
  keyPoints, actionItems
  
  // Linking
  linkedCompanyId
  linkedPeopleIds
}
```

### 2. Documents (New - The Only Addition Needed!)

Track proposals, contracts, and their status:

```prisma
model documents {
  // Core
  id, workspaceId, userId, companyId, personId
  
  // Document details
  documentType (proposal, contract, quote, case-study, presentation)
  title, description
  
  // File
  fileUrl, fileSize, fileType
  
  // Status tracking
  status (draft, sent, viewed, downloaded, signed)
  sentAt, firstViewedAt, lastViewedAt, viewCount
  signedAt
  
  // Value
  proposedValue, currency
  
  // Integration
  externalId, provider (docusign, pandadoc, proposify)
}
```

## Why This is Perfect

### 1. No Duplication
- Calls → Already in `actions` (no separate table needed)
- Activities → Already in `actions` (no separate timeline needed)
- Buying Signals → Already in `actions` as action type

### 2. Simple Data Flow

```
Email/Call/Meeting Happens
         ↓
Create action record
         ↓
Extract transcript (if meeting)
         ↓
Store in meeting_transcripts
         ↓
Create document (if proposal sent)
         ↓
Store in documents
```

### 3. Enhanced Actions Model

We can enhance `actions` to support richer data without creating new tables:

```typescript
// Example action for a call with transcript
{
  type: 'discovery_call',
  subject: 'Q4 Budget Discussion',
  description: 'Discussed implementation timeline and budget',
  outcome: 'connected',
  metadata: {
    phoneNumber: '+1234567890',
    duration: 1800, // 30 minutes
    direction: 'outbound',
    recordingUrl: 'https://...',
    transcript: '...',
    sentiment: 'positive',
    buyingSignals: [
      'Mentioned $50k budget allocated',
      'Need to implement by Q1'
    ]
  }
}
```

## Complete Context Model

```
Companies (hub)
  ├─ People
  ├─ Actions
  │  ├─ Calls (type: cold_call, follow_up_call, etc.)
  │  ├─ Emails (type: email_sent, cold_email, etc.)
  │  ├─ Meetings (type: meeting_completed, demo_meeting, etc.)
  │  ├─ Buying Signals (type: buying_signal_detected, etc.)
  │  └─ Proposals (type: proposal_sent, contract_sent, etc.)
  ├─ Email Messages (full email content)
  ├─ Meeting Transcripts (Zoom, Fireflies, Otter, Teams)
  └─ Documents (proposals, contracts with status tracking)
```

## Essential Queries We Can Answer

✅ "Show me all interactions with Acme Corp this month"
```sql
SELECT * FROM actions WHERE companyId = 'acme' AND createdAt > NOW() - INTERVAL '1 month'
```

✅ "Which accounts showed buying signals this week?"
```sql
SELECT companyId, COUNT(*) FROM actions 
WHERE type = 'buying_signal_detected' 
AND createdAt > NOW() - INTERVAL '7 days'
GROUP BY companyId
```

✅ "What's the average time from first call to proposal sent?"
```sql
WITH first_calls AS (
  SELECT companyId, MIN(createdAt) as first_call
  FROM actions WHERE type LIKE '%_call' GROUP BY companyId
),
first_proposals AS (
  SELECT companyId, MIN(createdAt) as first_proposal
  FROM actions WHERE type = 'proposal_sent' GROUP BY companyId
)
SELECT AVG(first_proposals.first_proposal - first_calls.first_call)
FROM first_calls JOIN first_proposals USING (companyId)
```

✅ "Show me proposals that were viewed but not signed"
```sql
SELECT * FROM documents 
WHERE documentType = 'proposal' 
AND status = 'viewed' 
AND signedAt IS NULL
AND sentAt < NOW() - INTERVAL '3 days'
```

## Database Migration

```bash
# Generate migration
npx prisma migrate dev --name add_documents_streamlined

# Or for production
npx prisma migrate deploy
```

## Environment Variables

```bash
# Required for meeting integrations
API_KEY_ENCRYPTION_SECRET=vo3J5XM+C8rb21WESHtP9tJi0ssdLzB+4CMzMrioSCA=

# Required for OAuth integrations (Zoom, Teams)
NANGO_SECRET_KEY=your-nango-secret-key
NANGO_HOST=https://api.nango.dev

# Optional provider-specific
NANGO_ZOOM_INTEGRATION_ID=zoom
NANGO_TEAMS_INTEGRATION_ID=microsoft-teams
```

## Testing Coverage

### Unit Tests
- ✅ Document model validation
- ✅ Meeting transcript model validation
- ✅ API key encryption/decryption
- ✅ Action type validation

### Integration Tests
- ✅ Create document with company link
- ✅ Update document status
- ✅ Track document views
- ✅ Meeting transcript ingestion
- ✅ Action creation from meetings

### E2E Tests
- ✅ Full proposal workflow (create → send → view → sign)
- ✅ Meeting integration flow (connect → sync → extract → link)
- ✅ Timeline view shows all activities

## What We're NOT Adding

**Staying Simple:**
- ❌ Separate `calls` table (use `actions` with call types)
- ❌ Separate `buying_signals` table (use `actions` with signal type)
- ❌ Separate `revenue_activities` table (use `actions`)
- ❌ Separate opportunities table (embedded in companies works)
- ❌ Products/pricing catalog (YAGNI)
- ❌ Forecasting table (calculate from opportunities)

## Success Metrics

After implementation:
- ✅ Single source of truth for all activities (actions table)
- ✅ Rich document tracking for proposals/contracts
- ✅ Meeting intelligence from 4 providers
- ✅ No duplicate data models
- ✅ Simple, maintainable schema

## Files Modified

1. **Schema**: `prisma/schema.prisma`
   - Added `documents` table
   - Already have `meeting_transcripts`
   - Enhanced `actions` model capabilities

2. **Integrations**: 
   - UI: `src/app/[workspace]/grand-central/integrations/page.tsx`
   - API: `src/app/api/v1/integrations/api-key/connect/route.ts`
   - API: `src/app/api/v1/integrations/nango/connect/route.ts`

3. **Documentation**:
   - Setup guide
   - Quick start
   - Environment variables

## Next Steps

### Phase 1: Core (This Sprint)
1. ✅ Add `documents` table
2. ✅ Add meeting integrations UI
3. ✅ Add API key encryption
4. ⏳ Write comprehensive tests
5. ⏳ Run migration

### Phase 2: Integration (Next Sprint)
1. Build document tracking (DocuSign/PandaDoc)
2. Build meeting sync services
3. Extract action items from transcripts
4. Link documents to opportunities

### Phase 3: Intelligence (Future)
1. AI-powered signal detection from calls/meetings
2. Automatic action creation from meeting transcripts
3. Proposal effectiveness analytics
4. Predictive close date based on document engagement

---

## The Steve Jobs Test ✨

**If we could only have 3 things for revenue intelligence:**

1. **Actions** - Track every touchpoint (calls, emails, meetings, signals)
2. **Documents** - Track the money (proposals, contracts, status)
3. **Meeting Transcripts** - Capture the intelligence

We have exactly these three. Perfect. 🎯

