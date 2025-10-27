/**
 * CORESIGNAL WEBHOOK API ROUTE
 * 
 * Handles incoming webhook notifications from Coresignal for real-time data updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { CoresignalWebhookIntegration, BuyerGroupUpdateHandler } from '../../../../_future_now/coresignal-webhook-integration.js';
import { ConsolidatedBuyerGroupEngine } from '../../../../_future_now/buyer-group-consolidated.js';

// Initialize webhook integration
const webhookIntegration = new CoresignalWebhookIntegration(
  process.env.CORESIGNAL_API_KEY!,
  process.env.CORESIGNAL_WEBHOOK_SECRET!
);

// Initialize buyer group update handler
const updateHandler = new BuyerGroupUpdateHandler(
  new ConsolidatedBuyerGroupEngine(),
  // Database instance would be injected here
  null // Placeholder for database
);

// Set up event handlers
webhookIntegration.on('employee.added', (event) => updateHandler.handleEmployeeChange(event));
webhookIntegration.on('employee.updated', (event) => updateHandler.handleEmployeeChange(event));
webhookIntegration.on('employee.deleted', (event) => updateHandler.handleEmployeeChange(event));
webhookIntegration.on('company.updated', (event) => updateHandler.handleCompanyChange(event));
webhookIntegration.on('company.merged', (event) => updateHandler.handleCompanyChange(event));

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-coresignal-signature');
    const timestamp = request.headers.get('x-coresignal-timestamp');
    const body = await request.text();

    if (!signature || !timestamp) {
      return NextResponse.json(
        { success: false, error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Process webhook notification
    const result = await webhookIntegration.processWebhookNotification(
      body,
      signature,
      timestamp
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return webhook status and subscription information
    const status = await webhookIntegration.getSubscriptionStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    );
  }
}