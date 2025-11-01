import { NextRequest, NextResponse } from "next/server";
import { UnifiedEmailSyncService } from "@/platform/services/UnifiedEmailSyncService";


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10 minutes timeout for large email sync

/**
 * Email Sync API - Manual and automatic email synchronization
 * 
 * POST: Trigger manual sync for specific account
 * GET: Get sync status for workspace accounts
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    const { accountId, platform } = await request.json();

    console.log(`📧 [EMAIL SYNC API] Manual sync requested for workspace: ${workspaceId}`);

    // Use the new unified service to sync all emails for the workspace
    const syncResults = await UnifiedEmailSyncService.syncWorkspaceEmails(workspaceId, userId);

    console.log(`✅ [EMAIL SYNC API] Sync completed successfully`);

    return createSuccessResponse(syncResults, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error("❌ [EMAIL SYNC API] Sync failed:", error);
    return createErrorResponse(
      "Email sync failed",
      "EMAIL_SYNC_ERROR",
      500
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    console.log(`📧 [EMAIL SYNC API] Getting sync status for workspace: ${workspaceId}, user: ${userId}`);

    // Get sync status using the new unified service
    const status = await UnifiedEmailSyncService.getEmailStats(workspaceId);

    console.log(`✅ [EMAIL SYNC API] Sync status retrieved:`, status);

    return createSuccessResponse(status, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error("❌ [EMAIL SYNC API] Failed to get sync status:", error);
    return createErrorResponse(
      "Failed to get sync status",
      "SYNC_STATUS_ERROR",
      500
    );
  }
}