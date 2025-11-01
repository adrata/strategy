import { NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

/**
 * Minimal Microsoft Graph Webhook Endpoint
 * 
 * This is the most basic implementation following Microsoft Graph docs exactly
 */

export async function POST(request: NextRequest) {
  console.log("🔔 [MINIMAL-GRAPH] POST received");
  
  try {
    // Check for validation token in header first
    const validationToken = request.headers.get('validationtoken');
    if (validationToken) {
      console.log("✅ [MINIMAL-GRAPH] Validation token found:", validationToken);
      return new Response(validationToken, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // If no header token, try reading body
    const body = await request.text();
    console.log("🔍 [MINIMAL-GRAPH] Body:", body);

    // Try parsing as JSON to look for validationToken
    try {
      const data = JSON.parse(body);
      if (data.validationToken) {
        console.log("✅ [MINIMAL-GRAPH] Validation token in body:", data.validationToken);
        return new Response(data.validationToken, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    } catch (e) {
      // If not JSON, treat entire body as potential token
      if (body && body.length > 0 && body.length < 100) {
        console.log("✅ [MINIMAL-GRAPH] Body as token:", body);
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    // Handle notification
    console.log("📧 [MINIMAL-GRAPH] Processing notification");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ [MINIMAL-GRAPH] Error:", error);
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(request: NextRequest) {
  console.log("🔔 [MINIMAL-GRAPH] GET received");
  
  const url = new URL(request.url);
  const validationToken = url.searchParams.get('validationToken') || url.searchParams.get('validationtoken');
  
  if (validationToken) {
    console.log("✅ [MINIMAL-GRAPH] GET validation token:", validationToken);
    return new Response(validationToken, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return new Response(JSON.stringify({ message: 'Minimal Graph Webhook' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
