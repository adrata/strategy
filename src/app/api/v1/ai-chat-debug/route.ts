/**
 * 🔍 AI CHAT DEBUG ENDPOINT
 * 
 * Minimal endpoint to debug 405 issues - no dependencies, no auth
 * This will help us determine if the 405 is from:
 * 1. Vercel edge/WAF
 * 2. Next.js routing
 * 3. Our code/middleware
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

// Log at module load time
console.log('🔍 [AI-CHAT-DEBUG] Route module loaded at:', new Date().toISOString());

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  console.log('✅ [AI-CHAT-DEBUG] POST handler REACHED at:', timestamp);
  console.log('🔍 [AI-CHAT-DEBUG] Request details:', {
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    headers: Object.fromEntries(request.headers.entries()),
  });

  try {
    const body = await request.text();
    console.log('🔍 [AI-CHAT-DEBUG] Request body length:', body.length);
    console.log('🔍 [AI-CHAT-DEBUG] Request body preview:', body.substring(0, 200));

    return NextResponse.json({
      success: true,
      message: 'POST request received successfully!',
      debug: {
        timestamp,
        method: request.method,
        url: request.url,
        pathname: request.nextUrl.pathname,
        bodyLength: body.length,
        headers: {
          'content-type': request.headers.get('content-type'),
          'user-agent': request.headers.get('user-agent'),
          'x-forwarded-for': request.headers.get('x-forwarded-for'),
          'x-vercel-id': request.headers.get('x-vercel-id'),
        }
      }
    });
  } catch (error) {
    console.error('❌ [AI-CHAT-DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  console.log('✅ [AI-CHAT-DEBUG] GET handler REACHED at:', timestamp);
  
  return NextResponse.json({
    success: true,
    message: 'Debug endpoint is working. Use POST to test.',
    timestamp,
    method: 'GET',
    pathname: request.nextUrl.pathname,
    info: 'If you see this, the route is accessible. Try POST next.'
  });
}

export async function OPTIONS(request: NextRequest) {
  console.log('✅ [AI-CHAT-DEBUG] OPTIONS handler REACHED');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

