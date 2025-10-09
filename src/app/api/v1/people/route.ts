import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getV1AuthUser } from '../auth';

const prisma = new PrismaClient();

/**
 * People CRUD API v1
 * GET /api/v1/people - List people with search and pagination
 * POST /api/v1/people - Create a new person
 */

// GET /api/v1/people - List people with search and pagination
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
    const companyId = searchParams.get('companyId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const countsOnly = searchParams.get('counts') === 'true';
    
    const offset = (page - 1) * limit;

    // Enhanced where clause for pipeline management
    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { workEmail: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pipeline status filtering (PROSPECT, ACTIVE, INACTIVE)
    if (status) {
      where.status = status;
    }

    // Priority filtering (LOW, MEDIUM, HIGH)
    if (priority) {
      where.priority = priority;
    }

    // Company filtering
    if (companyId) {
      where.companyId = companyId;
    }

    // 🚀 PERFORMANCE: If counts only, just return counts by status
    if (countsOnly) {
      const statusCounts = await prisma.people.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      });

      const counts = statusCounts.reduce((acc, stat) => {
        acc[stat.status || 'ACTIVE'] = stat._count.id;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        success: true,
        data: counts,
        meta: {
          type: 'counts',
          filters: { search, status, priority, companyId }
        }
      });
    }

    // Get people
    const [people, totalCount] = await Promise.all([
      prisma.people.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              website: true,
              industry: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              actions: true,
            },
          },
        },
      }),
      prisma.people.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: people,
      meta: {
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        filters: { search, status, priority, companyId, sortBy, sortOrder },
      },
    });

  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch people' },
      { status: 500 }
    );
  }
}

// POST /api/v1/people - Create a new person
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
    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Create full name
    const fullName = `${body.firstName} ${body.lastName}`;

    // Create person
    const person = await prisma.people.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        fullName: fullName,
        displayName: body.displayName,
        salutation: body.salutation,
        suffix: body.suffix,
        jobTitle: body.jobTitle,
        department: body.department,
        seniority: body.seniority,
        email: body.email,
        workEmail: body.workEmail,
        personalEmail: body.personalEmail,
        phone: body.phone,
        mobilePhone: body.mobilePhone,
        workPhone: body.workPhone,
        linkedinUrl: body.linkedinUrl,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        postalCode: body.postalCode,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender,
        bio: body.bio,
        profilePictureUrl: body.profilePictureUrl,
        status: body.status || 'ACTIVE',
        priority: body.priority || 'MEDIUM',
        source: body.source,
        tags: body.tags || [],
        customFields: body.customFields,
        notes: body.notes,
        preferredLanguage: body.preferredLanguage,
        timezone: body.timezone,
        emailVerified: body.emailVerified || false,
        phoneVerified: body.phoneVerified || false,
        lastAction: body.lastAction,
        lastActionDate: body.lastActionDate ? new Date(body.lastActionDate) : null,
        nextAction: body.nextAction,
        nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
        actionStatus: body.actionStatus,
        engagementScore: body.engagementScore || 0,
        globalRank: body.globalRank || 0,
        companyRank: body.companyRank || 0,
        workspaceId: authUser.workspaceId || 'local-workspace',
        companyId: body.companyId,
        assignedUserId: body.assignedUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: person,
      meta: {
        message: 'Person created successfully',
      },
    });

  } catch (error) {
    console.error('Error creating person:', error);
    
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Person with this information already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create person' },
      { status: 500 }
    );
  }
}