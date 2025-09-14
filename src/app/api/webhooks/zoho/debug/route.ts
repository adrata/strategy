import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 🔍 ZOHO WEBHOOK DEBUG ENDPOINT
 * 
 * Comprehensive endpoint to debug Zoho webhook issues
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [ZOHO DEBUG] === WEBHOOK RECEIVED ===');
    console.log('🔍 [ZOHO DEBUG] Timestamp:', new Date().toISOString());
    console.log('🔍 [ZOHO DEBUG] Method:', request.method);
    console.log('🔍 [ZOHO DEBUG] URL:', request.url);

    // Log all headers
    const headers = Object.fromEntries(request.headers.entries());
    console.log('🔍 [ZOHO DEBUG] All Headers:', JSON.stringify(headers, null, 2));

    // Log content type
    const contentType = request.headers.get('content-type');
    console.log('🔍 [ZOHO DEBUG] Content-Type:', contentType);

    // Try to get the body as text first
    const bodyText = await request.text();
    console.log('🔍 [ZOHO DEBUG] Raw Body Text:', bodyText);

    // Try to parse as JSON
    let body;
    try {
      body = JSON.parse(bodyText);
      console.log('🔍 [ZOHO DEBUG] Parsed JSON Body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.log('🔍 [ZOHO DEBUG] JSON Parse Error:', parseError);
      body = { rawText: bodyText };
    }

    // Check for common Zoho webhook formats
    console.log('🔍 [ZOHO DEBUG] === FORMAT ANALYSIS ===');
    
    if (body.module) {
      console.log('🔍 [ZOHO DEBUG] ✅ Found "module" field:', body.module);
    }
    
    if (body.operation) {
      console.log('🔍 [ZOHO DEBUG] ✅ Found "operation" field:', body.operation);
    }
    
    if (body.data) {
      console.log('🔍 [ZOHO DEBUG] ✅ Found "data" field:', typeof body.data);
      if (Array.isArray(body.data)) {
        console.log('🔍 [ZOHO DEBUG] ✅ Data is an array with', body.data.length, 'items');
      }
    }

    // Check for alternative Zoho formats
    if (body.channel_id) {
      console.log('🔍 [ZOHO DEBUG] ✅ Found "channel_id" (alternative format)');
    }

    if (body.token) {
      console.log('🔍 [ZOHO DEBUG] ✅ Found "token" field');
    }

    // Always return success to Zoho
    const response = {
      success: true,
      message: 'Debug webhook received successfully',
      received_at: new Date().toISOString(),
      payload_size: bodyText.length,
      format_detected: {
        has_module: !!body.module,
        has_operation: !!body.operation,
        has_data: !!body.data,
        has_channel_id: !!body.channel_id,
        has_token: !!body.token
      }
    };

    console.log('🔍 [ZOHO DEBUG] === RESPONSE ===');
    console.log('🔍 [ZOHO DEBUG] Sending response:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);

  } catch (error) {
    console.error('🔍 [ZOHO DEBUG] === ERROR ===');
    console.error('🔍 [ZOHO DEBUG] Error:', error);
    console.error('🔍 [ZOHO DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Still return success to Zoho
    return NextResponse.json({ 
      success: true, 
      message: 'Debug webhook received (with error)',
      error: error instanceof Error ? error.message : 'Unknown error',
      received_at: new Date().toISOString()
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Zoho debug webhook endpoint is active',
    endpoint: 'https://action.adrata.com/api/webhooks/zoho/debug',
    status: 'ready',
    instructions: 'Configure Zoho webhook to point to this URL for debugging'
  });
}
