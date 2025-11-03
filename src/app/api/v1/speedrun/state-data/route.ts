/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * Speedrun State Data API
 * 
 * GET /api/v1/speedrun/state-data - Get state ranking data for workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';
import { StateRankingService } from '@/products/speedrun/state-ranking';

export async function GET(request: NextRequest) {
  let context: SecureApiContext | null = null;
  
  try {
    // Authenticate and authorize user
    const { context: authContext, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    context = authContext;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Get state ranking data
    const stateRankingService = new StateRankingService(context.workspaceId, context.userId);
    const result = await stateRankingService.getStatesFromWorkspace();

    return createSuccessResponse(result, {
      message: 'State ranking data retrieved successfully',
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 SPEEDRUN STATE DATA API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to fetch state ranking data',
      'STATE_DATA_FETCH_ERROR',
      500
    );
  }
}
