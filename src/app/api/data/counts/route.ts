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

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
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
    
    // 🚀 PERFORMANCE: Check cache first
    const cacheKey = `counts-${workspaceId}-${userId}`;
    const cached = countsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < COUNTS_CACHE_TTL) {
      console.log(`⚡ [COUNTS API] Cache hit - returning cached counts in ${Date.now() - startTime}ms`);
      return createSuccessResponse(cached.data, {
        userId: context.userId,
        workspaceId: context.workspaceId,
        role: context.role,
        responseTime: Date.now() - startTime,
        fromCache: true
      });
    }
    
    console.log(`🚀 [COUNTS API] Loading counts for workspace: ${workspaceId}, user: ${userId}`);
    
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
      // Leads count
      prisma.leads.count({
        where: {
          workspaceId,
          deletedAt: null
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
      
      // Companies count
      prisma.companies.count({
        where: {
          workspaceId,
          deletedAt: null
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
      prisma.clients.count({
        where: {
          workspaceId,
          deletedAt: null
        }
      }).catch(() => 0),
      
      // Partners count (with fallback)
      prisma.partners.count({
        where: {
          workspaceId,
          deletedAt: null
        }
      }).catch(() => 0),
      
      // Sellers count - check both sellers table and people table with role 'seller'
      Promise.all([
        prisma.sellers.count({
          where: {
            workspaceId,
            deletedAt: null
          }
        }),
        prisma.people.count({
          where: {
            workspaceId,
            deletedAt: null,
            role: 'seller'
          }
        })
      ]).then(([sellersCount, peopleSellersCount]) => sellersCount + peopleSellersCount).catch(() => 0),
      
      // Speedrun count - count actual speedrun leads
      prisma.leads.count({
        where: {
          workspaceId,
          deletedAt: null,
          tags: { has: 'speedrun' }
        }
      }).catch(() => 0)
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
