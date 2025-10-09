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

    // Create the action log - use the correct model name and field mappings
    const actionLog = await prisma.actions.create({
      data: {
        personId: personId.toString(),
        type: actionType,
        subject: `${actionType} - ${personName || 'Unknown'}`,
        description: notes,
        outcome: nextAction || null,
        scheduledAt: nextActionDate ? new Date(nextActionDate) : null,
        completedAt: new Date(),
        status: 'completed',
        workspaceId,
        userId,
        assignedUserId: actionPerformedBy || userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ [SPEEDRUN ACTION LOG] Created action log:', {
      id: actionLog.id,
      personId: actionLog.personId,
      type: actionLog.type,
      workspaceId: actionLog.workspaceId,
      userId: actionLog.userId
    });

    return createSuccessResponse({
      success: true,
      data: {
        id: actionLog.id,
        personId: actionLog.personId,
        personName: personName || 'Unknown',
        actionType: actionLog.type,
        notes: actionLog.description,
        nextAction: actionLog.outcome,
        nextActionDate: actionLog.scheduledAt,
        actionPerformedBy: actionLog.assignedUserId,
        timestamp: actionLog.completedAt
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
    const actionLogs = await prisma.actions.findMany({
      where,
      orderBy: {
        completedAt: 'desc'
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

export async function DELETE(request: NextRequest) {
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
    const { actionId, personId } = body;

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    // Validate required fields
    if (!actionId) {
      return createErrorResponse('Missing required field: actionId', 'VALIDATION_ERROR', 400);
    }

    // Delete the action log
    const deletedAction = await prisma.actions.delete({
      where: {
        id: actionId,
        workspaceId: workspaceId, // Ensure user can only delete their own workspace actions
        userId: userId // Ensure user can only delete their own actions
      }
    });

    console.log('✅ [SPEEDRUN ACTION LOG] Deleted action log:', {
      id: deletedAction.id,
      personId: deletedAction.personId,
      type: deletedAction.type,
      workspaceId: deletedAction.workspaceId,
      userId: deletedAction.userId
    });

    return createSuccessResponse({
      success: true,
      data: {
        id: deletedAction.id,
        personId: deletedAction.personId,
        actionType: deletedAction.type,
        deleted: true
      }
    });

  } catch (error) {
    console.error('❌ [SPEEDRUN ACTION LOG] Failed to delete action log:', error);
    
    return createErrorResponse(
      'Failed to delete action log',
      'ACTION_LOG_DELETE_ERROR',
      500
    );
  }
}
