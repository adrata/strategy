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
    
    // 🎯 DEMO MODE: Detect if we're in demo mode for Dan's workspace
    const isDemoMode = workspaceId === '01K1VBYX2YERMXBFJ60RC6J194' || 
                      workspaceId === '01K1VBYXHD0J895XAN0HGFBKJP' || // Dan's actual workspace
                      workspaceId === '01K7464TNANHQXPCZT1FYX205V' || // Ross's workspace
                      workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || // Notary Everyday
                      userId === 'demo-user-2025' || 
                      userId === '01K1VBYZMWTCT09FWEKBDMCXZM' || // Dan's user ID
                      userId === '01K7469230N74BVGK2PABPNNZ9'; // Ross's user ID
    console.log(`🎯 [COUNTS API] Demo mode detected: ${isDemoMode}`);
    
    // 🚀 PERFORMANCE: Use direct Prisma queries for better reliability
    const [peopleCounts, companiesCounts, speedrunCount] = await Promise.all([
      // Get people counts by status
      prisma.people.groupBy({
        by: ['status'],
        where: {
          workspaceId,
          deletedAt: null // Only count non-deleted records
        },
        _count: { id: true }
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
      }),
      // Get speedrun count - count people with ranks 1-50 (per-user) who haven't been actioned today
      prisma.people.count({
        where: {
          workspaceId,
          deletedAt: null, // Only count non-deleted records
          companyId: { not: null }, // Only people with companies
          globalRank: { not: null, gte: 1, lte: 50 }, // Only people with ranks 1-50 (per-user)
          ...(isDemoMode ? {} : {
            mainSellerId: userId // Only count people assigned to this user
          }),
          OR: [
            { lastActionDate: null }, // Never actioned
            { 
              lastActionDate: {
                lt: new Date(new Date().setHours(0, 0, 0, 0)) // Actioned before today
              }
            }
          ]
        }
      })
      // Note: sellers table doesn't exist in current schema
      // If needed in future, add: prisma.sellers.count({ ... })
    ]);

    // Convert groupBy results to count objects
    const peopleCountsMap = peopleCounts.reduce((acc, stat) => {
      acc[stat.status || 'ACTIVE'] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    const companiesCountsMap = companiesCounts.reduce((acc, stat) => {
      acc[stat.status || 'ACTIVE'] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Map counts to our expected format
    const leadsCount = peopleCountsMap.LEAD || 0;
    const prospectsCount = peopleCountsMap.PROSPECT || 0;
    const opportunitiesCount = companiesCountsMap.OPPORTUNITY || 0;
    const companiesCount = Object.values(companiesCountsMap).reduce((sum: number, count: any) => sum + count, 0);
    const peopleCount = Object.values(peopleCountsMap).reduce((sum: number, count: any) => sum + count, 0);
    const clientsCount = companiesCountsMap.CLIENT || 0;
    const partnersCount = companiesCountsMap.ACTIVE || 0; // Use ACTIVE as fallback for partners
    // Note: sellers table doesn't exist yet - set to 0 for now
    const sellersCount = 0;
    // Use actual speedrun count based on qualifying records
    const actualSpeedrunCount = speedrunCount;
    
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
