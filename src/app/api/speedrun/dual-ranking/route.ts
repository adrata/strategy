import { NextRequest, NextResponse } from 'next/server';

import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

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
    const vertical = searchParams.get("vertical");

    console.log(`🔍 [SPEEDRUN DUAL RANKING] Fetching dual ranking for workspace: ${workspaceId}, vertical: ${vertical || 'all'}`);

    // Return empty dual ranking structure for now to prevent 404 errors
    const dualRanking = {
      optimalRank: [],
      verticalRanks: {
        'C Stores': [],
        'Grocery Stores': [],
        'Corporate Retailers': [],
        'Other': []
      },
      summary: {
        totalCompanies: 0,
        totalProspects: 0,
        verticalDistribution: {}
      }
    };

    return createSuccessResponse(dualRanking, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role,
      vertical: vertical || 'all'
    });

  } catch (error) {
    console.error('❌ Error fetching Speedrun dual ranking:', error);
    return createErrorResponse(
      'Failed to fetch Speedrun dual ranking',
      'SPEEDRUN_DUAL_RANKING_ERROR',
      500
    );
  }
}
