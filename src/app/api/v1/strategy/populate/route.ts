import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext } from '@/platform/services/security-service';
import { createErrorResponse } from '@/platform/services/error-service';
import { autoStrategyPopulationService } from '@/platform/services/auto-strategy-population-service';

/**
 * Auto Strategy Population API
 * POST /api/v1/strategy/populate - Populate strategy data for all companies
 */

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context, response } = authResult;
    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    console.log(`🔄 [STRATEGY POPULATE API] Starting strategy population for workspace ${context.workspaceId}`);

    // Populate strategies for all companies in the workspace
    const result = await autoStrategyPopulationService.populateStrategiesForAllCompanies(context.workspaceId);

    console.log(`✅ [STRATEGY POPULATE API] Completed strategy population:`, result);

    return NextResponse.json({
      success: result.success,
      data: result,
      meta: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [STRATEGY POPULATE API] Error:', error);
    return createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
}
