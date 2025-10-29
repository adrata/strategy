import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';
import { cache } from '@/platform/services/unified-cache';
import { IntelligentNextActionService } from '@/platform/services/IntelligentNextActionService';
import { findOrCreateCompany } from '@/platform/services/company-linking-service';
import { addBusinessDays } from '@/platform/utils/actionUtils';

// 🚀 PERFORMANCE: Enhanced caching with Redis
const CLIENTS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for clients

/**
 * Clients CRUD API v1
 * GET /api/v1/clients - List clients (people with status='CLIENT') with search and pagination
 * POST /api/v1/clients - Create a new client
 */

// GET /api/v1/clients - List clients with search and pagination
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
    const priority = searchParams.get('priority') || '';
    const companyId = searchParams.get('companyId') || '';
    const vertical = searchParams.get('vertical') || '';
    const revenue = searchParams.get('revenue') || '';
    const timezone = searchParams.get('timezone') || '';
    // Use alphabetical sorting by default for all client queries (UX best practice)
    const sortBy = searchParams.get('sortBy') || 'fullName';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
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
    const cacheKey = `clients-${context.workspaceId}-${context.userId}-${section}-${limit}-${page}`;
    
    // Define the fetch function for cache
    const fetchClientsData = async () => {
      // 🎯 DEMO MODE: Detect if we're in demo mode to bypass user assignment filters
      const isDemoMode = context.workspaceId === '01K1VBYX2YERMXBFJ60RC6J194' || 
                        context.workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday
      
      // Enhanced where clause for clients (status = 'CLIENT')
      console.log('🔍 [V1 CLIENTS API] Querying with workspace:', context.workspaceId, 'for user:', context.userId, 'section:', section);
      const where: any = {
        workspaceId: context.workspaceId, // Filter by user's workspace
        deletedAt: null, // Only show non-deleted records
        status: 'CLIENT', // Filter for clients only
        ...(isDemoMode ? {} : {
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ]
        })
      };

      // 🔍 DIAGNOSTIC: Check what data actually exists
      const [totalClients, clientsByStatus] = await Promise.all([
        prisma.people.count({
          where: {
            workspaceId: context.workspaceId,
            deletedAt: null,
            status: 'CLIENT'
          }
        }),
        prisma.people.groupBy({
          by: ['status'],
          where: {
            workspaceId: context.workspaceId,
            deletedAt: null,
            status: 'CLIENT'
          },
          _count: { id: true }
        })
      ]);

      console.log(`🔍 [V1 CLIENTS API] Data diagnostic:`, {
        totalClients,
        clientsByStatus: clientsByStatus.reduce((acc, stat) => {
          acc[stat.status || 'NULL'] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        requestedSection: section
      });
      
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
          
          // Name contains (for search terms that look like real names/words)
          // Allow contains matching for 2+ character searches to fix "Ni" → "Nike" issue
          const isLikelyName = /^[a-zA-Z\s\-']+$/.test(searchTerm) && searchTerm.length >= 2;
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
            filters: { search, priority, companyId }
          }
        };
      }

      console.log(`🔍 [V1 CLIENTS API] Final where clause:`, JSON.stringify(where, null, 2));

      // Optimized query with Prisma ORM for reliability
      const [clients, totalCount] = await Promise.all([
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
            title: true,
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
            state: true,
            linkedinUrl: true,
            linkedinNavigatorUrl: true,
            linkedinConnectionDate: true,
            createdAt: true,
            updatedAt: true,
            personalEmail: true,
            address: true,
            postalCode: true,
            bio: true,
            gender: true,
            dateOfBirth: true,
            linkedinConnections: true,
            linkedinFollowers: true,
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
            },
            _count: {
              select: {
                actions: {
                  where: {
                    deletedAt: null,
                    status: 'COMPLETED'
                  }
                }
              }
            }
          }
        }),
        prisma.people.count({ where }),
      ]);

      console.log(`🔍 [V1 CLIENTS API] Query results:`, {
        clientsFound: clients.length,
        totalCount,
        firstClient: clients[0] ? {
          id: clients[0].id,
          name: clients[0].fullName,
          status: clients[0].status
        } : null
      });

      // 🚀 COMPUTE LAST ACTION: Enrich with actual last action from actions table
      const enrichedClients = await Promise.all(clients.map(async (client) => {
        try {
          const lastAction = await prisma.actions.findFirst({
            where: { 
              personId: client.id, 
              deletedAt: null,
              status: 'COMPLETED'
            },
            orderBy: { completedAt: 'desc' },
            select: { 
              subject: true, 
              completedAt: true, 
              type: true,
              createdAt: true
            }
          });
          
          // Import isMeaningfulAction function
          const { isMeaningfulAction } = await import('@/platform/utils/meaningfulActions');
          
          // DEBUG: Log the client data to see what we're working with
          console.log(`🔍 [V1 CLIENTS API] Processing client ${client.id}:`, {
            name: client.fullName,
            lastAction: client.lastAction,
            lastActionDate: client.lastActionDate,
            nextAction: client.nextAction,
            nextActionDate: client.nextActionDate,
            hasLastActionFromDB: !!lastAction,
            lastActionType: lastAction?.type,
            lastActionSubject: lastAction?.subject
          });
          
          // Calculate lastActionTime for clients table display using meaningful actions
          let lastActionTime = 'Never';
          let lastActionText = client.lastAction;
          let lastActionDate = client.lastActionDate;
          
          // Check if we have a meaningful action from the database
          if (lastAction && isMeaningfulAction(lastAction.type)) {
            lastActionText = lastAction.subject || lastAction.type;
            lastActionDate = lastAction.completedAt || lastAction.createdAt;
          }
          
          // Only show real last actions if they exist and are meaningful
          if (lastActionDate && lastActionText && lastActionText !== 'No action taken' && lastActionText !== 'Record created') {
            // Real last action exists
            const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince === 0) lastActionTime = 'Today';
            else if (daysSince === 1) lastActionTime = 'Yesterday';
            else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
            else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
            else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
          }
          // If no meaningful action exists, lastActionTime remains 'Never'

          // Calculate nextActionTiming with fallback
          let nextActionTiming = 'No date set';
          let nextAction = client.nextAction;
          let nextActionDate = client.nextActionDate;
          
          // Auto-populate nextActionDate if missing
          if (!nextActionDate) {
            const rank = client.globalRank || 1000;
            const lastActionDateForCalc = lastActionDate || client.createdAt;
            
            // Skip Miller timing based on client priority
            let businessDaysToAdd = 7; // Default: 1 week
            if (rank <= 10) businessDaysToAdd = 2; // Hot: 2 business days
            else if (rank <= 50) businessDaysToAdd = 3; // Warm: 3 business days
            else if (rank <= 100) businessDaysToAdd = 5; // Active: 5 business days
            else if (rank <= 500) businessDaysToAdd = 7; // Nurture: 1 week
            else businessDaysToAdd = 14; // Cold: 2 weeks
            
            // Use business days calculation (skips weekends)
            nextActionDate = addBusinessDays(new Date(lastActionDateForCalc), businessDaysToAdd);
          }
          
          // Auto-populate nextAction text if missing
          if (!nextAction) {
            if (lastActionText && lastActionText !== 'No action taken') {
              if (lastActionText.toLowerCase().includes('email')) {
                nextAction = 'Schedule a call to discuss next steps';
              } else if (lastActionText.toLowerCase().includes('call')) {
                nextAction = 'Send follow-up email with meeting notes';
              } else if (lastActionText.toLowerCase().includes('linkedin')) {
                nextAction = 'Send personalized connection message';
              } else if (lastActionText.toLowerCase().includes('created')) {
                nextAction = 'Send initial outreach email';
              } else {
                nextAction = 'Follow up on previous contact';
              }
            } else {
              nextAction = 'Send initial outreach email';
            }
          }
          
          // Calculate nextActionTiming
          if (nextActionDate) {
            const now = new Date();
            const actionDate = new Date(nextActionDate);
            const diffMs = actionDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) nextActionTiming = 'Overdue';
            else if (diffDays === 0) nextActionTiming = 'Today';
            else if (diffDays === 1) nextActionTiming = 'Tomorrow';
            else if (diffDays <= 7) nextActionTiming = 'This week';
            else if (diffDays <= 14) nextActionTiming = 'Next week';
            else if (diffDays <= 30) nextActionTiming = 'This month';
            else nextActionTiming = 'Future';
          }
          
          const result = {
            ...client,
            // Use computed lastAction if available, otherwise fall back to stored fields
            lastAction: lastActionText || client.lastAction,
            lastActionDate: lastActionDate || client.lastActionDate,
            lastActionTime: lastActionTime, // NEW: Timing text
            nextAction: nextAction || client.nextAction,
            nextActionDate: nextActionDate || client.nextActionDate,
            nextActionTiming: nextActionTiming, // NEW: Timing text
            lastActionType: lastAction?.type || null
          };
          
          // DEBUG: Log the final result
          console.log(`✅ [V1 CLIENTS API] Final result for client ${client.id}:`, {
            name: result.fullName,
            lastAction: result.lastAction,
            lastActionTime: result.lastActionTime,
            nextAction: result.nextAction,
            nextActionTiming: result.nextActionTiming
          });
          
          return result;
        } catch (error) {
          console.error(`❌ [CLIENTS API] Error computing lastAction for client ${client.id}:`, error);
          // Return original client data if computation fails
          return client;
        }
      }));

      // Transform to use mainSeller terminology like speedrun
      const transformedClients = enrichedClients.map((client) => ({
        ...client,
        mainSellerId: client.mainSellerId,
        mainSeller: client.mainSeller 
          ? (client.mainSeller.id === context.userId
              ? 'Me'
              : client.mainSeller.firstName && client.mainSeller.lastName 
                ? `${client.mainSeller.firstName} ${client.mainSeller.lastName}`.trim()
                : client.mainSeller.name || client.mainSeller.email || '-')
          : '-',
        mainSellerData: client.mainSeller
      }));

      const result = {
        success: true,
        data: transformedClients,
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
          filters: { search, priority, companyId, sortBy, sortOrder },
          userId: context.userId,
          workspaceId: context.workspaceId,
        }
      };

      return result;
    };

    if (!forceRefresh) {
      try {
        const result = await cache.get(cacheKey, fetchClientsData, {
          ttl: CLIENTS_CACHE_TTL,
          priority: 'high',
          tags: ['clients', section, context.workspaceId, context.userId]
        });
        console.log(`⚡ [CLIENTS API] Cache hit - returning cached data`);
        return NextResponse.json(result);
      } catch (error) {
        console.warn('⚠️ [CLIENTS API] Cache read failed, proceeding with database query:', error);
        // Clear corrupted cache entry
        try {
          await cache.delete(cacheKey);
          console.log(`🗑️ [CLIENTS API] Cleared corrupted cache entry: ${cacheKey}`);
        } catch (deleteError) {
          console.warn('⚠️ [CLIENTS API] Failed to clear corrupted cache:', deleteError);
        }
      }
    }

    // If force refresh or cache failed, fetch data directly
    const result = await fetchClientsData();

    // 🚀 CACHE: Store in Redis for future requests
    try {
      await cache.set(cacheKey, result, {
        ttl: CLIENTS_CACHE_TTL,
        priority: 'high',
        tags: ['clients', section, context.workspaceId, context.userId]
      });
      console.log(`💾 [CLIENTS API] Cached result for key: ${cacheKey}`);
    } catch (error) {
      console.warn('⚠️ [CLIENTS API] Cache write failed:', error);
    }
    
    return NextResponse.json(result);

  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 CLIENTS API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to fetch clients data',
      'CLIENTS_FETCH_ERROR',
      500
    );
  }
}

// POST /api/v1/clients - Create a new client
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
        console.log(`🏢 [CLIENTS API] Auto-linking company: "${body.company}"`);
        const companyResult = await findOrCreateCompany(
          body.company,
          context.workspaceId
        );
        body.companyId = companyResult.id;
        console.log(`✅ [CLIENTS API] ${companyResult.isNew ? 'Created' : 'Found'} company: ${companyResult.name} (${companyResult.id})`);
      } catch (error) {
        console.error('⚠️ [CLIENTS API] Failed to link company:', error);
        // Continue without company linking rather than failing the entire request
      }
    }

    // Create client and action in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create client (person with status='CLIENT')
      const client = await tx.people.create({
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
          status: 'CLIENT', // Set status to CLIENT
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
          mainSellerId: body.mainSellerId || (context.workspaceId === '01K7464TNANHQXPCZT1FYX205V' ? '01K7B327HWN9G6KGWA97S1TK43' : body.mainSellerId), // Auto-assign Dan for Adrata workspace
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

      // Auto-assign Ross as co-seller for Adrata workspace
      if (context.workspaceId === '01K7464TNANHQXPCZT1FYX205V') {
        try {
          await tx.person_co_sellers.create({
            data: {
              personId: client.id,
              userId: '01K7469230N74BVGK2PABPNNZ9' // Ross's user ID
            }
          });
          console.log('🎯 [V1 CLIENTS API] Auto-assigned Ross as co-seller for Adrata workspace');
        } catch (coSellerError) {
          console.warn('⚠️ [V1 CLIENTS API] Could not add Ross as co-seller:', coSellerError);
          // Don't fail the entire request if co-seller assignment fails
        }
      }

      // Create action for client creation
      const action = await tx.actions.create({
        data: {
          type: 'client_created',
          subject: `New client added: ${client.fullName}`,
          description: `System created new client record for ${client.fullName}`,
          status: 'COMPLETED',
          priority: 'NORMAL',
          workspaceId: context.workspaceId,
          userId: context.userId,
          personId: client.id,
          companyId: client.companyId,
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { client, action };
    });

    const client = result.client;

    // Transform to use mainSeller terminology like speedrun
    const transformedClient = {
      ...client,
      mainSellerId: client.mainSellerId,
      mainSeller: client.mainSeller 
        ? (client.mainSeller.id === context.userId
            ? 'Me'
            : client.mainSeller.firstName && client.mainSeller.lastName 
              ? `${client.mainSeller.firstName} ${client.mainSeller.lastName}`.trim()
              : client.mainSeller.name || client.mainSeller.email || '-')
        : '-',
      mainSellerData: client.mainSeller
    };

    // 🚀 CACHE INVALIDATION: Clear clients cache when new client is created
    try {
      const cachePattern = `clients-${context.workspaceId}-${context.userId}-*`;
      await cache.invalidate(cachePattern);
      console.log(`🗑️ [CLIENTS API] Invalidated cache for pattern: ${cachePattern}`);
    } catch (error) {
      console.warn('⚠️ [CLIENTS API] Cache invalidation failed:', error);
    }

    // Generate initial next action using AI service (async, don't await)
    setImmediate(async () => {
      try {
        const nextActionService = new IntelligentNextActionService({
          workspaceId: context.workspaceId,
          userId: context.userId
        });
        
        await nextActionService.generateNextAction(client.id, 'person');
        console.log('✅ [CLIENTS API] Generated initial next action for new client', client.id);
      } catch (error) {
        console.error('⚠️ [CLIENTS API] Failed to generate initial next action:', error);
        // Don't fail the request if next action generation fails
      }
    });

    // Generate strategy data for new client (async, don't await)
    setImmediate(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/strategy/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'x-request-id': request.headers.get('x-request-id') || ''
          },
          body: JSON.stringify({
            personId: client.id,
            recordType: 'person'
          })
        });
        
        if (response.ok) {
          console.log('✅ [CLIENTS API] Generated strategy data for new client', client.id);
        } else {
          console.warn('⚠️ [CLIENTS API] Strategy generation returned non-200 status:', response.status);
        }
      } catch (error) {
        console.error('⚠️ [CLIENTS API] Failed to generate strategy data:', error);
        // Don't fail the request if strategy generation fails
      }
    });

    return NextResponse.json({
      success: true,
      data: transformedClient,
      meta: {
        timestamp: new Date().toISOString(),
        message: 'Client created successfully',
        userId: context.userId,
        workspaceId: context.workspaceId,
      }
    });

  } catch (error) {
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Client with this information already exists' },
        { status: 400 }
      );
    }
    
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 CLIENTS API POST',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to create client',
      'CLIENT_CREATE_ERROR',
      500
    );
  }
}
