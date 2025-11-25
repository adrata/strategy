/**
 * 🧪 SIMPLE POST TEST ENDPOINT
 * 
 * Absolutely minimal endpoint to test if POST works at all on Vercel
 * No imports, no dependencies, no auth
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('✅ [TEST-POST] POST received at:', new Date().toISOString());
  console.log('✅ [TEST-POST] Method:', request.method);
  console.log('✅ [TEST-POST] URL:', request.url);
  
  return NextResponse.json({
    success: true,
    message: 'POST works!',
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'GET works! Try POST to this endpoint.',
    timestamp: new Date().toISOString()
  });
}

