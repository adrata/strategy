import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 🔔 ZOHO WEBHOOK TEST ENDPOINT
 * 
 * Simple endpoint to debug what Zoho is sending
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 [ZOHO TEST] Received test webhook notification');

    // Log everything for debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('📋 [ZOHO TEST] Headers:', JSON.stringify(headers, null, 2));

    const body = await request.json();
    console.log('📍 [ZOHO TEST] Payload:', JSON.stringify(body, null, 2));

    // Always return success to Zoho
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received successfully',
      received_at: new Date().toISOString(),
      payload_size: JSON.stringify(body).length
    });

  } catch (error) {
    console.error('❌ [ZOHO TEST] Error:', error);
    
    // Still return success to Zoho to avoid "third party error"
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received (with error)',
      error: error instanceof Error ? error.message : 'Unknown error',
      received_at: new Date().toISOString()
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Zoho test webhook endpoint is active',
    endpoint: 'https://action.adrata.com/api/webhooks/zoho/test',
    status: 'ready'
  });
}
