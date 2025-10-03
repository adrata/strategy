import { NextRequest, NextResponse } from 'next/server';
import { ComprehensiveEmailLinkingService } from '@/platform/services/ComprehensiveEmailLinkingService';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
const emailLinkingService = ComprehensiveEmailLinkingService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const { emailIds, workspaceId } = await request.json();

    if (!emailIds || !Array.isArray(emailIds)) {
      return createErrorResponse('$1', '$2', $3);
    }

    // Authentication is handled by middleware and secure-api-helper catch (error) {
    console.error('❌ Error in comprehensive email linking:', error);
    return NextResponse.json(
      { error: 'Failed to link emails', details: error.message },
      { status: 500 }
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

    // Get email linking statistics
    const stats = await getEmailLinkingStats(workspaceId);

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
