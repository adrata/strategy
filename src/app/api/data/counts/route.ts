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
                      userId === 'demo-user-2025' || 
                      userId === '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan's user ID
    console.log(`🎯 [COUNTS API] Demo mode detected: ${isDemoMode}`);
    
    // 🚀 PERFORMANCE: Use v1 APIs for counts instead of direct Prisma queries
    const [peopleCountsResponse, companiesCountsResponse] = await Promise.all([
      // Get people counts by status from v1 API
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/people?counts=true`, {
        headers: {
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': request.headers.get('authorization') || ''
        }
      }),
      // Get companies counts by status from v1 API  
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/companies?counts=true`, {
        headers: {
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': request.headers.get('authorization') || ''
        }
      })
    ]);

    const [peopleCountsData, companiesCountsData] = await Promise.all([
      peopleCountsResponse.json(),
      companiesCountsResponse.json()
    ]);

    // Extract counts from v1 API responses
    const peopleCounts = peopleCountsData.success ? peopleCountsData.data : {};
    const companiesCounts = companiesCountsData.success ? companiesCountsData.data : {};

    // Map v1 API counts to our expected format
    const leadsCount = peopleCounts.LEAD || 0;
    const prospectsCount = peopleCounts.PROSPECT || 0;
    const opportunitiesCount = companiesCounts.OPPORTUNITY || 0;
    const companiesCount = Object.values(companiesCounts).reduce((sum: number, count: any) => sum + count, 0);
    const peopleCount = Object.values(peopleCounts).reduce((sum: number, count: any) => sum + count, 0);
    const clientsCount = companiesCounts.CLIENT || 0;
    const partnersCount = companiesCounts.ACTIVE || 0; // Use ACTIVE as fallback for partners
    const sellersCount = peopleCounts.CLIENT || 0; // Use CLIENT status as fallback for sellers
    const speedrunCount = peopleCount; // Use total people count as speedrun count
    
    const counts = {
      leads: leadsCount,
      prospects: prospectsCount,
      opportunities: opportunitiesCount,
      companies: companiesCount,
      people: peopleCount,
      clients: clientsCount,
      partners: partnersCount,
      sellers: sellersCount,
      speedrun: speedrunCount
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
