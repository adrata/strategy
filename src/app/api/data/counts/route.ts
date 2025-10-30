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
    
    // 🎯 DEMO MODE: Detect if we're in demo mode for Dan's workspace only
    const isDemoMode = workspaceId === '01K1VBYX2YERMXBFJ60RC6J194' || 
                      workspaceId === '01K1VBYXHD0J895XAN0HGFBKJP' || // Dan's actual workspace
                      userId === 'demo-user-2025' || 
                      userId === '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan's user ID only
    console.log(`🎯 [COUNTS API] Demo mode detected: ${isDemoMode}`);
    
    // 🚀 PERFORMANCE: Use direct Prisma queries for better reliability with error handling
    let peopleCounts: Array<{ status: string | null; _count: { id: number } }> = [];
    let companiesCounts: Array<{ status: string | null; _count: { id: number } }> = [];
    let speedrunPeopleCount: number = 0;
    let speedrunCompaniesCount: number = 0;
    
    try {
      [peopleCounts, companiesCounts, speedrunPeopleCount, speedrunCompaniesCount] = await Promise.all([
        // Get people counts by status
        prisma.people.groupBy({
          by: ['status'],
          where: {
            workspaceId,
            deletedAt: null, // Only count non-deleted records
            ...(isDemoMode ? {} : {
              OR: [
                { mainSellerId: userId },
                { mainSellerId: null }
              ]
            })
          },
          _count: { id: true }
        }).catch((error) => {
          console.error('❌ [COUNTS API] Error fetching people counts:', error);
          return [];
        }),
        // Get companies counts by status
        prisma.companies.groupBy({
          by: ['status'],
          where: {
            workspaceId,
            deletedAt: null, // Only count non-deleted records
            ...(isDemoMode ? {} : {
              OR: [
                { mainSellerId: userId },
                { mainSellerId: null }
              ]
            })
          },
          _count: { id: true }
        }).catch((error) => {
          console.error('❌ [COUNTS API] Error fetching companies counts:', error);
          return [];
        }),
        // Get speedrun people count - count people with ranks 1-50 (per-user)
        prisma.people.count({
          where: {
            workspaceId,
            deletedAt: null, // Only count non-deleted records
            companyId: { not: null }, // Only people with companies
            globalRank: { not: null, gte: 1, lte: 50 }, // Only people with ranks 1-50 (per-user)
            ...(isDemoMode ? {} : {
              mainSellerId: userId // Only count people assigned to this user
            })
          }
        }).catch((error) => {
          console.error('❌ [COUNTS API] Error fetching speedrun people count:', error);
          return 0;
        }),
        // Get speedrun companies count - count companies with ranks 1-50 and 0 people
        prisma.companies.count({
          where: {
            workspaceId,
            deletedAt: null,
            globalRank: { not: null, gte: 1, lte: 50 }, // Only companies with ranks 1-50
            people: { none: {} }, // CRITICAL: Only companies with 0 people (companies with people are represented by their people)
            ...(isDemoMode ? {} : {
              mainSellerId: userId
            })
          }
        }).catch((error) => {
          console.error('❌ [COUNTS API] Error fetching speedrun companies count:', error);
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

    // 🚀 LEADS: Include companies with 0 people in leads count
    let companiesWithNoPeopleCount = 0;
    try {
      companiesWithNoPeopleCount = await prisma.companies.count({
        where: {
          workspaceId,
          deletedAt: null,
          ...(isDemoMode ? {} : {
            OR: [
              { mainSellerId: userId },
              { mainSellerId: null }
            ]
          }),
          people: { none: {} } // Companies with 0 people (any status)
        }
      });
    } catch (error) {
      console.error('❌ [COUNTS API] Error fetching companies with no people count:', error);
      companiesWithNoPeopleCount = 0;
    }

    // Debug logging for counts
    console.log(`🔍 [COUNTS API] People counts by status:`, peopleCountsMap);
    console.log(`🔍 [COUNTS API] Companies counts by status:`, companiesCountsMap);
    console.log(`🔍 [COUNTS API] Companies with 0 people count:`, companiesWithNoPeopleCount);
    console.log(`🔍 [COUNTS API] Speedrun counts:`, { 
      people: speedrunPeopleCount, 
      companies: speedrunCompaniesCount,
      total: speedrunPeopleCount + speedrunCompaniesCount 
    });

    // Map counts to our expected format
    // Note: PersonStatus enum doesn't have PARTNER - only LEAD, PROSPECT, OPPORTUNITY, CLIENT, SUPERFAN
    const leadsCount = (peopleCountsMap['LEAD'] || 0) + companiesWithNoPeopleCount;
    const prospectsCount = peopleCountsMap['PROSPECT'] || 0;
    const opportunitiesCount = peopleCountsMap['OPPORTUNITY'] || 0;
    const companiesCount = Object.values(companiesCountsMap).reduce((sum: number, count: any) => sum + count, 0);
    const peopleCount = Object.values(peopleCountsMap).reduce((sum: number, count: any) => sum + count, 0);
    const clientsCount = peopleCountsMap['CLIENT'] || 0;
    // PARTNER is not in PersonStatus enum - set to 0 (or get from companies if needed)
    const partnersCount = 0;
    // Note: sellers table doesn't exist yet - set to 0 for now
    const sellersCount = 0;
    // Use actual speedrun count based on qualifying records (people + companies with 0 people)
    const actualSpeedrunCount = speedrunPeopleCount + speedrunCompaniesCount;
    
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
