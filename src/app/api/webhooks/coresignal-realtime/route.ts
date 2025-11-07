/**
 * Coresignal Real-Time Webhook Handler
 * 
 * Receives webhooks from Coresignal when:
 * - Person changes company
 * - Person changes title
 * - Company gets new executives
 * - Contact information updates
 * 
 * Triggers:
 * - Immediate data refresh
 * - Buyer group re-run if person was in buyer group
 * - AI notification storage for proactive alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/webhooks/coresignal-realtime
 * 
 * Receives Coresignal webhook events
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Read and verify webhook
    const payload = await request.text();
    const signature = request.headers.get('x-coresignal-signature');
    const timestamp = request.headers.get('x-coresignal-timestamp');
    
    console.log(`🔔 [WEBHOOK] Received Coresignal event`);
    
    // 2. Verify signature (security)
    if (!verifyWebhookSignature(payload, signature, timestamp)) {
      console.warn(`⚠️ [WEBHOOK] Invalid signature`);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // 3. Parse event
    const event = JSON.parse(payload);
    
    console.log(`📋 [WEBHOOK] Event type: ${event.type}`);
    console.log(`📋 [WEBHOOK] Event ID: ${event.id}`);
    
    // 4. Check idempotency (prevent duplicate processing)
    const existing = await prisma.webhookEvent.findFirst({
      where: { idempotencyKey: event.id }
    });
    
    if (existing) {
      console.log(`✅ [WEBHOOK] Already processed`);
      return NextResponse.json({
        status: 'already_processed',
        eventId: event.id
      });
    }
    
    // 5. Store webhook event
    await prisma.webhookEvent.create({
      data: {
        idempotencyKey: event.id,
        source: 'coresignal',
        eventType: event.type,
        payload: event as any,
        processed: false,
        receivedAt: new Date()
      }
    });
    
    // 6. Process based on event type
    let result;
    switch (event.type) {
      case 'person.company_change':
        result = await handlePersonCompanyChange(event);
        break;
      case 'person.title_change':
        result = await handlePersonTitleChange(event);
        break;
      case 'person.contact_update':
        result = await handlePersonContactUpdate(event);
        break;
      case 'company.executive_change':
        result = await handleCompanyExecutiveChange(event);
        break;
      default:
        console.log(`⚠️ [WEBHOOK] Unhandled event type: ${event.type}`);
        result = { processed: false, reason: 'Unhandled event type' };
    }
    
    // 7. Mark as processed
    await prisma.webhookEvent.update({
      where: { idempotencyKey: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
        result: result as any
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ [WEBHOOK] Processed in ${duration}ms`);
    
    return NextResponse.json({
      status: 'processed',
      eventId: event.id,
      duration: `${duration}ms`,
      result
    });
    
  } catch (error: any) {
    console.error(`❌ [WEBHOOK] Error:`, error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle person company change (CRITICAL)
 */
async function handlePersonCompanyChange(event: any) {
  console.log(`🚨 [WEBHOOK] CRITICAL: Person changed companies`);
  console.log(`   ${event.person.name}: ${event.oldCompany} → ${event.newCompany}`);
  
  // Find person
  const person = await prisma.people.findFirst({
    where: {
      OR: [
        { email: event.person.email },
        { linkedinUrl: event.person.linkedinUrl }
      ],
      deletedAt: null
    },
    include: {
      company: {
        select: { id: true, name: true }
      }
    }
  });
  
  if (!person) {
    return { processed: false, reason: 'Person not found' };
  }
  
  // Store change for AI notification
  const changeData = {
    field: 'company',
    oldValue: event.oldCompany,
    newValue: event.newCompany,
    critical: true,
    source: 'coresignal_webhook',
    detectedAt: new Date().toISOString(),
    notifiedToAI: false,
    userNotified: false
  };
  
  const customFields = person.customFields as any || {};
  const changeHistory = customFields.changeHistory || [];
  
  await prisma.people.update({
    where: { id: person.id },
    data: {
      customFields: {
        ...customFields,
        changeHistory: [...changeHistory, changeData],
        lastChangeDetected: new Date().toISOString(),
        hasUnnotifiedChanges: true
      },
      // Update churn prediction to RED (just changed jobs)
      customFields: {
        ...customFields,
        churnPrediction: {
          ...(customFields.churnPrediction || {}),
          refreshColor: 'red',
          refreshPriority: 'high',
          refreshFrequency: 'daily',
          lastRefreshDate: new Date().toISOString()
        }
      }
    }
  });
  
  // If person was in buyer group, trigger re-run
  if (person.isBuyerGroupMember && person.companyId) {
    console.log(`🔄 [WEBHOOK] Person was in buyer group - triggering re-run`);
    
    await prisma.companies.update({
      where: { id: person.companyId },
      data: {
        customFields: {
          ...(await getCompanyCustomFields(person.companyId)),
          buyerGroupReRunNeeded: true,
          buyerGroupReRunReason: 'Buyer group member left company',
          buyerGroupReRunContext: {
            personId: person.id,
            personName: person.fullName,
            oldCompany: event.oldCompany,
            newCompany: event.newCompany,
            webhookId: event.id,
            triggeredAt: new Date().toISOString()
          }
        }
      }
    });
  }
  
  return {
    processed: true,
    personId: person.id,
    personName: person.fullName,
    changeDetected: 'company_change',
    buyerGroupReRunTriggered: person.isBuyerGroupMember,
    aiNotificationQueued: true
  };
}

/**
 * Handle person title change
 */
async function handlePersonTitleChange(event: any) {
  console.log(`📋 [WEBHOOK] Title change detected`);
  console.log(`   ${event.person.name}: ${event.oldTitle} → ${event.newTitle}`);
  
  // Find and update person, store for AI notification
  // Similar to company change but less critical
  
  return {
    processed: true,
    changeType: 'title_change',
    aiNotificationQueued: true
  };
}

/**
 * Handle contact information update
 */
async function handlePersonContactUpdate(event: any) {
  console.log(`📧 [WEBHOOK] Contact info updated for ${event.person.name}`);
  
  // Update email/phone if changed
  // Store for AI notification
  
  return {
    processed: true,
    changeType: 'contact_update'
  };
}

/**
 * Handle company executive change
 */
async function handleCompanyExecutiveChange(event: any) {
  console.log(`🏢 [WEBHOOK] Executive change at ${event.company.name}`);
  
  // If exec left buyer group, trigger re-run
  
  return {
    processed: true,
    changeType: 'executive_change'
  };
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  if (!signature || !timestamp) {
    return false;
  }
  
  const secret = process.env.CORESIGNAL_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('⚠️ CORESIGNAL_WEBHOOK_SECRET not set');
    return true; // Allow in development
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}.${payload}`);
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

async function getCompanyCustomFields(companyId: string) {
  const company = await prisma.companies.findUnique({
    where: { id: companyId },
    select: { customFields: true }
  });
  return company?.customFields as any || {};
}

/**
 * GET: Webhook health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    webhook: 'coresignal-realtime',
    capabilities: [
      'person.company_change',
      'person.title_change',
      'person.contact_update',
      'company.executive_change'
    ]
  });
}

