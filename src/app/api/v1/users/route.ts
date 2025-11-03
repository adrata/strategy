import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { createRossDM } from '@/lib/oasis-dm-utils';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

const prisma = new PrismaClient();

/**
 * Users CRUD API v1
 * GET /api/v1/users - List users with search and pagination
 * POST /api/v1/users - Create a new user
 */

// GET /api/v1/users - List users with search and pagination
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user using unified auth system
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
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const countsOnly = searchParams.get('counts') === 'true';
    
    const offset = (page - 1) * limit;

    // Enhanced where clause
    const where: any = {
      isActive: true, // Only show active users
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filtering through workspace_users
    if (role) {
      where.workspace_users = {
        some: {
          role: role,
          workspaceId: context.workspaceId,
          isActive: true
        }
      };
    }

    // 🚀 PERFORMANCE: If counts only, just return counts by role
    if (countsOnly) {
      const roleCounts = await prisma.workspace_users.groupBy({
        by: ['role'],
        where: {
          workspaceId: context.workspaceId,
          isActive: true
        },
        _count: { id: true }
      });

      const counts = roleCounts.reduce((acc, role) => {
        acc[role.role] = role._count.id;
        return acc;
      }, {} as Record<string, number>);

      return createSuccessResponse(counts, {
        type: 'counts',
        filters: { search, role },
        userId: context.userId,
        workspaceId: context.workspaceId,
      });
    }

    // Get users
    const [users, totalCount] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          firstName: true,
          lastName: true,
          timezone: true,
          isActive: true,
          activeWorkspaceId: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          workspace_users: {
            where: {
              workspaceId: context.workspaceId,
              isActive: true
            },
            select: {
              role: true,
              joinedAt: true
            }
          }
        },
      }),
      prisma.users.count({ where }),
    ]);

    return createSuccessResponse(users, {
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: { search, role, sortBy, sortOrder },
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    console.error('❌ [V1 USERS API] Error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// POST /api/v1/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user using unified auth system
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
    if (!body.email || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Create user
    const user = await prisma.users.create({
      data: {
        email: body.email,
        username: body.username,
        name: body.name,
        firstName: body.firstName,
        lastName: body.lastName,
        timezone: body.timezone,
        isActive: true,
        activeWorkspaceId: context.workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        firstName: true,
        lastName: true,
        timezone: true,
        isActive: true,
        activeWorkspaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Add user to workspace with default role
    await prisma.workspace_users.create({
      data: {
        workspaceId: context.workspaceId,
        userId: user.id,
        role: body.role || 'VIEWER',
        isActive: true,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // Create DM with Ross for new user
    try {
      const dmResult = await createRossDM(context.workspaceId, user.id);
      if (dmResult.success) {
        console.log(`✅ [USER CREATION] Created DM with Ross for user ${user.name} (${user.id})`);
      } else {
        console.warn(`⚠️ [USER CREATION] Failed to create DM with Ross for user ${user.name}: ${dmResult.error}`);
      }
    } catch (error) {
      console.error(`❌ [USER CREATION] Error creating DM with Ross for user ${user.name}:`, error);
      // Don't fail user creation if DM creation fails
    }

    return createSuccessResponse(user, {
      message: 'User created successfully',
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}