import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse } from '@/platform/services/secure-api-helper';
import { cache } from '@/platform/services/unified-cache';

// 🚀 PERFORMANCE: Enhanced caching with Redis
const OPPORTUNITIES_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Opportunities CRUD API v1
 * Note: Opportunities use the companies table as per user specification
 * GET /api/v1/opportunities - List opportunities with search and pagination
 * POST /api/v1/opportunities - Create a new opportunity
 */

// GET /api/v1/opportunities - List opportunities with search and pagination
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
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const countsOnly = searchParams.get('counts') === 'true';
    const section = searchParams.get('section') || '';
    const cursor = searchParams.get('cursor') || '';
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 🚀 CACHE: Check Redis cache first (unless force refresh or counts only)
    const cacheKey = `opportunities-${context.workspaceId}-${context.userId}-${page}-${limit}-${search}-${status}-${priority}-${sortBy}-${sortOrder}-${section}-${cursor}`;
    
    if (!forceRefresh && !countsOnly) {
      try {
        const cachedResult = await cache.get(cacheKey);
        if (cachedResult) {
          console.log(`⚡ [OPPORTUNITIES API] Cache hit - returning cached data in ${Date.now() - startTime}ms`);
          return NextResponse.json(cachedResult);
        }
      } catch (error) {
        console.warn('⚠️ [OPPORTUNITIES API] Cache read failed, proceeding with database query:', error);
      }
    }

    // Build where clause - opportunities are companies with opportunity-specific filters
    const whereClause: any = {
      workspaceId: context.workspaceId,
      deletedAt: null,
      // Filter for companies that are opportunities (you may need to adjust this based on your schema)
      // This assumes there's a field to distinguish opportunities from regular companies
      // You might need to add a type field or use a different approach
    };

    // Add search filters
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add status filter (if opportunities have status)
    if (status) {
      whereClause.status = status;
    }

    // Add priority filter (if opportunities have priority)
    if (priority) {
      whereClause.priority = priority;
    }

    // Add section-specific filters
    if (section) {
      switch (section) {
        case 'opportunities':
          // All opportunities
          break;
        case 'hot_opportunities':
          whereClause.priority = 'HIGH';
          break;
        case 'qualified_opportunities':
          whereClause.status = 'QUALIFIED';
          break;
        case 'recent_opportunities':
          whereClause.createdAt = {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          };
          break;
      }
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Get total count
    const totalCount = await prisma.companies.count({ where: whereClause });

    // Get opportunities with pagination
    const skip = (page - 1) * limit;
    const opportunities = await prisma.companies.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
      include: {
        mainSeller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
    });

    // Format response - transform companies to opportunities format
    const formattedOpportunities = opportunities.map(opportunity => ({
      ...opportunity,
      // Map company fields to opportunity fields as needed
      fullName: opportunity.name, // Use company name as fullName for consistency
      mainSellerId: opportunity.mainSellerId,
      mainSeller: opportunity.mainSeller 
        ? (opportunity.mainSeller.id === context.userId
            ? 'Me'
            : opportunity.mainSeller.firstName && opportunity.mainSeller.lastName 
              ? `${opportunity.mainSeller.firstName} ${opportunity.mainSeller.lastName}`.trim()                                                                    
              : opportunity.mainSeller.name || opportunity.mainSeller.email || '-')
        : '-',
      mainSellerData: opportunity.mainSeller
    }));

    const result = {
      success: true,
      data: formattedOpportunities,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
        workspaceId: context.workspaceId,
        userId: context.userId,
        responseTime: Date.now() - startTime,
        cached: false
      }
    };

    // 🚀 CACHE: Store in Redis for future requests
    if (!countsOnly) {
      try {
        await cache.set(cacheKey, result, {
          ttl: OPPORTUNITIES_CACHE_TTL,
          priority: 'normal',
          tags: ['opportunities', context.workspaceId, context.userId]
        });
        console.log(`💾 [OPPORTUNITIES API] Cached result for key: ${cacheKey}`);
      } catch (error) {
        console.warn('⚠️ [OPPORTUNITIES API] Cache write failed:', error);
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ [OPPORTUNITIES API] Loaded ${opportunities.length} opportunities in ${responseTime}ms`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [OPPORTUNITIES API] Error:', error);
    return logAndCreateErrorResponse(
      error,
      'OPPORTUNITIES_LOAD_ERROR',
      500
    );
  }
}

// POST /api/v1/opportunities - Create a new opportunity
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

    // Validate required fields
    if (!body.name) {
      return createErrorResponse('Company name is required for opportunities', 'VALIDATION_ERROR', 400);
    }

    // Create opportunity as a company with workspace and user context
    const newOpportunity = await prisma.companies.create({
      data: {
        ...body,
        workspaceId: context.workspaceId,
        mainSellerId: context.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        mainSeller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
    });

    // 🚀 CACHE: Invalidate opportunities cache
    try {
      await cache.invalidateByPattern(`opportunities-${context.workspaceId}-${context.userId}-*`);
      console.log(`🗑️ [OPPORTUNITIES API] Invalidated cache after create`);
    } catch (error) {
      console.warn('⚠️ [OPPORTUNITIES API] Cache invalidation failed:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newOpportunity,
        fullName: newOpportunity.name, // Use company name as fullName for consistency
        mainSellerId: newOpportunity.mainSellerId,
        mainSeller: newOpportunity.mainSeller 
          ? (newOpportunity.mainSeller.id === context.userId
              ? 'Me'
              : newOpportunity.mainSeller.firstName && newOpportunity.mainSeller.lastName 
                ? `${newOpportunity.mainSeller.firstName} ${newOpportunity.mainSeller.lastName}`.trim()                                                                    
                : newOpportunity.mainSeller.name || newOpportunity.mainSeller.email || '-')
          : '-',
        mainSellerData: newOpportunity.mainSeller
      },
      meta: {
        message: 'Opportunity created successfully',
      },
    });

  } catch (error) {
    console.error('❌ [OPPORTUNITIES API] Create error:', error);
    return logAndCreateErrorResponse(
      error,
      'OPPORTUNITIES_CREATE_ERROR',
      500
    );
  }
}
