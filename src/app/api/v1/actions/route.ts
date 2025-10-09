import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/utils/prisma';

/**
 * Actions CRUD API v1
 * GET /api/v1/actions - List actions with search and pagination
 * POST /api/v1/actions - Create a new action
 */

// GET /api/v1/actions - List actions with search and pagination
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const type = searchParams.get('type') || '';
    const companyId = searchParams.get('companyId') || '';
    const personId = searchParams.get('personId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const countsOnly = searchParams.get('counts') === 'true';
    
    const offset = (page - 1) * limit;

    // Enhanced where clause for action management
    const where: any = {
      workspaceId: context.workspaceId, // Filter by user's workspace
      deletedAt: null, // Only show non-deleted records
    };
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { outcome: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filtering (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
    if (status) {
      where.status = status;
    }

    // Priority filtering (LOW, NORMAL, HIGH, URGENT)
    if (priority) {
      where.priority = priority;
    }

    // Type filtering
    if (type) {
      where.type = { contains: type, mode: 'insensitive' };
    }

    // Company filtering
    if (companyId) {
      where.companyId = companyId;
    }

    // Person filtering
    if (personId) {
      where.personId = personId;
    }

    // 🚀 PERFORMANCE: If counts only, just return counts by status
    if (countsOnly) {
      const statusCounts = await prisma.actions.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      });

      const counts = statusCounts.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>);

      return createSuccessResponse(counts, {
        type: 'counts',
        filters: { search, status, priority, type, companyId, personId },
        userId: context.userId,
        workspaceId: context.workspaceId,
      });
    }

    // Get actions
    const [actions, totalCount] = await Promise.all([
      prisma.actions.findMany({
        where,
        orderBy: { 
          [sortBy === 'rank' ? 'createdAt' : sortBy]: sortOrder 
        },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              website: true,
              industry: true,
            },
          },
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              jobTitle: true,
              email: true,
            },
          },
        },
      }),
      prisma.actions.count({ where }),
    ]);

    return createSuccessResponse(actions, {
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: { search, status, priority, type, companyId, personId, sortBy, sortOrder },
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    console.error('Error fetching actions:', error);
    return createErrorResponse('Failed to fetch actions', 'INTERNAL_ERROR', 500);
  }
}

// POST /api/v1/actions - Create a new action
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user
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

    // Basic validation
    if (!body.type || !body.subject) {
      return NextResponse.json(
        { success: false, error: 'Type and subject are required' },
        { status: 400 }
      );
    }

    // Create action
    const action = await prisma.actions.create({
      data: {
        type: body.type,
        subject: body.subject,
        description: body.description,
        outcome: body.outcome,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        status: body.status || 'PLANNED',
        priority: body.priority || 'NORMAL',
        workspaceId: context.workspaceId,
        userId: context.userId,
        companyId: body.companyId,
        personId: body.personId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
          },
        },
      },
    });

    return createSuccessResponse(action, {
      message: 'Action created successfully',
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    console.error('Error creating action:', error);
    
    return createErrorResponse('Failed to create action', 'INTERNAL_ERROR', 500);
  }
}
