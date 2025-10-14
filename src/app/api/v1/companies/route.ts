import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';
import { IntelligentNextActionService } from '@/platform/services/IntelligentNextActionService';

/**
 * Clean and normalize website URL
 * Handles various input formats: example.com, www.example.com, https://example.com, https//:example.com, etc.
 */
function cleanWebsiteUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let cleaned = url.trim();
  
  // Remove common typos in protocol
  cleaned = cleaned.replace(/^https?\/\/?:?/i, '');
  
  // Remove leading www. if present
  cleaned = cleaned.replace(/^www\./i, '');
  
  // If no protocol exists, prepend https://
  if (!cleaned.match(/^https?:\/\//i)) {
    cleaned = `https://${cleaned}`;
  }
  
  return cleaned;
}

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
    const search = (searchParams.get('search') || '').trim(); // Trim whitespace for consistent searching
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const industry = searchParams.get('industry') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const countsOnly = searchParams.get('counts') === 'true';
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    const offset = (page - 1) * limit;
    
    // Check cache first (skip if force refresh)
    const cacheKey = `companies-${context.workspaceId}-${status}-${limit}-${countsOnly}-${page}`;
    const cached = responseCache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📦 [V1 COMPANIES API] Returning cached data for key: ${cacheKey}`);
      return NextResponse.json(cached.data);
    }
    
    if (forceRefresh) {
      console.log(`🔄 [V1 COMPANIES API] Force refresh requested, bypassing cache`);
    }

    // Enhanced where clause for pipeline management
    console.log(`🔍 [V1 COMPANIES API] Querying with workspace: ${context.workspaceId}, user: ${context.userId}`);
    const where: any = {
      workspaceId: context.workspaceId, // Filter by user's workspace
      deletedAt: null, // Only show non-deleted records
      OR: [
        { mainSellerId: context.userId },
        { mainSellerId: null }
      ]
    };
    console.log(`🔍 [V1 COMPANIES API] Where clause:`, where);
    
    if (search) {
      // Combine search with assignment filter
      where.AND = [
        {
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
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
            size: true,
            revenue: true,
            notes: true,
            opportunityStage: true,
            opportunityAmount: true,
            opportunityProbability: true,
            expectedCloseDate: true,
            actualCloseDate: true,
            competitors: true
          }
        }),
        prisma.companies.count({ where }),
      ]);

      result = createSuccessResponse(companies, {
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        // Add compatibility fields for useFastSectionData hook
        count: totalCount,
        totalCount: totalCount,
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
    console.error('❌ [V1 COMPANIES API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error', 
      'INTERNAL_ERROR', 
      500
    );
  }
}

// POST /api/v1/companies - Create a new company
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
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return createErrorResponse('Company name is required and must be a non-empty string', 'VALIDATION_ERROR', 400);
    }

    // Validate workspaceId is present (should be set by auth context)
    if (!context.workspaceId) {
      return createErrorResponse('Workspace ID is required', 'VALIDATION_ERROR', 400);
    }

    // Validate userId is present (should be set by auth context)
    if (!context.userId) {
      return createErrorResponse('User ID is required', 'VALIDATION_ERROR', 400);
    }

    // Log context validation
    console.log('🔍 [V1 COMPANIES API] Context validation:', {
      hasWorkspaceId: !!context.workspaceId,
      hasUserId: !!context.userId,
      hasUserEmail: !!context.userEmail,
      workspaceId: context.workspaceId,
      userId: context.userId
    });

    // Check if current user exists (for mainSellerId assignment)
    let validatedMainSellerId = null;
    try {
      const currentUserExists = await prisma.users.findUnique({
        where: { id: context.userId },
        select: { id: true, email: true }
      });
      
      if (currentUserExists) {
        validatedMainSellerId = currentUserExists.id;
        console.log('✅ [V1 COMPANIES API] Current user found, will set as mainSeller:', {
          userId: currentUserExists.id,
          email: currentUserExists.email
        });
      } else {
        console.warn('⚠️ [V1 COMPANIES API] Current user not in database, mainSellerId will be null:', {
          userId: context.userId,
          userEmail: context.userEmail
        });
      }
    } catch (error) {
      console.warn('⚠️ [V1 COMPANIES API] Could not validate user, mainSellerId will be null:', error);
    }

    // Validate that userId exists in users table for action creation
    if (context.userId) {
      try {
        const actionUserExists = await prisma.users.findUnique({
          where: { id: context.userId },
          select: { id: true, email: true }
        });
        
        if (!actionUserExists) {
          console.warn('⚠️ [V1 COMPANIES API] Context userId not in database:', {
            userId: context.userId,
            userEmail: context.userEmail
          });
        } else {
          console.log('✅ [V1 COMPANIES API] Context user validated for action creation:', {
            userId: actionUserExists.id,
            email: actionUserExists.email
          });
        }
      } catch (error) {
        console.warn('⚠️ [V1 COMPANIES API] Could not validate context userId:', error);
      }
    }

    // Validate that the mainSellerId (if provided) exists in the users table
    if (body.mainSellerId && body.mainSellerId !== context.userId) {
      console.log('🔍 [V1 COMPANIES API] Validating mainSellerId:', body.mainSellerId);
      try {
        const userExists = await prisma.users.findUnique({
          where: { id: body.mainSellerId },
          select: { id: true }
        });
        if (!userExists) {
          return createErrorResponse('Invalid mainSellerId: user does not exist', 'VALIDATION_ERROR', 400);
        }
        console.log('✅ [V1 COMPANIES API] mainSellerId validation passed');
      } catch (error) {
        console.error('❌ [V1 COMPANIES API] Error validating mainSellerId:', error);
        return createErrorResponse('Error validating mainSellerId', 'VALIDATION_ERROR', 400);
      }
    }

    // Validate email format if provided
    if (body.email && typeof body.email === 'string' && body.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return createErrorResponse('Invalid company email format', 'VALIDATION_ERROR', 400);
      }
    }

    // Clean and validate website URL format if provided
    if (body.website && typeof body.website === 'string' && body.website.trim().length > 0) {
      const cleanedWebsite = cleanWebsiteUrl(body.website);
      try {
        new URL(cleanedWebsite);
        // Update the body with the cleaned URL
        body.website = cleanedWebsite;
      } catch {
        return createErrorResponse('Invalid website URL format', 'VALIDATION_ERROR', 400);
      }
    }

    // Validate opportunity amount if provided
    if (body.opportunityAmount !== undefined && body.opportunityAmount !== null) {
      const amount = parseFloat(body.opportunityAmount);
      if (isNaN(amount) || amount < 0) {
        return createErrorResponse('Opportunity amount must be a valid positive number', 'VALIDATION_ERROR', 400);
      }
    }

    // Validate opportunity probability if provided
    if (body.opportunityProbability !== undefined && body.opportunityProbability !== null) {
      const probability = parseFloat(body.opportunityProbability);
      if (isNaN(probability) || probability < 0 || probability > 100) {
        return createErrorResponse('Opportunity probability must be a number between 0 and 100', 'VALIDATION_ERROR', 400);
      }
    }

    // Log all data before transaction for debugging
    console.log('🔍 [V1 COMPANIES API] Pre-transaction data:', {
      context: {
        userId: context.userId,
        workspaceId: context.workspaceId,
        userEmail: context.userEmail
      },
      requestBody: {
        name: body.name,
        website: body.website,
        notes: body.notes,
        mainSellerId: body.mainSellerId
      },
      timestamp: new Date().toISOString()
    });

    // Create company and action in a transaction
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
      console.log('🔍 [V1 COMPANIES API] Starting company creation...');
      
      // Log the data being sent to help identify missing columns
      // Start with minimal required fields to avoid P2022 errors
      const companyData = {
        name: body.name,
        workspaceId: context.workspaceId,
        // Only include optional fields if they have values
        ...(body.legalName && { legalName: body.legalName }),
        ...(body.email && { email: body.email }),
        ...(body.website && { website: body.website }),
        ...(body.phone && { phone: body.phone }),
        ...(body.address && { address: body.address }),
        ...(body.city && { city: body.city }),
        ...(body.state && { state: body.state }),
        ...(body.country && { country: body.country }),
        ...(body.industry && { industry: body.industry }),
        ...(body.status && { status: body.status }),
        ...(body.priority && { priority: body.priority }),
        ...(validatedMainSellerId && { mainSellerId: validatedMainSellerId }),
        ...(body.mainSellerId && { mainSellerId: body.mainSellerId }),
        ...(body.notes && { notes: body.notes }),
        // Only include opportunity fields if they have values to avoid P2022 errors
        ...(body.opportunityStage && { opportunityStage: body.opportunityStage }),
        ...(body.opportunityAmount && { opportunityAmount: body.opportunityAmount }),
        ...(body.opportunityProbability && { opportunityProbability: body.opportunityProbability }),
        ...(body.expectedCloseDate && { expectedCloseDate: new Date(body.expectedCloseDate) }),
        ...(body.actualCloseDate && { actualCloseDate: new Date(body.actualCloseDate) }),
        // Let Prisma handle createdAt and updatedAt with defaults
      };
      
      console.log('🔍 [V1 COMPANIES API] Company data to create:', {
        fields: Object.keys(companyData),
        nonNullFields: Object.entries(companyData).filter(([_, value]) => value !== null && value !== undefined).map(([key, _]) => key),
        data: companyData
      });
      
      // Create company
      const company = await tx.companies.create({
        data: companyData,
        include: {
          mainSeller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      console.log('✅ [V1 COMPANIES API] Company created successfully:', {
        companyId: company.id,
        companyName: company.name,
        mainSellerId: company.mainSellerId
      });

      // Create action for company creation (non-blocking)
      let action = null;
      try {
        console.log('🔍 [V1 COMPANIES API] Creating action record...');
        action = await tx.actions.create({
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
            createdAt: new Date(),  // ADD THIS
            updatedAt: new Date(),
          },
        });

        console.log('✅ [V1 COMPANIES API] Action created successfully:', {
          actionId: action.id,
          actionType: action.type,
          companyId: action.companyId
        });
      } catch (actionError) {
        console.error('⚠️ [V1 COMPANIES API] Failed to create action (non-blocking):', {
          error: actionError,
          errorMessage: actionError instanceof Error ? actionError.message : String(actionError),
          userId: context.userId,
          companyId: company.id
        });
        // Continue without action - company creation should still succeed
      }

      return { company, action };
      });
    } catch (transactionError) {
      console.error('❌ [V1 COMPANIES API] Transaction failed:', {
        error: transactionError,
        errorMessage: transactionError instanceof Error ? transactionError.message : String(transactionError),
        errorStack: transactionError instanceof Error ? transactionError.stack : undefined,
        prismaCode: transactionError && typeof transactionError === 'object' && 'code' in transactionError ? transactionError.code : undefined,
        prismaMessage: transactionError && typeof transactionError === 'object' && 'message' in transactionError ? transactionError.message : undefined,
        prismaMeta: transactionError && typeof transactionError === 'object' && 'meta' in transactionError ? transactionError.meta : undefined,
      });
      throw transactionError; // Re-throw to be caught by outer catch block
    }

    const company = result.company;

    // 🚀 CACHE INVALIDATION: Clear companies cache when new company is created
    try {
      const cachePattern = `companies-${context.workspaceId}-${context.userId}-*`;
      // Note: Using responseCache.clear() since this is a Map-based cache
      // In a real Redis implementation, you would use cache.invalidateByPattern(cachePattern)
      responseCache.clear();
      console.log(`🗑️ [COMPANIES API] Invalidated cache for pattern: ${cachePattern}`);
    } catch (error) {
      console.warn('⚠️ [COMPANIES API] Cache invalidation failed:', error);
    }

    // Generate initial next action using AI service (async, don't await)
    setImmediate(async () => {
      try {
        const nextActionService = new IntelligentNextActionService({
          workspaceId: context.workspaceId,
          userId: context.userId
        });
        
        await nextActionService.generateNextAction(company.id, 'company');
        console.log('✅ [COMPANIES API] Generated initial next action for new company', company.id);
      } catch (error) {
        console.error('⚠️ [COMPANIES API] Failed to generate initial next action:', error);
        // Don't fail the request if next action generation fails
      }
    });

    return createSuccessResponse(company, {
      message: 'Company created successfully',
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return createErrorResponse('Company with this information already exists', 'DUPLICATE_COMPANY', 400);
    }
    
    // Enhanced error logging for P2022 (column doesn't exist) errors
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;
      console.error('❌ [V1 COMPANIES API] Prisma error details:', {
        code: prismaError.code,
        meta: prismaError.meta,
        message: prismaError.message,
        clientVersion: prismaError.clientVersion
      });
      
      if (prismaError.code === 'P2022') {
        console.error('❌ [V1 COMPANIES API] P2022 Error - Column does not exist:', {
          columnName: prismaError.meta?.column_name,
          tableName: prismaError.meta?.table_name,
          schemaName: prismaError.meta?.schema_name,
          fullMeta: prismaError.meta
        });
      }
    }
    
    // Log full Prisma error details for debugging
    console.error('❌ [V1 COMPANIES API] Detailed error:', {
      error,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      prismaCode: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
    });
    
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 COMPANIES API POST',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to create company',
      'COMPANY_CREATE_ERROR',
      500
    );
  }
}
