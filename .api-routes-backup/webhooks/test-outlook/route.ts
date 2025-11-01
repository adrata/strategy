
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 🔍 MINIMAL WEBHOOK TEST ENDPOINT
 * Super simple validation response for Microsoft Graph
 */

export async function POST(request: NextRequest) {
  console.log("🔍 [TEST WEBHOOK] POST received");
  console.log("🔍 [TEST WEBHOOK] Headers:", Object.fromEntries(request.headers));
  console.log("🔍 [TEST WEBHOOK] URL:", request.url);
  
  const validationToken = request.headers.get('validationtoken');
  if (validationToken) {
    console.log("🔍 [TEST WEBHOOK] Validation token found:", validationToken);
    return new Response(validationToken, {
      status: 200,
      headers: { 
        'Content-Type': 'text/plain',
        'Content-Length': validationToken.length.toString()
      }
    });
  }
  
  return new Response('OK', { status: 200 });
}

export async function GET(request: NextRequest) {
  console.log("🔍 [TEST WEBHOOK] GET received");
  console.log("🔍 [TEST WEBHOOK] Headers:", Object.fromEntries(request.headers));
  console.log("🔍 [TEST WEBHOOK] URL:", request.url);
  
  const { searchParams } = new URL(request.url);
  const validationToken = searchParams.get('validationToken') || searchParams.get('validationtoken');
  
  if (validationToken) {
    console.log("🔍 [TEST WEBHOOK] Validation token found:", validationToken);
    return new Response(validationToken, {
      status: 200,
      headers: { 
        'Content-Type': 'text/plain',
        'Content-Length': validationToken.length.toString()
      }
    });
  }
  
  return new Response('Test webhook endpoint ready', { status: 200 });
}
