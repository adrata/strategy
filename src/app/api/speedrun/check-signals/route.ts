import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
// 🚀 PERFORMANCE: Optimized speedrun signals check with caching
const signalsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds cache

// GET: Check for speedrun signals
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

    const { searchParams } = new URL(request.url);
    // Use secure context instead of query parameters
    const workspaceId = context.workspaceId;

    // 🚀 PERFORMANCE: Check cache first
    const cacheKey = `signals:${workspaceId}`;
    const cached = signalsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('⚡ [SPEEDRUN SIGNALS] Cache hit for workspace:', workspaceId);
      return createSuccessResponse(cached.data, {
        userId: context.userId,
        workspaceId: context.workspaceId,
        role: context.role,
        fromCache: true
      });
    }

    // Check if prisma is available
    if (!prisma) {
      console.error('❌ [SPEEDRUN CHECK SIGNALS] Prisma client is not available');
      return createErrorResponse('Database unavailable', 'DATABASE_ERROR', 500);
    }

    // 🚀 PERFORMANCE: Fast response - return empty signals immediately
    // In the future, this could check for actual signals, but for now we return empty
    const responseData = {
      success: true,
      signals: [],
      hasNewSignals: false,
      timestamp: new Date().toISOString()
    };

    // 🚀 PERFORMANCE: Cache the response
    signalsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    const duration = Date.now() - startTime;
    console.log(`⚡ [SPEEDRUN SIGNALS] Response generated in ${duration}ms for workspace: ${workspaceId}`);

    return createSuccessResponse(responseData, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('❌ [SPEEDRUN CHECK SIGNALS] Error:', error);
    return createErrorResponse(
      'Failed to check speedrun signals',
      'SPEEDRUN_SIGNALS_ERROR',
      500
    );
  }
}
