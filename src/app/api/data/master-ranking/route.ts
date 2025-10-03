import { NextRequest, NextResponse } from 'next/server';
import { MasterRankingEngine } from '@/platform/services/master-ranking-engine';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
export const runtime = 'nodejs';

/**
 * 🏆 MASTER RANKING API
 * 
 * Returns the master ranking of ALL contacts (1-N) and filtered views
 */

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
    const view = searchParams.get("view") as 'speedrun' | 'leads' | 'prospects' | 'opportunities' | 'all';

    console.log(`🏆 [MASTER RANKING API] Generating ranking for workspace: ${workspaceId}, view: ${view || 'all'}`);

    // Generate master ranking
    const masterRanking = await MasterRankingEngine.generateMasterRanking(workspaceId, userId);
    
    // Get filtered view if requested
    const filteredData = view && view !== 'all' 
      ? MasterRankingEngine.getFilteredView(masterRanking, view)
      : masterRanking;
    
    // Calculate timing distribution for insights
    const timingDistribution = masterRanking.reduce((acc, contact) => {
      const timing = contact.nextActionTiming;
      acc[timing] = (acc[timing] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return createSuccessResponse(data, {
      ...meta,
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('❌ [MASTER RANKING API] Error:', error);
    return createErrorResponse(
      'Failed to generate master ranking',
      'MASTER_RANKING_ERROR',
      500
    );
  }
}
