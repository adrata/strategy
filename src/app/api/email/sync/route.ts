import { NextRequest, NextResponse } from "next/server";
import { EmailPlatformIntegrator } from "@/platform/services/email-platform-integrator";


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

    if (!accountId) {
      return createErrorResponse('Account ID is required', 'VALIDATION_ERROR', 400);
    }

    console.log(`📧 [EMAIL SYNC API] Manual sync requested for account: ${accountId}`);

    let syncResults = [];

    if (accountId) {
      // Get account details to determine platform if not provided
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const account = await prisma.email_accounts.findUnique({
        where: { id: accountId },
        select: { platform: true, email: true }
      });
      
      if (!account) {
        return createErrorResponse('$1', '$2', $3);
      }
      
      const accountPlatform = platform || account.platform;
      console.log(`📧 [EMAIL SYNC API] Syncing ${account.email} (${accountPlatform})`);
      
      // Sync specific account
      if (accountPlatform === 'outlook') {
        const result = await EmailPlatformIntegrator.syncOutlookEmails(accountId);
        syncResults.push({ accountId, platform: accountPlatform, result });
      } else {
        return NextResponse.json(
          { success: false, error: `Platform ${accountPlatform} not supported` },
          { status: 400 }
        );
      }
      
      await prisma.$disconnect();
    } else if (workspaceId) {
      // Sync all accounts in workspace
      // TODO: Get all accounts for workspace and sync each
      console.log(`📧 Workspace sync not yet implemented for: ${workspaceId}`);
      return createErrorResponse('$1', '$2', $3);
    }

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

    // Get sync status
    const status = {
      isSyncing: false,
      lastSync: new Date().toISOString(),
      totalAccounts: 0,
      syncedAccounts: 0,
      failedAccounts: 0
    };

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