import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      subject,
      description,
      type,
      priority = 'normal',
      status = 'planned',
      scheduledDate,
      workspaceId,
      userId,
      contactId,
      opportunityId,
      leadId,
      accountId
    } = body;

    // Validate required fields
    if (!subject || !workspaceId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: subject, workspaceId, userId'
      }, { status: 400 });
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
      workspaceId: activity.workspaceId
    });

    return NextResponse.json({
      success: true,
      activity,
      message: 'Activity created successfully'
    });

  } catch (error) {
    console.error('❌ [ACTIVITIES API] Error creating activity:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    if (!workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'Missing workspaceId'
      }, { status: 400 });
    }

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
      workspaceId
    });

    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ACTIVITIES API] Error retrieving activities:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve activities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
