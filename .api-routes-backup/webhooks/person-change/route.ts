import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Required for static export compatibility
export const dynamic = 'force-dynamic';

/**
 * PERSON CHANGE WEBHOOK
 * 
 * Receives webhooks from external sources (LinkedIn, CoreSignal, etc.)
 * when a person's role, company, or other attributes change.
 * 
 * Triggers automatic buyer group refresh for affected companies.
 * 
 * Security: HMAC signature validation
 * Idempotency: Deduplication via event ID
 * Processing: Async via job queue
 */

interface PersonChangeEvent {
  id: string; // Event ID (for idempotency)
  source: string; // 'coresignal', 'linkedin', 'manual'
  type: string; // 'person.role_change', 'person.company_change', etc.
  timestamp: string;
  person: {
    id: string;
    name: string;
    email?: string;
    oldTitle?: string;
    newTitle?: string;
    oldCompany?: string;
    newCompany?: string;
  };
  company: {
    id: string;
    name: string;
  };
  changes: Record<string, { old: any; new: any }>;
}

/**
 * POST: Receive person change webhook
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Read payload
    const payload = await request.text();
    const signature = request.headers.get('x-signature');
    const timestamp = request.headers.get('x-timestamp');
    
    console.log(`📥 [WEBHOOK] Received person-change webhook`);
    
    // 2. Verify HMAC signature (security)
    if (!verifySignature(payload, signature, timestamp)) {
      console.warn(`⚠️ [WEBHOOK] Invalid signature`);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // 3. Parse event
    const event: PersonChangeEvent = JSON.parse(payload);
    
    console.log(`📋 [WEBHOOK] Event: ${event.type}, Person: ${event.person.name}, Company: ${event.company.name}`);
    
    // 4. Check idempotency (deduplication)
    const { prisma } = await import('@/platform/database/prisma-client');
    
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { idempotencyKey: event.id }
    });
    
    if (existingEvent) {
      console.log(`✅ [WEBHOOK] Already processed: ${event.id}`);
      return NextResponse.json({
        status: 'already_processed',
        eventId: event.id,
        processedAt: existingEvent.processedAt
      });
    }
    
    // 5. Store event (for audit trail)
    await prisma.webhookEvent.create({
      data: {
        idempotencyKey: event.id,
        source: event.source,
        eventType: event.type,
        payload: event as any,
        processed: false,
        receivedAt: new Date()
      }
    });
    
    // 6. Check if we should trigger refresh
    const shouldRefresh = await shouldTriggerRefresh(event);
    
    if (!shouldRefresh) {
      console.log(`⏭️ [WEBHOOK] Skipping refresh (rate limited or insignificant change)`);
      
      await prisma.webhookEvent.update({
        where: { idempotencyKey: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
          error: 'Skipped (rate limited)'
        }
      });
      
      return NextResponse.json({
        status: 'skipped',
        reason: 'rate_limited',
        eventId: event.id
      });
    }
    
    // 7. Enqueue job for async processing
    const { queueManager } = await import('@/platform/services/job-queue/queue-manager');
    
    const job = await queueManager.enqueue('refresh-buyer-group', {
      companyId: event.company.id,
      companyName: event.company.name,
      reason: event.type,
      triggeredBy: event.person.id,
      enrichmentLevel: 'enrich' // Default to medium level
    }, {
      idempotencyKey: `refresh-${event.company.id}-${event.id}` // Ensure job runs only once
    });
    
    console.log(`🚀 [WEBHOOK] Enqueued refresh job for: ${event.company.name}, jobId: ${job.id}`);
    
    // 8. Update webhook event as processed
    await prisma.webhookEvent.update({
      where: { idempotencyKey: event.id },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ [WEBHOOK] Processed in ${processingTime}ms`);
    
    return NextResponse.json({
      status: 'enqueued',
      eventId: event.id,
      processingTime
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [WEBHOOK] Processing failed after ${processingTime}ms:`, error);
    
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Verify HMAC signature
 */
function verifySignature(
  payload: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  if (!signature || !timestamp) {
    return false;
  }
  
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn(`⚠️ [WEBHOOK] No WEBHOOK_SECRET configured`);
    return true; // Allow in development
  }
  
  // Check timestamp (prevent replay attacks)
  const eventTimestamp = parseInt(timestamp);
  const currentTimestamp = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  if (Math.abs(currentTimestamp - eventTimestamp) > maxAge) {
    console.warn(`⚠️ [WEBHOOK] Timestamp too old or future`);
    return false;
  }
  
  // Verify HMAC
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Should we trigger a buyer group refresh?
 */
async function shouldTriggerRefresh(event: PersonChangeEvent): Promise<boolean> {
  const { prisma } = await import('@/platform/database/prisma-client');
  
  // 1. Check if change is significant
  const significantChanges = [
    'person.role_change',
    'person.company_change',
    'person.promotion',
    'person.department_change'
  ];
  
  if (!significantChanges.includes(event.type)) {
    console.log(`⏭️ [WEBHOOK] Insignificant change type: ${event.type}`);
    return false;
  }
  
  // 2. Check rate limiting (max 1 refresh per company per hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentRefresh = await prisma.buyerGroupRefreshLog.findFirst({
    where: {
      companyId: event.company.id,
      status: { in: ['processing', 'completed'] },
      startedAt: { gte: oneHourAgo }
    },
    orderBy: { startedAt: 'desc' }
  });
  
  if (recentRefresh) {
    console.log(`⏭️ [WEBHOOK] Rate limited - last refresh: ${recentRefresh.startedAt}`);
    return false;
  }
  
  return true;
}

/**
 * GET: Webhook info/documentation
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: 'Person Change Webhook',
    version: '1.0',
    description: 'Receives person change events and triggers buyer group refresh',
    method: 'POST',
    security: {
      authentication: 'HMAC signature (x-signature header)',
      timestampValidation: '5 minute window (x-timestamp header)',
      idempotency: 'Event ID deduplication'
    },
    rateLimit: {
      perCompany: '1 refresh per hour',
      deduplication: 'Automatic via event ID'
    },
    eventTypes: [
      'person.role_change',
      'person.company_change',
      'person.promotion',
      'person.department_change'
    ],
    example: {
      headers: {
        'x-signature': 'hmac_signature_here',
        'x-timestamp': '1696800000000',
        'content-type': 'application/json'
      },
      body: {
        id: 'evt_123456',
        source: 'coresignal',
        type: 'person.role_change',
        timestamp: '2025-10-10T12:00:00Z',
        person: {
          id: 'person_123',
          name: 'John Doe',
          email: 'john@example.com',
          oldTitle: 'VP Sales',
          newTitle: 'CRO'
        },
        company: {
          id: 'company_456',
          name: 'Salesforce'
        },
        changes: {
          title: {
            old: 'VP Sales',
            new: 'CRO'
          }
        }
      }
    },
    webhookSecretSetup: {
      environment: 'WEBHOOK_SECRET=your_secret_key',
      generation: 'openssl rand -hex 32'
    }
  });
}

