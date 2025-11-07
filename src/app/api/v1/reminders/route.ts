import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/v1/reminders
 * Create a new reminder for a person or company
 */
export async function POST(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
    });

    if (!context || response) {
      return response || NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId, workspaceId } = context;
    const body = await request.json();
    const { entityType, entityId, reminderAt, note } = body;

    // Validate required fields
    if (!entityType || !entityId || !reminderAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: entityType, entityId, reminderAt' },
        { status: 400 }
      );
    }

    // Validate entityType
    if (entityType !== 'people' && entityType !== 'companies') {
      return NextResponse.json(
        { success: false, error: 'entityType must be "people" or "companies"' },
        { status: 400 }
      );
    }

    // Validate reminderAt is in the future
    const reminderDate = new Date(reminderAt);
    if (isNaN(reminderDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid reminderAt date' },
        { status: 400 }
      );
    }

    if (reminderDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'reminderAt must be in the future' },
        { status: 400 }
      );
    }

    // Verify the entity exists and belongs to the workspace
    if (entityType === 'people') {
      const person = await prisma.people.findFirst({
        where: {
          id: entityId,
          workspaceId,
          deletedAt: null,
        },
      });

      if (!person) {
        return NextResponse.json(
          { success: false, error: 'Person not found or access denied' },
          { status: 404 }
        );
      }
    } else {
      const company = await prisma.companies.findFirst({
        where: {
          id: entityId,
          workspaceId,
          deletedAt: null,
        },
      });

      if (!company) {
        return NextResponse.json(
          { success: false, error: 'Company not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Create the reminder
    const reminder = await prisma.reminders.create({
      data: {
        workspaceId,
        userId,
        entityType,
        entityId,
        reminderAt: reminderDate,
        note: note || null,
        isCompleted: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error('❌ [REMINDERS API] Error creating reminder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create reminder' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/reminders
 * Get reminders for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
    });

    if (!context || response) {
      return response || NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId, workspaceId } = context;
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType');
    const entityId = url.searchParams.get('entityId');
    const isCompleted = url.searchParams.get('isCompleted');

    // Build where clause
    const where: any = {
      workspaceId,
      userId,
      deletedAt: null,
    };

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (isCompleted !== null) {
      where.isCompleted = isCompleted === 'true';
    }

    const reminders = await prisma.reminders.findMany({
      where,
      orderBy: {
        reminderAt: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error('❌ [REMINDERS API] Error fetching reminders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch reminders' 
      },
      { status: 500 }
    );
  }
}

