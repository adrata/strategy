import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

// Response cache for fast performance
const responseCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Companies CRUD API v1
 * GET /api/v1/companies - List companies with search and pagination
 * POST /api/v1/companies - Create a new company
 */

// GET /api/v1/companies - List companies with search and pagination
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000); // Cap at 1000, default 100
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const industry = searchParams.get('industry') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const countsOnly = searchParams.get('counts') === 'true';
    
    const offset = (page - 1) * limit;
    
    // Check cache first
    const cacheKey = `companies-${context.workspaceId}-${status}-${limit}-${countsOnly}-${page}`;
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Enhanced where clause for pipeline management
    console.log(`🔍 [V1 COMPANIES API] Querying with workspace: ${context.workspaceId}, user: ${context.userId}`);
    const where: any = {
      workspaceId: context.workspaceId, // Filter by user's workspace
      deletedAt: null, // Only show non-deleted records
      OR: [
        { assignedUserId: context.userId },
        { assignedUserId: null }
      ]
    };
    console.log(`🔍 [V1 COMPANIES API] Where clause:`, where);
    
    if (search) {
      // Combine search with assignment filter
      where.AND = [
        {
          OR: [
            { assignedUserId: context.userId },
            { assignedUserId: null }
          ]
        },
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { legalName: { contains: search, mode: 'insensitive' } },
            { tradingName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { website: { contains: search, mode: 'insensitive' } },
            { domain: { contains: search, mode: 'insensitive' } },
          ]
        }
      ];
      // Remove the top-level OR since we're using AND now
      delete where.OR;
    }

    // Pipeline status filtering (PROSPECT, CLIENT, ACTIVE, INACTIVE, OPPORTUNITY)
    if (status) {
      where.status = status;
      console.log(`🔍 [V1 COMPANIES API] Filtering by status: ${status}`);
    }

    // Priority filtering (LOW, MEDIUM, HIGH)
    if (priority) {
      where.priority = priority;
    }

    // Industry filtering
    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    let result;
    
    if (countsOnly) {
      // Fast count query using Prisma ORM
      const statusCounts = await prisma.companies.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      });

      const counts = statusCounts.reduce((acc, stat) => {
        acc[stat.status || 'ACTIVE'] = stat._count.id;
        return acc;
      }, {} as Record<string, number>);

      result = { success: true, data: counts };
    } else {
      // Optimized query with Prisma ORM for reliability
      console.log(`🔍 [V1 COMPANIES API] Executing database query with where:`, where);
      console.log(`🔍 [V1 COMPANIES API] Final where clause for status=${status}:`, JSON.stringify(where, null, 2));
      const [companies, totalCount] = await Promise.all([
        prisma.companies.findMany({
          where,
          orderBy: { 
            [sortBy === 'rank' ? 'globalRank' : sortBy]: sortOrder 
          },
          skip: offset,
          take: limit,
          select: {
            id: true,
            name: true,
            website: true,
            status: true,
            globalRank: true,
            lastAction: true,
            nextAction: true,
            lastActionDate: true,
            nextActionDate: true,
            industry: true,
            size: true
            // Optimized for list views - removed unnecessary fields
          }
        }),
        prisma.companies.count({ where }),
      ]);
      console.log(`🔍 [V1 COMPANIES API] Database query results:`, { 
        companiesCount: companies.length, 
        totalCount,
        status: status,
        sampleCompanies: companies.slice(0, 3).map(c => ({
          id: c.id,
          name: c.name,
          status: c.status
        }))
      });

      result = createSuccessResponse(companies, {
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
    }

    // Cache the result
    responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    
    return result;

  } catch (error) {
    console.error('❌ [V1 COMPANIES API] Error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

// POST /api/v1/companies - Create a new company
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
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Create company and action in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.companies.create({
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

      // Create action for company creation
      const action = await tx.actions.create({
        data: {
          type: 'company_created',
          subject: `New company added: ${company.name}`,
          description: `System created new company record for ${company.name}`,
          status: 'COMPLETED',
          priority: 'NORMAL',
          workspaceId: context.workspaceId,
          userId: context.userId,
          companyId: company.id,
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { company, action };
    });

    const company = result.company;

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
