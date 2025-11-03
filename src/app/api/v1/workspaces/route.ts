import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

const prisma = new PrismaClient();

/**
 * Workspaces CRUD API v1
 * GET /api/v1/workspaces - List workspaces for current user
 * POST /api/v1/workspaces - Create a new workspace
 */

// GET /api/v1/workspaces - List workspaces for current user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user using unified auth system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: false // Don't require workspace access for listing workspaces
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    // Get workspaces where user is a member
    const where: any = {
      workspace_users: {
        some: {
          userId: context.userId,
          isActive: true
        }
      },
      isActive: true
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get workspaces with user count
    const [workspaces, totalCount] = await Promise.all([
      prisma.workspaces.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          workspace_users: {
            where: { isActive: true },
            select: {
              userId: true,
              role: true,
              joinedAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.workspaces.count({ where })
    ]);

    // Transform workspaces to include user count and current user's role
    const transformedWorkspaces = workspaces.map(workspace => {
      const userMembership = workspace.workspace_users.find(wu => wu.userId === context.userId);
      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        timezone: workspace.timezone,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        isActive: workspace.isActive,
        userCount: workspace.workspace_users.length,
        currentUserRole: userMembership?.role || null,
        joinedAt: userMembership?.joinedAt || null
      };
    });

    return createSuccessResponse(transformedWorkspaces, {
      message: 'Workspaces retrieved successfully',
      userId: context.userId,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return createErrorResponse(
      'Failed to fetch workspaces',
      'GET_WORKSPACES_ERROR',
      500
    );
  }
}

// POST /api/v1/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    // Authenticate user using unified auth system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: false // Don't require workspace access for creating workspaces
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();

    // Basic validation
    if (!body.name || !body.slug) {
      return createErrorResponse(
        'Name and slug are required',
        'VALIDATION_ERROR',
        400
      );
    }

    // Check if slug already exists
    const existingWorkspace = await prisma.workspaces.findUnique({
      where: { slug: body.slug }
    });

    if (existingWorkspace) {
      return createErrorResponse(
        'Workspace slug already exists',
        'SLUG_EXISTS',
        409
      );
    }

    // Create workspace
    const workspace = await prisma.workspaces.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || `${body.name} workspace`,
        timezone: body.timezone || 'UTC',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
    });

    // Add current user to workspace as admin
    await prisma.workspace_users.create({
      data: {
        workspaceId: workspace.id,
        userId: context.userId,
        role: 'ADMIN', // Creator becomes admin
        isActive: true,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    return createSuccessResponse(workspace, {
      message: 'Workspace created successfully',
      userId: context.userId,
      workspaceId: workspace.id,
    });

  } catch (error) {
    console.error('Error creating workspace:', error);
    return createErrorResponse(
      'Failed to create workspace',
      'CREATE_WORKSPACE_ERROR',
      500
    );
  }
}
