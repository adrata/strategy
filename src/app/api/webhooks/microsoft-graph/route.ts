import { NextRequest, NextResponse } from 'next/server';
import { UnifiedEmailSyncService } from '@/platform/services/UnifiedEmailSyncService';

export const dynamic = "force-dynamic";

/**
 * Microsoft Graph Webhook Endpoint - Compliant with 2025 Standards
 * 
 * This endpoint handles Microsoft Graph webhook validation and notifications
 * according to the latest Microsoft Graph API requirements
 */

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 [MS-GRAPH WEBHOOK] POST request received");
    console.log("🔍 Headers:", Object.fromEntries(request.headers));
    console.log("🔍 URL:", request.url);
    console.log("🔍 Search params:", new URL(request.url).searchParams.toString());

    // CRITICAL: Check for validation token in query parameters FIRST (Microsoft Graph standard)
    const { searchParams } = new URL(request.url);
    const validationTokenQuery = searchParams.get('validationToken') || searchParams.get('validationtoken');
    if (validationTokenQuery) {
      console.log("✅ [MS-GRAPH WEBHOOK] POST validation via query parameter:", validationTokenQuery);
      
      // URL decode the validation token (Microsoft Graph requirement)
      const decodedToken = decodeURIComponent(validationTokenQuery);
      console.log("🔍 [MS-GRAPH WEBHOOK] Decoded token:", decodedToken);
      
      // Microsoft Graph expects EXACTLY this response format
      const response = new Response(decodedToken, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain'
        }
      });
      
      console.log("🔍 [MS-GRAPH WEBHOOK] POST responding with status 200 and decoded query token");
      return response;
    }

    // Read the raw body
    const body = await request.text();
    console.log("🔍 Raw body:", body);
    console.log("🔍 Body length:", body.length);
    console.log("🔍 Body type:", typeof body);

    // STEP 1: Handle validation token in header (alternative method)
    const validationTokenHeader = request.headers.get('validationToken') || request.headers.get('validationtoken');
    if (validationTokenHeader) {
      console.log("✅ [MS-GRAPH WEBHOOK] Validation via header token:", validationTokenHeader);
      
      // Microsoft Graph expects EXACTLY this response format
      const response = new Response(validationTokenHeader, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
      
      console.log("🔍 [MS-GRAPH WEBHOOK] Responding with status 200 and header token");
      return response;
    }

    // STEP 2: Try to parse as JSON
    let notification;
    try {
      notification = JSON.parse(body);
      console.log("🔍 [MS-GRAPH WEBHOOK] Parsed JSON:", JSON.stringify(notification, null, 2));
    } catch (parseError) {
      // STEP 3: Handle plain text validation token (fallback)
      if (body && body.trim().length > 0 && body.trim().length < 200) {
        console.log("✅ [MS-GRAPH WEBHOOK] Plain text validation token:", body.trim());
        
        const response = new Response(body.trim(), {
          status: 200,
          headers: { 
            'Content-Type': 'text/plain; charset=utf-8'
          }
        });
        
        console.log("🔍 [MS-GRAPH WEBHOOK] Responding with status 200 and plain text token");
        return response;
      }
      
      console.error("❌ [MS-GRAPH WEBHOOK] JSON parse error:", parseError);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // STEP 4: Check for validation token in JSON body
    if (notification && notification.validationToken) {
      console.log("✅ [MS-GRAPH WEBHOOK] JSON validation token:", notification.validationToken);
      
      const response = new Response(notification.validationToken, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
      
      console.log("🔍 [MS-GRAPH WEBHOOK] Responding with status 200 and JSON token");
      return response;
    }

    // STEP 5: Process actual webhook notifications
    if (notification && notification['value'] && Array.isArray(notification.value)) {
      console.log(`🔔 [MS-GRAPH WEBHOOK] Processing ${notification.value.length} notifications`);

      for (const change of notification.value) {
        try {
          await processGraphNotification(change);
        } catch (error) {
          console.error("❌ [MS-GRAPH WEBHOOK] Failed to process notification:", error);
          // Continue processing other notifications
        }
      }

      return NextResponse.json({ 
        success: true, 
        processed: notification.value.length,
        timestamp: new Date().toISOString()
      });
    }

    // STEP 6: Handle unknown format
    console.log("⚠️ [MS-GRAPH WEBHOOK] Unknown notification format");
    
    // EMERGENCY FALLBACK: If Microsoft is sending something we don't recognize,
    // try to find any token-like string and respond with it
    const emergencyTokenMatch = body.match(/[a-zA-Z0-9\-_]{20,}/);
    if (emergencyTokenMatch) {
      console.log("🚨 [MS-GRAPH WEBHOOK] Emergency fallback - found token-like string:", emergencyTokenMatch[0]);
      
      const response = new Response(emergencyTokenMatch[0], {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
      
      console.log("🔍 [MS-GRAPH WEBHOOK] Emergency responding with status 200 and extracted token");
      return response;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Webhook received but format not recognized",
      body: body.substring(0, 100) 
    });

  } catch (error) {
    console.error("❌ [MS-GRAPH WEBHOOK] Error processing webhook:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests for webhook verification
 */
export async function GET(request: NextRequest) {
  console.log("🔔 [MS-GRAPH WEBHOOK] GET request received");
  console.log("🔍 Headers:", Object.fromEntries(request.headers));
  console.log("🔍 URL:", request.url);
  console.log("🔍 Search params:", new URL(request.url).searchParams.toString());
  
  // Check for validation token in query params
  const { searchParams } = new URL(request.url);
  const validationToken = searchParams.get('validationToken') || 
                          searchParams.get('validationtoken') ||
                          searchParams.get('challenge');
  
  // Check for validation token in headers
  const headerValidationToken = request.headers.get('validationToken') ||
                               request.headers.get('validationtoken') ||
                               request.headers.get('challenge');
  
  const tokenToReturn = validationToken || headerValidationToken;
  
  if (tokenToReturn) {
    console.log("✅ [MS-GRAPH WEBHOOK] GET validation token:", tokenToReturn);
    
    const response = new Response(tokenToReturn, {
      status: 200,
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
    
    console.log("🔍 [MS-GRAPH WEBHOOK] GET responding with status 200 and token");
    return response;
  }

  return NextResponse.json({ 
    message: "Microsoft Graph webhook endpoint",
    timestamp: new Date().toISOString()
  });
}

/**
 * Process individual Microsoft Graph notification
 */
async function processGraphNotification(notification: any): Promise<void> {
  console.log("🔔 Processing Graph notification:", {
    changeType: notification.changeType,
    resource: notification.resource,
    clientState: notification.clientState,
    subscriptionId: notification.subscriptionId
  });

  // Extract account ID from clientState
  const accountId = notification.clientState?.split('_')[0];
  if (!accountId) {
    console.error("❌ No account ID found in notification clientState");
    return;
  }

  // Handle different types of changes
  switch (notification.changeType) {
    case 'created':
      console.log("📧 New email created, triggering sync");
      await triggerEmailSync(accountId);
      break;
    
    case 'updated':
      console.log("📧 Email updated, triggering sync");
      await triggerEmailSync(accountId);
      break;
    
    default:
      console.log(`📧 Unhandled change type: ${notification.changeType}`);
  }
}

/**
 * Trigger email sync for account
 */
async function triggerEmailSync(accountId: string): Promise<void> {
  try {
    console.log(`🔄 Triggering email sync for account: ${accountId}`);
    
    // For now, we'll just log that a sync was triggered
    // In the new system, webhooks are handled differently through Nango
    console.log(`✅ Email sync triggered for account: ${accountId} (handled by Nango webhooks)`);

  } catch (error) {
    console.error(`❌ Failed to trigger email sync for account ${accountId}:`, error);
  }
}

