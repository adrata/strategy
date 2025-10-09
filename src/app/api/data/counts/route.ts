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
import { DemoAccessValidator } from '@/platform/services/demo-access-validator';

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
    
    // 🎯 DEMO MODE: Detect if we're in demo mode - ONLY for Dan and Ross
    const demoAccessResult = DemoAccessValidator.validateDemoWorkspaceAccess(
      userId, 
      context.userEmail, 
      workspaceId
    );
    
    const isDemoMode = (workspaceId === '01K1VBYX2YERMXBFJ60RC6J194' || 
                       userId === 'demo-user-2025') && demoAccessResult.hasAccess && demoAccessResult.isDanOrRoss;
    console.log(`🎯 [COUNTS API] Demo mode detected: ${isDemoMode} (Dan/Ross: ${demoAccessResult.isDanOrRoss})`);
    
    // 🚀 PERFORMANCE: Run all count queries in parallel
    const [
      leadsCount,
      prospectsCount,
      opportunitiesCount,
      companiesCount,
      peopleCount,
      clientsCount,
      partnersCount,
      sellersCount,
      speedrunCount
    ] = await Promise.all([
      // Leads count - count from people table (same as unified API)
      prisma.people.count({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      }),
      
      // Prospects count
      prisma.prospects.count({
        where: {
          workspaceId,
          deletedAt: null
        }
      }),
      
      // Opportunities count
      prisma.opportunities.count({
        where: {
          workspaceId,
          deletedAt: null
        }
      }),
      
      // Companies count - match section API filtering logic
      prisma.companies.count({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      }),
      
      // People count
      prisma.people.count({
        where: {
          workspaceId,
          deletedAt: null
        }
      }),
      
      // Clients count (with fallback)
      prisma.companies.count({
        where: {
          workspaceId,
          deletedAt: null,
          status: 'CLIENT'
        }
      }).catch(() => 0),
      
      // Partners count (with fallback)
      prisma.companies.count({
        where: {
          workspaceId,
          deletedAt: null,
          status: 'OPPORTUNITY'
        }
      }).catch(() => 0),
      
      // Sellers count - count from both sellers table AND people table with role 'seller'
      Promise.all([
        prisma.users.count({
          where: {
            workspaceId,
            deletedAt: null,
            // Add role filter if needed for sellers
          }
        }).catch(() => 0),
        // People don't have roles in the streamlined schema
        Promise.resolve(0)
      ]).then(([sellersTableCount, peopleTableCount]) => sellersTableCount + peopleTableCount),
      
      // Speedrun count - count actual speedrun items (limited to 30 for performance)
      (async () => {
        try {
          // First try to count speedrun-tagged leads
          const speedrunLeadsCount = await prisma.people.count({
            where: {
              workspaceId,
              deletedAt: null,
              status: 'LEAD',
              tags: { has: 'speedrun' }
            }
          });
          
          // If no speedrun leads found, count people with company relationships but limit to 30
          if (speedrunLeadsCount === 0) {
            console.log(`🔄 [COUNTS API] No speedrun leads found, counting people for speedrun (limited to 30) for workspace: ${workspaceId}`);
            const peopleCount = await prisma.people.count({
              where: {
                workspaceId,
                deletedAt: null,
                companyId: { not: null }
              }
            });
            // Return the actual count used in speedrun (limited to 30)
            return Math.min(peopleCount, 30);
          }
          
          // Return the actual count used in speedrun (limited to 30)
          return Math.min(speedrunLeadsCount, 30);
        } catch (error) {
          console.error('❌ [COUNTS API] Error counting speedrun data:', error);
          return 0;
        }
      })()
    ]);
    
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
