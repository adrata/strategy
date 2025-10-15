/**
 * User Settings API
 * 
 * GET /api/v1/user/settings - Get user settings including speedrun ranking preferences
 * POST /api/v1/user/settings - Update user settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';
import type { StateRankingSettings } from '@/products/speedrun/types/StateRankingTypes';

// GET /api/v1/user/settings - Get user settings
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

    // Get user settings
    const user = await prisma.users.findUnique({
      where: { id: context.userId },
      select: {
        id: true,
        // Note: These fields will be available after schema migration
        // speedrunRankingMode: true,
        // stateRankingOrder: true,
        timezone: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 'USER_NOT_FOUND', 404);
    }

    const settings = {
      userId: user.id,
      workspaceId: context.workspaceId,
      speedrunRankingMode: 'global', // user.speedrunRankingMode || 'global',
      stateRankingOrder: [], // user.stateRankingOrder || [],
      timezone: user.timezone,
      name: user.name,
      email: user.email
    };

    return createSuccessResponse(settings, {
      message: 'User settings retrieved successfully',
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 USER SETTINGS API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to fetch user settings',
      'USER_SETTINGS_FETCH_ERROR',
      500
    );
  }
}

// POST /api/v1/user/settings - Update user settings
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { 
      speedrunRankingMode, 
      stateRankingOrder, 
      timezone 
    } = body;

    // Validate input
    if (speedrunRankingMode && !['global', 'state-based'].includes(speedrunRankingMode)) {
      return createErrorResponse('Invalid ranking mode', 'INVALID_RANKING_MODE', 400);
    }

    if (stateRankingOrder && !Array.isArray(stateRankingOrder)) {
      return createErrorResponse('State ranking order must be an array', 'INVALID_STATE_ORDER', 400);
    }

    // Update user settings
    const updatedUser = await prisma.users.update({
      where: { id: context.userId },
      data: {
        // Note: These fields will be available after schema migration
        // ...(speedrunRankingMode && { speedrunRankingMode }),
        // ...(stateRankingOrder && { stateRankingOrder }),
        ...(timezone && { timezone }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        // speedrunRankingMode: true,
        // stateRankingOrder: true,
        timezone: true,
        name: true,
        email: true
      }
    });

    const settings = {
      userId: updatedUser.id,
      workspaceId: context.workspaceId,
      speedrunRankingMode: 'global', // updatedUser.speedrunRankingMode || 'global',
      stateRankingOrder: [], // updatedUser.stateRankingOrder || [],
      timezone: updatedUser.timezone,
      name: updatedUser.name,
      email: updatedUser.email
    };

    console.log(`✅ [USER_SETTINGS] Updated settings for user: ${context.userId}`, {
      speedrunRankingMode: settings.speedrunRankingMode,
      stateRankingOrderLength: settings.stateRankingOrder.length
    });

    return createSuccessResponse(settings, {
      message: 'User settings updated successfully',
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 USER SETTINGS API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to update user settings',
      'USER_SETTINGS_UPDATE_ERROR',
      500
    );
  }
}
