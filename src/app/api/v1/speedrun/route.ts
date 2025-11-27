import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { cache } from '@/platform/services/unified-cache';
import { isMeaningfulAction } from '@/platform/utils/meaningfulActions';

// 🚀 PERFORMANCE: Aggressive caching for speedrun data (rarely changes)
const SPEEDRUN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const SPEEDRUN_CACHE_VERSION = 3; // Increment to bust cache when pagination logic changes

/**
 * 🚀 SPEEDRUN API v1 - LIGHTNING FAST
 * 
 * Dedicated optimized endpoint for speedrun data
 * - Top 50 people with companies (prioritizes ranked people, includes unranked)
 * - Only includes people with company relationships
 * - Ordered by globalRank descending (50-1), then by creation date
 * - Pre-formatted response (no transformation needed)
 * - Aggressive Redis caching (5 min TTL)
 * - Leverages composite indexes for <200ms queries
 */

// GET /api/v1/speedrun - Get top 50 speedrun prospects
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Cap at 100, default 50
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0); // Default 0, minimum 0
    const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.get('t'); // Force refresh if timestamp provided
    const isPartnerOS = searchParams.get('partneros') === 'true'; // 🚀 NEW: PartnerOS mode detection
    
    // 🚀 CACHE: Check Redis cache first (unless force refresh)
    // 🚀 FIX: Include isPartnerOS in cache key to prevent stale PartnerOS-filtered results
    // 🔧 PAGINATION FIX: Include cache version to bust old caches with incorrect counts
    const cacheKey = `speedrun-v${SPEEDRUN_CACHE_VERSION}-${context.workspaceId}-${context.userId}-${limit}-${offset}-${isPartnerOS}`;
    
    // Define the fetch function for cache
    const fetchSpeedrunData = async () => {
      // User assignment filters are now applied universally for proper data isolation
      
      console.log(`🚀 [SPEEDRUN API] Loading top ${limit} speedrun prospects for workspace: ${context.workspaceId}, user: ${context.userId}`);

      // 🔍 DIAGNOSTIC: Check what data actually exists
      let peopleWithCompanies, peopleWithRank, peopleWithBoth;
      try {
        [peopleWithCompanies, peopleWithRank, peopleWithBoth] = await Promise.all([
          prisma.people.count({
            where: {
              workspaceId: context.workspaceId,
              deletedAt: null,
              companyId: { not: null },
              mainSellerId: context.userId // Only assigned to this user
            }
          }),
          prisma.people.count({
            where: {
              workspaceId: context.workspaceId,
              deletedAt: null,
              globalRank: { not: null },
              mainSellerId: context.userId // Only assigned to this user
            }
          }),
          prisma.people.count({
            where: {
              workspaceId: context.workspaceId,
              deletedAt: null,
              companyId: { not: null },
              globalRank: { not: null },
              mainSellerId: context.userId // Only assigned to this user
            }
          })
        ]);
      } catch (dbError) {
        console.error('❌ [SPEEDRUN API] Database count query failed:', dbError);
        throw new Error(`Database query failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      }

      console.log(`🔍 [SPEEDRUN API] Data diagnostic:`, {
        peopleWithCompanies,
        peopleWithRank,
        peopleWithBoth,
        willShowData: peopleWithBoth > 0
      });

      // 🎯 UNIFIED SPEEDRUN RANKING: Get both companies (without people) and people for Speedrun
      // Companies are only included if they have NO people
      // People are included from companies that HAVE people
      let speedrunRecords = [];
      try {
        // 🎯 SMART FILTERING: Calculate date thresholds (exclude contacts from today/yesterday only)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        
        // 1. Get companies without people (these get Speedrun ranks)
        // 🚀 PERFORMANCE: Filter by globalRank to use index and limit scan
        // 🚀 SPEEDRUN FILTERING: Exclude companies contacted today or yesterday (allow older contacts)
        const companiesWhere: any = {
          workspaceId: context.workspaceId,
          deletedAt: null,
          mainSellerId: context.userId, // Only companies assigned to this user
          globalRank: { not: null, gte: 1, lte: 50 }, // Only companies with ranks 1-50 for performance
          // Only companies with 0 people
          people: {
            none: {
              deletedAt: null,
              mainSellerId: context.userId // Only people assigned to this user
            }
          },
          // 🚀 FILTER: Exclude records contacted today or yesterday (include older contacts or never contacted)
          OR: [
            { lastActionDate: null }, // No action date = include them
            { lastActionDate: { lt: yesterday } } // Action before yesterday = include them (excludes today and yesterday)
          ]
        };
        
        // 🚀 PARTNEROS FILTERING: Filter by relationshipType when in PartnerOS mode
        if (isPartnerOS) {
          companiesWhere.relationshipType = {
            in: ['PARTNER', 'FUTURE_PARTNER']
          };
          console.log('🚀 [SPEEDRUN API] PartnerOS mode enabled - filtering companies by relationshipType PARTNER/FUTURE_PARTNER');
        }
        
        // 🏆 FIX: Fetch more records initially to account for filtering (fetch up to 200 to ensure we have enough after filtering)
        const companiesWithoutPeople = await prisma.companies.findMany({
          where: companiesWhere,
          select: {
            id: true,
            name: true,
            globalRank: true,
            status: true,
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true,
            mainSellerId: true,
            workspaceId: true,
            createdAt: true,
            updatedAt: true,
            customFields: true, // Include customFields for AI context (intelligence data)
            mainSeller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: [
            { globalRank: 'asc' }, // Sort by rank ascending (1-50) to get top priority first
            { createdAt: 'desc' } // Fallback to creation date
          ],
          take: 200 // 🏆 FIX: Fetch more records initially to ensure we have enough after filtering meaningful actions
        });

        // 2. Get people from companies that have people (these get Speedrun ranks)
        // 🚀 PERFORMANCE: Filter by globalRank to use index and limit scan
        // 🚀 SPEEDRUN FILTERING: Exclude people contacted today or yesterday (allow older contacts)
        const { isMeaningfulAction } = await import('@/platform/utils/meaningfulActions');
        
        const peopleWhere: any = {
          workspaceId: context.workspaceId,
          deletedAt: null,
          companyId: { not: null }, // Only people with company relationships
          mainSellerId: context.userId, // Only people assigned to this user
          globalRank: { not: null, gte: 1, lte: 50 }, // Only people with ranks 1-50 for performance
          // 🚀 FILTER: Exclude records contacted today or yesterday (include older contacts or never contacted)
          OR: [
            { lastActionDate: null }, // No action date = include them
            { lastActionDate: { lt: yesterday } } // Action before yesterday = include them (excludes today and yesterday)
          ]
        };
        
        // 🚀 PARTNEROS FILTERING: Filter by relationshipType when in PartnerOS mode
        if (isPartnerOS) {
          peopleWhere.relationshipType = {
            in: ['PARTNER', 'FUTURE_PARTNER']
          };
          console.log('🚀 [SPEEDRUN API] PartnerOS mode enabled - filtering people by relationshipType PARTNER/FUTURE_PARTNER');
        }
        
        // 🏆 FIX: Fetch more records initially to account for filtering (fetch up to 200 to ensure we have enough after filtering)
        const peopleFromCompaniesWithPeople = await prisma.people.findMany({
          where: peopleWhere,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            jobTitle: true,
            phone: true,
            linkedinUrl: true,
            linkedinNavigatorUrl: true,
            status: true,
            globalRank: true,
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true,
            buyerGroupRole: true,
            influenceLevel: true,
            engagementStrategy: true,
            buyerGroupStatus: true,
            isBuyerGroupMember: true,
            mainSellerId: true,
            workspaceId: true,
            createdAt: true,
            updatedAt: true,
            notes: true,
            customFields: true, // Include customFields for AI context (intelligence data)
            company: {
              select: {
                id: true,
                name: true
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
          },
          orderBy: [
            { globalRank: 'asc' }, // Sort by rank ascending (1-50) to get top priority first
            { createdAt: 'desc' } // Fallback to creation date
          ],
          take: 200 // 🏆 FIX: Fetch more records initially to ensure we have enough after filtering meaningful actions
        });

        // 3. Combine and sort by globalRank (descending: 50-1)
        const allRecords = [
          ...companiesWithoutPeople.map(company => ({
            ...company,
            type: 'company',
            isCompanyLead: true, // Add flag for consistency with leads/prospects
            displayName: company.name,
            fullName: company.name, // For NAME column
            name: company.name, // Fallback for NAME column
            companyName: company.name, // For COMPANY column
            company: company.name, // For COMPANY column as string
            status: 'PROSPECT', // Set stage to PROSPECT
            jobTitle: null,
            phone: null,
            linkedinUrl: null,
            buyerGroupRole: null,
            influenceLevel: null,
            engagementStrategy: null,
            buyerGroupStatus: null,
            isBuyerGroupMember: null
          })),
          ...peopleFromCompaniesWithPeople.map(person => ({
            ...person,
            type: 'person',
            displayName: person.fullName,
            companyName: person.company?.name || 'Unknown'
          }))
        ];

        // Sort by globalRank ascending (1-50) - rank 1 is highest priority
        allRecords.sort((a, b) => {
          // First sort by globalRank if both have it
          if (a.globalRank && b.globalRank) {
            return a.globalRank - b.globalRank; // Ascending: 1-50 (rank 1 = highest priority)
          }
          // If only one has rank, prioritize it
          if (a.globalRank && !b.globalRank) return -1;
          if (!a.globalRank && b.globalRank) return 1;
          // If neither has rank, sort by creation date (newest first)
          const aDate = new Date(a.createdAt).getTime();
          const bDate = new Date(b.createdAt).getTime();
          return bDate - aDate;
        });
        
        // 🏆 FIX: Don't limit here - we'll filter meaningful actions first, then limit to top 50
        // Assign sequential ranks (1, 2, 3, ...) for proper display
        speedrunRecords = allRecords.map((record, index) => ({
          ...record,
          displayRank: index + 1, // Sequential rank: 1, 2, 3, ...
          globalRank: record.globalRank || (index + 1) // Use existing rank or assign sequential
        }));
        
      } catch (error) {
        console.error('❌ Error fetching Speedrun records:', error);
        speedrunRecords = [];
      }

      console.log(`🔍 [SPEEDRUN API] Query returned ${speedrunRecords.length} records:`, 
        speedrunRecords.slice(0, 10).map(p => ({
          name: p.displayName,
          rank: p.globalRank,
          company: p.companyName,
          type: p.type
        }))
      );

      // 🚀 BATCH QUERY ACTIONS: Get action counts AND filter out records with meaningful actions from today/yesterday
      // Calculate date thresholds for action filtering
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const personIds = speedrunRecords
        .filter(r => r.type === 'person')
        .map(r => r.id);
      
      const companyIds = speedrunRecords
        .filter(r => r.type === 'company')
        .map(r => r.id);
      
      let actionCountsMap: Record<string, number> = {};
      const recordsWithRecentMeaningfulActions = new Set<string>();
      
      if (personIds.length > 0) {
        try {
          // Query 1: Get ALL meaningful actions for action counts (display purposes)
          const allActions = await prisma.actions.findMany({
            where: {
              personId: { in: personIds },
              status: 'COMPLETED'
            },
            select: {
              personId: true,
              type: true
            }
          });

          // Count ALL meaningful actions per person for display
          for (const action of allActions) {
            if (action.personId && isMeaningfulAction(action.type)) {
              actionCountsMap[action.personId] = (actionCountsMap[action.personId] || 0) + 1;
            }
          }

          // Query 2: Get recent meaningful actions (today/yesterday) for filtering
          const recentActions = await prisma.actions.findMany({
            where: {
              personId: { in: personIds },
              status: 'COMPLETED',
              createdAt: { gte: yesterday } // Only actions from yesterday or today
            },
            select: {
              personId: true,
              type: true
            }
          });

          // Track which records have recent meaningful actions (for filtering)
          for (const action of recentActions) {
            if (action.personId && isMeaningfulAction(action.type)) {
              recordsWithRecentMeaningfulActions.add(action.personId);
            }
          }

          console.log(`🔍 [SPEEDRUN API] Action counts queried: ${Object.keys(actionCountsMap).length} people with actions, ${recordsWithRecentMeaningfulActions.size} with recent actions`);
        } catch (actionError) {
          console.error('❌ [SPEEDRUN API] Error querying actions:', actionError);
          // Continue with empty map if action query fails
        }
      }
      
      // Also check company actions
      if (companyIds.length > 0) {
        try {
          const companyActions = await prisma.actions.findMany({
            where: {
              companyId: { in: companyIds },
              status: 'COMPLETED',
              createdAt: { gte: yesterday } // Only actions from yesterday or today
            },
            select: {
              companyId: true,
              type: true,
              createdAt: true
            }
          });
          
          for (const action of companyActions) {
            if (action.companyId && isMeaningfulAction(action.type)) {
              // Track records with recent meaningful actions for filtering
              recordsWithRecentMeaningfulActions.add(action.companyId);
            }
          }
        } catch (actionError) {
          console.error('❌ [SPEEDRUN API] Error querying company actions:', actionError);
        }
      }
      
      // 🚀 FILTER: Remove records that have meaningful actions from today or yesterday only
      speedrunRecords = speedrunRecords.filter(record => {
        const recordId = record.id;
        const hasRecentMeaningfulAction = recordsWithRecentMeaningfulActions.has(recordId);
        
        // Check lastAction/lastActionDate fields - exclude if contacted today or yesterday
        const lastAction = record.lastAction;
        const lastActionDate = record.lastActionDate;
        
        // Exclude if has recent meaningful action (from today/yesterday)
        if (hasRecentMeaningfulAction) {
          console.log(`🚫 [SPEEDRUN API] Filtering out ${record.displayName || record.name} - has meaningful action from today/yesterday`);
          return false;
        }
        
        // Check lastActionDate - exclude if it's from today or yesterday and indicates meaningful action
        if (lastActionDate) {
          const actionDate = new Date(lastActionDate);
          const actionDateOnly = new Date(actionDate.getFullYear(), actionDate.getMonth(), actionDate.getDate());
          
          // If lastActionDate is today or yesterday, check if it's a meaningful action
          if (actionDateOnly >= yesterday) {
            const hasNonMeaningfulLastAction = !lastAction || 
              lastAction === 'No action taken' ||
              lastAction === 'Record created' ||
              lastAction === 'Company record created' ||
              lastAction === 'Record added';
            
            // If lastAction exists and is meaningful (not in the non-meaningful list), exclude
            if (!hasNonMeaningfulLastAction) {
              console.log(`🚫 [SPEEDRUN API] Filtering out ${record.displayName || record.name} - lastAction: ${lastAction}, lastActionDate: ${lastActionDate} (today/yesterday)`);
              return false;
            }
          }
        }
        
        return true;
      });
      
      console.log(`🔍 [SPEEDRUN API] After filtering recent meaningful actions (today/yesterday): ${speedrunRecords.length} records remaining`);
      
      // 🏆 FIX: Now limit to top 50 AFTER filtering meaningful actions
      speedrunRecords = speedrunRecords.slice(0, 50);

      // 🚀 TRANSFORM: Pre-format data for frontend (unified companies and people)
      const speedrunPeopleData = speedrunRecords.map((record, index) => {
        // Format owner name - show "Me" for current user
        const ownerName = record.mainSeller 
          ? (record.mainSeller.id === context.userId
              ? 'Me'
              : record.mainSeller.firstName && record.mainSeller.lastName 
                ? `${record.mainSeller.firstName} ${record.mainSeller.lastName}`.trim()
                : record.mainSeller.name || record.mainSeller.email || '-')
          : '-';

        // Format co-sellers names - exclude current user from co-sellers list
        const coSellersNames = record.coSellers && record.coSellers.length > 0
          ? record.coSellers
              .filter((coSeller: any) => coSeller.user.id !== context.userId) // Exclude current user
              .map((coSeller: any) => {
                const user = coSeller.user;
                return user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`.trim()
                  : user.name || user.email || 'Unknown';
              }).join(', ')
          : '-';

        // Calculate lastActionTime for speedrun table display using meaningful actions
        let lastActionTime = 'Never';
        let lastAction = record.lastAction;
        let lastActionDate = record.lastActionDate;
        
        // lastAction is now a scalar field, so use it directly
        // If we need to get the most recent meaningful action, we'll use the actions relation
        
        // Only show real last actions if they exist and are meaningful
        if (lastActionDate && lastAction && lastAction !== 'No action taken' && lastAction !== 'Record created' && lastAction !== 'Company record created') {
          const now = new Date();
          const actionDate = new Date(lastActionDate);
          const diffMs = now.getTime() - actionDate.getTime();
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          
          if (diffMinutes < 1) lastActionTime = 'Just now';
          else if (diffMinutes < 60) lastActionTime = `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
          else if (diffHours < 24) lastActionTime = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
          else if (diffDays === 1) lastActionTime = 'Yesterday';
          else if (diffDays <= 7) lastActionTime = `${diffDays} days ago`;
          else if (diffDays <= 30) lastActionTime = `${Math.floor(diffDays / 7)} weeks ago`;
          else lastActionTime = `${Math.floor(diffDays / 30)} months ago`;
        } else {
          // No meaningful action - set standard text
          lastAction = 'Record added';
        }
        // If no meaningful action exists, lastActionTime remains 'Never'

        // Calculate nextActionTiming for speedrun table display
        let nextActionTiming = 'No date set';
        const nextActionDate = record.nextActionDate;
        
        if (nextActionDate) {
          const now = new Date();
          const actionDate = new Date(nextActionDate);
          const diffMs = actionDate.getTime() - now.getTime();
          
          // Calculate actual timing based on date difference
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          
          // For speedrun people, if it's the same day, show "Today" regardless of time
          const isSameDay = now.toDateString() === actionDate.toDateString();
          
          if (isSameDay) {
            nextActionTiming = 'Today';
          } else if (diffMs < 0) {
            // Past due (different day)
            nextActionTiming = 'Overdue';
          } else if (diffHours < 2) {
            nextActionTiming = 'Now';
          } else if (diffHours < 24) {
            nextActionTiming = `in ${diffHours}h`;
          } else if (diffDays === 1) {
            nextActionTiming = 'Tomorrow';
          } else if (diffDays <= 7) {
            nextActionTiming = `in ${diffDays}d`;
          } else {
            nextActionTiming = `in ${Math.ceil(diffDays / 7)}w`;
          }
        } else {
          // If no date set, show "No date set"
          nextActionTiming = 'No date set';
        }

        // Auto-populate nextAction if missing (for both people and companies)
        let nextAction = record.nextAction;
        let calculatedNextActionDate = record.nextActionDate;

        if (!nextAction) {
          if (record.type === 'company') {
            // Company-level next action generation
            if (lastAction && lastAction !== 'Record added' && lastAction !== 'Company record created') {
              if (lastAction.toLowerCase().includes('email')) {
                nextAction = 'Schedule discovery call to validate pain';
              } else if (lastAction.toLowerCase().includes('call') || lastAction.toLowerCase().includes('discovery')) {
                nextAction = 'Send follow-up email with pain validation insights';
              } else if (lastAction.toLowerCase().includes('linkedin')) {
                nextAction = 'Schedule discovery call to validate pain';
              } else {
                nextAction = 'Schedule stakeholder mapping call';
              }
            } else {
              // No meaningful action - PROSPECT stage default
              nextAction = 'Research company and identify key contacts';
            }
          } else {
            // Person-level next action generation
            if (lastAction && lastAction !== 'Record added') {
              if (lastAction.toLowerCase().includes('email')) {
                nextAction = 'Schedule a call to discuss next steps';
              } else if (lastAction.toLowerCase().includes('call')) {
                nextAction = 'Send follow-up email with meeting notes';
              } else if (lastAction.toLowerCase().includes('linkedin')) {
                nextAction = 'Send personalized connection message';
              } else {
                nextAction = 'Follow up on previous contact';
              }
            } else {
              nextAction = 'Send initial outreach email';
            }
          }
          
          // Calculate nextActionDate based on globalRank if missing
          if (!calculatedNextActionDate) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (!record.globalRank || record.globalRank <= 50) {
              calculatedNextActionDate = today; // Top 50: TODAY
            } else if (record.globalRank <= 200) {
              calculatedNextActionDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
            } else {
              calculatedNextActionDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
            }
            
            // Recalculate nextActionTiming with new date
            const diffMs = calculatedNextActionDate.getTime() - now.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const isSameDay = now.toDateString() === calculatedNextActionDate.toDateString();
            
            if (isSameDay) {
              nextActionTiming = 'Today';
            } else if (diffMs < 0) {
              nextActionTiming = 'Overdue';
            } else if (diffHours < 2) {
              nextActionTiming = 'Now';
            } else if (diffHours < 24) {
              nextActionTiming = `in ${diffHours}h`;
            } else if (diffDays === 1) {
              nextActionTiming = 'Tomorrow';
            } else if (diffDays <= 7) {
              nextActionTiming = `in ${diffDays}d`;
            } else {
              nextActionTiming = `in ${Math.ceil(diffDays / 7)}w`;
            }
          }
        }

        // Get action count from batch query (only for people, not companies)
        const meaningfulActionCount = record.type === 'person' 
          ? (actionCountsMap[record.id] || 0)
          : 0;
        
        // Debug logging for action counts - show more details for high counts
        if (index < 5 || meaningfulActionCount > 50) { // Log first 5 records OR any with high counts
          console.log(`🔍 [SPEEDRUN API] Record ${record.displayName} action count:`, {
            meaningfulActions: meaningfulActionCount,
            recordId: record.id,
            recordType: record.type
          });
        }
        
        // Use meaningful actions for accurate count
        const actionCountToShow = meaningfulActionCount;

        // Determine if person has been contacted recently (within last 24 hours)
        const hasRecentAction = lastActionDate && 
          (new Date().getTime() - new Date(lastActionDate).getTime()) < (24 * 60 * 60 * 1000);
        
        // Determine contact status for styling
        const contactStatus = hasRecentAction ? 'contacted' : 'pending';

        return {
          id: record.id,
          // 🏆 FIX: Use displayRank for UI (sequential 1, 2, 3, ...) instead of globalRank (which can have duplicates)
          rank: record.displayRank || record.globalRank, // Use displayRank for UI display
          name: record.displayName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown',
          title: record.jobTitle || 'Unknown Title',
          email: record.email || '',
          phone: record.phone || '',
          linkedin: record.linkedinUrl || '',
          linkedinUrl: record.linkedinUrl || '',
          linkedinNavigatorUrl: record.linkedinNavigatorUrl || null, // Include linkedinNavigatorUrl field
          status: record.status || 'Unknown',
          globalRank: record.globalRank, // Keep original for sorting/metadata
          displayRank: record.displayRank, // Sequential rank for UI (1, 2, 3, ...)
          lastAction: lastAction || null,
          lastActionDate: lastActionDate || null,
          lastActionTime: lastActionTime,
          nextAction: nextAction || null,
          nextActionDate: calculatedNextActionDate || null,
          nextActionTiming: nextActionTiming,
          mainSellerId: record.mainSellerId,
          workspaceId: record.workspaceId,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          notes: record.notes || null, // Include notes field for persistence
          // Add state fields at top level for table display
          state: record.company?.hqState || record.company?.state || '',
          hqState: record.company?.hqState || '',
          company: record.company ? (
            typeof record.company === 'string' 
              ? {
                  id: record.id, // Use record.id for company-only records
                  name: record.company, // Use the string value as name
                  industry: '',
                  size: '',
                  globalRank: record.globalRank || 0,
                  hqState: '',
                  state: ''
                }
              : {
                  id: record.company.id,
                  name: record.company.name,
                  industry: record.company.industry || '',
                  size: record.company.size || '',
                  globalRank: record.company.globalRank || 0,
                  hqState: record.company.hqState || '',
                  state: record.company.state || ''
                }
          ) : null,
          tags: ['speedrun'], // Add speedrun tag for consistency
          // Add main-seller and co-sellers data
          mainSeller: ownerName,
          coSellers: coSellersNames,
          mainSellerData: record.mainSeller,
          coSellersData: record.coSellers ? record.coSellers.filter((coSeller: any) => coSeller.user.id !== context.userId) : [],
          currentUserId: context.userId,
          // Add action count for Actions column
          _count: {
            actions: actionCountToShow
          },
          // Add contact status for styling (contacted = light green, pending = normal)
          contactStatus: contactStatus,
          // Add record type for differentiation
          recordType: record.type || 'person',
          // Add isCompanyLead flag for frontend to detect company-only records
          isCompanyLead: record.isCompanyLead || false
        };
      });

      // 🚀 COMBINE: Merge people and companies, sort by globalRank
      const combinedData = speedrunPeopleData.sort((a, b) => {
        return (a.globalRank || 999) - (b.globalRank || 999);
      }).slice(offset, offset + limit); // Apply offset and limit after sorting

      console.log(`🎯 [SPEEDRUN API] Combined speedrun data: ${speedrunPeopleData.length} total records, returning ${combinedData.length} records (offset: ${offset}, limit: ${limit})`);

      const result = {
        success: true,
        data: combinedData,
        meta: {
          count: combinedData.length,
          totalCount: combinedData.length, // For pagination compatibility
          peopleCount: speedrunPeopleData.filter(r => r.recordType === 'person').length,
          companiesCount: speedrunPeopleData.filter(r => r.recordType === 'company').length,
          limit,
          workspaceId: context.workspaceId,
          userId: context.userId,
          responseTime: Date.now() - startTime,
          cached: false
        }
      };

      return result;
    };

    // 🚀 CACHE: Use cache with proper invalidation
    const result = await cache.get(cacheKey, fetchSpeedrunData, { ttl: SPEEDRUN_CACHE_TTL });

    const responseTime = Date.now() - startTime;
    console.log(`✅ [SPEEDRUN API] Loaded ${result.data.length} speedrun prospects in ${responseTime}ms (cached: ${result.meta?.cached || false})`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [SPEEDRUN API] Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to load speedrun data',
      'SPEEDRUN_LOAD_ERROR',
      500
    );
  }
}

// POST /api/v1/speedrun - Invalidate cache when speedrun data changes
export async function POST(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // 🚀 CACHE INVALIDATION: Clear speedrun cache when data changes
    // 🔧 PAGINATION FIX: Include cache version pattern to invalidate correctly
    const cacheKey = `speedrun-v${SPEEDRUN_CACHE_VERSION}-${context.workspaceId}-${context.userId}-*`;
    try {
      await cache.invalidate(cacheKey);
      console.log(`🗑️ [SPEEDRUN API] Invalidated cache for pattern: ${cacheKey}`);
    } catch (error) {
      console.warn('⚠️ [SPEEDRUN API] Cache invalidation failed:', error);
    }

    return createSuccessResponse({ 
      message: 'Speedrun cache invalidated successfully',
      workspaceId: context.workspaceId,
      userId: context.userId
    });

  } catch (error) {
    console.error('❌ [SPEEDRUN API] Cache invalidation error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to invalidate cache',
      'CACHE_INVALIDATION_ERROR',
      500
    );
  }
}
