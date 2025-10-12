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

    console.log(`🔍 [METRICS PIPELINE] Fetching metrics for workspace: ${workspaceId}, userId: ${userId}`);

    // Return empty metrics for now to prevent 404 errors
    const metrics = {
      totalOpportunities: 0,
      openOpportunities: 0,
      closedWon: 0,
      closedLost: 0,
      totalValue: 0,
      openValue: 0,
      winRate: 0,
      averageDealSize: 0,
      salesCycle: 0
    };

    return createSuccessResponse(metrics, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('❌ Error fetching pipeline metrics:', error);
    return createErrorResponse(
      'Failed to fetch pipeline metrics',
      'METRICS_FETCH_ERROR',
      500
    );
  }
}
