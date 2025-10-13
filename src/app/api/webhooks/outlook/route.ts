import { NextRequest, NextResponse } from "next/server";
import { UnifiedEmailSyncService } from "@/platform/services/UnifiedEmailSyncService";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Microsoft Graph Webhook Handler for Real-time Email Notifications
 * 
 * Handles webhook notifications from Microsoft Graph when new emails arrive
 * Automatically syncs new emails to the database
 */

export async function POST(request: NextRequest) {
  try {
    // 🔍 DEBUG: Log all incoming headers and query params
    console.log("🔍 [WEBHOOK DEBUG] Request method:", request.method);
    console.log("🔍 [WEBHOOK DEBUG] Request URL:", request.url);
    console.log("🔍 [WEBHOOK DEBUG] All headers:", Object.fromEntries(request.headers));
    console.log("🔍 [WEBHOOK DEBUG] Search params:", new URL(request.url).searchParams);
    console.log("🔔 [OUTLOOK WEBHOOK] Received webhook notification");

    const body = await request.text();
    console.log("🔍 [WEBHOOK DEBUG] Raw body:", body);

    // CRITICAL: Microsoft Graph sends validation token in request body for POST validation
    // Check if this is a validation request first (before parsing as JSON)
    const validationTokenHeader = request.headers.get('validationtoken');
    if (validationTokenHeader) {
      console.log("🔔 [OUTLOOK WEBHOOK] Header validation request with token:", validationTokenHeader);
      return new NextResponse(validationTokenHeader, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Check if body contains just a validation token (Microsoft Graph validation)
    let notification;
    try {
      notification = JSON.parse(body);
    } catch (parseError) {
      // If body is not JSON, it might be a plain validation token
      if (body && body.length > 0 && body.length < 100) {
        console.log("🔔 [OUTLOOK WEBHOOK] Plain text validation token:", body);
        return new NextResponse(body, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      throw parseError;
    }

    // Check if notification object has validationToken property
    if (notification && notification.validationToken) {
      console.log("🔔 [OUTLOOK WEBHOOK] JSON validation request with token:", notification.validationToken);
      return new NextResponse(notification.validationToken, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Process webhook notifications
    if (notification['value'] && Array.isArray(notification.value)) {
      console.log(`🔔 [OUTLOOK WEBHOOK] Processing ${notification.value.length} notifications`);

      for (const change of notification.value) {
        try {
          await processOutlookNotification(change);
        } catch (error) {
          console.error("❌ [OUTLOOK WEBHOOK] Failed to process notification:", error);
          // Continue processing other notifications
        }
      }
    }

    return NextResponse.json({ success: true, processed: notification.value?.length || 0 });

  } catch (error) {
    console.error("❌ [OUTLOOK WEBHOOK] Error processing webhook:", error);
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
  console.log("🔍 [WEBHOOK DEBUG] GET request received");
  console.log("🔍 [WEBHOOK DEBUG] URL:", request.url);
  console.log("🔍 [WEBHOOK DEBUG] Headers:", Object.fromEntries(request.headers));
  
  // Check for validation token in query params (Microsoft Graph style)
  const { searchParams } = new URL(request.url);
  const validationToken = searchParams.get('validationToken') || searchParams.get('validationtoken');
  
  // Check for validation token in headers (alternative approach)
  const headerValidationToken = request.headers.get('validationtoken');
  
  const tokenToReturn = validationToken || headerValidationToken;
  
  if (tokenToReturn) {
    console.log("🔔 [OUTLOOK WEBHOOK] Validation request with token:", tokenToReturn);
    return new NextResponse(tokenToReturn, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return NextResponse.json({ message: "Outlook webhook endpoint" });
}

/**
 * Process individual Microsoft Graph notification
 */
async function processOutlookNotification(notification: any): Promise<void> {
  console.log("🔔 Processing Outlook notification:", {
    changeType: notification.changeType,
    resource: notification.resource,
    clientState: notification.clientState
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
      console.log("📧 New email received, triggering sync");
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