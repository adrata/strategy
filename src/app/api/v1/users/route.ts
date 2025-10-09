import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withSecurity, SecureApiContext } from '../middleware';
import { getV1AuthUser } from '../auth';

const prisma = new PrismaClient();

/**
 * Users CRUD API v1
 * GET /api/v1/users - List users with search and pagination
 * POST /api/v1/users - Create a new user
 */

// GET /api/v1/users - List users with search and pagination
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
            workspaceId: authUser.workspaceId,
            isActive: true
          }
        };
      }

      // 🚀 PERFORMANCE: If counts only, just return counts by role
      if (countsOnly) {
        const roleCounts = await prisma.workspace_users.groupBy({
          by: ['role'],
          where: {
            workspaceId: authUser.workspaceId,
            isActive: true
          },
          _count: { id: true }
        });

        const counts = roleCounts.reduce((acc, role) => {
          acc[role.role] = role._count.id;
          return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
          success: true,
          data: counts,
          meta: {
            type: 'counts',
            filters: { search, role }
          }
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
                workspaceId: authUser.workspaceId,
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

      return NextResponse.json({
        success: true,
        data: users,
        meta: {
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
          filters: { search, role, sortBy, sortOrder },
        },
      });

  } catch (error) {
    console.error('❌ [V1 USERS API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/users - Create a new user
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
        activeWorkspaceId: authUser.workspaceId,
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
        workspaceId: authUser.workspaceId,
        userId: user.id,
        role: body.role || 'VIEWER',
        isActive: true,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      data: user,
      meta: {
        message: 'User created successfully',
      },
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