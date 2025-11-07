# Revenue Cloud Essential Context Models

## Philosophy: Steve Jobs Simplicity

**"Simplicity is the ultimate sophistication."**

We're building essential context models to understand, automate, and accelerate the revenue process. No bloat, only what truly matters.

## Current State Analysis

### What We Have ✅
- **Companies** - with embedded opportunity data
- **People** - contacts and stakeholders  
- **Email Messages** - all email communications
- **Calendar Events** - scheduled meetings
- **Meeting Transcripts** - captured meeting intelligence
- **Actions** - tasks and follow-ups
- **Reminders** - time-based triggers

### What's Missing for Complete Revenue Intelligence

## Essential Additions

### 1. Calls (Phone Conversations) 🎯

**Why Essential**: Phone calls are different from video meetings. Sales reps make calls throughout the day. We need to track them separately.

**Schema**:
```prisma
model calls {
  id              String    @id @default(ulid())
  workspaceId     String    @db.VarChar(30)
  userId          String    @db.VarChar(30)
  companyId       String?   @db.VarChar(30)
  personId        String?   @db.VarChar(30)
  
  // Call details
  direction       String    @db.VarChar(10) // inbound, outbound
  phoneNumber     String    @db.VarChar(50)
  duration        Int? // seconds
  callStartTime   DateTime
  callEndTime     DateTime?
  outcome         String?   @db.VarChar(50) // connected, voicemail, no-answer, busy
  
  // Intelligence
  transcript      String?   @db.Text
  summary         String?   @db.Text
  sentiment       String?   @db.VarChar(20) // positive, neutral, negative
  buyingSignals   Json?     @default("[]")
  actionItems     Json?     @default("[]")
  
  // Metadata
  provider        String?   @db.VarChar(50) // twilio, dialpad, aircall
  externalId      String?   @db.VarChar(255)
  recordingUrl    String?   @db.VarChar(500)
  metadata        Json      @default("{}")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  workspace       workspaces @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user            users      @relation(fields: [userId], references: [id], onDelete: Cascade)
  company         companies? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  person          people?    @relation(fields: [personId], references: [id], onDelete: SetNull)

  @@index([workspaceId, callStartTime])
  @@index([userId, callStartTime])
  @@index([companyId])
  @@index([personId])
  @@index([direction])
}
```

**Use Cases**:
- Track all phone conversations
- Link calls to opportunities
- Extract buying signals from call transcripts
- Calculate talk time and activity metrics
- Identify best times to call

### 2. Buying Signals 🎯

**Why Essential**: This is THE killer feature. Automatically detect when prospects show buying intent across all channels.

**Schema**:
```prisma
model buying_signals {
  id              String    @id @default(ulid())
  workspaceId     String    @db.VarChar(30)
  companyId       String    @db.VarChar(30)
  personId        String?   @db.VarChar(30)
  
  // Signal classification
  signalType      String    @db.VarChar(50) // budget-mentioned, timeline-discussed, competition-evaluated, champion-identified, problem-confirmed
  strength        String    @db.VarChar(20) // strong, medium, weak
  confidence      Float     @default(0.0) // 0-1
  
  // Source
  sourceType      String    @db.VarChar(50) // email, meeting, call, website
  sourceId        String    @db.VarChar(30)
  excerpt         String?   @db.Text // The actual text that triggered the signal
  
  // Context
  detectedAt      DateTime  @default(now())
  expiresAt       DateTime? // Some signals are time-sensitive
  status          String    @default("active") @db.VarChar(20) // active, acted-on, expired
  
  // AI metadata
  extractedBy     String    @db.VarChar(50) // ai-model-name
  metadata        Json      @default("{}")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  workspace       workspaces @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  company         companies  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  person          people?    @relation(fields: [personId], references: [id], onDelete: SetNull)

  @@index([workspaceId, detectedAt])
  @@index([companyId, status, strength])
  @@index([personId])
  @@index([signalType])
  @@index([status, expiresAt])
}
```

**Signal Types**:
- **Budget Mentioned** - "We have $X allocated"
- **Timeline Discussed** - "Need to implement by Q2"
- **Competition Evaluated** - "We're also looking at [competitor]"
- **Champion Identified** - Someone advocates for your solution
- **Problem Confirmed** - They explicitly state the problem you solve
- **Decision Process** - "I need to get buy-in from [person]"
- **Urgency** - "This is a top priority"

**Use Cases**:
- Auto-prioritize accounts showing buying intent
- Alert reps to hot opportunities
- Track signal-to-close conversion
- Identify which signals matter most
- Time-based follow-ups on strong signals

### 3. Revenue Activities (Unified Timeline) 🎯

**Why Essential**: Consolidate ALL touchpoints in one place. See the complete picture of customer engagement.

**Schema**:
```prisma
model revenue_activities {
  id              String    @id @default(ulid())
  workspaceId     String    @db.VarChar(30)
  userId          String    @db.VarChar(30)
  companyId       String    @db.VarChar(30)
  personId        String?   @db.VarChar(30)
  
  // Activity type and source
  activityType    String    @db.VarChar(50) // email-sent, email-received, meeting-held, call-made, proposal-sent, contract-signed
  sourceType      String    @db.VarChar(50) // email, meeting, call, document
  sourceId        String    @db.VarChar(30)
  
  // Activity details
  title           String    @db.VarChar(500)
  summary         String?   @db.Text
  outcome         String?   @db.VarChar(100)
  sentiment       String?   @db.VarChar(20) // positive, neutral, negative
  
  // Timing
  occurredAt      DateTime
  duration        Int? // seconds
  
  // Engagement metrics
  engagementScore Float?    @default(0.0) // 0-1, how engaged was this interaction
  responseTime    Int? // seconds to respond (for emails)
  
  // Metadata
  metadata        Json      @default("{}")
  
  createdAt       DateTime  @default(now())
  
  workspace       workspaces @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user            users      @relation(fields: [userId], references: [id], onDelete: Cascade)
  company         companies  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  person          people?    @relation(fields: [personId], references: [id], onDelete: SetNull)

  @@index([workspaceId, occurredAt])
  @@index([companyId, occurredAt])
  @@index([personId, occurredAt])
  @@index([userId, occurredAt])
  @@index([activityType])
}
```

**Use Cases**:
- Unified timeline of all interactions
- Calculate engagement scores
- Identify gaps in communication
- Track velocity of deals
- See complete account history

### 4. Documents (Proposals, Contracts) 🎯

**Why Essential**: Track when proposals are sent, viewed, and signed. This is revenue-critical.

**Schema**:
```prisma
model revenue_documents {
  id              String    @id @default(ulid())
  workspaceId     String    @db.VarChar(30)
  userId          String    @db.VarChar(30)
  companyId       String    @db.VarChar(30)
  personId        String?   @db.VarChar(30)
  
  // Document details
  documentType    String    @db.VarChar(50) // proposal, contract, quote, case-study, presentation
  title           String    @db.VarChar(500)
  description     String?   @db.Text
  
  // File info
  fileUrl         String?   @db.VarChar(500)
  fileSize        Int? // bytes
  fileType        String?   @db.VarChar(50)
  
  // Status tracking
  status          String    @default("draft") @db.VarChar(50) // draft, sent, viewed, downloaded, signed
  sentAt          DateTime?
  firstViewedAt   DateTime?
  lastViewedAt    DateTime?
  viewCount       Int       @default(0)
  signedAt        DateTime?
  
  // Value tracking
  proposedValue   Decimal?  @db.Decimal(15, 2)
  currency        String?   @default("USD") @db.VarChar(3)
  
  // Integration
  externalId      String?   @db.VarChar(255)
  provider        String?   @db.VarChar(50) // docusign, pandadoc, proposify
  
  // Metadata
  metadata        Json      @default("{}")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  workspace       workspaces @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user            users      @relation(fields: [userId], references: [id], onDelete: Cascade)
  company         companies  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  person          people?    @relation(fields: [personId], references: [id], onDelete: SetNull)

  @@index([workspaceId, sentAt])
  @@index([companyId, status])
  @@index([documentType, status])
  @@index([status])
}
```

**Use Cases**:
- Track proposal to close time
- Know when prospects view proposals
- Alert when contracts are signed
- Measure proposal effectiveness
- Link documents to revenue outcomes

## Why These Four?

**Steve Jobs Test**: If we could only add 4 things, what would move the needle most?

1. **Calls** - Complete the communication picture (email ✅, meetings ✅, calls ❌)
2. **Buying Signals** - THE automation opportunity. AI-powered revenue acceleration
3. **Revenue Activities** - Unified timeline. See everything in one place
4. **Documents** - Track the money. Proposals and contracts ARE revenue

## What We're NOT Adding

**Staying Simple** (tempting but unnecessary):
- ❌ Separate opportunities table (embedded in companies works fine)
- ❌ Social media interactions (too noisy, low signal)
- ❌ Website tracking events (can be in activities if needed)
- ❌ Separate tasks table (actions work fine)
- ❌ Deal stages table (string field is enough)
- ❌ Products/pricing catalog (YAGNI for now)
- ❌ Forecasting table (can calculate from opportunities)

## Integration Strategy

### How It All Connects

```
Companies (hub)
  ├─ People
  ├─ Emails ──────┐
  ├─ Meetings ────┤
  ├─ Calls ───────├──> Buying Signals (extracted from all)
  ├─ Documents ───┤
  └─ Activities ──┘ (unified view)
```

### Data Flow

1. **Inbound**: Email/Call/Meeting happens
2. **Extract**: AI extracts signals and creates activity
3. **Score**: Update engagement and confidence scores
4. **Alert**: Notify rep of strong signals
5. **Act**: Create recommended actions

## Testing Strategy

Each model needs:

### Unit Tests
- Model validation (required fields, formats)
- Relationship integrity
- Default values
- Indexes work correctly

### Integration Tests
- Create record with relations
- Query with joins
- Update cascades properly
- Delete cascades properly

### E2E Tests
- Full user flow (call → signal → action)
- Cross-model queries
- Performance with realistic data volume

## Migration Strategy

1. **Phase 1**: Add tables (this sprint)
2. **Phase 2**: Build ingestion pipelines
3. **Phase 3**: Add AI signal extraction
4. **Phase 4**: Build UI views

## Success Metrics

After implementation, we should be able to answer:

- ✅ "Show me all interactions with Acme Corp this month"
- ✅ "Which accounts are showing buying signals?"
- ✅ "What's the average time from first call to proposal sent?"
- ✅ "Which reps are most active this week?"
- ✅ "How many strong signals converted to deals?"
- ✅ "What are the top signals that lead to closes?"

## Implementation Priority

**P0 (This Sprint)**:
1. Add schema for all 4 models
2. Write comprehensive tests
3. Document data models

**P1 (Next Sprint)**:
1. Build call tracking (Twilio integration)
2. Build document tracking (DocuSign/PandaDoc)
3. Implement signal extraction (AI)
4. Build unified activities view

**P2 (Future)**:
1. AI-powered signal detection improvements
2. Predictive scoring
3. Automated actions based on signals
4. Advanced analytics

---

## Final Thought

**Keep It Simple**. These four models give us 80% of the value with 20% of the complexity. We can understand, automate, and accelerate the revenue process without building a bloated CRM.

**Steve Jobs would approve**. ✨

