import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { cache } from '@/platform/services/unified-cache';
import { isMeaningfulAction } from '@/platform/utils/meaningfulActions';

// 🚀 PERFORMANCE: Aggressive caching for speedrun data (rarely changes)
const SPEEDRUN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * 🚀 SPEEDRUN API v1 - LIGHTNING FAST
 * 
 * Dedicated optimized endpoint for speedrun data
 * - Top 50 people with companies (prioritizes ranked people, includes unranked)
 * - Only includes people with company relationships
 * - Ordered by globalRank ascending (1-50), then by creation date
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
    
    // 🚀 CACHE: Check Redis cache first (unless force refresh)
    const cacheKey = `speedrun-${context.workspaceId}-${context.userId}-${limit}-${offset}`;
    
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
              OR: [
                { mainSellerId: context.userId },
                { mainSellerId: null }
              ]
            }
          }),
          prisma.people.count({
            where: {
              workspaceId: context.workspaceId,
              deletedAt: null,
              globalRank: { not: null },
              OR: [
                { mainSellerId: context.userId },
                { mainSellerId: null }
              ]
            }
          }),
          prisma.people.count({
            where: {
              workspaceId: context.workspaceId,
              deletedAt: null,
              companyId: { not: null },
              globalRank: { not: null },
              OR: [
                { mainSellerId: context.userId },
                { mainSellerId: null }
              ]
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
        // 1. Get companies without people (these get Speedrun ranks)
        const companiesWithoutPeople = await prisma.companies.findMany({
          where: {
            workspaceId: context.workspaceId,
            deletedAt: null,
            globalRank: { not: null, gte: 1, lte: 50 }, // Only top 50 Speedrun ranks
            mainSellerId: context.userId,
            // Only companies with 0 people
            people: {
              none: {
                deletedAt: null,
                mainSellerId: context.userId
              }
            }
          },
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
          orderBy: { globalRank: 'asc' }
        });

        // 2. Get people from companies that have people (these get Speedrun ranks)
        const peopleFromCompaniesWithPeople = await prisma.people.findMany({
          where: {
            workspaceId: context.workspaceId,
            deletedAt: null,
            companyId: { not: null }, // Only people with company relationships
            globalRank: { not: null, gte: 1, lte: 50 }, // Only top 50 Speedrun ranks
            mainSellerId: context.userId
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            jobTitle: true,
            phone: true,
            linkedinUrl: true,
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
          orderBy: { globalRank: 'asc' }
        });

        // 3. Combine and sort by globalRank
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

        // Sort by globalRank to maintain unified ranking
        allRecords.sort((a, b) => a.globalRank - b.globalRank);
        
        speedrunRecords = allRecords.slice(0, 50); // Take top 50
        
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

        // Count meaningful actions (simplified - no actions relation in unified query)
        const totalActions = 0; // No actions relation in unified query
        const meaningfulActionCount = 0; // No actions relation in unified query
        
        // Debug logging for action counts - show more details for high counts
        if (index < 5 || meaningfulActionCount > 50) { // Log first 5 records OR any with high counts
          console.log(`🔍 [SPEEDRUN API] Record ${record.displayName} action count:`, {
            totalActions,
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
          // Remove redundant 'rank' field - table will use index-based ranking for Speedrun
          name: record.displayName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown',
          title: record.jobTitle || 'Unknown Title',
          email: record.email || '',
          phone: record.phone || '',
          linkedin: record.linkedinUrl || '',
          status: record.status || 'Unknown',
          globalRank: record.globalRank, // Keep for metadata, but table won't use for display
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
    const cacheKey = `speedrun-${context.workspaceId}-${context.userId}-*`;
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
