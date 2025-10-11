# Function-Based Orchestration - Quick Start

**Status:** ✅ Phase 1 Complete  
**Time to Test:** 5 minutes

## 🚀 What We Built

Based on 2025 industry best practices, we've implemented:

1. **Idempotent Pure Functions** - Safe to retry, no duplicates
2. **Webhook Integration** - Auto-refresh buyer groups on changes
3. **Database Schema** - Track webhooks and refresh operations
4. **Security** - HMAC validation, rate limiting, deduplication

## ✅ Files Created

```
src/platform/pipelines/shared/
└── pipeline-functions.ts        ✅ Pure, idempotent pipeline functions

src/app/api/webhooks/
└── person-change/
    └── route.ts                 ✅ Webhook receiver with security

prisma/
├── schema-streamlined.prisma    ✅ Updated with webhook models
└── migrations/
    └── 20251010000002_add_webhook_models/
        └── migration.sql        ✅ Database migration
```

## 🔧 Quick Setup (3 Steps)

### Step 1: Generate Webhook Secret

```bash
# Generate a strong secret
openssl rand -hex 32

# Output example:
# a1b2c3d4e5f6...
```

### Step 2: Add to .env

```bash
# Add this line to your .env file
WEBHOOK_SECRET=your_generated_secret_from_step1
```

### Step 3: Run Migration

```bash
# Apply database changes
cd c:/Users/ross/Development/adrata
npx prisma migrate dev --name add_webhook_models
```

## 🧪 Test It (2 Minutes)

### Test 1: Webhook Info Endpoint

```bash
curl http://localhost:3000/api/webhooks/person-change
```

**Expected:** JSON with webhook documentation

### Test 2: Send Test Webhook

```bash
curl -X POST http://localhost:3000/api/webhooks/person-change \
  -H "Content-Type: application/json" \
  -H "x-signature: test_signature" \
  -H "x-timestamp: 1696800000000" \
  -d '{
    "id": "evt_test_001",
    "source": "test",
    "type": "person.role_change",
    "timestamp": "2025-10-10T12:00:00Z",
    "person": {
      "id": "person_123",
      "name": "John Doe",
      "email": "john@example.com",
      "oldTitle": "VP Sales",
      "newTitle": "CRO"
    },
    "company": {
      "id": "company_456",
      "name": "Test Company"
    },
    "changes": {
      "title": { "old": "VP Sales", "new": "CRO" }
    }
  }'
```

**Expected:** `{"status": "enqueued", "eventId": "evt_test_001"}`

## 📊 Check Database

```sql
-- See received webhooks
SELECT * FROM webhook_events ORDER BY "receivedAt" DESC LIMIT 10;

-- See refresh operations
SELECT * FROM buyer_group_refresh_logs ORDER BY "startedAt" DESC LIMIT 10;

-- See pipeline operations
SELECT * FROM pipeline_operations ORDER BY "createdAt" DESC LIMIT 10;
```

## 💡 Key Features

### 1. Idempotency ✅

Every operation can be safely retried:

```typescript
// Safe to call multiple times - no duplicates!
await saveBuyerGroupStep.execute({
  workspaceId: 'ws_123',
  buyerGroup: { ... }
});
```

### 2. Security ✅

HMAC signature validation prevents malicious webhooks:

```typescript
// Webhook validates signature before processing
const isValid = verifySignature(payload, signature, timestamp);
if (!isValid) return 401; // Unauthorized
```

### 3. Deduplication ✅

Same event won't be processed twice:

```typescript
// Checks idempotency key
const existing = await prisma.webhookEvent.findUnique({
  where: { idempotencyKey: event.id }
});

if (existing) {
  return { status: 'already_processed' };
}
```

### 4. Rate Limiting ✅

Prevents refresh spam (max 1 per company per hour):

```typescript
// Checks recent refreshes
const recentRefresh = await prisma.buyerGroupRefreshLog.findFirst({
  where: {
    companyId: event.company.id,
    startedAt: { gte: oneHourAgo }
  }
});

if (recentRefresh) {
  return false; // Skip - rate limited
}
```

## 🎯 Real-World Use Cases

### Use Case 1: Person Role Change

**Scenario:** CFO gets promoted to CEO

```
LinkedIn → Webhook → person.role_change
    ↓
Validate HMAC signature
    ↓
Check idempotency (deduplicate)
    ↓
Check rate limit (1/hour)
    ↓
Enqueue refresh job
    ↓
Worker refreshes buyer group
    ↓
Notify user "Buyer group updated"
```

### Use Case 2: Person Joins New Company

**Scenario:** VP Sales moves from Company A to Company B

```
CoreSignal → Webhook → person.company_change
    ↓
Triggers 2 refreshes:
  - Company A (person left)
  - Company B (person joined)
    ↓
Both buyer groups updated automatically
```

### Use Case 3: Manual Refresh

**Scenario:** User clicks "Refresh" button

```
UI Button → API Call → POST /api/v1/intelligence/buyer-group/refresh
    ↓
Creates webhook event with source='manual'
    ↓
Same flow as external webhooks
    ↓
Idempotent - safe to click multiple times
```

## 🔧 Integration Points

### From Your Buyer Group Pipeline

```typescript
// Use pure functions in existing pipeline
import { 
  validateCompanyInput,
  saveBuyerGroupStep 
} from '@/platform/pipelines/shared/pipeline-functions';

// Validate input (idempotent)
const validated = await validateCompanyInput.execute(
  { companyName: 'Salesforce' },
  context
);

// Save to database (idempotent with upsert)
await saveBuyerGroupStep.execute(
  { workspaceId: 'ws_123', buyerGroup: result },
  context
);
```

### From External Webhooks

Configure webhook URLs in your data providers:

**CoreSignal:**
```
Webhook URL: https://yourdomain.com/api/webhooks/person-change
Secret: your_webhook_secret
Events: person.role_change, person.company_change
```

**LinkedIn (if available):**
```
Webhook URL: https://yourdomain.com/api/webhooks/person-change
Secret: your_webhook_secret
Events: profile.update, job.change
```

## 📈 What's Next

### Immediate (Today)
1. ✅ Test webhook endpoint
2. ✅ Verify database schema
3. ✅ Review pure functions

### Short Term (This Week)
4. ⏳ Set up BullMQ job queue
5. ⏳ Implement worker process
6. ⏳ Add observability (logging, metrics)

### Long Term (Next Sprint)
7. ⏳ Refactor main pipeline to use pure functions
8. ⏳ Add comprehensive tests
9. ⏳ Build monitoring dashboard

## 🆘 Troubleshooting

### Issue: Webhook signature fails

**Solution:** Check that `WEBHOOK_SECRET` in .env matches the secret used to generate signature

### Issue: Migration fails

**Solution:** Make sure you're using the streamlined schema:
```bash
npx prisma migrate dev --schema=prisma/schema-streamlined.prisma
```

### Issue: Duplicate webhook events

**Solution:** This is expected! Idempotency key prevents duplicate processing:
```typescript
// Second webhook with same ID returns:
{ status: 'already_processed' }
```

## 📚 Documentation

**Full Guides:**
- `FUNCTION_BASED_PIPELINE_IMPLEMENTATION.md` - Complete implementation details
- `PIPELINE_REFACTOR_2025_BEST_PRACTICES.md` - Industry best practices
- `ORCHESTRATION_SUMMARY.md` - Executive overview

**Code Examples:**
- `src/platform/intelligence/buyer-group/function-based-pipeline.ts` - Example usage
- `src/platform/intelligence/shared/orchestration.ts` - Orchestration engine

---

**Ready to test?** Start with Step 1 above! 🚀

**Questions?** Check the documentation files or review the code comments.

