import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getV1AuthUser } from '../auth';

const prisma = new PrismaClient();

/**
 * Actions CRUD API v1
 * GET /api/v1/actions - List actions with search and pagination
 * POST /api/v1/actions - Create a new action
 */

// GET /api/v1/actions - List actions with search and pagination
export async function GET(request: NextRequest) {
  try {
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
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
    
    const offset = (page - 1) * limit;

    // Enhanced where clause for action management
    const where: any = {};
    
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

    // Get actions
    const [actions, totalCount] = await Promise.all([
      prisma.actions.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
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

    return NextResponse.json({
      success: true,
      data: actions,
      meta: {
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        filters: { search, status, priority, type, companyId, personId, sortBy, sortOrder },
      },
    });

  } catch (error) {
    console.error('Error fetching actions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}

// POST /api/v1/actions - Create a new action
export async function POST(request: NextRequest) {
  try {
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
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
        workspaceId: authUser.workspaceId || 'default-workspace',
        userId: authUser.id,
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

    return NextResponse.json({
      success: true,
      data: action,
      meta: {
        message: 'Action created successfully',
      },
    });

  } catch (error) {
    console.error('Error creating action:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to create action' },
      { status: 500 }
    );
  }
}
