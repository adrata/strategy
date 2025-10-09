import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
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

    // Enhanced where clause for user management
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filtering (for sellers count)
    if (role) {
      where.role = role;
    }

    // 🚀 PERFORMANCE: If counts only, just return counts by role
    if (countsOnly) {
      const roleCounts = await prisma.user_roles.groupBy({
        by: ['roleId'],
        where: {
          workspaceId: authUser.workspaceId || 'local-workspace',
          isActive: true
        },
        _count: { id: true }
      });

      // Get role names for the counts
      const roleIds = roleCounts.map(rc => rc.roleId);
      const roles = await prisma.roles.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, name: true }
      });

      const counts = roleCounts.reduce((acc, stat) => {
        const role = roles.find(r => r.id === stat.roleId);
        if (role) {
          acc[role.name] = stat._count.id;
        }
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
        include: {
          user_roles: {
            where: { isActive: true },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
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
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
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
        name: body.name,
        firstName: body.firstName,
        lastName: body.lastName,
        password: body.password, // Should be hashed in production
        timezone: body.timezone,
        activeWorkspaceId: authUser.workspaceId || 'local-workspace',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user_roles: {
          where: { isActive: true },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      },
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
