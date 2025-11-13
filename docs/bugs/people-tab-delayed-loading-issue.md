# People Tab Delayed Loading Issue

## Issue Summary

Company pages display "No People (Employees) Found" immediately after company creation, but show employee records after approximately 10 minutes without any refresh action.

## Root Cause

The issue is caused by an asynchronous enrichment process that runs in the background:

1. **Company Creation** (`src/app/api/v1/companies/route.ts:1074-1091`)
   - When a company is created, enrichment is triggered using `setImmediate` (non-blocking)
   - The API returns immediately before enrichment completes
   - User navigates to the company page while enrichment is still queued/running

2. **People Tab Loading** (`src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx:260`)
   - The People tab queries `/api/v1/people?companyId={id}` immediately on load
   - At this point, no people records exist in the database yet
   - The UI displays "No People (Employees) Found"

3. **Background Enrichment** (`src/platform/services/enrichment-service.ts:250-328`)
   - The enrichment process calls `/api/v1/enrich` asynchronously
   - This process fetches employee data from external sources (CoreSignal, BrightData)
   - Takes 5-15 minutes depending on company size and API response times

4. **Delayed Data Appearance**
   - After enrichment completes, people records are stored in the database
   - User must manually refresh or navigate away and back to see the data
   - No loading state or status indicator is shown during enrichment

## Technical Details

### Enrichment Service Flow

```typescript
// src/app/api/v1/companies/route.ts:1074-1091
setImmediate(async () => {
  const { EnrichmentService } = await import('@/platform/services/enrichment-service');
  EnrichmentService.triggerEnrichmentAsync(
    'company',
    company.id,
    'create',
    context.workspaceId,
    authToken
  );
});
```

### Enrichment API Stub

```typescript
// src/app/api/v1/enrich/route.ts:151-181
async function enrichCompany(body: any, context: any) {
  // Returns immediately with stub response
  return {
    type: 'company',
    entityId: company?.id,
    status: 'enriched',
    message: 'Company enrichment triggered. Processing in background...'
  };
}
```

The enrichment API currently returns a stub response and doesn't actually perform the enrichment. The actual enrichment must be happening through:
- External scripts (e.g., `scripts/process-companies-without-people.js`)
- Background job systems (not visible in the codebase review)
- Manual data import processes

## Impact

### User Experience Issues

1. **Confusing Empty State**: Users see "No People Found" immediately after adding a company
2. **No Feedback**: No indication that data is loading or will appear later
3. **Manual Refresh Required**: Users must refresh the page multiple times to check for data
4. **Uncertain Wait Time**: No indication of how long the process will take
5. **Perceived Bug**: Appears as a system malfunction rather than a feature

### Business Impact

1. **Reduced Trust**: Users may think the system is broken
2. **Support Burden**: Increases support tickets about "missing employee data"
3. **Workflow Disruption**: Users cannot immediately work with company contacts
4. **Adoption Friction**: New users may abandon the product during trial

## Proposed Solutions

### Solution 1: Add Enrichment Status Tracking (Recommended)

Add an `enrichmentStatus` field to the Companies table to track progress:

**Database Migration:**
```sql
ALTER TABLE companies 
ADD COLUMN enrichment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN enrichment_started_at TIMESTAMP,
ADD COLUMN enrichment_completed_at TIMESTAMP,
ADD COLUMN enrichment_error TEXT;
```

**Status Values:**
- `pending`: Not started
- `queued`: Queued for processing
- `in_progress`: Currently enriching
- `completed`: Successfully completed
- `failed`: Failed with error
- `partial`: Partially completed (some data found)

**Update enrichment service to track status:**
- Set status to `queued` when enrichment is triggered
- Set status to `in_progress` when enrichment starts
- Set status to `completed` when enrichment finishes
- Set status to `failed` if enrichment errors

**Update UI to show status:**
- Show loading spinner when status is `queued` or `in_progress`
- Show retry button when status is `failed`
- Poll for updates every 5-10 seconds until completed

### Solution 2: Immediate Partial Data + Background Enhancement

Fetch basic employee data synchronously during company creation, then enrich in background:

1. **Synchronous Basic Fetch** (1-2 seconds):
   - Fetch top 5-10 employees from LinkedIn/CoreSignal
   - Display immediately in the UI
   - Show "Loading more employees..." indicator

2. **Asynchronous Deep Enrichment**:
   - Continue fetching full employee list
   - Enrich with contact information
   - Update UI as data arrives

### Solution 3: Polling with Progressive Loading

Keep current async flow but add smart polling:

**Frontend Changes:**
```typescript
// UniversalPeopleTab.tsx
useEffect(() => {
  let pollInterval: NodeJS.Timeout;
  
  const checkEnrichmentStatus = async () => {
    const response = await authFetch(
      `/api/v1/companies/${companyId}/enrichment-status`
    );
    
    if (response.status === 'in_progress') {
      // Continue polling
      pollInterval = setTimeout(checkEnrichmentStatus, 5000);
    } else if (response.status === 'completed') {
      // Refresh people data
      fetchPeople();
    }
  };
  
  checkEnrichmentStatus();
  
  return () => clearTimeout(pollInterval);
}, [companyId]);
```

### Solution 4: WebSocket Real-Time Updates

Implement WebSocket connection to push updates when enrichment completes:

1. Client subscribes to enrichment events for company
2. Server pushes update when enrichment completes
3. UI automatically refreshes with new data
4. No polling required

## Recommended Implementation Plan

### Phase 1: Immediate Fix (1-2 days)

1. Add enrichment status field to companies table
2. Update enrichment service to track status
3. Add loading state to People tab
4. Implement basic polling (every 10 seconds for 5 minutes)

### Phase 2: Enhanced UX (3-5 days)

1. Add progress indicator showing enrichment stages
2. Implement estimated time remaining
3. Add retry mechanism for failed enrichments
4. Show partial results as they arrive

### Phase 3: Optimization (1 week)

1. Implement WebSocket for real-time updates
2. Add intelligent caching layer
3. Optimize enrichment pipeline performance
4. Add enrichment priority queue

## Testing Requirements

1. **Unit Tests**:
   - Enrichment status state transitions
   - Polling logic with mocked responses
   - Error handling for failed enrichments

2. **Integration Tests**:
   - End-to-end company creation and enrichment flow
   - Status tracking across multiple companies
   - Concurrent enrichment requests

3. **Performance Tests**:
   - Enrichment completion time for various company sizes
   - Database query performance with status field
   - Polling overhead on server resources

## Monitoring and Metrics

Add monitoring for:

1. **Enrichment Performance**:
   - Average time to complete enrichment
   - Success vs failure rate
   - Enrichment queue depth

2. **User Behavior**:
   - How often users refresh the page
   - Time spent on empty state
   - Abandonment rate on company pages

3. **System Health**:
   - Enrichment API error rates
   - Database query performance
   - External API response times

## Related Files

- `src/app/api/v1/companies/route.ts` - Company creation endpoint
- `src/platform/services/enrichment-service.ts` - Enrichment service
- `src/app/api/v1/enrich/route.ts` - Enrichment API endpoint
- `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx` - People tab component
- `src/app/api/v1/people/route.ts` - People API endpoint

## References

- Issue reported: 2025-11-13
- Company: Alpine Power Systems
- URL: `https://action.adrata.com/toptemp/companies/alpine-power-systems-01K9QD3M334P4HVW8FPNNAGJ72/?tab=people`
- Time to data appearance: ~10 minutes
- User actions attempted: Multiple loads, hard refreshes from multiple pages

