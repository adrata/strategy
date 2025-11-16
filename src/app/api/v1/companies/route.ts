import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';
import { findOrCreateCoreCompany, mergeCoreCompanyWithWorkspace } from '@/platform/services/core-entity-service';
import { IntelligentNextActionService } from '@/platform/services/IntelligentNextActionService';
import { addBusinessDays } from '@/platform/utils/actionUtils';
import { OpportunityNameGenerationService } from '@/platform/services/OpportunityNameGenerationService';
import { DealValueEstimationService } from '@/platform/services/DealValueEstimationService';

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
const COMPANIES_CACHE_VERSION = 3; // Increment to bust cache when pagination logic changes

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
  
  console.log(`🚀 [V1 COMPANIES API] GET request started at ${new Date().toISOString()}`);
  console.log(`🔍 [V1 COMPANIES API] Request URL:`, request.url);
  console.log(`🔍 [V1 COMPANIES API] Request headers:`, Object.fromEntries(request.headers.entries()));
  
  try {
    console.log(`🔐 [V1 COMPANIES API] Starting authentication...`);
    
    // Authenticate and authorize user using unified auth system
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    console.log(`🔐 [V1 COMPANIES API] Auth result:`, {
      hasContext: !!authResult.context,
      hasResponse: !!authResult.response,
      contextKeys: authResult.context ? Object.keys(authResult.context) : 'no context',
      responseStatus: authResult.response?.status || 'no response'
    });
    
    const { context: authContext, response } = authResult;
    context = authContext; // Assign to outer scope variable

    if (response) {
      console.log(`❌ [V1 COMPANIES API] Authentication failed, returning error response:`, {
        status: response.status,
        statusText: response.statusText
      });
      return response; // Return error response if authentication failed
    }

    if (!context) {
      console.log(`❌ [V1 COMPANIES API] No context after auth, returning 401`);
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }
    
    console.log(`✅ [V1 COMPANIES API] Authentication successful:`, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      userEmail: context.user?.email || 'no email'
    });

    console.log(`📋 [V1 COMPANIES API] Parsing query parameters...`);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 10000); // Cap at 10000, default 100
    const search = (searchParams.get('search') || '').trim(); // Trim whitespace for consistent searching
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const industry = searchParams.get('industry') || '';
    // Use alphabetical sorting by default for all company queries (UX best practice)
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const countsOnly = searchParams.get('counts') === 'true';
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    const offset = (page - 1) * limit;
    
    console.log(`📋 [V1 COMPANIES API] Query parameters:`, {
      page, limit, search, status, priority, industry, sortBy, sortOrder, countsOnly, forceRefresh, offset
    });
    
    // 🔧 CRITICAL FIX: Override workspace ID from query params if present (for multi-workspace support)
    // This allows users to access workspaces other than their default JWT workspace
    let finalWorkspaceId = context.workspaceId;
    const queryWorkspaceId = searchParams.get('workspaceId');
    if (queryWorkspaceId) {
      finalWorkspaceId = queryWorkspaceId;
      console.log(`🔧 [V1 COMPANIES API] Overriding workspace ID from query param: ${context.workspaceId} -> ${finalWorkspaceId}`);
    }
    
    // Check cache first (skip if force refresh)
    // 🔧 PAGINATION FIX: Include cache version to bust old caches with incorrect counts
    const cacheKey = `companies-v${COMPANIES_CACHE_VERSION}-${finalWorkspaceId}-${status}-${priority}-${industry}-${search}-${sortBy}-${sortOrder}-${limit}-${countsOnly}-${page}`;
    const cached = responseCache.get(cacheKey);
    
    console.log(`💾 [V1 COMPANIES API] Cache check:`, {
      cacheKey,
      hasCached: !!cached,
      cacheAge: cached ? Date.now() - cached.timestamp : 'no cache',
      forceRefresh,
      cacheTTL: CACHE_TTL
    });
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📦 [V1 COMPANIES API] Returning cached data for key: ${cacheKey}`);
      return NextResponse.json(cached.data);
    }
    
    if (forceRefresh) {
      console.log(`🔄 [V1 COMPANIES API] Force refresh requested, bypassing cache`);
    }

    // Enhanced where clause for pipeline management
    console.log(`🔍 [V1 COMPANIES API] Querying with workspace: ${finalWorkspaceId}, user: ${context.userId}`);
    
    const where: any = {
      workspaceId: finalWorkspaceId, // Use final workspace ID (from URL or JWT)
      deletedAt: null, // Only show non-deleted records
      OR: [
        { mainSellerId: context.userId },
        { mainSellerId: null }
      ]
    };
    console.log(`🔍 [V1 COMPANIES API] Where clause:`, where);
    
    console.log(`🗄️ [V1 COMPANIES API] Starting database query...`);
    
    if (search) {
      const searchTerm = search.trim();
      
      // Only search if the search term is meaningful (at least 2 characters)
      if (searchTerm.length >= 2) {
        // Create intelligent search conditions with priority order
        const searchConditions = [];
        
        // Exact matches (highest priority)
        searchConditions.push(
          { name: { equals: searchTerm, mode: 'insensitive' } },
          { legalName: { equals: searchTerm, mode: 'insensitive' } },
          { tradingName: { equals: searchTerm, mode: 'insensitive' } }
        );
        
        // Starts with matches (high priority)
        searchConditions.push(
          { name: { startsWith: searchTerm, mode: 'insensitive' } },
          { legalName: { startsWith: searchTerm, mode: 'insensitive' } },
          { tradingName: { startsWith: searchTerm, mode: 'insensitive' } }
        );
        
        // Email exact matches
        searchConditions.push(
          { email: { equals: searchTerm, mode: 'insensitive' } }
        );
        
        // Website/domain exact matches
        searchConditions.push(
          { website: { equals: searchTerm, mode: 'insensitive' } },
          { domain: { equals: searchTerm, mode: 'insensitive' } }
        );
        
        // Email contains (for partial email matches)
        if (searchTerm.includes('@')) {
          searchConditions.push(
            { email: { contains: searchTerm, mode: 'insensitive' } }
          );
        }
        
        // Website/domain contains (for partial URL matches)
        if (searchTerm.includes('.') || searchTerm.includes('http')) {
          searchConditions.push(
            { website: { contains: searchTerm, mode: 'insensitive' } },
            { domain: { contains: searchTerm, mode: 'insensitive' } }
          );
        }
        
        // Name contains (only for longer search terms to avoid irrelevant matches)
        if (searchTerm.length >= 3) {
          searchConditions.push(
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { legalName: { contains: searchTerm, mode: 'insensitive' } },
            { tradingName: { contains: searchTerm, mode: 'insensitive' } }
          );
        }
        
        // Combine search with assignment filter
        where.AND = [
          {
            OR: [
              { mainSellerId: context.userId },
              { mainSellerId: null }
            ]
          },
          {
            OR: searchConditions
          }
        ];
        // Remove the top-level OR since we're using AND now
        delete where.OR;
      }
    }

    // Pipeline status filtering (PROSPECT, CLIENT, ACTIVE, INACTIVE, OPPORTUNITY)
    // For CLIENT status, also check additionalStatuses array
    if (status) {
      if (status === 'CLIENT') {
        // Check both primary status and additionalStatuses for CLIENT
        where.OR = [
          { status: 'CLIENT' as any },
          { additionalStatuses: { has: 'CLIENT' } }
        ];
        // If there's already an OR clause from search, we need to combine them
        // For now, we'll prioritize the status filter
      } else {
        where.status = status as any; // Type casting to handle Prisma enum validation
      }
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
      console.log(`🗄️ [V1 COMPANIES API] Executing main database query with where clause:`, where);
      
      const [companies, totalCount] = await Promise.all([
        prisma.companies.findMany({
          where,
          orderBy: { 
            [sortBy === 'rank' ? 'globalRank' : sortBy]: sortOrder 
          },
          skip: offset,
          take: limit,
          // 🚀 PERFORMANCE: Select only fields needed for list view (90% data reduction: 54MB → 6MB)
          select: {
            // Core fields
            id: true,
            name: true,
            workspaceId: true,
            
            // Display fields
            industry: true,
            status: true,
            priority: true,
            globalRank: true,
            description: true,
            descriptionEnriched: true,
            
            // Action tracking
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true,
            
            // Opportunity fields (for opportunities)
            opportunityAmount: true,
            opportunityStage: true,
            opportunityProbability: true,
            expectedCloseDate: true,
            // Use descriptionEnriched as opportunity summary (can be Claude-generated)
            // We'll add a script to generate these summaries
            
            // Additional useful fields
            email: true,
            website: true,
            linkedinUrl: true,
            state: true, // Include state field for table compatibility
            hqState: true,
            size: true,
            
            // Assignment
            mainSellerId: true,
            mainSeller: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            
            // Action count and people count for header display
            _count: {
              select: {
                actions: {
                  where: {
                    deletedAt: null,
                    status: 'COMPLETED'
                  }
                },
                people: {
                  where: {
                    deletedAt: null,
                    OR: [
                      { buyerGroupRole: { not: null } },
                      { isBuyerGroupMember: true },
                      { buyerGroupStatus: 'in' }
                    ]
                  }
                }
              }
            },
            
            // Metadata
            createdAt: true,
            updatedAt: true,
            deletedAt: true
          }
        }),
        prisma.companies.count({ where }),
      ]);

      console.log(`🗄️ [V1 COMPANIES API] Database query completed:`, {
        companiesFound: companies.length,
        totalCount,
        queryTime: Date.now() - startTime
      });

      // 🚀 PERFORMANCE: Skip core data merge since we're not fetching coreCompany
      // This saves additional processing time
      
      // 🚀 COMPUTE LAST ACTION: Use shared utility to compute accurate lastAction
      // Checks both company-level actions AND actions from associated people
      const { computeCompanyLastActionsBatch } = await import('@/platform/utils/company-last-action');
      const lastActionResults = await computeCompanyLastActionsBatch(
        companies.map(c => ({ id: c.id, lastAction: c.lastAction, lastActionDate: c.lastActionDate }))
      );
      
      const enrichedCompanies = await Promise.all(companies.map(async (company) => {
        try {
          const lastActionResult = lastActionResults.get(company.id);
          const lastActionText = lastActionResult?.lastAction || company.lastAction || null;
          const lastActionDate = lastActionResult?.lastActionDate || company.lastActionDate || null;
          const lastActionTime = lastActionResult?.lastActionTime || 'Never';

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
            
            // Calculate next action date from last action or creation date
            const calculatedDate = addBusinessDays(new Date(lastActionDateForCalc), businessDaysToAdd);
            
            // Ensure next action date is always in the future
            const now = new Date();
            if (calculatedDate.getTime() < now.getTime()) {
              // If calculated date is in the past, calculate from now instead
              nextActionDate = addBusinessDays(now, businessDaysToAdd);
            } else {
              nextActionDate = calculatedDate;
            }
          }
          
          // Auto-populate nextAction text if missing
          if (!nextAction) {
            // Special handling for OPPORTUNITY status companies
            if (company.status === 'OPPORTUNITY') {
              const opportunityStage = company.opportunityStage || 'QUALIFICATION';
              
              // Opportunity-specific next actions based on stage and engagement
              if (lastActionText && lastActionText !== 'No action taken') {
                const lastActionLower = lastActionText.toLowerCase();
                
                // Stage-based actions
                if (opportunityStage === 'QUALIFICATION' || opportunityStage === 'qualification') {
                  if (lastActionLower.includes('email') || lastActionLower.includes('outreach')) {
                    nextAction = 'Schedule discovery call to validate pain and qualify opportunity';
                  } else if (lastActionLower.includes('call') || lastActionLower.includes('meeting')) {
                    nextAction = 'Send qualification summary and next steps';
                  } else {
                    nextAction = 'Schedule discovery call to understand needs and timeline';
                  }
                } else if (opportunityStage === 'DISCOVERY' || opportunityStage === 'discovery') {
                  if (lastActionLower.includes('discovery') || lastActionLower.includes('call')) {
                    nextAction = 'Send discovery summary and stakeholder mapping request';
                  } else if (lastActionLower.includes('proposal') || lastActionLower.includes('quote')) {
                    nextAction = 'Follow up on proposal and address questions';
                  } else {
                    nextAction = 'Schedule stakeholder alignment call';
                  }
                } else if (opportunityStage === 'PROPOSAL' || opportunityStage === 'proposal') {
                  if (lastActionLower.includes('proposal') || lastActionLower.includes('quote')) {
                    nextAction = 'Follow up on proposal and address objections';
                  } else if (lastActionLower.includes('roi') || lastActionLower.includes('business case')) {
                    nextAction = 'Schedule executive alignment call';
                  } else {
                    nextAction = 'Send business case and ROI proposal';
                  }
                } else if (opportunityStage === 'NEGOTIATION' || opportunityStage === 'negotiation') {
                  if (lastActionLower.includes('negotiation') || lastActionLower.includes('contract')) {
                    nextAction = 'Navigate procurement and legal approvals';
                  } else if (lastActionLower.includes('proposal')) {
                    nextAction = 'Schedule negotiation call to finalize terms';
                  } else {
                    nextAction = 'Follow up on negotiation and close timeline';
                  }
                } else {
                  // Default opportunity action
                  nextAction = 'Schedule stakeholder alignment call';
                }
              } else {
                // No last action - start with discovery
                nextAction = 'Schedule discovery call to validate pain and qualify opportunity';
              }
            } else {
              // Non-opportunity companies - use existing logic
              // First check if company has people attached
              const topPerson = await prisma.people.findFirst({
                where: {
                  companyId: company.id,
                  workspaceId: finalWorkspaceId,
                  deletedAt: null
                },
                select: {
                  id: true,
                  fullName: true,
                  nextAction: true,
                  globalRank: true
                },
                orderBy: { globalRank: 'asc' }
              });

              if (topPerson?.nextAction) {
                // Use the person's next action
                nextAction = `Engage ${topPerson.fullName} - ${topPerson.nextAction}`;
              } else if (topPerson) {
                // Person exists but no next action - generate a basic one
                nextAction = `Engage ${topPerson.fullName} - Send introduction email`;
              } else {
                // No people at company - use company-level logic
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
                  nextAction = 'Research company and identify key contacts';
                }
              }
            }
          }
          
          // Save computed nextAction and nextActionDate to database if they were auto-generated
          // Do this asynchronously so it doesn't block the response
          if (nextAction && (!company.nextAction || nextAction !== company.nextAction)) {
            // Fire and forget - don't await, don't block response
            Promise.resolve().then(async () => {
              try {
                await prisma.companies.update({
                  where: { id: company.id },
                  data: {
                    nextAction: nextAction,
                    ...(nextActionDate && { nextActionDate: nextActionDate })
                  }
                });
                console.log(`✅ [COMPANIES API] Saved computed nextAction for company ${company.id}: ${nextAction}`);
              } catch (error) {
                console.error(`⚠️ [COMPANIES API] Failed to save nextAction for company ${company.id}:`, error);
                // Don't fail the request if saving fails
              }
            }).catch(err => {
              console.error(`⚠️ [COMPANIES API] Error in nextAction save promise:`, err);
            });
          } else if (nextActionDate && (!company.nextActionDate || nextActionDate.getTime() !== company.nextActionDate.getTime())) {
            // Only update nextActionDate if it changed
            Promise.resolve().then(async () => {
              try {
                await prisma.companies.update({
                  where: { id: company.id },
                  data: { nextActionDate: nextActionDate }
                });
                console.log(`✅ [COMPANIES API] Saved computed nextActionDate for company ${company.id}`);
              } catch (error) {
                console.error(`⚠️ [COMPANIES API] Failed to save nextActionDate for company ${company.id}:`, error);
                // Don't fail the request if saving fails
              }
            }).catch(err => {
              console.error(`⚠️ [COMPANIES API] Error in nextActionDate save promise:`, err);
            });
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
          
          // 🚀 ESTIMATE DEAL VALUE: If opportunity has no deal value, estimate it synchronously for immediate display
          let finalOpportunityAmount = company.opportunityAmount;
          if (company.status === 'OPPORTUNITY' && (!company.opportunityAmount || company.opportunityAmount === 0)) {
            try {
              const estimatedValue = await DealValueEstimationService.estimateDealValue(
                {
                  companyName: company.name || '',
                  industry: company.industry,
                  employeeCount: company.size || null,
                  revenue: company.revenue,
                  description: company.description,
                  descriptionEnriched: company.descriptionEnriched,
                  lastAction: lastActionText || company.lastAction
                },
                finalWorkspaceId
              );
              finalOpportunityAmount = estimatedValue;
              
              console.log(`💰 [COMPANIES API] Estimated deal value $${estimatedValue.toLocaleString()} for opportunity ${company.id} (${company.name})`);
              
              // Save estimated value asynchronously (don't block response)
              Promise.resolve().then(async () => {
                try {
                  await prisma.companies.update({
                    where: { id: company.id },
                    data: { opportunityAmount: estimatedValue }
                  });
                  console.log(`✅ [COMPANIES API] Saved estimated deal value $${estimatedValue.toLocaleString()} for opportunity ${company.id}`);
                } catch (error) {
                  console.error(`⚠️ [COMPANIES API] Failed to save estimated deal value for company ${company.id}:`, error);
                }
              }).catch(err => {
                console.error(`⚠️ [COMPANIES API] Error in deal value save promise:`, err);
              });
            } catch (error) {
              console.error(`⚠️ [COMPANIES API] Error estimating deal value for company ${company.id}:`, error);
              // Continue without estimation
            }
          }
          
          return {
            ...company,
            // Ensure state field is available (map hqState to state for table compatibility)
            state: company.hqState || company.state || null,
            hqState: company.hqState || null,
            // Use computed lastAction if available, otherwise fall back to stored fields
            lastAction: lastActionText || company.lastAction || null,
            lastActionDate: lastActionDate || company.lastActionDate || null,
            lastActionTime: lastActionTime, // NEW: Timing text
            nextAction: nextAction || company.nextAction || null,
            nextActionDate: nextActionDate || company.nextActionDate || null,
            nextActionTiming: nextActionTiming, // NEW: Timing text
            lastActionType: lastActionResult?.lastActionType || null,
            // Use estimated deal value if original was null/0
            opportunityAmount: finalOpportunityAmount || company.opportunityAmount || null
          };
        } catch (error) {
          console.error(`❌ [COMPANIES API] Error computing lastAction for company ${company.id}:`, error);
          // Return original company data if computation fails, but ensure state field exists
          return {
            ...company,
            state: company.hqState || company.state || null,
            hqState: company.hqState || null,
            lastAction: company.lastAction || null,
            lastActionDate: company.lastActionDate || null
          };
        }
      }));

      console.log(`🔧 [V1 COMPANIES API] Building response with enriched companies:`, {
        enrichedCount: enrichedCompanies.length,
        totalCount,
        processingTime: Date.now() - startTime
      });

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
    
    console.log(`✅ [V1 COMPANIES API] Returning successful response:`, {
      success: result.success,
      dataLength: result.data?.length || 0,
      totalTime: Date.now() - startTime,
      cacheKey
    });
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [V1 COMPANIES API] Error:', error);
    console.error('❌ [V1 COMPANIES API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      context: context ? { userId: context.userId, workspaceId: context.workspaceId } : 'no context'
    });
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error', 
      'INTERNAL_ERROR', 
      500
    );
  }
  
  // 🚨 CRITICAL: Catch-all return to prevent empty responses
  // This should never be reached, but ensures we never return undefined
  console.error('🚨 [V1 COMPANIES API] CRITICAL: Reached catch-all return - this should never happen!');
  return createErrorResponse(
    'Unexpected error - no response generated', 
    'NO_RESPONSE_ERROR', 
    500
  );
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

    // Normalize company name to prevent trailing spaces and ensure clean data
    const { normalizeName } = await import('@/platform/utils/name-normalization');
    const normalizedCompanyName = normalizeName(body.name);
    
    if (!normalizedCompanyName) {
      return createErrorResponse('Company name is required and must be a non-empty string', 'VALIDATION_ERROR', 400);
    }

    // Check for duplicate company before creating
    const companyName = normalizedCompanyName;
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

    // Auto-assign sequential globalRank if not provided
    let globalRank = body.globalRank;
    if (!globalRank) {
      // Find the highest existing globalRank for this user in this workspace
      const maxRankCompany = await prisma.companies.findFirst({
        where: {
          workspaceId: context.workspaceId,
          mainSellerId: context.userId,
          deletedAt: null
        },
        select: { globalRank: true },
        orderBy: { globalRank: 'desc' }
      });
      
      globalRank = (maxRankCompany?.globalRank || 0) + 1;
      console.log(`🎯 [V1 COMPANIES API] Auto-assigned globalRank: ${globalRank}`);
    }

    // Link to core company entity (if enabled)
    let coreCompanyId: string | null = null;
    try {
      const coreCompanyResult = await findOrCreateCoreCompany(companyName, {
        website: body.website,
        domain: body.domain,
        industry: body.industry,
        employeeCount: body.employeeCount,
        foundedYear: body.foundedYear,
        country: body.country,
        city: body.city
      });
      coreCompanyId = coreCompanyResult.id;
      console.log(`🔗 [V1 COMPANIES API] Linked to core company: ${coreCompanyResult.name} (${coreCompanyResult.id})`);
    } catch (coreError) {
      console.warn('⚠️ [V1 COMPANIES API] Failed to link to core company (non-blocking):', coreError);
      // Continue without core linking - company creation should still succeed
    }

    // For opportunities, generate title and estimate deal value if not provided
    let opportunityTitle: string | null = null;
    let estimatedDealValue: number | null = null;
    
    if (body.status === 'OPPORTUNITY' || body.status === 'opportunity') {
      try {
        // Generate opportunity title using Claude
        opportunityTitle = await OpportunityNameGenerationService.generateOpportunityTitle(
          normalizedCompanyName,
          {
            industry: body.industry,
            employeeCount: body.employeeCount,
            revenue: body.revenue,
            description: body.description,
            descriptionEnriched: body.descriptionEnriched,
            lastAction: body.lastAction,
            businessChallenges: body.businessChallenges || [],
            businessPriorities: body.businessPriorities || []
          },
          context.workspaceId
        );
        console.log(`📝 [V1 COMPANIES API] Generated opportunity title: ${opportunityTitle}`);
      } catch (error) {
        console.error('⚠️ [V1 COMPANIES API] Error generating opportunity title:', error);
        // Continue without title - will use company name
      }

      // Estimate deal value if not provided
      if (!body.opportunityAmount || body.opportunityAmount === 0) {
        try {
          estimatedDealValue = await DealValueEstimationService.estimateDealValue(
            {
              companyName: normalizedCompanyName,
              industry: body.industry,
              employeeCount: body.employeeCount,
              revenue: body.revenue,
              description: body.description,
              descriptionEnriched: body.descriptionEnriched,
              businessChallenges: body.businessChallenges || [],
              businessPriorities: body.businessPriorities || [],
              lastAction: body.lastAction
            },
            context.workspaceId
          );
          console.log(`💰 [V1 COMPANIES API] Estimated deal value: $${estimatedDealValue.toLocaleString()}`);
        } catch (error) {
          console.error('⚠️ [V1 COMPANIES API] Error estimating deal value:', error);
          // Continue without estimation - will use provided value or default
        }
      }
    }

    // Create company data object outside transaction scope for error handler access
    const companyData: any = {
      name: opportunityTitle || normalizedCompanyName, // Use generated title if available, otherwise company name
      workspaceId: context.workspaceId,
      state: body.state || null,
      status: body.status || 'ACTIVE', // Use provided status or default to ACTIVE
      globalRank: globalRank,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(coreCompanyId && { coreCompanyId: coreCompanyId }),
      // Include optional fields if provided and non-empty
      ...(body.website && body.website.trim() && { website: body.website }),
      ...(body.email && body.email.trim() && { email: body.email.trim() }),
      ...(body.notes && body.notes.trim() && { notes: body.notes.trim() }),
      ...(body.linkedin && body.linkedin.trim() && { linkedinUrl: body.linkedin.trim() }),
      // Opportunity fields
      ...(body.opportunityAmount !== undefined && body.opportunityAmount !== null && body.opportunityAmount !== 0 
        ? { opportunityAmount: parseFloat(body.opportunityAmount) }
        : estimatedDealValue !== null 
        ? { opportunityAmount: estimatedDealValue }
        : {}),
      ...(body.opportunityProbability !== undefined && body.opportunityProbability !== null && { opportunityProbability: parseFloat(body.opportunityProbability) }),
      ...(body.opportunityStage && { opportunityStage: body.opportunityStage }),
      ...(body.expectedCloseDate && { expectedCloseDate: new Date(body.expectedCloseDate) }),
      ...(body.customFields && { customFields: body.customFields }),
      // Store original company name in customFields if we're using generated title
      ...(opportunityTitle && opportunityTitle !== normalizedCompanyName && {
        customFields: {
          ...(body.customFields || {}),
          originalCompanyName: normalizedCompanyName,
          opportunityTitle: opportunityTitle
        }
      })
    };

    // Always set mainSellerId to current user
    companyData.mainSellerId = context.userId;
    console.log('🎯 [V1 COMPANIES API] Assigned current user as main seller:', context.userId);

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

    // Auto-trigger enrichment/intelligence gathering (async, don't await)
    setImmediate(async () => {
      try {
        const { EnrichmentService } = await import('@/platform/services/enrichment-service');
        const authToken = request.headers.get('Authorization') || undefined;
        EnrichmentService.triggerEnrichmentAsync(
          'company',
          company.id,
          'create',
          context.workspaceId,
          authToken || undefined
        );
        console.log('🤖 [COMPANIES API] Auto-triggered enrichment check for new company', company.id);
      } catch (error) {
        console.error('⚠️ [COMPANIES API] Failed to trigger enrichment:', error);
        // Don't fail the request if enrichment trigger fails
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