import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';
import { cache } from '@/platform/services/unified-cache';
import { IntelligentNextActionService } from '@/platform/services/IntelligentNextActionService';
import { findOrCreateCompany } from '@/platform/services/company-linking-service';
import { findOrCreateCorePerson, mergeCorePersonWithWorkspace } from '@/platform/services/core-entity-service';
import { addBusinessDays } from '@/platform/utils/actionUtils';
import { extractTitleWithFallback } from '@/platform/utils/extract-title-from-enrichment';

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
  
  console.log(`🚀 [V1 PEOPLE API] GET request started at ${new Date().toISOString()}`);
  console.log(`🔍 [V1 PEOPLE API] Request URL:`, request.url);
  
  try {
    console.log(`🔐 [V1 PEOPLE API] Starting authentication...`);
    
    // Authenticate and authorize user using unified auth system
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    console.log(`🔐 [V1 PEOPLE API] Auth result:`, {
      hasContext: !!authResult.context,
      hasResponse: !!authResult.response,
      contextKeys: authResult.context ? Object.keys(authResult.context) : 'no context',
      responseStatus: authResult.response?.status || 'no response'
    });
    
    const { context: authContext, response } = authResult;
    context = authContext; // Assign to outer scope variable

    if (response) {
      console.log(`❌ [V1 PEOPLE API] Authentication failed, returning error response:`, {
        status: response.status,
        statusText: response.statusText
      });
      return response; // Return error response if authentication failed
    }

    if (!context) {
      console.log(`❌ [V1 PEOPLE API] No context after auth, returning 401`);
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }
    
    console.log(`✅ [V1 PEOPLE API] Authentication successful:`, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      userEmail: context.user?.email || 'no email'
    });
    
    // CRITICAL FIX: Log warning if using fallback workspaceId, but allow query to proceed
    // secure-api-helper.ts now provides "local-workspace" fallback, so this should rarely be empty
    if (!context.workspaceId || context.workspaceId.trim() === '') {
      console.error('❌ [V1 PEOPLE API] Empty workspaceId in context:', {
        hasWorkspaceId: !!context.workspaceId,
        workspaceIdValue: context.workspaceId,
        userId: context.userId,
        userEmail: context.userEmail
      });
      return createErrorResponse(
        'Workspace ID is required but was not found in authentication context',
        'WORKSPACE_ID_REQUIRED',
        400
      );
    }
    
    // Log warning if using fallback workspaceId (will return empty results but won't error)
    if (context.workspaceId === 'local-workspace') {
      console.warn('⚠️ [V1 PEOPLE API] Using fallback workspaceId - queries may return empty results:', {
        workspaceId: context.workspaceId,
        userId: context.userId
      });
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Default 100, no cap
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const companyId = searchParams.get('companyId') || '';
    const excludeCompanyId = searchParams.get('excludeCompanyId') || ''; // NEW: Filter out people already linked to this company
    const includeAllUsers = searchParams.get('includeAllUsers') === 'true'; // NEW: Include all users regardless of seller assignment
    const vertical = searchParams.get('vertical') || '';
    const revenue = searchParams.get('revenue') || '';
    const timezone = searchParams.get('timezone') || '';
    // Use alphabetical sorting by default for all person queries (UX best practice)
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
    const isPartnerOS = searchParams.get('partneros') === 'true'; // 🚀 NEW: PartnerOS mode detection
    
    const offset = (page - 1) * limit;
    
    // 🚀 CACHE: Check Redis cache first (unless force refresh)
    const cacheKey = `people-${context.workspaceId}-${context.userId}-${section}-${status}-${excludeCompanyId}-${includeAllUsers}-${isPartnerOS}-${limit}-${page}`;
    
    // Define the fetch function for cache
    const fetchPeopleData = async () => {
      // Enhanced where clause for pipeline management
      // 🚀 PERFORMANCE: Reduced logging - only log key parameters
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [V1 PEOPLE API] Querying with workspace:', context.workspaceId, 'section:', section);
      }
      const where: any = {
        workspaceId: context.workspaceId, // Filter by user's workspace
        deletedAt: null, // Only show non-deleted records
        ...(includeAllUsers ? {} : {
          // Include records assigned to user OR unassigned (NULL) - consistent with counts API
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ]
        })
      };

      // 🚀 PARTNEROS FILTERING: Filter by relationshipType when in PartnerOS mode
      if (isPartnerOS) {
        where.relationshipType = {
          in: ['PARTNER', 'FUTURE_PARTNER']
        };
        console.log('🚀 [V1 PEOPLE API] PartnerOS mode enabled - filtering by relationshipType PARTNER/FUTURE_PARTNER');
      }

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

      // Pipeline status filtering (PROSPECT, ACTIVE, INACTIVE, LEAD, OPPORTUNITY)
      // Note: status is for pipeline stage, relationshipType is separate for CLIENT/PARTNER filtering
      // Track if we're using relationshipType so we can fall back if column doesn't exist
      let usingRelationshipType = false;
      if (status) {
        // For CLIENT/PARTNER filtering, use relationshipType instead of status
        if (status === 'CLIENT' || status === 'FUTURE_CLIENT') {
          where.relationshipType = {
            in: ['CLIENT', 'FUTURE_CLIENT']
          };
          usingRelationshipType = true;
        } else if (status === 'PARTNER' || status === 'FUTURE_PARTNER') {
          where.relationshipType = {
            in: ['PARTNER', 'FUTURE_PARTNER']
          };
          usingRelationshipType = true;
        } else {
          // For pipeline stages (LEAD, PROSPECT, OPPORTUNITY, etc.), use status
          where.status = status;
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

      // Exclude people already linked to a specific company (for AddPersonToCompanyModal)
      if (excludeCompanyId) {
        where.companyId = {
          not: excludeCompanyId
        };
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
        // Special handling for leads section to include companies with 0 people
        if (section === 'leads') {
          const peopleCountWhere: any = { ...where, status: 'LEAD' };
          const companyCountWhere: any = {
            workspaceId: context.workspaceId,
            deletedAt: null,
            OR: [
              { mainSellerId: context.userId },
              { mainSellerId: null }
            ],
            AND: [
              { people: { none: {} } }, // Companies with 0 people
              {
                OR: [
                  { status: 'LEAD' },
                  { status: null } // Include companies without status set
                ]
              }
            ]
          };
          
          // 🚀 PARTNEROS FILTERING: Filter by relationshipType when in PartnerOS mode
          if (isPartnerOS) {
            peopleCountWhere.relationshipType = {
              in: ['PARTNER', 'FUTURE_PARTNER']
            };
            companyCountWhere.relationshipType = {
              in: ['PARTNER', 'FUTURE_PARTNER']
            };
          }
          
          const [peopleCount, companyCount] = await Promise.all([
            prisma.people.count({ where: peopleCountWhere }),
            prisma.companies.count({ where: companyCountWhere })
          ]);
          
          return {
            success: true,
            data: { LEAD: peopleCount + companyCount },
            meta: {
              type: 'counts',
              filters: { search, status, priority, companyId }
            }
          };
        }

        // Special handling for prospects section to include companies with 0 people
        if (section === 'prospects') {
          const peopleCountWhere: any = { ...where, status: 'PROSPECT' };
          const companyCountWhere: any = {
            workspaceId: context.workspaceId,
            deletedAt: null,
            OR: [
              { mainSellerId: context.userId },
              { mainSellerId: null }
            ],
            AND: [
              { people: { none: {} } },
              { status: 'PROSPECT' }
            ]
          };
          
          // 🚀 PARTNEROS FILTERING: Filter by relationshipType when in PartnerOS mode
          if (isPartnerOS) {
            peopleCountWhere.relationshipType = {
              in: ['PARTNER', 'FUTURE_PARTNER']
            };
            companyCountWhere.relationshipType = {
              in: ['PARTNER', 'FUTURE_PARTNER']
            };
          }
          
          const [peopleCount, companyCount] = await Promise.all([
            prisma.people.count({ where: peopleCountWhere }),
            prisma.companies.count({ where: companyCountWhere })
          ]);
          
          return {
            success: true,
            data: { PROSPECT: peopleCount + companyCount },
            meta: {
              type: 'counts',
              filters: { search, status, priority, companyId }
            }
          };
        }

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

      // 🚀 PERFORMANCE: Reduced logging - only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [V1 PEOPLE API] Final where clause:`, JSON.stringify(where, null, 2));
      }

      // Optimized query with Prisma ORM for reliability
      // 🚀 PERFORMANCE: Use select instead of include for corePerson to reduce data transfer
      let people, totalCount;
      try {
        [people, totalCount] = await Promise.all([
          prisma.people.findMany({
            where,
            orderBy: { 
              [mappedSortField]: sortOrder 
            },
            skip: offset,
            take: limit,
            select: {
            // Select only fields needed for the response
            id: true,
            workspaceId: true,
            corePersonId: true,
            companyId: true,
            firstName: true,
            lastName: true,
            fullName: true,
            fullNameOverride: true,
            emailOverride: true,
            jobTitleOverride: true,
            displayName: true,
            jobTitle: true,
            email: true,
            workEmail: true,
            personalEmail: true,
            phone: true,
            mobilePhone: true,
            workPhone: true,
            linkedinUrl: true,
            status: true,
            priority: true,
            source: true,
            tags: true,
            customFields: true,
            notes: true,
            timezone: true,
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true,
            globalRank: true,
            companyRank: true,
            createdAt: true,
            updatedAt: true,
            entityId: true,
            deletedAt: true,
            mainSellerId: true,
            vertical: true,
            // Buyer group fields for consistency
            buyerGroupRole: true,
            influenceLevel: true,
            isBuyerGroupMember: true,
            buyerGroupStatus: true,
            buyerGroupOptimized: true,
            // Include relations with minimal fields
            corePerson: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true,
                email: true,
                workEmail: true,
                personalEmail: true,
                phone: true,
                mobilePhone: true,
                workPhone: true,
                linkedinUrl: true,
                jobTitle: true,
                companyName: true,
                currentCompany: true,
                currentRole: true,
                city: true,
                state: true,
                country: true,
                profilePictureUrl: true
              }
            },
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
            // 🚀 PERFORMANCE: Removed _count.actions to avoid N+1 queries - will batch count separately
          }
        }),
          prisma.people.count({ where }),
        ]);
      } catch (queryError: any) {
        // If relationshipType column doesn't exist (migration not run), fall back to query without it
        if (usingRelationshipType && queryError?.code === 'P2022' && queryError?.meta?.column_name === 'relationshipType') {
          console.warn('⚠️ [V1 PEOPLE API] relationshipType column not found, falling back to query without it');
          const fallbackWhere = { ...where };
          delete fallbackWhere.relationshipType;
          
          [people, totalCount] = await Promise.all([
            prisma.people.findMany({
              where: fallbackWhere,
              orderBy: { 
                [mappedSortField]: sortOrder 
              },
              skip: offset,
              take: limit,
              select: {
                // Select only fields needed for the response
                id: true,
                workspaceId: true,
                corePersonId: true,
                companyId: true,
                firstName: true,
                lastName: true,
                fullName: true,
                fullNameOverride: true,
                emailOverride: true,
                jobTitleOverride: true,
                displayName: true,
                jobTitle: true,
                email: true,
                workEmail: true,
                personalEmail: true,
                phone: true,
                mobilePhone: true,
                workPhone: true,
                linkedinUrl: true,
                status: true,
                priority: true,
                source: true,
                tags: true,
                customFields: true,
                notes: true,
                timezone: true,
                lastAction: true,
                lastActionDate: true,
                nextAction: true,
                nextActionDate: true,
                globalRank: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                corePerson: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    fullName: true,
                    email: true,
                    workEmail: true,
                    personalEmail: true,
                    phone: true,
                    mobilePhone: true,
                    workPhone: true,
                    linkedinUrl: true,
                    jobTitle: true,
                    companyName: true,
                    currentCompany: true,
                    currentRole: true,
                    city: true,
                    state: true,
                    country: true,
                    profilePictureUrl: true
                  }
                },
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
            prisma.people.count({ where: fallbackWhere }),
          ]);
        } else {
          // Re-throw if it's a different error
          throw queryError;
        }
      }

      // 🚀 PERFORMANCE: Reduced logging - only log summary
      console.log(`🔍 [V1 PEOPLE API] Query results: ${people.length} people, total: ${totalCount}`);

      // 🚀 MERGE CORE DATA: Merge core person data with workspace data
      const peopleWithCore = people.map(person => 
        mergeCorePersonWithWorkspace(person, person.corePerson || null)
      );

      // 🚀 PERFORMANCE FIX: Fetch all last actions AND action counts in batch queries instead of N+1 queries
      const personIds = peopleWithCore.map(p => p.id);
      const { isMeaningfulAction } = await import('@/platform/utils/meaningfulActions');
      
      // 🚀 PERFORMANCE: Use Promise.all to fetch actions and counts in parallel
      // Only fetch meaningful action types to reduce data transfer
      const [allLastActions, actionCounts] = await Promise.all([
        // Get all last actions for all people in one query
        // Filter by meaningful types in the query to reduce data transfer
        prisma.actions.findMany({
          where: {
            personId: { in: personIds },
            deletedAt: null,
            status: 'COMPLETED',
            // Filter meaningful actions at database level if possible
            // Note: We'll still filter in memory for types not easily filterable
          },
          orderBy: { completedAt: 'desc' },
          select: {
            personId: true,
            subject: true,
            completedAt: true,
            type: true,
            createdAt: true
          },
          // 🚀 PERFORMANCE: Limit to reduce data transfer - we only need the most recent per person
          // This is a trade-off: we get more than needed but it's still faster than N+1
        }),
        // 🚀 PERFORMANCE: Batch count actions for all people in one query
        prisma.actions.groupBy({
          by: ['personId'],
          where: {
            personId: { in: personIds },
            deletedAt: null,
            status: 'COMPLETED'
          },
          _count: {
            id: true
          }
        })
      ]);

      // Create maps for fast lookup
      const lastActionsMap = new Map<string, typeof allLastActions[0]>();
      const actionCountsMap = new Map<string, number>();
      
      // 🚀 PERFORMANCE: Map last actions (only meaningful actions, most recent first)
      // Process in a single pass for better performance
      for (const action of allLastActions) {
        if (isMeaningfulAction(action.type) && !lastActionsMap.has(action.personId)) {
          lastActionsMap.set(action.personId, action);
        }
      }
      
      // Map action counts
      for (const count of actionCounts) {
        if (count.personId) {
          actionCountsMap.set(count.personId, count._count.id);
        }
      }

      // 🚀 COMPUTE LAST ACTION: Enrich with actual last action from actions table
      const enrichedPeople = peopleWithCore.map((person) => {
        try {
          const lastAction = lastActionsMap.get(person.id);
          
          // Calculate lastActionTime for leads table display using meaningful actions (copy from speedrun)
          let lastActionTime = 'Never';
          let lastActionText = person.lastAction;
          let lastActionDate = person.lastActionDate;
          
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
          let nextAction = person.nextAction;
          let nextActionDate: string | null | undefined = person.nextActionDate;
          
          // Auto-populate nextActionDate if missing (Skip Miller ProActive Selling timing)
          if (!nextActionDate) {
            const rank = person.globalRank || 1000;
            const lastActionDateForCalc = lastActionDate || person.createdAt;
            
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
              nextActionDate = addBusinessDays(now, businessDaysToAdd).toISOString();
            } else {
              nextActionDate = calculatedDate.toISOString();
            }
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
          
          // 🎯 TITLE FALLBACK: Extract title from enrichment data if jobTitle is missing
          const extractedTitle = extractTitleWithFallback(
            null, // title field removed - use null
            person.jobTitle,
            person.customFields as any
          );
          const finalJobTitle = person.jobTitle || extractedTitle || null;
          
          const result = {
            ...person,
            // Use jobTitle only (title field removed from schema)
            jobTitle: finalJobTitle,
            // Use computed lastAction if available, otherwise fall back to stored fields
            lastAction: lastActionText || person.lastAction,
            lastActionDate: lastActionDate || person.lastActionDate,
            lastActionTime: lastActionTime, // NEW: Timing text
            nextAction: nextAction || person.nextAction,
            nextActionDate: nextActionDate || person.nextActionDate,
            nextActionTiming: nextActionTiming, // NEW: Timing text
            lastActionType: lastAction?.type || null,
            // 🚀 PERFORMANCE: Add action count from batched query
            _count: {
              actions: actionCountsMap.get(person.id) || 0
            }
          };
          
          // 🚀 PERFORMANCE: Removed per-person logging - only log errors
          // Logging every person significantly slows down the API with large datasets
          
          return result;
        } catch (error) {
          console.error(`❌ [PEOPLE API] Error computing lastAction for person ${person.id}:`, error);
          // Return original person data if computation fails
          return person;
        }
      });

      // Transform to use mainSeller terminology like speedrun
      const transformedPeople = enrichedPeople.map((person) => ({
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

      // 🚀 LEADS: Add companies with 0 people for leads section
      let allLeads = transformedPeople;
      if (section === 'leads') {
        // 🚀 PERFORMANCE: Reduced logging
        if (process.env.NODE_ENV === 'development') {
          console.log(`🏢 [V1 PEOPLE API] Fetching companies with 0 people for leads section`);
        }
        
        const companiesWhere: any = {
          workspaceId: context.workspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ],
          AND: [
            { people: { none: {} } }, // Companies with 0 people
            {
              OR: [
                { status: 'LEAD' },
                { status: null } // Include companies without status set
              ]
            }
          ]
        };
        
        // 🚀 PARTNEROS FILTERING: Filter by relationshipType when in PartnerOS mode
        if (isPartnerOS) {
          companiesWhere.relationshipType = {
            in: ['PARTNER', 'FUTURE_PARTNER']
          };
        }
        
        const companiesWithNoPeople = await prisma.companies.findMany({
          where: companiesWhere,
          select: {
            id: true,
            name: true,
            industry: true,
            status: true,
            priority: true,
            globalRank: true,
            lastAction: true,
            nextAction: true,
            lastActionDate: true,
            nextActionDate: true,
            mainSellerId: true,
            hqState: true,
            createdAt: true,
            updatedAt: true,
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
        });

        // 🚀 PERFORMANCE: Reduced logging
        if (process.env.NODE_ENV === 'development') {
          console.log(`🏢 [V1 PEOPLE API] Found ${companiesWithNoPeople.length} companies with 0 people`);
        }

        // Transform companies to look like person records
        const companyLeads = companiesWithNoPeople.map(company => ({
          id: company.id,
          fullName: company.name, // Use company name in name column
          firstName: null,
          lastName: null,
          email: null,
          jobTitle: null,
          title: null,
          phone: null,
          department: null,
          status: company.status || 'LEAD', // Use actual company status
          priority: company.priority,
          globalRank: company.globalRank,
          lastAction: company.lastAction,
          nextAction: company.nextAction,
          lastActionDate: company.lastActionDate,
          nextActionDate: company.nextActionDate,
          companyId: company.id,
          mainSellerId: company.mainSellerId,
          company: {
            id: company.id,
            name: company.name, // Show company name in company column too
            industry: company.industry,
            size: null,
            globalRank: company.globalRank,
            hqState: company.hqState
          },
          mainSeller: company.mainSeller 
            ? (company.mainSeller.id === context.userId
                ? 'Me'
                : company.mainSeller.firstName && company.mainSeller.lastName 
                  ? `${company.mainSeller.firstName} ${company.mainSeller.lastName}`.trim()
                  : company.mainSeller.name || company.mainSeller.email || '-')
            : '-',
          mainSellerData: company.mainSeller,
          isCompanyLead: true, // Flag to identify company records
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          _count: { actions: 0 }
        }));

        // Combine people and company leads
        allLeads = [...transformedPeople, ...companyLeads];
        console.log(`🏢 [V1 PEOPLE API] Combined leads: ${transformedPeople.length} people + ${companyLeads.length} companies = ${allLeads.length} total`);
      }

      // 🚀 PROSPECTS: Add companies with 0 people for prospects section
      if (section === 'prospects') {
        console.log(`🏢 [V1 PEOPLE API] Fetching companies with 0 people for prospects section`);
        
        const companiesWhere: any = {
          workspaceId: context.workspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ],
          AND: [
            { people: { none: {} } }, // Companies with 0 people
            { status: 'PROSPECT' }
          ]
        };
        
        // 🚀 PARTNEROS FILTERING: Filter by relationshipType when in PartnerOS mode
        if (isPartnerOS) {
          companiesWhere.relationshipType = {
            in: ['PARTNER', 'FUTURE_PARTNER']
          };
        }
        
        const companiesWithNoPeople = await prisma.companies.findMany({
          where: companiesWhere,
          select: {
            id: true,
            name: true,
            industry: true,
            status: true,
            priority: true,
            globalRank: true,
            lastAction: true,
            nextAction: true,
            lastActionDate: true,
            nextActionDate: true,
            mainSellerId: true,
            hqState: true,
            createdAt: true,
            updatedAt: true,
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
        });

        console.log(`🏢 [V1 PEOPLE API] Found ${companiesWithNoPeople.length} prospect companies with 0 people`);

        // Transform companies to look like person records
        const companyProspects = companiesWithNoPeople.map(company => ({
          id: company.id,
          fullName: company.name,
          firstName: null,
          lastName: null,
          email: null,
          jobTitle: null,
          title: null,
          phone: null,
          department: null,
          status: company.status || 'PROSPECT',
          priority: company.priority,
          globalRank: company.globalRank,
          lastAction: company.lastAction,
          nextAction: company.nextAction,
          lastActionDate: company.lastActionDate,
          nextActionDate: company.nextActionDate,
          companyId: company.id,
          mainSellerId: company.mainSellerId,
          company: {
            id: company.id,
            name: company.name,
            industry: company.industry,
            size: null,
            globalRank: company.globalRank,
            hqState: company.hqState
          },
          mainSeller: company.mainSeller 
            ? (company.mainSeller.id === context.userId
                ? 'Me'
                : company.mainSeller.firstName && company.mainSeller.lastName 
                  ? `${company.mainSeller.firstName} ${company.mainSeller.lastName}`.trim()
                  : company.mainSeller.name || company.mainSeller.email || '-')
            : '-',
          mainSellerData: company.mainSeller,
          isCompanyLead: true,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          _count: { actions: 0 }
        }));

        // Combine people and company prospects
        allLeads = [...transformedPeople, ...companyProspects];
        console.log(`🏢 [V1 PEOPLE API] Combined prospects: ${transformedPeople.length} people + ${companyProspects.length} companies = ${allLeads.length} total`);
      }

      // 🚀 DEDUPLICATION SAFETY: Remove any duplicate IDs before returning
      const seenIds = new Set();
      const deduplicatedLeads = allLeads.filter(lead => {
        if (seenIds.has(lead.id)) {
          console.warn(`⚠️ [V1 PEOPLE API] Duplicate ID detected and removed: ${lead.id} (${lead.fullName || lead.name})`);
          return false;
        }
        seenIds.add(lead.id);
        return true;
      });

      if (deduplicatedLeads.length !== allLeads.length) {
        console.warn(`⚠️ [V1 PEOPLE API] Removed ${allLeads.length - deduplicatedLeads.length} duplicate records from ${section} response`);
      }

      // 🚀 FIX: Calculate accurate totalCount for leads/prospects sections
      // For leads/prospects, we need to count companies with 0 people separately
      let accurateTotalCount = totalCount;
      if (section === 'leads') {
        const peopleWhere: any = {
          workspaceId: context.workspaceId,
          deletedAt: null,
          status: 'LEAD',
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ]
        };
        
        const companiesWhere: any = {
          workspaceId: context.workspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ],
          AND: [
            { people: { none: {} } },
            {
              OR: [
                { status: 'LEAD' },
                { status: null }
              ]
            }
          ]
        };
        
        // 🚀 PARTNEROS FILTERING: Filter by relationshipType when in PartnerOS mode
        if (isPartnerOS) {
          peopleWhere.relationshipType = {
            in: ['PARTNER', 'FUTURE_PARTNER']
          };
          companiesWhere.relationshipType = {
            in: ['PARTNER', 'FUTURE_PARTNER']
          };
        }
        
        const [peopleCount, companyCount] = await Promise.all([
          prisma.people.count({ where: peopleWhere }),
          prisma.companies.count({ where: companiesWhere })
        ]);
        accurateTotalCount = peopleCount + companyCount;
      } else if (section === 'prospects') {
        const peopleWhere: any = {
          workspaceId: context.workspaceId,
          deletedAt: null,
          status: 'PROSPECT',
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ]
        };
        
        const companiesWhere: any = {
          workspaceId: context.workspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: context.userId },
            { mainSellerId: null }
          ],
          AND: [
            { people: { none: {} } },
            { status: 'PROSPECT' }
          ]
        };
        
        // 🚀 PARTNEROS FILTERING: Filter by relationshipType when in PartnerOS mode
        if (isPartnerOS) {
          peopleWhere.relationshipType = {
            in: ['PARTNER', 'FUTURE_PARTNER']
          };
          companiesWhere.relationshipType = {
            in: ['PARTNER', 'FUTURE_PARTNER']
          };
        }
        
        const [peopleCount, companyCount] = await Promise.all([
          prisma.people.count({ where: peopleWhere }),
          prisma.companies.count({ where: companiesWhere })
        ]);
        accurateTotalCount = peopleCount + companyCount;
      } else {
        // For regular people section, totalCount already includes NULL mainSellerId records
        // since where clause now includes OR for NULL mainSellerId
        accurateTotalCount = totalCount;
      }

      const result = {
        success: true,
        data: deduplicatedLeads,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: {
            page,
            limit,
            totalCount: accurateTotalCount, // Use accurate database count, not array length
            totalPages: Math.ceil(accurateTotalCount / limit),
          },
          // Add compatibility fields for useFastSectionData hook
          count: accurateTotalCount,
          totalCount: accurateTotalCount,
          filters: { search, status, priority, companyId, excludeCompanyId, sortBy, sortOrder },
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

    // Validate status if provided
    const validStatuses = ['LEAD', 'PROSPECT', 'OPPORTUNITY', 'CLIENT', 'PARTNER', 'SUPERFAN'];
    if (body.status && !validStatuses.includes(body.status)) {
      return createErrorResponse(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        'VALIDATION_ERROR',
        400
      );
    }

    // Normalize linkedin field - handle both 'linkedin' and 'linkedinUrl' for backwards compatibility
    if (body.linkedin && !body.linkedinUrl) {
      body.linkedinUrl = body.linkedin;
    }

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

    // Auto-assign sequential globalRank if not provided
    let globalRank = body.globalRank;
    if (!globalRank) {
      // Find the highest existing globalRank for this user in this workspace
      const maxRankPerson = await prisma.people.findFirst({
        where: {
          workspaceId: context.workspaceId,
          mainSellerId: context.userId,
          deletedAt: null
        },
        select: { globalRank: true },
        orderBy: { globalRank: 'desc' }
      });
      
      globalRank = (maxRankPerson?.globalRank || 0) + 1;
      console.log(`🎯 [V1 PEOPLE API] Auto-assigned globalRank: ${globalRank}`);
    }

    // Link to core person entity (if enabled)
    let corePersonId: string | null = null;
    try {
      const corePersonResult = await findOrCreateCorePerson(body.firstName, body.lastName, {
        email: body.email,
        workEmail: body.workEmail,
        personalEmail: body.personalEmail,
        linkedinUrl: body.linkedinUrl,
        jobTitle: body.jobTitle,
        companyName: body.company,
        phone: body.phone || body.workPhone || body.mobilePhone
      });
      corePersonId = corePersonResult.id;
      console.log(`🔗 [V1 PEOPLE API] Linked to core person: ${corePersonResult.fullName} (${corePersonResult.id})`);
    } catch (coreError) {
      console.warn('⚠️ [V1 PEOPLE API] Failed to link to core person (non-blocking):', coreError);
      // Continue without core linking - person creation should still succeed
    }

    // Normalize name fields to prevent trailing spaces and ensure clean data
    const { normalizePersonNames, generateFullName, normalizeFullName } = await import('@/platform/utils/name-normalization');
    const normalizedNames = normalizePersonNames(body.firstName, body.lastName);
    const normalizedFullName = body.fullName 
      ? normalizeFullName(body.fullName)
      : generateFullName(normalizedNames.firstName, normalizedNames.lastName);

    // Create person and action in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create person
      const person = await tx.people.create({
        data: {
          firstName: normalizedNames.firstName,
          lastName: normalizedNames.lastName,
          fullName: normalizedFullName,
          ...(corePersonId && { corePersonId: corePersonId }),
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
          globalRank: globalRank,
          companyRank: body.companyRank || 0,
          workspaceId: context.workspaceId,
          companyId: body.companyId,
          mainSellerId: body.mainSellerId || context.userId, // Auto-assign current user as main seller
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
              personId: person.id,
              userId: '01K7469230N74BVGK2PABPNNZ9' // Ross's user ID
            }
          });
          console.log('🎯 [V1 PEOPLE API] Auto-assigned Ross as co-seller for Adrata workspace');
        } catch (coSellerError) {
          console.warn('⚠️ [V1 PEOPLE API] Could not add Ross as co-seller:', coSellerError);
          // Don't fail the entire request if co-seller assignment fails
        }
      }

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

    // Reverse linking: Link existing emails to this newly created person
    setImmediate(async () => {
      try {
        const { UnifiedEmailSyncService } = await import('@/platform/services/UnifiedEmailSyncService');
        
        // Collect all email addresses for this person
        const personEmails = [
          person.email,
          person.workEmail,
          person.personalEmail
        ].filter(Boolean) as string[];

        if (personEmails.length > 0) {
          const linkResult = await UnifiedEmailSyncService.linkExistingEmailsToPerson(
            person.id,
            context.workspaceId,
            personEmails
          );
          
          if (linkResult.linked > 0) {
            console.log(`✅ [PEOPLE API] Reverse-linked ${linkResult.linked} emails and created ${linkResult.actionsCreated} actions for new person ${person.id}`);
          }
        }
      } catch (error) {
        console.error('⚠️ [PEOPLE API] Failed to reverse-link emails (non-blocking):', error);
        // Don't fail the request if reverse linking fails
      }
    });

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

    // Generate strategy data for new person (async, don't await)
    setImmediate(async () => {
      try {
        const { getBaseUrl } = await import('@/lib/env-urls');
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/v1/strategy/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'x-request-id': request.headers.get('x-request-id') || ''
          },
          body: JSON.stringify({
            personId: person.id,
            recordType: 'person'
          })
        });
        
        if (response.ok) {
          console.log('✅ [PEOPLE API] Generated strategy data for new person', person.id);
        } else {
          console.warn('⚠️ [PEOPLE API] Strategy generation returned non-200 status:', response.status);
        }
      } catch (error) {
        console.error('⚠️ [PEOPLE API] Failed to generate strategy data:', error);
        // Don't fail the request if strategy generation fails
      }
    });

    // Auto-trigger enrichment/intelligence gathering (async, don't await)
    setImmediate(async () => {
      try {
        const { EnrichmentService } = await import('@/platform/services/enrichment-service');
        const authToken = request.headers.get('Authorization') || undefined;
        EnrichmentService.triggerEnrichmentAsync(
          'person',
          person.id,
          'create',
          context.workspaceId,
          authToken || undefined
        );
        console.log('🤖 [PEOPLE API] Auto-triggered enrichment check for new person', person.id);
      } catch (error) {
        console.error('⚠️ [PEOPLE API] Failed to trigger enrichment:', error);
        // Don't fail the request if enrichment trigger fails
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