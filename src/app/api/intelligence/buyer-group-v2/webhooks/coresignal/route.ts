/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * CORESIGNAL WEBHOOK ENDPOINT
 * 
 * Handles incoming webhook events from Coresignal for real-time buyer group updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { CoresignalWebhookHandler } from '@/platform/intelligence/buyer-group-v2/webhooks/coresignal-webhook-handler';

const webhookHandler = new CoresignalWebhookHandler();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-coresignal-signature') || '';
    
    // Verify webhook signature
    if (!webhookHandler.verifySignature(body, signature)) {
      console.error('❌ [WEBHOOK] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    let event;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('❌ [WEBHOOK] Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Process the webhook event
    const result = await webhookHandler.processWebhookEvent(event);
    
    if (result.success) {
      console.log(`✅ [WEBHOOK] Event processed: ${event.type} (${event.id})`);
      return NextResponse.json({ success: true });
    } else {
      console.error(`❌ [WEBHOOK] Event processing failed: ${result.message}`);
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ [WEBHOOK] Webhook processing error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    subscriptions: webhookHandler.getSubscriptions().length
  });
}
