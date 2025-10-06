import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

export async function GET(request: NextRequest) {
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
    
    console.log(`🎯 [SELLERS API] Loading sellers for workspace: ${workspaceId}, user: ${userId}`);
    
    // Fetch sellers from database
    const sellers = await prisma.sellers.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ [SELLERS API] Returning ${sellers.length} sellers from database`);
    
    return createSuccessResponse(sellers, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role,
      count: sellers.length
    });
    
  } catch (error) {
    console.error('❌ [SELLERS API] Error loading sellers:', error);
    return createErrorResponse(
      'Failed to load sellers',
      'FETCH_SELLERS_ERROR',
      500
    );
  }
}

