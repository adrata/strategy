import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';

export async function GET(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return createErrorResponse('Workspace ID is required', 'WORKSPACE_ID_REQUIRED', 400);
    }

    // Get workspace with speedrun settings
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        speedrunDailyTarget: true,
        speedrunWeeklyTarget: true,
      },
    });

    if (!workspace) {
      return createErrorResponse('Workspace not found', 'WORKSPACE_NOT_FOUND', 404);
    }

    // Return settings with defaults if not set
    const settings = {
      dailyTarget: workspace.speedrunDailyTarget ?? 50,
      weeklyTarget: workspace.speedrunWeeklyTarget ?? 250,
    };

    return createSuccessResponse(settings);
  } catch (error) {
    console.error('Error fetching speedrun settings:', error);
    return createErrorResponse(
      'Failed to fetch speedrun settings',
      'FETCH_ERROR',
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const { workspaceId, dailyTarget, weeklyTarget } = body;

    if (!workspaceId) {
      return createErrorResponse('Workspace ID is required', 'WORKSPACE_ID_REQUIRED', 400);
    }

    if (typeof dailyTarget !== 'number' || typeof weeklyTarget !== 'number') {
      return createErrorResponse(
        'Daily and weekly targets must be numbers',
        'INVALID_TARGET_TYPE',
        400
      );
    }

    if (dailyTarget < 1 || dailyTarget > 1000 || weeklyTarget < 1 || weeklyTarget > 5000) {
      return createErrorResponse(
        'Targets must be between 1-1000 (daily) and 1-5000 (weekly)',
        'INVALID_TARGET_RANGE',
        400
      );
    }

    // Update workspace settings
    const updatedWorkspace = await prisma.workspaces.update({
      where: { id: workspaceId },
      data: {
        speedrunDailyTarget: dailyTarget,
        speedrunWeeklyTarget: weeklyTarget,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        speedrunDailyTarget: true,
        speedrunWeeklyTarget: true,
      },
    });

    return createSuccessResponse({
      dailyTarget: updatedWorkspace.speedrunDailyTarget,
      weeklyTarget: updatedWorkspace.speedrunWeeklyTarget,
    });
  } catch (error) {
    console.error('Error updating speedrun settings:', error);
    return createErrorResponse(
      'Failed to update speedrun settings',
      'UPDATE_ERROR',
      500
    );
  }
}
