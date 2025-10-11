import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { cache } from '@/platform/services/unified-cache';

// 🚀 PERFORMANCE: Aggressive caching for speedrun data (rarely changes)
const SPEEDRUN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * 🚀 SPEEDRUN API v1 - LIGHTNING FAST
 * 
 * Dedicated optimized endpoint for speedrun data
 * - Top 50 ranked people with companies
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
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // 🚀 CACHE: Check Redis cache first (unless force refresh)
    const cacheKey = `speedrun-${context.workspaceId}-${context.userId}-${limit}`;
    
    if (!forceRefresh) {
      try {
        const cached = await cache.get(cacheKey);
        if (cached) {
          console.log(`⚡ [SPEEDRUN API] Cache hit - returning cached data in ${Date.now() - startTime}ms`);
          return NextResponse.json(cached);
        }
      } catch (error) {
        console.warn('⚠️ [SPEEDRUN API] Cache read failed, proceeding with database query:', error);
      }
    }

    // 🎯 DEMO MODE: Detect if we're in demo mode to bypass user assignment filters
    const isDemoMode = context.workspaceId === '01K1VBYX2YERMXBFJ60RC6J194' || // Demo Workspace only
                      context.userId === 'demo-user-2025'; // Demo user only
    
    console.log(`🚀 [SPEEDRUN API] Loading top ${limit} speedrun prospects for workspace: ${context.workspaceId}, user: ${context.userId}`);

    // 🚀 OPTIMIZED QUERY: Use composite index for lightning-fast performance
    const speedrunPeople = await prisma.people.findMany({
      where: {
        workspaceId: context.workspaceId,
        deletedAt: null,
        companyId: { not: null }, // Only people with company relationships
        ...(isDemoMode ? {} : {
          OR: [
            { assignedUserId: context.userId },
            { assignedUserId: null }
          ]
        })
      },
      orderBy: [
        { globalRank: 'asc' }, // Sort by rank (best prospects first)
        { updatedAt: 'desc' }
      ],
      take: limit,
      select: {
        // 🚀 PERFORMANCE: Only select required fields (no customFields)
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
        assignedUserId: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            size: true,
            globalRank: true
          }
        }
      }
    });

    // 🚀 TRANSFORM: Pre-format data for frontend (no additional processing needed)
    const speedrunData = speedrunPeople.map((person, index) => ({
      id: person.id,
      rank: index + 1, // Sequential ranking starting from 1
      name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown',
      company: person.company?.name || 'Unknown Company',
      title: person.jobTitle || 'Unknown Title',
      email: person.email || '',
      phone: person.phone || '',
      linkedin: person.linkedinUrl || '',
      status: person.status || 'Unknown',
      globalRank: person.globalRank || 0,
      lastAction: person.lastAction || 'No action taken',
      lastActionDate: person.lastActionDate || null,
      nextAction: person.nextAction || 'No next action',
      nextActionDate: person.nextActionDate || null,
      assignedUserId: person.assignedUserId || null,
      workspaceId: person.workspaceId,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      company: person.company ? {
        id: person.company.id,
        name: person.company.name,
        industry: person.company.industry || '',
        size: person.company.size || '',
        globalRank: person.company.globalRank || 0
      } : null,
      tags: ['speedrun'] // Add speedrun tag for consistency
    }));

    const result = {
      success: true,
      data: speedrunData,
      meta: {
        count: speedrunData.length,
        totalCount: speedrunData.length, // For pagination compatibility
        limit,
        workspaceId: context.workspaceId,
        userId: context.userId,
        responseTime: Date.now() - startTime,
        cached: false
      }
    };

    // 🚀 CACHE: Store in Redis for future requests
    try {
      await cache.set(cacheKey, result, {
        ttl: SPEEDRUN_CACHE_TTL,
        priority: 'high',
        tags: ['speedrun', context.workspaceId, context.userId]
      });
      console.log(`💾 [SPEEDRUN API] Cached result for key: ${cacheKey}`);
    } catch (error) {
      console.warn('⚠️ [SPEEDRUN API] Cache write failed:', error);
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ [SPEEDRUN API] Loaded ${speedrunData.length} speedrun prospects in ${responseTime}ms`);

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
      await cache.invalidateByPattern(cacheKey);
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
