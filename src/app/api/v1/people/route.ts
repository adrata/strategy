import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

// Response cache for fast performance
const responseCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

// Connection pooling optimization
let connectionCheck: Promise<boolean> | null = null;

/**
 * People CRUD API v1
 * GET /api/v1/people - List people with search and pagination
 * POST /api/v1/people - Create a new person
 */

// GET /api/v1/people - List people with search and pagination
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 1000); // Cap at 1000
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const companyId = searchParams.get('companyId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const countsOnly = searchParams.get('counts') === 'true';
    
    const offset = (page - 1) * limit;
    
    // Check cache first
    const cacheKey = `people-${context.workspaceId}-${status}-${limit}-${countsOnly}-${page}`;
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Enhanced where clause for pipeline management
    const where: any = {
      workspaceId: context.workspaceId, // Filter by user's workspace
      deletedAt: null, // Only show non-deleted records
    };
    
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

    let result;
    
    if (countsOnly) {
      // Fast count query using Prisma ORM
      const counts = await prisma.people.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      });
      
      const countMap = counts.reduce((acc, item) => {
        acc[item.status || 'ACTIVE'] = item._count.status;
        return acc;
      }, {} as Record<string, number>);
      
      result = { success: true, data: countMap };
    } else {
      // Optimized query with Prisma ORM for reliability
      const [people, totalCount] = await Promise.all([
        prisma.people.findMany({
          where,
          orderBy: { 
            [sortBy === 'rank' ? 'globalRank' : sortBy]: sortOrder 
          },
          skip: offset,
          take: limit,
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            globalRank: true,
            lastAction: true,
            nextAction: true,
            lastActionDate: true,
            nextActionDate: true,
            companyId: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }),
        prisma.people.count({ where }),
      ]);

      result = createSuccessResponse(people, {
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        filters: { search, status, priority, companyId, sortBy, sortOrder },
        userId: context.userId,
        workspaceId: context.workspaceId,
      });
    }

    // Cache the result
    responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [V1 PEOPLE API] Error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// POST /api/v1/people - Create a new person
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
        status: body.status || 'LEAD',
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
        workspaceId: context.workspaceId,
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

    return createSuccessResponse(person, {
      message: 'Person created successfully',
      userId: context.userId,
      workspaceId: context.workspaceId,
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
    
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}