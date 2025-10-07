import { NextRequest, NextResponse } from 'next/server';
import { RankingSystem } from '@/platform/services/ranking-system';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

export const runtime = 'nodejs';

/**
 * 🏆 UNIFIED RANKING API
 * 
 * Returns the unified ranking of ALL contacts (1-N) and filtered views
 * Uses the new event-driven ranking system
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
    const view = searchParams.get("view") as 'speedrun' | 'leads' | 'prospects' | 'opportunities' | 'companies' | 'all';
    const entityType = searchParams.get("entityType") || 'people';
    const limit = parseInt(searchParams.get("limit") || '100');

    console.log(`🏆 [UNIFIED RANKING API] Generating ranking for workspace: ${workspaceId}, view: ${view || 'all'}, entityType: ${entityType}`);

    // Get unified ranking system
    const rankingSystem = RankingSystem.getInstance();
    
    // Get system rankings
    const systemRankings = await rankingSystem.getSystemRankings(workspaceId, entityType, limit);
    
    // Transform to expected format
    const masterRanking = systemRankings.map((ranking, index) => ({
      id: ranking.entityId,
      rank: ranking.rank,
      score: ranking.score,
      entityType: ranking.entityType,
      factors: ranking.factors,
      lastUpdated: ranking.lastUpdated,
      // Add additional fields for compatibility
      nextActionTiming: 'optimal', // Default timing
      priority: ranking.score > 80 ? 'high' : ranking.score > 50 ? 'medium' : 'low'
    }));
    
    // Get filtered view if requested
    const filteredData = view && view !== 'all' 
      ? masterRanking.filter(item => {
          switch (view) {
            case 'speedrun': return item.entityType === 'people';
            case 'leads': return item.entityType === 'leads';
            case 'prospects': return item.entityType === 'prospects';
            case 'opportunities': return item.entityType === 'opportunities';
            case 'companies': return item.entityType === 'companies';
            default: return true;
          }
        })
      : masterRanking;
    
    // Calculate timing distribution for insights
    const timingDistribution = masterRanking.reduce((acc, contact) => {
      const timing = contact.nextActionTiming;
      acc[timing] = (acc[timing] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const data = {
      rankings: filteredData,
      totalCount: masterRanking.length,
      filteredCount: filteredData.length,
      timingDistribution,
      lastUpdated: new Date().toISOString()
    };

    const meta = {
      view: view || 'all',
      entityType,
      limit,
      hasMore: masterRanking.length >= limit
    };

    return createSuccessResponse(data, {
      ...meta,
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('❌ [UNIFIED RANKING API] Error:', error);
    return createErrorResponse(
      'Failed to generate unified ranking',
      'UNIFIED_RANKING_ERROR',
      500
    );
  }
}