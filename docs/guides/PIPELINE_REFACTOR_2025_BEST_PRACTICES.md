# Buyer Group Pipeline Refactor - 2025 Best Practices

**Based on Research: Temporal.io, Prefect, Airflow, Shakudo, Symphony Solutions**

## 🔍 Research Summary: 2025 Industry Standards

### Top Findings

1. **Function-Based Orchestration** is now the standard
2. **Idempotency** is critical for reliability
3. **Change Data Capture (CDC)** for real-time sync
4. **AI-Driven Monitoring** for anomaly detection
5. **Zero-Trust Security Model** is baseline
6. **Data Product Mindset** - treat pipelines as products
7. **API-First Design** with GraphQL gaining traction
8. **ELT over ETL** for cloud-native processing

### Modern Pipeline Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│ 1. ORCHESTRATION LAYER                                  │
│    • Pure functions (testable, composable)              │
│    • Idempotent operations (safe retries)               │
│    • DAG visualization (workflow clarity)               │
│    • Conditional branching (dynamic workflows)          │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. OBSERVABILITY LAYER                                   │
│    • Real-time monitoring (performance, errors)         │
│    • Distributed tracing (end-to-end visibility)        │
│    • AI-driven anomaly detection                        │
│    • Automated alerts (proactive issue detection)       │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. EVENT LAYER (CDC + Webhooks)                         │
│    • Change Data Capture (real-time sync)               │
│    • Webhook ingestion (external events)                │
│    • Event deduplication (idempotency keys)             │
│    • Rate limiting (prevent overload)                   │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. SECURITY LAYER                                        │
│    • End-to-end encryption (data in transit/rest)       │
│    • Zero-trust authentication (verify everything)      │
│    • HMAC signature validation (webhook security)       │
│    • IP whitelisting (restrict access)                  │
└─────────────────────────────────────────────────────────┘
```

## 📋 Implementation Plan with 2025 Standards

### Phase 1: Idempotent Function-Based Pipeline

**Goal:** Make every pipeline step idempotent and pure

#### 1.1 Extract Pure, Idempotent Functions

**Idempotency Pattern:**
```typescript
// ❌ NOT idempotent
async function enrichContact(person) {
  await prisma.people.create({ data: person }); // Fails on retry!
}

// ✅ Idempotent
async function enrichContact(person, idempotencyKey) {
  await prisma.people.upsert({
    where: { idempotencyKey },
    update: person,
    create: { ...person, idempotencyKey }
  }); // Safe to retry!
}
```

**Functions to Extract:**
1. `loadCompanies()` - Pure, idempotent
2. `resolveCompany()` - Idempotent with deduplication
3. `discoverBuyerGroup()` - Idempotent with caching
4. `enrichContacts()` - Idempotent with upsert pattern
5. `deepResearch()` - Idempotent with cached results
6. `calculateQuality()` - Pure function (no side effects)
7. `saveToDatabase()` - Idempotent with upsert
8. `updateCache()` - Idempotent by nature

#### 1.2 Add Idempotency Keys

```typescript
interface PipelineStep<TInput, TOutput> {
  name: string;
  execute: (input: TInput, context: PipelineContext) => Promise<TOutput>;
  idempotencyKey: (input: TInput) => string; // NEW!
  retryable: boolean; // Default: true
  maxRetries: number; // Default: 3
  timeout: number; // Default: 30000ms
}
```

#### 1.3 Implement Orchestration DAG

```typescript
const buyerGroupWorkflow = createWorkflow({
  name: 'buyer-group-discovery',
  steps: {
    validate: {
      fn: validateInput,
      dependencies: []
    },
    checkCache: {
      fn: checkCache,
      dependencies: ['validate']
    },
    resolveCompany: {
      fn: resolveCompany,
      dependencies: ['checkCache'],
      condition: (ctx) => !ctx.cacheHit
    },
    discoverBuyerGroup: {
      fn: discoverBuyerGroup,
      dependencies: ['resolveCompany']
    },
    enrichContacts: {
      fn: enrichContacts,
      dependencies: ['discoverBuyerGroup'],
      condition: (ctx) => ctx.enrichmentLevel !== 'identify'
    },
    deepResearch: {
      fn: deepResearch,
      dependencies: ['enrichContacts'],
      condition: (ctx) => ctx.enrichmentLevel === 'deep_research'
    },
    saveToDatabase: {
      fn: saveToDatabase,
      dependencies: ['deepResearch', 'enrichContacts', 'discoverBuyerGroup']
    }
  }
});
```

### Phase 2: Observability & Monitoring

**Goal:** Full visibility into pipeline execution

#### 2.1 Structured Logging

```typescript
import { logger } from '@/platform/services/logger';

// Structured logs with context
logger.info('step.started', {
  step: 'discoverBuyerGroup',
  company: 'Salesforce',
  enrichmentLevel: 'enrich',
  traceId: '123-456-789'
});

logger.info('step.completed', {
  step: 'discoverBuyerGroup',
  duration: 2500,
  membersFound: 12,
  traceId: '123-456-789'
});
```

#### 2.2 Distributed Tracing

```typescript
import { trace } from '@opentelemetry/api';

async function executeStep(step, input, context) {
  const span = trace.getTracer('pipeline').startSpan(step.name);
  
  try {
    span.setAttribute('company', input.companyName);
    span.setAttribute('enrichmentLevel', context.enrichmentLevel);
    
    const result = await step.execute(input, context);
    
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}
```

#### 2.3 Real-Time Metrics

```typescript
import { metrics } from '@/platform/services/metrics';

// Track key metrics
metrics.increment('pipeline.step.started', { step: 'discoverBuyerGroup' });
metrics.histogram('pipeline.step.duration', duration, { step: 'discoverBuyerGroup' });
metrics.gauge('pipeline.cost.estimate', costEstimate, { enrichmentLevel: 'enrich' });
metrics.counter('pipeline.members.discovered', membersFound);
```

#### 2.4 AI-Driven Anomaly Detection

```typescript
// Detect unusual patterns
const anomalyDetector = new AnomalyDetector({
  metrics: ['duration', 'membersFound', 'confidence'],
  threshold: 2.5 // Standard deviations
});

if (anomalyDetector.isAnomaly(result)) {
  logger.warn('anomaly.detected', {
    expected: anomalyDetector.expected,
    actual: result,
    deviation: anomalyDetector.deviation
  });
  
  // Alert team
  await alertTeam('Unusual pipeline behavior detected');
}
```

### Phase 3: Change Data Capture (CDC) + Webhooks

**Goal:** Real-time sync with automatic buyer group refresh

#### 3.1 Database CDC Setup

```typescript
// Listen to database changes
const cdc = new DatabaseCDC({
  table: 'people',
  events: ['INSERT', 'UPDATE', 'DELETE'],
  filter: (change) => {
    // Only care about role changes
    return change.old.jobTitle !== change.new.jobTitle ||
           change.old.companyId !== change.new.companyId;
  }
});

cdc.on('change', async (change) => {
  // Trigger buyer group refresh
  await refreshBuyerGroup(change.new.companyId, {
    reason: 'cdc_role_change',
    personId: change.new.id
  });
});
```

#### 3.2 Webhook Receiver with HMAC Validation

```typescript
// src/app/api/webhooks/person-change/route.ts

import crypto from 'crypto';

export async function POST(request: NextRequest) {
  // 1. Verify HMAC signature (security)
  const signature = request.headers.get('x-signature');
  const payload = await request.text();
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const event = JSON.parse(payload);
  
  // 2. Check idempotency (deduplication)
  const idempotencyKey = event.id;
  const existing = await prisma.webhookEvent.findUnique({
    where: { idempotencyKey }
  });
  
  if (existing) {
    // Already processed, return success (idempotent)
    return NextResponse.json({ status: 'already_processed' });
  }
  
  // 3. Store event (for audit trail)
  await prisma.webhookEvent.create({
    data: {
      idempotencyKey,
      source: event.source,
      eventType: event.type,
      payload: event,
      receivedAt: new Date()
    }
  });
  
  // 4. Enqueue job (async processing)
  await jobQueue.enqueue('refresh-buyer-group', {
    companyId: event.companyId,
    reason: 'webhook_person_change',
    triggeredBy: event.personId
  });
  
  return NextResponse.json({ status: 'enqueued' });
}
```

#### 3.3 Background Job Queue with Retry

```typescript
// src/platform/services/job-queue.ts

import { Queue, Worker } from 'bullmq';

const refreshQueue = new Queue('buyer-group-refresh', {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
  }
});

// Worker with retry logic
const worker = new Worker('buyer-group-refresh', async (job) => {
  const { companyId, reason, triggeredBy } = job.data;
  
  // Log job start
  await prisma.buyerGroupRefreshLog.create({
    data: {
      companyId,
      reason,
      triggeredBy,
      status: 'processing'
    }
  });
  
  try {
    // Execute pipeline
    const result = await engine.discover({
      companyId,
      enrichmentLevel: 'enrich',
      forceRefresh: true
    });
    
    // Log success
    await prisma.buyerGroupRefreshLog.update({
      where: { companyId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        changes: result.changes
      }
    });
    
    // Notify user
    await notifyUser(companyId, 'Buyer group updated');
    
    return result;
  } catch (error) {
    // Log failure
    await prisma.buyerGroupRefreshLog.update({
      where: { companyId },
      data: {
        status: 'failed',
        error: error.message
      }
    });
    
    throw error; // Will trigger retry
  }
}, {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
  },
  concurrency: 3,
  limiter: {
    max: 10, // Max 10 jobs per minute
    duration: 60000
  }
});

// Retry config
refreshQueue.defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 500 // Keep last 500 failed jobs
};
```

#### 3.4 Deduplication & Rate Limiting

```typescript
// Prevent duplicate refreshes within time window
async function shouldRefresh(companyId: string): Promise<boolean> {
  const recentRefresh = await prisma.buyerGroupRefreshLog.findFirst({
    where: {
      companyId,
      status: { in: ['processing', 'completed'] },
      startedAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
      }
    }
  });
  
  if (recentRefresh) {
    logger.info('refresh.skipped.rate_limit', {
      companyId,
      lastRefresh: recentRefresh.startedAt
    });
    return false;
  }
  
  return true;
}
```

### Phase 4: Zero-Trust Security

**Goal:** Enterprise-grade security

#### 4.1 End-to-End Encryption

```typescript
// Encrypt sensitive data
import { encrypt, decrypt } from '@/platform/services/encryption';

// Before saving to database
const encryptedEmail = encrypt(email, process.env.ENCRYPTION_KEY);

// When retrieving
const email = decrypt(encryptedEmail, process.env.ENCRYPTION_KEY);
```

#### 4.2 Zero-Trust Authentication

```typescript
// Every request must be authenticated
export async function POST(request: NextRequest) {
  // 1. Verify session/token
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Verify workspace access
  const hasAccess = await hasWorkspaceAccess(session.userId, workspaceId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 3. Verify resource access
  const canModify = await canModifyResource(session.userId, resourceId);
  if (!canModify) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Now proceed with request
}
```

### Phase 5: Data Product Mindset

**Goal:** Treat pipeline as a product with SLAs

#### 5.1 Service Level Objectives (SLOs)

```typescript
const buyerGroupSLOs = {
  availability: 99.9, // 99.9% uptime
  latency: {
    p50: 5000, // 50th percentile: 5 seconds
    p95: 30000, // 95th percentile: 30 seconds
    p99: 60000 // 99th percentile: 60 seconds
  },
  accuracy: {
    confidence: 80, // 80% average confidence
    cohesion: 7 // 7/10 cohesion score
  },
  cost: {
    identify: 0.10,
    enrich: 2.50,
    deep_research: 6.00
  }
};
```

#### 5.2 Continuous Monitoring of SLOs

```typescript
// Alert if SLO breach
if (result.metadata.processingTime > buyerGroupSLOs.latency.p95) {
  await alertTeam('SLO breach: p95 latency exceeded', {
    expected: buyerGroupSLOs.latency.p95,
    actual: result.metadata.processingTime
  });
}
```

## 📊 Database Schema Updates

```prisma
// Idempotency tracking
model WebhookEvent {
  id               String   @id @default(cuid())
  idempotencyKey   String   @unique // For deduplication
  source           String   // 'coresignal', 'linkedin', etc
  eventType        String   // 'person.role_change', etc
  payload          Json
  processed        Boolean  @default(false)
  receivedAt       DateTime @default(now())
  processedAt      DateTime?
  error            String?
  
  @@index([source, eventType])
  @@index([processed, receivedAt])
}

// Refresh tracking
model BuyerGroupRefreshLog {
  id          String   @id @default(cuid())
  companyId   String
  workspaceId String
  reason      String   // 'webhook', 'manual', 'scheduled', 'cdc'
  triggeredBy String?  // personId or userId
  status      String   // 'pending', 'processing', 'completed', 'failed'
  startedAt   DateTime @default(now())
  completedAt DateTime?
  changes     Json?
  error       String?
  
  company     companies @relation(fields: [companyId], references: [id])
  
  @@index([companyId, startedAt])
  @@index([status])
}

// Idempotency for pipeline operations
model PipelineOperation {
  id               String   @id @default(cuid())
  idempotencyKey   String   @unique
  pipelineName     String
  input            Json
  output           Json?
  status           String   // 'pending', 'processing', 'completed', 'failed'
  createdAt        DateTime @default(now())
  completedAt      DateTime?
  error            String?
  
  @@index([idempotencyKey])
  @@index([pipelineName, status])
}
```

## 🎯 Implementation Checklist

### Phase 1: Idempotent Functions ⏳
- [ ] Add idempotency keys to all pipeline steps
- [ ] Implement upsert patterns for database operations
- [ ] Add deduplication logic
- [ ] Create DAG workflow definitions
- [ ] Add retry logic with exponential backoff

### Phase 2: Observability ⏳
- [ ] Implement structured logging
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Set up real-time metrics
- [ ] Implement AI-driven anomaly detection
- [ ] Create dashboards for monitoring

### Phase 3: CDC + Webhooks ⏳
- [ ] Set up database CDC listeners
- [ ] Create webhook receiver endpoints
- [ ] Implement HMAC signature validation
- [ ] Set up background job queue (BullMQ)
- [ ] Add deduplication and rate limiting
- [ ] Create refresh triggers

### Phase 4: Security ⏳
- [ ] Implement end-to-end encryption
- [ ] Add zero-trust authentication
- [ ] Set up IP whitelisting
- [ ] Implement audit logging
- [ ] Add security scanning

### Phase 5: Data Product ⏳
- [ ] Define SLOs for pipeline
- [ ] Set up SLO monitoring
- [ ] Create automated alerts
- [ ] Implement cost tracking
- [ ] Build product dashboard

## 🚀 Expected Benefits

### Performance
- ⚡ **3x faster** - Parallel execution with DAG
- 📉 **50% cost reduction** - Smart caching and deduplication
- 🔄 **100% reliability** - Idempotent operations

### Developer Experience
- 🧪 **Easy testing** - Pure functions
- 🔍 **Full visibility** - Distributed tracing
- 🐛 **Quick debugging** - Isolated failures
- 🔧 **Easy maintenance** - Small, focused functions

### Business Value
- ✅ **Real-time data** - CDC keeps buyer groups current
- 💰 **Cost efficiency** - Only refresh when needed
- 📊 **SLO compliance** - Meet performance targets
- 🔒 **Enterprise security** - Zero-trust model

## 📚 References

- Temporal.io - Modern workflow orchestration
- Prefect - Data pipeline best practices
- Shakudo - Automated data pipelines
- Symphony Solutions - 2025 data integration trends
- OWASP - Webhook security best practices

---

**Next Step:** Implement Phase 1 - Idempotent Function-Based Pipeline

