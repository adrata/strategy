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
      subject,
      description,
      type,
      priority = 'normal',
      status = 'planned',
      scheduledDate,
      contactId,
      opportunityId,
      leadId,
      accountId
    } = body;

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    // Validate required fields
    if (!subject) {
      return createErrorResponse('Missing required field: subject', 'VALIDATION_ERROR', 400);
    }

    // Create the activity
    const activity = await prisma.actions.create({
      data: {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workspaceId,
        userId,
        subject,
        description: description || null,
        type: type || 'Task',
        priority,
        status,
        scheduledAt: scheduledDate ? new Date(scheduledDate) : null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        contactId: contactId || null,
        opportunityId: opportunityId || null,
        leadId: leadId || null,
        accountId: accountId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ [ACTIVITIES API] Created activity:', {
      id: activity.id,
      subject: activity.subject,
      type: activity.type,
      workspaceId: activity.workspaceId,
      userId: context.userId
    });

    return createSuccessResponse({
      activity,
      message: 'Activity created successfully'
    }, {
      userId: context.userId,
      workspaceId: context.workspaceId
    });

  } catch (error) {
    console.error('❌ [ACTIVITIES API] Error creating activity:', error);
    return createErrorResponse(
      'Failed to create activity',
      'CREATE_ACTIVITY_ERROR',
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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    // Build where clause
    const where: any = {
      workspaceId
    };

    if (userId) {
      where['userId'] = userId;
    }

    if (type) {
      where['type'] = type;
    }

    if (status) {
      where['status'] = status;
    }

    // Get activities with pagination
    const activities = await prisma.actions.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        subject: true,
        description: true,
        type: true,
        priority: true,
        status: true,
        scheduledAt: true,
        scheduledDate: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        contactId: true,
        opportunityId: true,
        leadId: true,
        accountId: true,
        userId: true
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.actions.count({ where });

    console.log('✅ [ACTIVITIES API] Retrieved activities:', {
      count: activities.length,
      totalCount,
      workspaceId,
      userId: context.userId
    });

    return createSuccessResponse({
      activities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('❌ [ACTIVITIES API] Error retrieving activities:', error);
    return createErrorResponse(
      'Failed to retrieve activities',
      'RETRIEVE_ACTIVITIES_ERROR',
      500
    );
  }
}
