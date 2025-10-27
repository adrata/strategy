import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';
import { IntelligentNextActionService } from '@/platform/services/IntelligentNextActionService';
import { addBusinessDays } from '@/platform/utils/actionUtils';

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
 * Validate database schema for companies table
 * This helps detect schema mismatches between development and production
 */
async function validateCompaniesSchema(): Promise<{ hasMainSellerId: boolean; hasAssignedUserId: boolean; error?: string }> {
  try {
    // Try to query with mainSellerId
    let hasMainSellerId = false;
    try {
      await prisma.$queryRaw`SELECT "mainSellerId" FROM "companies" LIMIT 1`;
      hasMainSellerId = true;
    } catch (error) {
      // Column doesn't exist
    }

    // Try to query with assignedUserId
    let hasAssignedUserId = false;
    try {
      await prisma.$queryRaw`SELECT "assignedUserId" FROM "companies" LIMIT 1`;
      hasAssignedUserId = true;
    } catch (error) {
      // Column doesn't exist
    }

    return { hasMainSellerId, hasAssignedUserId };
  } catch (error) {
    return { 
      hasMainSellerId: false, 
      hasAssignedUserId: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Companies CRUD API v1
 * GET /api/v1/companies - List companies with search and pagination
 * POST /api/v1/companies - Create a new company
 */

// GET /api/v1/companies - List companies with search and pagination
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 10000); // Cap at 10000, default 100
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
    
    // 🎯 DEMO MODE: Detect if we're in demo mode to bypass user assignment filters
    const isDemoMode = context.workspaceId === '01K1VBYX2YERMXBFJ60RC6J194' || 
                      context.workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday
    
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
            legalName: true,
            tradingName: true,
            localName: true,
            description: true,
            website: true,
            email: true,
            phone: true,
            fax: true,
            address: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
            status: true,
            priority: true,
            globalRank: true,
            lastAction: true,
            nextAction: true,
            lastActionDate: true,
            nextActionDate: true,
            nextActionReasoning: true,
            nextActionPriority: true,
            nextActionType: true,
            actionStatus: true,
            industry: true,
            sector: true,
            size: true,
            revenue: true,
            currency: true,
            employeeCount: true,
            foundedYear: true,
            domain: true,
            logoUrl: true,
            notes: true,
            tags: true,
            registrationNumber: true,
            taxId: true,
            vatNumber: true,
            opportunityStage: true,
            opportunityAmount: true,
            opportunityProbability: true,
            expectedCloseDate: true,
            actualCloseDate: true,
            acquisitionDate: true,
            competitors: true,
            businessChallenges: true,
            businessPriorities: true,
            competitiveAdvantages: true,
            growthOpportunities: true,
            strategicInitiatives: true,
            successMetrics: true,
            marketThreats: true,
            keyInfluencers: true,
            decisionTimeline: true,
            marketPosition: true,
            digitalMaturity: true,
            techStack: true,
            linkedinUrl: true,
            linkedinNavigatorUrl: true,
            linkedinFollowers: true,
            twitterUrl: true,
            twitterFollowers: true,
            facebookUrl: true,
            instagramUrl: true,
            youtubeUrl: true,
            githubUrl: true,
            hqLocation: true,
            hqFullAddress: true,
            hqCity: true,
            hqState: true,
            hqStreet: true,
            hqZipcode: true,
            hqRegion: true,
            hqCountryIso2: true,
            hqCountryIso3: true,
            lastFundingAmount: true,
            lastFundingDate: true,
            stockSymbol: true,
            isPublic: true,
            naicsCodes: true,
            sicCodes: true,
            activeJobPostings: true,
            numTechnologiesUsed: true,
            technologiesUsed: true,
            confidence: true,
            sources: true,
            lastVerified: true,
            parentCompanyName: true,
            parentCompanyDomain: true,
            entityId: true,
            mainSellerId: true,
            createdAt: true,
            updatedAt: true,
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
        prisma.companies.count({ where }),
      ]);

      // 🚀 COMPUTE LAST ACTION: Enrich with actual last action from actions table
      const enrichedCompanies = await Promise.all(companies.map(async (company) => {
        try {
          const lastAction = await prisma.actions.findFirst({
            where: { 
              companyId: company.id, 
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
          
          // Calculate lastActionTime for companies table display using meaningful actions (copy from speedrun)
          let lastActionTime = 'Never';
          let lastActionText = company.lastAction;
          let lastActionDate = company.lastActionDate;
          
          // Check if we have a meaningful action from the database
          if (lastAction && isMeaningfulAction(lastAction.type)) {
            lastActionText = lastAction.subject || lastAction.type;
            lastActionDate = lastAction.completedAt || lastAction.createdAt;
          }
          
          // Only show real last actions if they exist and are meaningful
          if (lastActionDate && lastActionText && lastActionText !== 'No action taken') {
            // Real last action exists
            const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince === 0) lastActionTime = 'Today';
            else if (daysSince === 1) lastActionTime = 'Yesterday';
            else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
            else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
            else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
          } else if (company.createdAt) {
            // No real last action, show when data was added
            const daysSince = Math.floor((new Date().getTime() - new Date(company.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince === 0) lastActionTime = 'Today';
            else if (daysSince === 1) lastActionTime = 'Yesterday';
            else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
            else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
            else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
          }

          // Calculate nextActionTiming with fallback
          let nextActionTiming = 'No date set';
          let nextAction = company.nextAction;
          let nextActionDate = company.nextActionDate;
          
          // Auto-populate nextActionDate if missing (Skip Miller ProActive Selling timing)
          if (!nextActionDate) {
            const rank = company.globalRank || 1000;
            const lastActionDateForCalc = lastActionDate || company.createdAt;
            
            // Skip Miller timing based on prospect priority
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
          
          return {
            ...company,
            // Use computed lastAction if available, otherwise fall back to stored fields
            lastAction: lastActionText || company.lastAction,
            lastActionDate: lastActionDate || company.lastActionDate,
            lastActionTime: lastActionTime, // NEW: Timing text
            nextAction: nextAction || company.nextAction,
            nextActionDate: nextActionDate || company.nextActionDate,
            nextActionTiming: nextActionTiming, // NEW: Timing text
            lastActionType: lastAction?.type || null
          };
        } catch (error) {
          console.error(`❌ [COMPANIES API] Error computing lastAction for company ${company.id}:`, error);
          // Return original company data if computation fails
          return company;
        }
      }));

      result = {
        success: true,
        data: enrichedCompanies,
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
          filters: { search, status, priority, industry, sortBy, sortOrder },
          userId: context.userId,
          workspaceId: context.workspaceId,
        }
      };
    }

    // Cache the result
    responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    
    return NextResponse.json(result);

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

    // Validate database schema for debugging
    const schemaValidation = await validateCompaniesSchema();
    console.log('🔍 [V1 COMPANIES API] Schema validation:', schemaValidation);

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

    // Check for duplicate company before creating
    const companyName = body.name.trim();
    const existingCompany = await prisma.companies.findFirst({
      where: {
        workspaceId: context.workspaceId,
        name: {
          equals: companyName,
          mode: 'insensitive'
        },
        deletedAt: null
      },
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

    if (existingCompany) {
      console.log('🔄 [V1 COMPANIES API] Found existing company, returning it instead of creating duplicate:', {
        existingCompanyId: existingCompany.id,
        existingCompanyName: existingCompany.name,
        requestedName: companyName
      });
      
      return NextResponse.json({
        success: true,
        data: existingCompany,
        isExisting: true,
        meta: {
          message: 'Selected existing company',
        },
      });
    }

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

    // Clean and validate website URL only if it's being explicitly provided as a non-empty value
    if (body.website !== undefined && typeof body.website === 'string' && body.website.trim().length > 0) {
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

    // Create company data object outside transaction scope for error handler access
    const companyData = {
      name: body.name,
      workspaceId: context.workspaceId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add mainSellerId if provided, or auto-assign Dan for Adrata workspace
    if (body.mainSellerId) {
      companyData.mainSellerId = body.mainSellerId;
    } else if (context.workspaceId === '01K7464TNANHQXPCZT1FYX205V') {
      // Auto-assign Dan as main seller for Adrata workspace
      companyData.mainSellerId = '01K7B327HWN9G6KGWA97S1TK43';
      console.log('🎯 [V1 COMPANIES API] Auto-assigned Dan as main seller for Adrata workspace');
    }

    // Create company and action in a transaction
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
      console.log('🔍 [V1 COMPANIES API] Starting company creation...');
      
      console.log('🔍 [V1 COMPANIES API] Company data to create:', {
        fields: Object.keys(companyData),
        nonNullFields: Object.entries(companyData).filter(([_, value]) => value !== null && value !== undefined).map(([key, _]) => key),
        data: companyData
      });
      
      // Create company with fallback for column name issues
      let company;
      try {
        company = await tx.companies.create({
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
      } catch (createError) {
        // If mainSellerId column doesn't exist, try with assignedUserId (fallback for old schema)
        if (createError && typeof createError === 'object' && 'code' in createError && createError.code === 'P2022') {
          const prismaError = createError as any;
          if (prismaError.meta?.column_name === 'mainSellerId') {
            console.warn('⚠️ [V1 COMPANIES API] mainSellerId column not found, trying with assignedUserId (old schema)');
            
            // Create data object with assignedUserId instead of mainSellerId
            const fallbackData = { ...companyData };
            if (fallbackData.mainSellerId) {
              fallbackData.assignedUserId = fallbackData.mainSellerId;
              delete fallbackData.mainSellerId;
            }
            
            company = await tx.companies.create({
              data: fallbackData,
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
            
            console.log('✅ [V1 COMPANIES API] Company created with fallback schema (assignedUserId)');
          } else {
            throw createError; // Re-throw if it's a different column issue
          }
        } else {
          throw createError; // Re-throw if it's not a column issue
        }
      }

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

    // Generate strategy data for new company (async, don't await)
    setImmediate(async () => {
      try {
        const { autoStrategyPopulationService } = await import('@/platform/services/auto-strategy-population-service');
        await autoStrategyPopulationService.populateStrategiesForNewCompany(company.id);
        console.log('✅ [COMPANIES API] Generated strategy data for new company', company.id);
      } catch (error) {
        console.error('⚠️ [COMPANIES API] Failed to generate strategy data:', error);
        // Don't fail the request if strategy generation fails
      }
    });

    return NextResponse.json({
      success: true,
      data: company,
      isExisting: false,
      meta: {
        message: 'Company created successfully',
        userId: context.userId,
        workspaceId: context.workspaceId,
      },
    });

  } catch (error) {
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return createErrorResponse('Company with this information already exists', 'DUPLICATE_COMPANY', 400);
    }
    
    // Enhanced error logging for Prisma errors
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;
      console.error('❌ [V1 COMPANIES API] Prisma error details:', {
        code: prismaError.code,
        meta: prismaError.meta,
        message: prismaError.message,
        clientVersion: prismaError.clientVersion,
        stack: prismaError.stack
      });
      
      if (prismaError.code === 'P2022') {
        console.error('❌ [V1 COMPANIES API] P2022 Error - Column does not exist:', {
          columnName: prismaError.meta?.column_name,
          tableName: prismaError.meta?.table_name,
          schemaName: prismaError.meta?.schema_name,
          fullMeta: prismaError.meta,
          attemptedData: companyData,
          bodyReceived: body
        });
        
        // Check if it's the mainSellerId column issue
        if (prismaError.meta?.column_name === 'mainSellerId') {
          console.error('❌ [V1 COMPANIES API] mainSellerId column missing - likely migration not applied to production');
          return createErrorResponse(
            'Database schema mismatch: mainSellerId column not found. This indicates the database migration has not been applied to production.',
            'SCHEMA_MIGRATION_MISSING',
            500
          );
        }
        
        // Return a more specific error message
        return createErrorResponse(
          `Database column '${prismaError.meta?.column_name}' does not exist in table '${prismaError.meta?.table_name}'. This indicates a schema mismatch between the application and database.`,
          'SCHEMA_MISMATCH',
          500
        );
      }
      
      // Handle other Prisma errors
      if (prismaError.code === 'P2003') {
        console.error('❌ [V1 COMPANIES API] P2003 Error - Foreign key constraint failed:', {
          meta: prismaError.meta,
          attemptedData: companyData
        });
        return createErrorResponse(
          'Foreign key constraint failed - referenced record does not exist',
          'FOREIGN_KEY_ERROR',
          400
        );
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
