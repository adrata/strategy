import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  const startTime = Date.now();
  
  try {
    console.log(`🔐 [SPEEDRUN SETTINGS ${requestId}] Starting request`);
    
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    console.log(`🔐 [SPEEDRUN SETTINGS ${requestId}] Auth context:`, {
      hasContext: !!context,
      userId: context?.userId,
      workspaceId: context?.workspaceId,
      userEmail: context?.userEmail,
      role: context?.role,
      permissions: context?.permissions
    });

    if (response) {
      console.log(`❌ [SPEEDRUN SETTINGS ${requestId}] Auth failed, returning response:`, response.status);
      return response;
    }
    
    if (!context) {
      console.log(`❌ [SPEEDRUN SETTINGS ${requestId}] No auth context available`);
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    console.log(`🔍 [SPEEDRUN SETTINGS ${requestId}] Querying workspace:`, workspaceId);

    if (!workspaceId) {
      console.log(`❌ [SPEEDRUN SETTINGS ${requestId}] No workspace ID provided`);
      return createErrorResponse('Workspace ID is required', 'WORKSPACE_ID_REQUIRED', 400);
    }

    // Validate workspace access
    console.log(`🔍 [SPEEDRUN SETTINGS ${requestId}] Validating workspace access for user ${context.userId} to workspace ${workspaceId}`);
    
    // Check if user has access to the requested workspace
    if (context.workspaceId !== workspaceId) {
      console.log(`❌ [SPEEDRUN SETTINGS ${requestId}] User workspace mismatch: user=${context.workspaceId}, requested=${workspaceId}`);
      return createErrorResponse('Access denied to requested workspace', 'WORKSPACE_ACCESS_DENIED', 403);
    }

    console.log(`🔍 [SPEEDRUN SETTINGS ${requestId}] Querying database for workspace settings`);
    
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

    console.log(`🔍 [SPEEDRUN SETTINGS ${requestId}] Database query result:`, {
      found: !!workspace,
      workspaceId: workspace?.id,
      workspaceName: workspace?.name,
      dailyTarget: workspace?.speedrunDailyTarget,
      weeklyTarget: workspace?.speedrunWeeklyTarget
    });

    if (!workspace) {
      console.log(`❌ [SPEEDRUN SETTINGS ${requestId}] Workspace not found in database`);
      return createErrorResponse('Workspace not found', 'WORKSPACE_NOT_FOUND', 404);
    }

    // Return settings with defaults if not set
    const settings = {
      dailyTarget: workspace.speedrunDailyTarget ?? 50,
      weeklyTarget: workspace.speedrunWeeklyTarget ?? 250,
    };

    console.log(`✅ [SPEEDRUN SETTINGS ${requestId}] Success - returning settings:`, settings);
    console.log(`⏱️ [SPEEDRUN SETTINGS ${requestId}] Request completed in ${Date.now() - startTime}ms`);

    return createSuccessResponse(settings);
  } catch (error) {
    console.error(`❌ [SPEEDRUN SETTINGS ${requestId}] Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error,
      requestId,
      duration: Date.now() - startTime
    });
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to fetch speedrun settings';
    let errorCode = 'FETCH_ERROR';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('prisma') || error.message.includes('database')) {
        errorMessage = 'Database connection error';
        errorCode = 'DATABASE_ERROR';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout';
        errorCode = 'TIMEOUT_ERROR';
        statusCode = 408;
      }
    }
    
    return createErrorResponse(errorMessage, errorCode, statusCode);
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  const startTime = Date.now();
  
  try {
    console.log(`🔐 [SPEEDRUN SETTINGS POST ${requestId}] Starting request`);
    
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    console.log(`🔐 [SPEEDRUN SETTINGS POST ${requestId}] Auth context:`, {
      hasContext: !!context,
      userId: context?.userId,
      workspaceId: context?.workspaceId,
      userEmail: context?.userEmail,
      role: context?.role
    });

    if (response) {
      console.log(`❌ [SPEEDRUN SETTINGS POST ${requestId}] Auth failed, returning response:`, response.status);
      return response;
    }
    
    if (!context) {
      console.log(`❌ [SPEEDRUN SETTINGS POST ${requestId}] No auth context available`);
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const { workspaceId, dailyTarget, weeklyTarget } = body;

    console.log(`🔍 [SPEEDRUN SETTINGS POST ${requestId}] Request body:`, {
      workspaceId,
      dailyTarget,
      weeklyTarget
    });

    if (!workspaceId) {
      console.log(`❌ [SPEEDRUN SETTINGS POST ${requestId}] No workspace ID provided`);
      return createErrorResponse('Workspace ID is required', 'WORKSPACE_ID_REQUIRED', 400);
    }

    // Validate workspace access
    if (context.workspaceId !== workspaceId) {
      console.log(`❌ [SPEEDRUN SETTINGS POST ${requestId}] User workspace mismatch: user=${context.workspaceId}, requested=${workspaceId}`);
      return createErrorResponse('Access denied to requested workspace', 'WORKSPACE_ACCESS_DENIED', 403);
    }

    if (typeof dailyTarget !== 'number' || typeof weeklyTarget !== 'number') {
      console.log(`❌ [SPEEDRUN SETTINGS POST ${requestId}] Invalid target types:`, { dailyTarget, weeklyTarget });
      return createErrorResponse(
        'Daily and weekly targets must be numbers',
        'INVALID_TARGET_TYPE',
        400
      );
    }

    if (dailyTarget < 1 || dailyTarget > 1000 || weeklyTarget < 1 || weeklyTarget > 5000) {
      console.log(`❌ [SPEEDRUN SETTINGS POST ${requestId}] Invalid target ranges:`, { dailyTarget, weeklyTarget });
      return createErrorResponse(
        'Targets must be between 1-1000 (daily) and 1-5000 (weekly)',
        'INVALID_TARGET_RANGE',
        400
      );
    }

    console.log(`🔍 [SPEEDRUN SETTINGS POST ${requestId}] Updating workspace settings in database`);

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

    console.log(`✅ [SPEEDRUN SETTINGS POST ${requestId}] Settings updated successfully:`, {
      workspaceId: updatedWorkspace.id,
      dailyTarget: updatedWorkspace.speedrunDailyTarget,
      weeklyTarget: updatedWorkspace.speedrunWeeklyTarget
    });
    console.log(`⏱️ [SPEEDRUN SETTINGS POST ${requestId}] Request completed in ${Date.now() - startTime}ms`);

    return createSuccessResponse({
      dailyTarget: updatedWorkspace.speedrunDailyTarget,
      weeklyTarget: updatedWorkspace.speedrunWeeklyTarget,
    });
  } catch (error) {
    console.error(`❌ [SPEEDRUN SETTINGS POST ${requestId}] Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error,
      requestId,
      duration: Date.now() - startTime
    });
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to update speedrun settings';
    let errorCode = 'UPDATE_ERROR';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('prisma') || error.message.includes('database')) {
        errorMessage = 'Database connection error';
        errorCode = 'DATABASE_ERROR';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout';
        errorCode = 'TIMEOUT_ERROR';
        statusCode = 408;
      }
    }
    
    return createErrorResponse(errorMessage, errorCode, statusCode);
  }
}
