# Speedrun API Fix - Using Central v1 Actions API

## Issue
The speedrun was using `/api/speedrun/action-log` which:
1. Was timing out (10 second default timeout)
2. Was not the standard central action database
3. Created inconsistency with the rest of the app

## Solution
Updated to use the central **`/api/v1/actions`** API which:
- Is the standard action tracking system used across the entire app
- Has proper authentication and validation
- Integrates with the central action schema
- Has better error handling and logging

## Changes Made

### 1. Create Action (Line 565-581)
**Before:**
```typescript
const response = await fetch('/api/speedrun/action-log', {
  method: 'POST',
  body: JSON.stringify({
    personId, personName, actionType, notes, nextAction, nextActionDate, workspaceId, userId, actionPerformedBy
  })
});
```

**After:**
```typescript
const response = await fetch('/api/v1/actions', {
  method: 'POST',
  body: JSON.stringify({
    personId: selectedPerson.id,
    type: actionData.type,
    subject: `${actionData.type} - ${selectedPerson.name}`,
    description: actionData.notes,
    outcome: actionData.nextAction || null,
    scheduledAt: actionData.nextActionDate ? new Date(actionData.nextActionDate).toISOString() : null,
    status: 'completed',
    completedAt: new Date().toISOString(),
    ownerId: actionData.actionPerformedBy || userId,
  })
});
```

### 2. Delete Action (Line 428-433)
**Before:**
```typescript
const response = await fetch('/api/speedrun/action-log', {
  method: 'DELETE',
  body: JSON.stringify({ actionId, personId })
});
```

**After:**
```typescript
const response = await fetch(`/api/v1/actions/${undoData.actionId}`, {
  method: 'DELETE'
});
```

## Field Mapping

| Old Field (speedrun) | New Field (v1) | Notes |
|---------------------|----------------|-------|
| actionType | type | Action type |
| notes | description | Action details |
| nextAction | outcome | Result/outcome |
| nextActionDate | scheduledAt | Scheduled date |
| personName | subject | Action subject (auto-generated) |
| actionPerformedBy | ownerId | User who performed action |

## Benefits
1. ✅ Uses central action database
2. ✅ Consistent with rest of application
3. ✅ Better validation and error handling
4. ✅ Automatic next action generation via IntelligentNextActionService
5. ✅ Proper authentication context
6. ✅ Should resolve timeout issues

## Testing
Try adding an action again - it should now work correctly using the central API.

