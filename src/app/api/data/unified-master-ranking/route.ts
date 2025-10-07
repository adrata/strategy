import { NextRequest, NextResponse } from 'next/server';
import { RankingSystem } from '@/platform/services/ranking-system';

import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
/**
 * 🏆 UNIFIED MASTER RANKING API
 * 
 * Returns the unified master ranking for all sections:
 * - Companies (1-476)
 * - People (1-4760) 
 * - Leads (1-2000)
 * - Prospects (2001-4760)
 * - Speedrun (1-30)
 */

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Get workspace and user from request
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
    
    console.log(`🏆 [UNIFIED MASTER RANKING API] Generating master ranking for workspace: ${workspaceId}, user: ${userId}`);
    
    // Generate unified master ranking using new system
    const rankingSystem = RankingSystem.getInstance();
    const rankings = await rankingSystem.getSystemRankings(workspaceId, 'people', 100);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ [UNIFIED MASTER RANKING API] Generated ranking in ${processingTime}ms`);
    
    return createSuccessResponse(rankings, {
      processingTime: Date.now() - startTime,
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });
    
  } catch (error) {
    console.error('❌ [UNIFIED MASTER RANKING API] Error:', error);
    return createErrorResponse(
      'Failed to generate unified master ranking',
      'UNIFIED_MASTER_RANKING_ERROR',
      500
    );
  }
}
