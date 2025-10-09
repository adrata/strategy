import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/utils/prisma';

/**
 * Companies CRUD API v1
 * GET /api/v1/companies - List companies with search and pagination
 * POST /api/v1/companies - Create a new company
 */

// GET /api/v1/companies - List companies with search and pagination
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
    const industry = searchParams.get('industry') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const countsOnly = searchParams.get('counts') === 'true';
    
    const offset = (page - 1) * limit;

    // Enhanced where clause for pipeline management
    const where: any = {
      workspaceId: context.workspaceId, // Filter by user's workspace
      deletedAt: null, // Only show non-deleted records
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { tradingName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pipeline status filtering (PROSPECT, CLIENT, ACTIVE, INACTIVE)
    if (status) {
      where.status = status;
    }

    // Priority filtering (LOW, MEDIUM, HIGH)
    if (priority) {
      where.priority = priority;
    }

    // Industry filtering
    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    // 🚀 PERFORMANCE: If counts only, just return counts by status
    if (countsOnly) {
      const statusCounts = await prisma.companies.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      });

      const counts = statusCounts.reduce((acc, stat) => {
        acc[stat.status || 'ACTIVE'] = stat._count.id;
        return acc;
      }, {} as Record<string, number>);

      return createSuccessResponse(counts, {
        type: 'counts',
        filters: { search, status, priority, industry },
        userId: context.userId,
        workspaceId: context.workspaceId,
      });
    }

    // Get companies
    const [companies, totalCount] = await Promise.all([
      prisma.companies.findMany({
        where,
        orderBy: { 
          [sortBy === 'rank' ? 'globalRank' : sortBy]: sortOrder 
        },
        skip: offset,
        take: limit,
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              people: true,
              actions: true,
            },
          },
        },
      }),
      prisma.companies.count({ where }),
    ]);

    return createSuccessResponse(companies, {
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: { search, status, priority, industry, sortBy, sortOrder },
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    console.error('❌ [V1 COMPANIES API] Error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// POST /api/v1/companies - Create a new company
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
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Create company
    const company = await prisma.companies.create({
      data: {
        name: body.name,
        legalName: body.legalName,
        email: body.email,
        website: body.website,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        industry: body.industry,
        status: body.status || 'ACTIVE',
        priority: body.priority || 'MEDIUM',
        workspaceId: context.workspaceId,
        assignedUserId: body.assignedUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return createSuccessResponse(company, {
      message: 'Company created successfully',
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    console.error('Error creating company:', error);
    
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Company with this information already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
