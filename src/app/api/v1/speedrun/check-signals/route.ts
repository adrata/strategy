import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/platform/database/prisma-client';

// 🚀 PERFORMANCE: Optimized speedrun signals check with caching
// Force dynamic rendering for API routes (required for authentication)
export const dynamic = 'force-dynamic';

const signalsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds cache

/**
 * 🚨 SPEEDRUN SIGNALS API v1 - LIGHTNING FAST
 * 
 * Dedicated optimized endpoint for checking speedrun signals
 * - Uses unified authentication system (JWT tokens from cookies)
 * - Extracts workspaceId from authenticated user context
 * - Implements 30-second caching for performance
 * - Returns standardized v1 response format
 * - Currently returns empty signals (ready for future signal detection)
 */

// GET /api/v1/speedrun/check-signals - Check for new speedrun signals
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Authenticate user using unified auth system
    const authUser = await getUnifiedAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // ISO timestamp for incremental checks
    
    // 2. Extract workspaceId from authenticated user context
    const workspaceId = (authUser as any).activeWorkspaceId || authUser.workspaceId || 'local-workspace';
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚨 [SPEEDRUN SIGNALS v1] Checking signals for workspace: ${workspaceId}, user: ${authUser.id}, since: ${since || 'beginning'}`);
    }

    // 🚀 PERFORMANCE: Check cache first
    const cacheKey = `signals-v1:${workspaceId}:${authUser.id}`;
    const cached = signalsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [SPEEDRUN SIGNALS v1] Cache hit - returning cached data`);
      }
      return NextResponse.json({
        success: true,
        data: cached.data,
        meta: {
          timestamp: new Date().toISOString(),
          userId: authUser.id,
          workspaceId: workspaceId,
          fromCache: true,
          responseTime: Date.now() - startTime
        }
      });
    }

    // Check if prisma is available
    if (!prisma) {
      console.error('❌ [SPEEDRUN SIGNALS v1] Prisma client is not available');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database unavailable',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

    // 🚀 PERFORMANCE: Fast response - return empty signals immediately
    // In the future, this could check for actual signals based on the 'since' parameter
    const responseData = {
      signal: null,
      hasNewSignals: false,
      signals: [], // Keep for backward compatibility
      since: since || new Date().toISOString()
    };

    // 🚀 PERFORMANCE: Cache the response
    signalsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    const responseTime = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [SPEEDRUN SIGNALS v1] Checked signals in ${responseTime}ms`);
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        timestamp: new Date().toISOString(),
        userId: authUser.id,
        workspaceId: workspaceId,
        responseTime: responseTime,
        cached: false
      }
    });

  } catch (error) {
    console.error('❌ [SPEEDRUN SIGNALS v1] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check speedrun signals',
        code: 'SPEEDRUN_SIGNALS_ERROR'
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/speedrun/check-signals - Invalidate cache when signals change
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUnifiedAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const workspaceId = (authUser as any).activeWorkspaceId || authUser.workspaceId || 'local-workspace';
    
    // 🚀 CACHE INVALIDATION: Clear signals cache when data changes
    const cacheKey = `signals-v1:${workspaceId}:${authUser.id}`;
    signalsCache.delete(cacheKey);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ [SPEEDRUN SIGNALS v1] Invalidated cache for: ${cacheKey}`);
    }

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Speedrun signals cache invalidated successfully',
        workspaceId: workspaceId,
        userId: authUser.id
      }
    });

  } catch (error) {
    console.error('❌ [SPEEDRUN SIGNALS v1] Cache invalidation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to invalidate cache',
        code: 'CACHE_INVALIDATION_ERROR'
      },
      { status: 500 }
    );
  }
}
