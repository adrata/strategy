import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { getUsageStats } from '@/platform/api-usage-tracker';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Vercel compatibility

// GET: Get usage statistics for an API key
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const apiKeyId = params.id;
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    await prisma.$connect();

    // Verify API key belongs to user/workspace
    const apiKey = await prisma.api_keys.findFirst({
      where: {
        id: apiKeyId,
        workspaceId: workspaceId,
        userId: userId,
      }
    });

    if (!apiKey) {
      return createErrorResponse('API key not found', 'API_KEY_NOT_FOUND', 404);
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    // Get usage stats
    const stats = await getUsageStats(apiKeyId, startDate, endDate);

    return createSuccessResponse(stats);
  } catch (error: any) {
    console.error('❌ [API KEY USAGE] Error:', error);
    return createErrorResponse('Failed to get usage stats', 'USAGE_STATS_ERROR', 500);
  }
}
