import { NextRequest, NextResponse } from "next/server";
import { emailLinkingService } from "@/platform/services/EmailLinkingService";


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10 minutes timeout for large linking operations

/**
 * Email Linking API
 * 
 * POST: Link emails to contacts, leads, accounts, and prospects
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

    const { dateRange, linkAll } = await request.json();

    console.log(`🔗 [EMAIL LINKING API] Starting email linking for workspace: ${workspaceId}, user: ${userId}`);

    // Execute email linking
    const result = await emailLinkingService.linkEmails({
      workspaceId,
      userId,
      dateRange,
      linkAll
    });

    console.log(`✅ [EMAIL LINKING API] Email linking completed:`, result);

    return createSuccessResponse(result, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error("❌ [EMAIL LINKING API] Linking failed:", error);
    return createErrorResponse(
      "Email linking failed",
      "EMAIL_LINKING_ERROR",
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

    console.log(`🔗 [EMAIL LINKING API] Getting linking status for workspace: ${workspaceId}, user: ${userId}`);

    // Get linking status
    const status = await emailLinkingService.getLinkingStatus({
      workspaceId,
      userId
    });

    console.log(`✅ [EMAIL LINKING API] Linking status retrieved:`, status);

    return createSuccessResponse(status, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error("❌ [EMAIL LINKING API] Failed to get linking status:", error);
    return createErrorResponse(
      "Failed to get linking status",
      "LINKING_STATUS_ERROR",
      500
    );
  }
}
