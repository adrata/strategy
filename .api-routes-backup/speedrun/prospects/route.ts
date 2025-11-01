import { NextRequest, NextResponse } from 'next/server';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    console.log(`🔍 [SPEEDRUN PROSPECTS] Fetching prospects for workspace: ${workspaceId}, limit: ${limit}`);

    // Return empty prospects for now to prevent 404 errors
    const prospects = [];

    return createSuccessResponse(prospects, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role,
      count: prospects.length
    });

  } catch (error) {
    console.error('❌ Error fetching Speedrun prospects:', error);
    return createErrorResponse(
      'Failed to fetch Speedrun prospects',
      'SPEEDRUN_PROSPECTS_ERROR',
      500
    );
  }
}
