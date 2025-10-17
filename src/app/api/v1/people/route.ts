import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';
import { cache } from '@/platform/services/unified-cache';
import { IntelligentNextActionService } from '@/platform/services/IntelligentNextActionService';
import { findOrCreateCompany } from '@/platform/services/company-linking-service';

// 🚀 PERFORMANCE: Enhanced caching with Redis
const PEOPLE_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for leads/prospects
const SPEEDRUN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for speedrun

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
  let context: any = null; // Declare context outside try block for error handler access
  
  try {
    // Authenticate and authorize user using unified auth system
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context: authContext, response } = authResult;
    context = authContext; // Assign to outer scope variable

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
    const companyId = searchParams.get('companyId') || '';
    const vertical = searchParams.get('vertical') || '';
    const revenue = searchParams.get('revenue') || '';
    const timezone = searchParams.get('timezone') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Validate sort field
    const validSortFields = ['globalRank', 'fullName', 'firstName', 'lastName', 'email', 'jobTitle', 'lastActionDate', 'createdAt', 'status', 'priority'];
    const sortFieldMapping: Record<string, string> = {
      'rank': 'globalRank',
      'name': 'fullName',
      'title': 'jobTitle',
      'lastAction': 'lastActionDate',
      'company': 'company.name'
    };
    
    const mappedSortField = sortFieldMapping[sortBy] || sortBy;
    if (!validSortFields.includes(mappedSortField)) {
      return NextResponse.json({
        success: false,
        error: `Invalid sort field: ${sortBy}`,
        code: 'INVALID_SORT_FIELD'
      }, { status: 400 });
    }
    const countsOnly = searchParams.get('counts') === 'true';
    const section = searchParams.get('section') || ''; // 🚀 NEW: Section parameter for pre-filtered results
    const cursor = searchParams.get('cursor') || ''; // 🚀 NEW: Cursor-based pagination
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    const offset = (page - 1) * limit;
    
    // 🚀 CACHE: Check Redis cache first (unless force refresh)
    const cacheKey = `people-${context.workspaceId}-${context.userId}-${section}-${status}-${limit}-${page}`;
    
    // Define the fetch function for cache
    const fetchPeopleData = async () => {
      // 🎯 DEMO MODE: Detect if we're in demo mode to bypass user assignment filters
      const isDemoMode = context.workspaceId === '01K1VBYX2YERMXBFJ60RC6J194' || 
                        context.workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday
      
      // Enhanced where clause for pipeline management
      console.log('🔍 [V1 PEOPLE API] Querying with workspace:', context.workspaceId, 'for user:', context.userId, 'section:', section);
      const where: any = {
        workspaceId: context.workspaceId, // Filter by user's workspace
        deletedAt: null, // Only show non-deleted records
        ...(isDemoMode ? {} : {
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ]
        })
      };

      // 🔍 DIAGNOSTIC: Check what data actually exists
      const [totalPeople, peopleByStatus] = await Promise.all([
        prisma.people.count({
          where: {
            workspaceId: context.workspaceId,
            deletedAt: null
          }
        }),
        prisma.people.groupBy({
          by: ['status'],
          where: {
            workspaceId: context.workspaceId,
            deletedAt: null
          },
          _count: { id: true }
        })
      ]);

      console.log(`🔍 [V1 PEOPLE API] Data diagnostic:`, {
        totalPeople,
        peopleByStatus: peopleByStatus.reduce((acc, stat) => {
          acc[stat.status || 'NULL'] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        requestedSection: section
      });

      // 🚀 SECTION FILTERING: Pre-filter by section for better performance
      if (section) {
        switch (section) {
          case 'leads':
            where.status = 'LEAD';
            break;
          case 'prospects':
            where.status = 'PROSPECT';
            break;
          case 'opportunities':
            where.status = 'OPPORTUNITY';
            break;
          default:
            // No additional filtering for other sections
            break;
        }
      }
      
      if (search) {
        const searchTerm = search.trim();
        
        // Only search if the search term is meaningful (at least 2 characters and not just random characters)
        if (searchTerm.length >= 2) {
          // Create more intelligent search conditions
          const searchConditions = [];
          
          // Exact matches (highest priority)
          searchConditions.push(
            { fullName: { equals: searchTerm, mode: 'insensitive' } },
            { firstName: { equals: searchTerm, mode: 'insensitive' } },
            { lastName: { equals: searchTerm, mode: 'insensitive' } }
          );
          
          // Word boundary matches (starts with)
          searchConditions.push(
            { fullName: { startsWith: searchTerm, mode: 'insensitive' } },
            { firstName: { startsWith: searchTerm, mode: 'insensitive' } },
            { lastName: { startsWith: searchTerm, mode: 'insensitive' } }
          );
          
          // Email exact matches
          searchConditions.push(
            { email: { equals: searchTerm, mode: 'insensitive' } },
            { workEmail: { equals: searchTerm, mode: 'insensitive' } }
          );
          
          // Email contains (for partial email matches)
          if (searchTerm.includes('@')) {
            searchConditions.push(
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { workEmail: { contains: searchTerm, mode: 'insensitive' } }
            );
          }
          
          // Job title and department contains (only for longer search terms)
          if (searchTerm.length >= 3) {
            searchConditions.push(
              { jobTitle: { contains: searchTerm, mode: 'insensitive' } },
              { department: { contains: searchTerm, mode: 'insensitive' } }
            );
          }
          
          // Name contains (only for search terms that look like real names/words)
          // This filters out random character sequences
          const isLikelyName = /^[a-zA-Z\s\-']+$/.test(searchTerm) && searchTerm.length >= 3;
          if (isLikelyName) {
            searchConditions.push(
              { fullName: { contains: searchTerm, mode: 'insensitive' } },
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } }
            );
          }
          
          where.OR = searchConditions;
        }
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

      // Vertical filtering
      if (vertical) {
        where.vertical = { contains: vertical, mode: 'insensitive' };
      }

      // Revenue filtering (via company relation)
      if (revenue) {
        where.company = {
          revenue: { contains: revenue, mode: 'insensitive' }
        };
      }

      // Timezone filtering
      if (timezone) {
        where.timezone = { contains: timezone, mode: 'insensitive' };
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

        return {
          success: true,
          data: counts,
          meta: {
            type: 'counts',
            filters: { search, status, priority, companyId }
          }
        };
      }

      console.log(`🔍 [V1 PEOPLE API] Final where clause:`, JSON.stringify(where, null, 2));

      // Optimized query with Prisma ORM for reliability
      const [people, totalCount] = await Promise.all([
        prisma.people.findMany({
          where,
          orderBy: { 
            [mappedSortField]: sortOrder 
          },
          skip: offset,
          take: limit,
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            phone: true,
            department: true,
            status: true,
            priority: true,
            globalRank: true,
            lastAction: true,
            nextAction: true,
            lastActionDate: true,
            nextActionDate: true,
            companyId: true,
            mainSellerId: true,
            vertical: true,
            notes: true,
            buyerGroupRole: true,
            influenceLevel: true,
            engagementStrategy: true,
            buyerGroupStatus: true,
            isBuyerGroupMember: true,
            company: {
              select: {
                id: true,
                name: true,
                industry: true,
                size: true,
                globalRank: true,
                hqState: true
              }
            },
            mainSeller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.people.count({ where }),
      ]);

      console.log(`🔍 [V1 PEOPLE API] Query results:`, {
        peopleFound: people.length,
        totalCount,
        firstPerson: people[0] ? {
          id: people[0].id,
          name: people[0].fullName,
          status: people[0].status
        } : null
      });

      // Transform to use mainSeller terminology like speedrun
      const transformedPeople = people.map((person) => ({
        ...person,
        mainSellerId: person.mainSellerId,
        mainSeller: person.mainSeller 
          ? (person.mainSeller.id === context.userId
              ? 'Me'
              : person.mainSeller.firstName && person.mainSeller.lastName 
                ? `${person.mainSeller.firstName} ${person.mainSeller.lastName}`.trim()
                : person.mainSeller.name || person.mainSeller.email || '-')
          : '-',
        mainSellerData: person.mainSeller
      }));

      const result = {
        success: true,
        data: transformedPeople,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
          // Add compatibility fields for useFastSectionData hook
          count: totalCount,
          totalCount: totalCount,
          filters: { search, status, priority, companyId, sortBy, sortOrder },
          userId: context.userId,
          workspaceId: context.workspaceId,
        }
      };

      return result;
    };

    if (!forceRefresh) {
      try {
        const result = await cache.get(cacheKey, fetchPeopleData, {
          ttl: section === 'speedrun' ? SPEEDRUN_CACHE_TTL : PEOPLE_CACHE_TTL,
          priority: 'high',
          tags: ['people', section, context.workspaceId, context.userId]
        });
        console.log(`⚡ [PEOPLE API] Cache hit - returning cached data`);
        return NextResponse.json(result);
      } catch (error) {
        console.warn('⚠️ [PEOPLE API] Cache read failed, proceeding with database query:', error);
        // Clear corrupted cache entry
        try {
          await cache.delete(cacheKey);
          console.log(`🗑️ [PEOPLE API] Cleared corrupted cache entry: ${cacheKey}`);
        } catch (deleteError) {
          console.warn('⚠️ [PEOPLE API] Failed to clear corrupted cache:', deleteError);
        }
      }
    }

    // If force refresh or cache failed, fetch data directly
    const result = await fetchPeopleData();

    // 🚀 CACHE: Store in Redis for future requests
    try {
      const cacheTTL = section === 'speedrun' ? SPEEDRUN_CACHE_TTL : PEOPLE_CACHE_TTL;
      await cache.set(cacheKey, result, {
        ttl: cacheTTL,
        priority: 'high',
        tags: ['people', section, context.workspaceId, context.userId]
      });
      console.log(`💾 [PEOPLE API] Cached result for key: ${cacheKey}`);
    } catch (error) {
      console.warn('⚠️ [PEOPLE API] Cache write failed:', error);
    }
    
    return NextResponse.json(result);

  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 PEOPLE API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to fetch people data',
      'PEOPLE_FETCH_ERROR',
      500
    );
  }
}

// POST /api/v1/people - Create a new person
export async function POST(request: NextRequest) {
  // Declare context outside try block so it's accessible in catch block
  let context: SecureApiContext | null = null;
  
  try {
    // Authenticate and authorize user using unified auth system
    const { context: authContext, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!authContext) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    context = authContext;

    const body = await request.json();

    // Comprehensive validation for required fields
    if (!body.firstName || typeof body.firstName !== 'string' || body.firstName.trim().length === 0) {
      return createErrorResponse('First name is required and must be a non-empty string', 'VALIDATION_ERROR', 400);
    }

    if (!body.lastName || typeof body.lastName !== 'string' || body.lastName.trim().length === 0) {
      return createErrorResponse('Last name is required and must be a non-empty string', 'VALIDATION_ERROR', 400);
    }

    // Validate workspaceId is present (should be set by auth context)
    if (!context.workspaceId) {
      return createErrorResponse('Workspace ID is required', 'VALIDATION_ERROR', 400);
    }

    // Validate email format if provided
    if (body.email && typeof body.email === 'string' && body.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return createErrorResponse('Invalid email format', 'VALIDATION_ERROR', 400);
      }
    }

    // Validate workEmail format if provided
    if (body.workEmail && typeof body.workEmail === 'string' && body.workEmail.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.workEmail.trim())) {
        return createErrorResponse('Invalid work email format', 'VALIDATION_ERROR', 400);
      }
    }

    // Validate personalEmail format if provided
    if (body.personalEmail && typeof body.personalEmail === 'string' && body.personalEmail.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.personalEmail.trim())) {
        return createErrorResponse('Invalid personal email format', 'VALIDATION_ERROR', 400);
      }
    }

    // Create full name
    const fullName = `${body.firstName} ${body.lastName}`;

    // Handle company linking if company name is provided without companyId
    if (body.company && typeof body.company === 'string' && body.company.trim() && !body.companyId) {
      try {
        console.log(`🏢 [PEOPLE API] Auto-linking company: "${body.company}"`);
        const companyResult = await findOrCreateCompany(
          body.company,
          context.workspaceId
        );
        body.companyId = companyResult.id;
        console.log(`✅ [PEOPLE API] ${companyResult.isNew ? 'Created' : 'Found'} company: ${companyResult.name} (${companyResult.id})`);
      } catch (error) {
        console.error('⚠️ [PEOPLE API] Failed to link company:', error);
        // Continue without company linking rather than failing the entire request
      }
    }

    // Create person and action in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create person
      const person = await tx.people.create({
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
          vertical: body.vertical,
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
          mainSellerId: body.mainSellerId,
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
          mainSeller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create action for person creation
      const action = await tx.actions.create({
        data: {
          type: 'person_created',
          subject: `New person added: ${person.fullName}`,
          description: `System created new person record for ${person.fullName}`,
          status: 'COMPLETED',
          priority: 'NORMAL',
          workspaceId: context.workspaceId,
          userId: context.userId,
          personId: person.id,
          companyId: person.companyId,
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { person, action };
    });

    const person = result.person;

    // Transform to use mainSeller terminology like speedrun
    const transformedPerson = {
      ...person,
      mainSellerId: person.mainSellerId,
      mainSeller: person.mainSeller 
        ? (person.mainSeller.id === context.userId
            ? 'Me'
            : person.mainSeller.firstName && person.mainSeller.lastName 
              ? `${person.mainSeller.firstName} ${person.mainSeller.lastName}`.trim()
              : person.mainSeller.name || person.mainSeller.email || '-')
        : '-',
      mainSellerData: person.mainSeller
    };

    // 🚀 CACHE INVALIDATION: Clear people cache when new person is created
    try {
      const cachePattern = `people-${context.workspaceId}-${context.userId}-*`;
      await cache.invalidate(cachePattern);
      console.log(`🗑️ [PEOPLE API] Invalidated cache for pattern: ${cachePattern}`);
    } catch (error) {
      console.warn('⚠️ [PEOPLE API] Cache invalidation failed:', error);
    }

    // Generate initial next action using AI service (async, don't await)
    setImmediate(async () => {
      try {
        const nextActionService = new IntelligentNextActionService({
          workspaceId: context.workspaceId,
          userId: context.userId
        });
        
        await nextActionService.generateNextAction(person.id, 'person');
        console.log('✅ [PEOPLE API] Generated initial next action for new person', person.id);
      } catch (error) {
        console.error('⚠️ [PEOPLE API] Failed to generate initial next action:', error);
        // Don't fail the request if next action generation fails
      }
    });

    return NextResponse.json({
      success: true,
      data: transformedPerson,
      meta: {
        timestamp: new Date().toISOString(),
        message: 'Person created successfully',
        userId: context.userId,
        workspaceId: context.workspaceId,
      }
    });

  } catch (error) {
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Person with this information already exists' },
        { status: 400 }
      );
    }
    
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 PEOPLE API POST',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to create person',
      'PERSON_CREATE_ERROR',
      500
    );
  }
}