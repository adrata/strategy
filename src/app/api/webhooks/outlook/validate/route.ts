import { NextRequest, NextResponse } from 'next/server';

/**
 * Dedicated Microsoft Graph Webhook Validation Endpoint
 * 
 * Microsoft Graph sometimes has issues with validation on the main webhook endpoint
 * This dedicated endpoint ensures proper validation response
 */

export async function GET(request: NextRequest) {
  console.log("🔍 [WEBHOOK VALIDATE] Validation GET request received");
  console.log("🔍 [WEBHOOK VALIDATE] URL:", request.url);
  console.log("🔍 [WEBHOOK VALIDATE] Headers:", Object.fromEntries(request.headers));
  
  // Check for validation token in query params
  const { searchParams } = new URL(request.url);
  const validationToken = searchParams.get('validationToken') || searchParams.get('validationtoken');
  
  // Check for validation token in headers
  const headerValidationToken = request.headers.get('validationtoken');
  
  const tokenToReturn = validationToken || headerValidationToken;
  
  if (tokenToReturn) {
    console.log("🔔 [WEBHOOK VALIDATE] Returning validation token:", tokenToReturn);
    return new NextResponse(tokenToReturn, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  console.log("❌ [WEBHOOK VALIDATE] No validation token found");
  return NextResponse.json({ 
    error: "No validation token provided",
    searchParams: Object.fromEntries(searchParams),
    headers: Object.fromEntries(request.headers)
  }, { status: 400 });
}

export async function POST(request: NextRequest) {
  console.log("🔍 [WEBHOOK VALIDATE] Validation POST request received");
  
  const body = await request.text();
  console.log("🔍 [WEBHOOK VALIDATE] Body:", body);
  
  // Check headers for validation token
  const validationToken = request.headers.get('validationtoken');
  
  if (validationToken) {
    console.log("🔔 [WEBHOOK VALIDATE] POST validation with token:", validationToken);
    return new NextResponse(validationToken, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return NextResponse.json({ message: "Webhook validation endpoint" });
}
