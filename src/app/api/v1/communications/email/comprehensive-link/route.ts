import { NextRequest, NextResponse } from 'next/server';
import { UnifiedEmailSyncService } from '@/platform/services/UnifiedEmailSyncService';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

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

    const { emailIds } = await request.json();

    if (!emailIds || !Array.isArray(emailIds)) {
      return createErrorResponse('Email IDs array is required', 'VALIDATION_ERROR', 400);
    }

    // Use the new unified service for email linking
    const result = await UnifiedEmailSyncService.syncWorkspaceEmails(
      context.workspaceId,
      context.userId
    );

    return createSuccessResponse(result, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('❌ Error in comprehensive email linking:', error);
    return createErrorResponse(
      'Failed to link emails',
      'EMAIL_LINKING_ERROR',
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

    // Use secure context instead of query parameters
    const workspaceId = context.workspaceId;

    // Get email statistics using the new unified service
    const stats = await UnifiedEmailSyncService.getEmailStats(workspaceId);

    return createSuccessResponse(stats, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('❌ Error getting email linking statistics:', error);
    return createErrorResponse(
      'Failed to get email linking statistics',
      'EMAIL_LINKING_STATS_ERROR',
      500
    );
  }
}
