# Actions Model - Meeting Pattern Guide

## Meeting Types in Actions

The `actions` model already handles **all meeting types** through the `type` field. No separate tables needed!

### Meeting Action Types

```typescript
// Discovery phase
'discovery_call'      // Discovery call with prospect
'discovery_meeting'   // Discovery meeting (video/in-person)

// Demo phase  
'demo_call'           // Demo over phone
'demo_meeting'        // Demo meeting (screen share/in-person)

// Proposal phase
'proposal_meeting'    // Meeting to present proposal

// Closing phase
'closing_call'        // Closing call
'closing_meeting'     // Final meeting to close deal
```

### Status Pattern

**Use the timestamp fields to determine status:**

```typescript
// Scheduled (future)
{
  type: 'demo_meeting',
  subject: 'Product Demo with Acme Corp',
  scheduledAt: '2025-02-15T10:00:00Z',  // Future date
  completedAt: null,                     // Not completed yet
  status: 'PLANNED'
}

// Completed (past)
{
  type: 'demo_meeting',
  subject: 'Product Demo with Acme Corp',
  scheduledAt: '2025-01-15T10:00:00Z',   // Original schedule
  completedAt: '2025-01-15T11:30:00Z',   // When it finished
  status: 'COMPLETED'
}

// In Progress (happening now)
{
  type: 'demo_meeting',
  subject: 'Product Demo with Acme Corp',
  scheduledAt: '2025-01-20T10:00:00Z',
  completedAt: null,
  status: 'IN_PROGRESS'
}
```

## Meeting Enrichment Pattern

When a meeting has a transcript (from Zoom/Fireflies/Otter/Teams), store it in `meeting_transcripts` and link back to the action:

```typescript
// 1. Create action for the meeting
const action = await prisma.actions.create({
  data: {
    workspaceId,
    userId,
    companyId,
    personId,
    type: 'demo_meeting',
    subject: 'Product Demo - Q1 2025',
    description: 'Demo of new features for Q1 launch',
    scheduledAt: meetingDate,
    completedAt: meetingDate, // Meeting happened
    status: 'COMPLETED',
    outcome: 'Very positive - interested in implementation'
  }
});

// 2. Store transcript in meeting_transcripts
const transcript = await prisma.meeting_transcripts.create({
  data: {
    workspaceId,
    userId,
    connectionId: 'fireflies-conn-id',
    provider: 'fireflies',
    externalMeetingId: 'ff-meeting-123',
    meetingTitle: 'Product Demo - Q1 2025',
    meetingDate,
    duration: 3600,
    participants: [{ name: 'John Doe', email: 'john@acme.com' }],
    transcript: 'Full transcript text...',
    summary: 'Client expressed strong interest...',
    keyPoints: [
      'Budget of $50k allocated',
      'Need implementation by March'
    ],
    actionItems: [
      { assignee: 'Sales Rep', task: 'Send proposal by EOW' }
    ],
    linkedCompanyId: companyId,
    linkedPeopleIds: [personId],
    metadata: {
      actionId: action.id // Link back to action
    }
  }
});
```

## Query Patterns

### Get all scheduled meetings for a company

```typescript
const scheduledMeetings = await prisma.actions.findMany({
  where: {
    companyId,
    type: {
      in: ['discovery_meeting', 'demo_meeting', 'proposal_meeting', 'closing_meeting']
    },
    scheduledAt: {
      gte: new Date() // Future meetings
    },
    status: 'PLANNED'
  },
  orderBy: {
    scheduledAt: 'asc'
  }
});
```

### Get all completed meetings with transcripts

```typescript
const completedMeetings = await prisma.actions.findMany({
  where: {
    companyId,
    type: {
      in: ['discovery_meeting', 'demo_meeting', 'proposal_meeting', 'closing_meeting']
    },
    status: 'COMPLETED'
  },
  include: {
    // Join with meeting_transcripts via metadata
  },
  orderBy: {
    completedAt: 'desc'
  }
});

// Then fetch transcripts
const transcripts = await prisma.meeting_transcripts.findMany({
  where: {
    linkedCompanyId: companyId,
    metadata: {
      path: ['actionId'],
      in: completedMeetings.map(m => m.id)
    }
  }
});
```

### Calculate meeting velocity

```typescript
// Time from discovery to demo
const discoveryMeeting = await prisma.actions.findFirst({
  where: {
    companyId,
    type: 'discovery_meeting',
    status: 'COMPLETED'
  },
  orderBy: { completedAt: 'asc' }
});

const demoMeeting = await prisma.actions.findFirst({
  where: {
    companyId,
    type: 'demo_meeting',
    status: 'COMPLETED'
  },
  orderBy: { completedAt: 'asc' }
});

const daysToDemo = demoMeeting.completedAt - discoveryMeeting.completedAt;
```

## Creating Actions from Meeting Integrations

When syncing from Zoom/Fireflies/Otter/Teams:

```typescript
async function createMeetingFromTranscript(transcriptData) {
  // 1. Determine meeting type from title/content
  const meetingType = inferMeetingType(transcriptData.meetingTitle);
  
  // 2. Create action
  const action = await prisma.actions.create({
    data: {
      workspaceId: transcriptData.workspaceId,
      userId: transcriptData.userId,
      companyId: transcriptData.linkedCompanyId,
      personId: transcriptData.linkedPeopleIds[0],
      type: meetingType, // e.g., 'demo_meeting'
      subject: transcriptData.meetingTitle,
      description: transcriptData.summary,
      scheduledAt: transcriptData.meetingDate,
      completedAt: transcriptData.meetingDate,
      status: 'COMPLETED',
      outcome: extractOutcome(transcriptData)
    }
  });
  
  // 3. Store transcript
  const transcript = await prisma.meeting_transcripts.create({
    data: {
      ...transcriptData,
      metadata: {
        ...transcriptData.metadata,
        actionId: action.id
      }
    }
  });
  
  // 4. Extract and create action items
  for (const item of transcriptData.actionItems) {
    await prisma.actions.create({
      data: {
        workspaceId: transcriptData.workspaceId,
        userId: transcriptData.userId,
        companyId: transcriptData.linkedCompanyId,
        type: 'follow_up_task',
        subject: item.task,
        status: 'PLANNED',
        scheduledAt: item.dueDate
      }
    });
  }
  
  return { action, transcript };
}

function inferMeetingType(title: string): string {
  const lower = title.toLowerCase();
  
  if (lower.includes('discovery') || lower.includes('intro')) {
    return 'discovery_meeting';
  }
  if (lower.includes('demo') || lower.includes('demonstration')) {
    return 'demo_meeting';
  }
  if (lower.includes('proposal') || lower.includes('pricing')) {
    return 'proposal_meeting';
  }
  if (lower.includes('closing') || lower.includes('final') || lower.includes('decision')) {
    return 'closing_meeting';
  }
  
  return 'meeting_completed'; // Default
}
```

## Status Enum Values

From the actions model:

```prisma
enum ActionStatus {
  PLANNED       // Scheduled, not started
  IN_PROGRESS   // Currently happening
  COMPLETED     // Finished
  CANCELLED     // Was cancelled
}
```

## Best Practices

1. **Always set both dates**:
   - `scheduledAt` - When the meeting is/was scheduled
   - `completedAt` - When the meeting actually finished (if completed)

2. **Use specific meeting types**:
   - Don't use generic `meeting_completed` if you know it's a demo
   - Use `demo_meeting`, `discovery_meeting`, etc.

3. **Store outcome**:
   - Always capture the outcome in the `outcome` field
   - Examples: "Positive - moving to next stage", "No show", "Rescheduled"

4. **Link transcripts**:
   - Store actionId in meeting_transcripts.metadata
   - Enables easy joining and timeline views

5. **Extract action items**:
   - Create new action records for each action item
   - Link them to the same company/person

## Timeline View

With this pattern, you get a complete timeline:

```typescript
const timeline = await prisma.actions.findMany({
  where: { companyId },
  orderBy: { completedAt: 'desc' },
  include: {
    user: true,
    person: true
  }
});

// Timeline shows:
// - Cold calls
// - Emails sent
// - Discovery meetings
// - Demo meetings  
// - Proposals sent
// - Contracts sent
// - Deal closed
```

## Summary

✅ **Use actions table** for all meetings (no separate table)
✅ **Use specific types** (discovery_meeting, demo_meeting, etc.)
✅ **Status via timestamps** (scheduledAt vs completedAt)
✅ **Link transcripts** via meeting_transcripts table
✅ **Extract action items** as new action records

**Simple. Streamlined. Steve Jobs approved.** ✨

