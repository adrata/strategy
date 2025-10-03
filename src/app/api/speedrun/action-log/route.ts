import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      personId,
      personName,
      actionType,
      notes,
      nextAction,
      nextActionDate,
      actionPerformedBy
    } = body;

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    // Validate required fields
    if (!personId || !actionType || !notes) {
      return createErrorResponse('Missing required fields: personId, actionType, and notes are required', 'VALIDATION_ERROR', 400);
    }

    // Create the action log
    const actionLog = await prisma.speedrunActionLogs.create({
      data: {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workspaceId,
        userId,
        personId: personId.toString(),
        personName: personName || 'Unknown',
        actionType,
        notes,
        nextAction: nextAction || null,
        nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
        actionPerformedBy: actionPerformedBy || userId,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ [SPEEDRUN ACTION LOG] Created action log:', {
      id: actionLog.id,
      personId: actionLog.personId,
      personName: actionLog.personName,
      actionType: actionLog.actionType,
      workspaceId: actionLog.workspaceId,
      userId: actionLog.userId
    });

    return createSuccessResponse({
      success: true,
      data: {
        id: actionLog.id,
        personId: actionLog.personId,
        personName: actionLog.personName,
        actionType: actionLog.actionType,
        notes: actionLog.notes,
        nextAction: actionLog.nextAction,
        nextActionDate: actionLog.nextActionDate,
        actionPerformedBy: actionLog.actionPerformedBy,
        timestamp: actionLog.timestamp
      }
    });

  } catch (error) {
    console.error('❌ [SPEEDRUN ACTION LOG] Failed to create action log:', error);
    
    return createErrorResponse(
      'Failed to create action log',
      'ACTION_LOG_ERROR',
      500
    );
  }
}

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

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Use authenticated user's workspace and ID
    const userWorkspaceId = context.workspaceId;
    const userId = context.userId;

    // Build where clause
    const where: any = {
      workspaceId: userWorkspaceId
    };

    if (personId) {
      where.personId = personId;
    }

    // Fetch action logs
    const actionLogs = await prisma.speedrunActionLogs.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    console.log(`✅ [SPEEDRUN ACTION LOG] Retrieved ${actionLogs.length} action logs for workspace ${userWorkspaceId}`);

    return createSuccessResponse({
      success: true,
      data: actionLogs
    });

  } catch (error) {
    console.error('❌ [SPEEDRUN ACTION LOG] Failed to fetch action logs:', error);
    
    return createErrorResponse(
      'Failed to fetch action logs',
      'ACTION_LOG_FETCH_ERROR',
      500
    );
  }
}
