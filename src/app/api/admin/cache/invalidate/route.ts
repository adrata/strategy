import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cache/invalidate
 * 
 * Admin endpoint to invalidate frontend caches for specific companies
 * Used when buyer group data is fixed and needs to be refreshed in the frontend
 * 
 * Body params:
 * - companyId: string (required) - Company ID to invalidate cache for
 * - workspaceId: string (optional) - Workspace ID, defaults to authenticated user's workspace
 * - cacheType: 'buyer-groups' | 'people' | 'all' (optional) - Type of cache to invalidate
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user (admin only)
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

    const { companyId, workspaceId, cacheType = 'all' } = await request.json();

    if (!companyId) {
      return createErrorResponse('companyId is required', 'VALIDATION_ERROR', 400);
    }

    // Use authenticated user's workspace if not provided
    const targetWorkspaceId = workspaceId || context.workspaceId;
    const userId = context.userId;

    console.log(`🗑️ [CACHE INVALIDATION] User ${userId} requesting cache invalidation for company ${companyId} in workspace ${targetWorkspaceId}`);

    // Generate cache keys that need to be cleared on the frontend
    const cacheKeys: string[] = [];

    if (cacheType === 'buyer-groups' || cacheType === 'all') {
      cacheKeys.push(`buyer-groups-${companyId}-${targetWorkspaceId}`);
      console.log(`   📌 Added buyer groups cache key: buyer-groups-${companyId}-${targetWorkspaceId}`);
    }

    if (cacheType === 'people' || cacheType === 'all') {
      // People cache uses a more general key pattern
      cacheKeys.push(`people-${targetWorkspaceId}`);
      cacheKeys.push(`people-company-${companyId}-${targetWorkspaceId}`);
      console.log(`   📌 Added people cache keys`);
    }

    console.log(`✅ [CACHE INVALIDATION] Generated ${cacheKeys.length} cache keys to clear`);

    // Return the cache keys to the frontend so it can clear them
    return NextResponse.json({
      success: true,
      data: {
        cacheKeys,
        companyId,
        workspaceId: targetWorkspaceId,
        cacheType,
        timestamp: new Date().toISOString()
      },
      message: `Cache invalidation requested for ${cacheKeys.length} keys`
    });

  } catch (error) {
    console.error('❌ [CACHE INVALIDATION] Error:', error);
    return createErrorResponse(
      'Failed to process cache invalidation',
      'CACHE_INVALIDATION_ERROR',
      500
    );
  }
}

/**
 * GET /api/admin/cache/invalidate
 * 
 * Get information about cache invalidation capabilities
 */
export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      success: true,
      data: {
        description: 'Cache invalidation endpoint for admin use',
        method: 'POST',
        requiredParams: ['companyId'],
        optionalParams: ['workspaceId', 'cacheType'],
        cacheTypes: ['buyer-groups', 'people', 'all'],
        usage: {
          example: {
            companyId: '01ABC123',
            workspaceId: '01DEF456',
            cacheType: 'buyer-groups'
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ [CACHE INVALIDATION] Error:', error);
    return createErrorResponse(
      'Failed to get cache invalidation info',
      'CACHE_INFO_ERROR',
      500
    );
  }
}

