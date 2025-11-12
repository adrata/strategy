/**
 * 🚀 FAST COUNTS API - LIGHTNING SPEED NAVIGATION COUNTS
 * 
 * Ultra-fast endpoint for left panel navigation counts only
 * Replaces the heavy dashboard API for navigation purposes
 * 
 * Performance Target: <100ms response time
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

// 🚀 PERFORMANCE: Ultra-aggressive caching for counts
const COUNTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const countsCache = new Map<string, { data: any; timestamp: number }>();

// 🧹 WORKSPACE SWITCH CACHE CLEARING: Clear counts cache when workspace changes
export function clearCountsCache(workspaceId: string, userId: string): void {
  const cacheKey = `counts-${workspaceId}-${userId}`;
  countsCache.delete(cacheKey);
  console.log(`🧹 [COUNTS CACHE] Cleared cache for workspace: ${workspaceId}, user: ${userId}`);
}

export async function POST(request: NextRequest) {
  try {
    // Clear all counts cache
    countsCache.clear();
    console.log('🧹 [COUNTS API] Cleared all counts cache');
    
    return createSuccessResponse({ message: 'Cache cleared successfully' }, {
      responseTime: 0
    });
  } catch (error) {
    console.error('❌ [COUNTS API] Error clearing cache:', error);
    return createErrorResponse(
      'Failed to clear cache',
      'CLEAR_CACHE_ERROR',
      500
    );
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Check for cache-busting parameter
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.has('t');
  const isPartnerOS = url.searchParams.get('partneros') === 'true'; // 🚀 NEW: PartnerOS mode detection
  
  try {
    // 1. Authenticate and authorize user
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

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;
    
    // CRITICAL FIX: Defensive check - log warning if workspaceId is fallback value
    // But allow query to proceed - Prisma will return empty results if workspace doesn't exist
    if (!workspaceId || workspaceId.trim() === '' || workspaceId === 'local-workspace') {
      console.warn('⚠️ [COUNTS API] Using fallback workspaceId - queries may return empty results:', {
        workspaceId,
        userId,
        hasContext: !!context
      });
      // Continue with query - Prisma will handle non-existent workspace gracefully
    }
    
    // 🚀 PERFORMANCE: Check cache first (unless force refresh)
    const cacheKey = `counts-${workspaceId}-${userId}`;
    const cached = countsCache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < COUNTS_CACHE_TTL) {
      console.log(`⚡ [COUNTS API] Cache hit - returning cached counts in ${Date.now() - startTime}ms`);
      return createSuccessResponse(cached.data, {
        userId: context.userId,
        workspaceId: context.workspaceId,
        role: context.role,
        responseTime: Date.now() - startTime,
        fromCache: true
      });
    }
    
    if (forceRefresh) {
      console.log(`🔄 [COUNTS API] Force refresh requested - bypassing cache`);
    }
    
    console.log(`🚀 [COUNTS API] Loading counts for workspace: ${workspaceId}, user: ${userId}`);
    
    // User assignment filters are now applied universally for proper data isolation
    
    // 🚀 PERFORMANCE: Use direct Prisma queries for better reliability with error handling
    let peopleCounts: Array<{ status: string | null; _count: { id: number } }> = [];
    let companiesCounts: Array<{ status: string | null; _count: { id: number } }> = [];
    let speedrunPeopleCount: number = 0;
    let speedrunCompaniesCount: number = 0;
    let speedrunPeopleNoActionsCount: number = 0;
    let speedrunCompaniesNoActionsCount: number = 0;
    
    try {
      // 🚀 PARTNEROS FILTERING: Build base where clauses with relationshipType filter when in PartnerOS mode
      const peopleBaseWhere: any = {
        workspaceId,
        deletedAt: null,
        OR: [
          { mainSellerId: userId },
          { mainSellerId: null }
        ]
      };
      
      const companiesBaseWhere: any = {
        workspaceId,
        deletedAt: null,
        OR: [
          { mainSellerId: userId },
          { mainSellerId: null }
        ]
      };
      
      if (isPartnerOS) {
        peopleBaseWhere.relationshipType = {
          in: ['PARTNER', 'FUTURE_PARTNER']
        };
        companiesBaseWhere.relationshipType = {
          in: ['PARTNER', 'FUTURE_PARTNER']
        };
      }
      
      [peopleCounts, companiesCounts, speedrunPeopleCount, speedrunCompaniesCount, speedrunPeopleNoActionsCount, speedrunCompaniesNoActionsCount] = await Promise.all([
        // Get people counts by status - Include records where user is main seller OR mainSellerId is null (consistent with list API)
        prisma.people.groupBy({
          by: ['status'],
          where: peopleBaseWhere,
          _count: { id: true }
        }).catch((error) => {
          console.error('❌ [COUNTS API] Error fetching people counts:', error);
          return [];
        }),
        // Get companies counts by status - Include records where user is main seller OR mainSellerId is null (consistent with list API)
        prisma.companies.groupBy({
          by: ['status'],
          where: companiesBaseWhere,
          _count: { id: true }
        }).catch((error) => {
          console.error('❌ [COUNTS API] Error fetching companies counts:', error);
          return [];
        }),
        // Get speedrun people count - count people with ranks 1-50 (per-user)
        prisma.people.count({
          where: {
            ...peopleBaseWhere,
            companyId: { not: null }, // Only people with companies
            globalRank: { not: null, gte: 1, lte: 50 } // Only people with ranks 1-50 (per-user)
          }
        }).catch((error) => {
          console.error('❌ [COUNTS API] Error fetching speedrun people count:', error);
          return 0;
        }),
        // Get speedrun companies count - count companies with ranks 1-50 and 0 people
        prisma.companies.count({
          where: {
            ...companiesBaseWhere,
            globalRank: { not: null, gte: 1, lte: 50 }, // Only companies with ranks 1-50
            people: { none: {} } // CRITICAL: Only companies with 0 people (companies with people are represented by their people)
          }
        }).catch((error) => {
          console.error('❌ [COUNTS API] Error fetching speedrun companies count:', error);
          return 0;
        }),
        // Get speedrun people with no meaningful actions TODAY count
        // 🏆 FIX: Count people where lastActionDate is null OR before today OR (today but not meaningful action)
        // If lastActionDate is today AND lastAction is meaningful, they're NOT "Ready"
        prisma.people.count({
          where: {
            ...peopleBaseWhere,
            companyId: { not: null },
            globalRank: { not: null, gte: 1, lte: 50 },
            AND: [
              {
                OR: [
                  { lastActionDate: null },
                  { 
                    lastActionDate: {
                      lt: new Date(new Date().setHours(0, 0, 0, 0)) // Before today = Ready
                    }
                  },
                  {
                    // Action today but not meaningful = Still Ready
                    AND: [
                      { 
                        lastActionDate: {
                          gte: new Date(new Date().setHours(0, 0, 0, 0)),
                          lt: new Date(new Date().setHours(23, 59, 59, 999))
                        }
                      },
                      {
                        OR: [
                          { lastAction: null },
                          { lastAction: 'No action taken' },
                          { lastAction: 'Record created' },
                          { lastAction: 'Company record created' },
                          { lastAction: 'Record added' }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }).catch((error) => {
          console.error('❌ [COUNTS API] Error fetching speedrun people with no actions count:', error);
          return 0;
        }),
        // Get speedrun companies with no meaningful actions TODAY count
        // 🏆 FIX: Count companies where lastActionDate is null OR before today OR (today but not meaningful action)
        prisma.companies.count({
          where: {
            ...companiesBaseWhere,
            globalRank: { not: null, gte: 1, lte: 50 },
            people: { none: {} },
            AND: [
              {
                OR: [
                  { lastActionDate: null },
                  { 
                    lastActionDate: {
                      lt: new Date(new Date().setHours(0, 0, 0, 0)) // Before today = Ready
                    }
                  },
                  {
                    // Action today but not meaningful = Still Ready
                    AND: [
                      { 
                        lastActionDate: {
                          gte: new Date(new Date().setHours(0, 0, 0, 0)),
                          lt: new Date(new Date().setHours(23, 59, 59, 999))
                        }
                      },
                      {
                        OR: [
                          { lastAction: null },
                          { lastAction: 'No action taken' },
                          { lastAction: 'Record created' },
                          { lastAction: 'Company record created' },
                          { lastAction: 'Record added' }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }).catch((error) => {
          console.error('❌ [COUNTS API] Error fetching speedrun companies with no actions count:', error);
          return 0;
        })
        // Note: sellers table doesn't exist in current schema
        // If needed in future, add: prisma.sellers.count({ ... })
      ]);
    } catch (error) {
      console.error('❌ [COUNTS API] Error in Promise.all:', error);
      // Provide default values if Promise.all fails
      peopleCounts = [];
      companiesCounts = [];
      speedrunPeopleCount = 0;
      speedrunCompaniesCount = 0;
      speedrunPeopleNoActionsCount = 0;
      speedrunCompaniesNoActionsCount = 0;
    }

    // Convert groupBy results to count objects with proper null handling
    const peopleCountsMap = peopleCounts.reduce((acc, stat) => {
      // Handle null status values - PersonStatus enum: LEAD, PROSPECT, OPPORTUNITY, CLIENT, SUPERFAN
      const status = stat.status || 'LEAD'; // Default to LEAD if null (most common for new records)
      acc[status] = (acc[status] || 0) + stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    const companiesCountsMap = companiesCounts.reduce((acc, stat) => {
      // Handle null status values - CompanyStatus enum: LEAD, PROSPECT, OPPORTUNITY, CLIENT, SUPERFAN, ACTIVE, INACTIVE
      const status = stat.status || 'ACTIVE'; // Default to ACTIVE if null
      acc[status] = (acc[status] || 0) + stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // 🚀 LEADS: Include companies with 0 people in leads count - Include records where user is main seller OR mainSellerId is null
    let companiesWithNoPeopleCount = 0;
    try {
      const leadsCompaniesWhere: any = {
        ...companiesBaseWhere,
        people: { none: {} }, // Companies with 0 people
        AND: [
          {
            OR: [
              { status: 'LEAD' as any },
              { status: null } // Include companies without status set
            ]
          }
        ]
      };
      companiesWithNoPeopleCount = await prisma.companies.count({
        where: leadsCompaniesWhere
      });
    } catch (error) {
      console.error('❌ [COUNTS API] Error fetching companies with no people count:', error);
      companiesWithNoPeopleCount = 0;
    }

    // 🚀 PROSPECTS: Include companies with 0 people and PROSPECT status - Include records where user is main seller OR mainSellerId is null
    let companiesProspectsCount = 0;
    try {
      const prospectsCompaniesWhere: any = {
        ...companiesBaseWhere,
        people: { none: {} }, // Companies with 0 people
        status: 'PROSPECT' as any
      };
      companiesProspectsCount = await prisma.companies.count({
        where: prospectsCompaniesWhere
      });
    } catch (error) {
      console.error('❌ [COUNTS API] Error fetching prospect companies count:', error);
      companiesProspectsCount = 0;
    }

    // Debug logging for counts
    console.log(`🔍 [COUNTS API] People counts by status:`, peopleCountsMap);
    console.log(`🔍 [COUNTS API] Companies counts by status:`, companiesCountsMap);
    console.log(`🔍 [COUNTS API] Companies with 0 people count (leads):`, companiesWithNoPeopleCount);
    console.log(`🔍 [COUNTS API] Companies with 0 people count (prospects):`, companiesProspectsCount);
    console.log(`🔍 [COUNTS API] Speedrun counts:`, { 
      people: speedrunPeopleCount, 
      companies: speedrunCompaniesCount,
      total: speedrunPeopleCount + speedrunCompaniesCount,
      peopleNoActions: speedrunPeopleNoActionsCount,
      companiesNoActions: speedrunCompaniesNoActionsCount,
      totalNoActions: speedrunPeopleNoActionsCount + speedrunCompaniesNoActionsCount
    });

    // 🚀 CLIENTS: Count people with CLIENT status (primary or additionalStatuses) - Only show records where user is main seller
    let clientsWithAdditionalStatusCount = 0;
    try {
      const clientsWhere: any = {
        ...peopleBaseWhere,
        mainSellerId: userId, // Only count records where user is the main seller
        AND: [
          { additionalStatuses: { has: 'CLIENT' } },
          { status: { not: 'CLIENT' } } // Don't double-count those with primary status CLIENT
        ]
      };
      clientsWithAdditionalStatusCount = await prisma.people.count({
        where: clientsWhere
      });
    } catch (error) {
      console.error('❌ [COUNTS API] Error fetching clients with additionalStatuses count:', error);
      clientsWithAdditionalStatusCount = 0;
    }

    // Also count companies with CLIENT in additionalStatuses - Only show records where user is main seller
    let companiesClientsWithAdditionalStatusCount = 0;
    try {
      const companiesClientsWhere: any = {
        ...companiesBaseWhere,
        mainSellerId: userId, // Only count records where user is the main seller
        AND: [
          { additionalStatuses: { has: 'CLIENT' } },
          { status: { not: 'CLIENT' } } // Don't double-count those with primary status CLIENT
        ]
      };
      companiesClientsWithAdditionalStatusCount = await prisma.companies.count({
        where: companiesClientsWhere
      });
    } catch (error) {
      console.error('❌ [COUNTS API] Error fetching companies with CLIENT in additionalStatuses count:', error);
      companiesClientsWithAdditionalStatusCount = 0;
    }

    // Map counts to our expected format
    // Note: PersonStatus enum doesn't have PARTNER - only LEAD, PROSPECT, OPPORTUNITY, CLIENT, SUPERFAN
    const leadsCount = (peopleCountsMap['LEAD'] || 0) + companiesWithNoPeopleCount;
    const prospectsCount = (peopleCountsMap['PROSPECT'] || 0) + companiesProspectsCount;
    const opportunitiesCount = peopleCountsMap['OPPORTUNITY'] || 0;
    const companiesCount = Object.values(companiesCountsMap).reduce((sum: number, count: any) => sum + count, 0);
    const peopleCount = Object.values(peopleCountsMap).reduce((sum: number, count: any) => sum + count, 0);
    // Include clients from both primary status and additionalStatuses
    const clientsCount = (peopleCountsMap['CLIENT'] || 0) + clientsWithAdditionalStatusCount;
    // PARTNER is not in PersonStatus enum - set to 0 (or get from companies if needed)
    const partnersCount = 0;
    // Note: sellers table doesn't exist yet - set to 0 for now
    const sellersCount = 0;
    // Use actual speedrun count based on qualifying records (people + companies with 0 people)
    const actualSpeedrunCount = speedrunPeopleCount + speedrunCompaniesCount;
    const speedrunReadyCount = speedrunPeopleNoActionsCount + speedrunCompaniesNoActionsCount;
    
    // 🚀 REMAINING COUNT: Calculate records with no meaningful actions EVER (not just today)
    // This counts records that have never had a meaningful action, regardless of when
    let speedrunRemainingCount = 0;
    try {
      const remainingPeopleWhere: any = {
        ...peopleBaseWhere,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 },
        AND: [
          {
            OR: [
              { lastActionDate: null },
              { lastAction: null },
              { lastAction: 'No action taken' },
              { lastAction: 'Record created' },
              { lastAction: 'Company record created' },
              { lastAction: 'Record added' }
            ]
          }
        ]
      };
      
      const remainingCompaniesWhere: any = {
        ...companiesBaseWhere,
        globalRank: { not: null, gte: 1, lte: 50 },
        people: { none: {} },
        AND: [
          {
            OR: [
              { lastActionDate: null },
              { lastAction: null },
              { lastAction: 'No action taken' },
              { lastAction: 'Record created' },
              { lastAction: 'Company record created' },
              { lastAction: 'Record added' }
            ]
          }
        ]
      };
      
      const [peopleWithNoActionsEver, companiesWithNoActionsEver] = await Promise.all([
        // Count people with no meaningful actions EVER
        prisma.people.count({
          where: remainingPeopleWhere
        }),
        // Count companies with no meaningful actions EVER
        prisma.companies.count({
          where: remainingCompaniesWhere
        })
      ]);
      speedrunRemainingCount = peopleWithNoActionsEver + companiesWithNoActionsEver;
    } catch (error) {
      console.error('❌ [COUNTS API] Error calculating speedrun remaining count:', error);
      // Fallback to ready count if remaining calculation fails
      speedrunRemainingCount = speedrunReadyCount;
    }
    
    const counts = {
      leads: leadsCount,
      prospects: prospectsCount,
      opportunities: opportunitiesCount,
      companies: companiesCount,
      people: peopleCount,
      clients: clientsCount,
      partners: partnersCount,
      sellers: sellersCount,
      speedrun: actualSpeedrunCount,
      speedrunReady: speedrunReadyCount, // Count for records with no meaningful actions TODAY
      speedrunRemaining: speedrunRemainingCount, // Count for records with no meaningful actions EVER
      metrics: 16, // Fixed count for tracked metrics
      chronicle: 0 // Will be updated when Chronicle reports are created
    };

    // Debug logging for final counts
    console.log(`🔍 [COUNTS API] Final counts:`, counts);
    
    // 🚀 PERFORMANCE: Cache the results
    countsCache.set(cacheKey, {
      data: counts,
      timestamp: Date.now()
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ [COUNTS API] Loaded counts in ${responseTime}ms:`, counts);
    
    return createSuccessResponse(counts, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role,
      responseTime: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('❌ [COUNTS API] Error:', error);
    return createErrorResponse(
      'Failed to fetch counts',
      'FETCH_COUNTS_ERROR',
      500
    );
  }
}
