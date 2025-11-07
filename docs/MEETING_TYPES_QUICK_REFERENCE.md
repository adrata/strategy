# Meeting Types Quick Reference

## Sales Meeting Progression

```
Discovery → Demo → Proposal → Closing
```

## Action Types for Meetings

| Stage | Call Type | Meeting Type | Description |
|-------|-----------|--------------|-------------|
| **Discovery** | `discovery_call` | `discovery_meeting` | Initial contact, understand needs |
| **Demo** | `demo_call` | `demo_meeting` | Product demonstration |
| **Proposal** | - | `proposal_meeting` | Present proposal/pricing |
| **Closing** | `closing_call` | `closing_meeting` | Final decision, close deal |
| **Generic** | `phone_call` | `meeting_completed` | Other calls/meetings |

## Status Field Values

| Status | scheduledAt | completedAt | Meaning |
|--------|-------------|-------------|---------|
| `PLANNED` | Future date | null | Scheduled, not happened yet |
| `IN_PROGRESS` | Past/now | null | Currently happening |
| `COMPLETED` | Any date | Past date | Meeting finished |
| `CANCELLED` | Any date | null | Meeting was cancelled |

## Example: Creating a Scheduled Demo

```typescript
await prisma.actions.create({
  data: {
    workspaceId: 'ws123',
    userId: 'user456',
    companyId: 'comp789',
    personId: 'person123',
    type: 'demo_meeting',
    subject: 'Product Demo - New Features',
    description: 'Demo of Q1 2025 features for Acme Corp',
    scheduledAt: new Date('2025-02-15T10:00:00Z'), // Future
    completedAt: null,                              // Not done yet
    status: 'PLANNED',
    priority: 'HIGH'
  }
});
```

## Example: Completing a Meeting

```typescript
// After meeting finishes, update it
await prisma.actions.update({
  where: { id: 'action123' },
  data: {
    completedAt: new Date(),
    status: 'COMPLETED',
    outcome: 'Very positive - ready to see proposal',
    description: 'Demoed key features. Client excited about automation capabilities.'
  }
});
```

## Example: Meeting with Transcript

```typescript
// 1. Create/update the action
const action = await prisma.actions.create({
  data: {
    type: 'demo_meeting',
    subject: 'Product Demo',
    scheduledAt: meetingDate,
    completedAt: meetingDate,
    status: 'COMPLETED',
    outcome: 'Interested in pilot program'
  }
});

// 2. Store the transcript
await prisma.meeting_transcripts.create({
  data: {
    provider: 'fireflies',
    meetingTitle: 'Product Demo',
    meetingDate,
    transcript: '...',
    summary: 'Client showed strong interest...',
    actionItems: [
      { task: 'Send pilot program proposal', assignee: 'Sales Rep' }
    ],
    linkedCompanyId: companyId,
    metadata: { actionId: action.id } // Link back
  }
});
```

## Querying Patterns

### Upcoming meetings for a company
```typescript
const upcoming = await prisma.actions.findMany({
  where: {
    companyId,
    type: { in: ['discovery_meeting', 'demo_meeting', 'proposal_meeting', 'closing_meeting'] },
    status: 'PLANNED',
    scheduledAt: { gte: new Date() }
  },
  orderBy: { scheduledAt: 'asc' }
});
```

### Completed meetings this week
```typescript
const completed = await prisma.actions.findMany({
  where: {
    companyId,
    type: { in: ['discovery_meeting', 'demo_meeting', 'proposal_meeting', 'closing_meeting'] },
    status: 'COMPLETED',
    completedAt: { 
      gte: startOfWeek,
      lte: endOfWeek
    }
  }
});
```

### Meeting velocity (discovery to demo)
```typescript
const discovery = await prisma.actions.findFirst({
  where: { companyId, type: 'discovery_meeting', status: 'COMPLETED' },
  orderBy: { completedAt: 'asc' }
});

const demo = await prisma.actions.findFirst({
  where: { companyId, type: 'demo_meeting', status: 'COMPLETED' },
  orderBy: { completedAt: 'asc' }
});

const days = (demo.completedAt - discovery.completedAt) / (1000 * 60 * 60 * 24);
```

## Meeting Transcripts

Store in `meeting_transcripts` table:
- Full transcript text
- AI-generated summary
- Key discussion points
- Action items extracted
- Link to company/people
- Link back to action via metadata

## Key Principles

1. **Use specific types** - `demo_meeting` not generic `meeting_completed`
2. **Status via timestamps** - Check `scheduledAt` vs `completedAt`
3. **Always capture outcome** - What happened? Next steps?
4. **Link transcripts** - Store actionId in meeting_transcripts metadata
5. **Extract action items** - Create new actions for follow-ups

## Remember

- ✅ One table (`actions`) for all activities
- ✅ Type field for meeting types
- ✅ Status field + timestamps for state
- ✅ Link to meeting_transcripts for intelligence
- ❌ No separate meetings table needed

**Simple. Clean. Streamlined.** ✨

