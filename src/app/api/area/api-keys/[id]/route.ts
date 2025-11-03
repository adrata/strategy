import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Vercel compatibility

// GET: Get API key details
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

    const workspaceId = context.workspaceId;
    const userId = context.userId;
    const keyId = params.id;

    await prisma.$connect();

    // Check if api_keys model exists in Prisma client
    if (!prisma.api_keys) {
      console.error('❌ [API KEYS] Prisma client missing api_keys model. Run: npm run db:generate');
      return createErrorResponse(
        'API keys feature not available. Please regenerate Prisma client.',
        'PRISMA_CLIENT_OUTDATED',
        503
      );
    }

    const apiKey = await prisma.api_keys.findFirst({
      where: {
        id: keyId,
        workspaceId: workspaceId,
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        expiresAt: true,
        scopes: true,
        allowedIps: true,
        deniedIps: true,
        rateLimitPerHour: true,
        rateLimitPerDay: true,
        lastRotatedAt: true,
        rotationGracePeriodEndsAt: true,
      }
    });

    if (!apiKey) {
      return createErrorResponse('API key not found', 'API_KEY_NOT_FOUND', 404);
    }

    return createSuccessResponse(apiKey);
  } catch (error: any) {
    console.error('❌ [API KEYS] Error fetching API key:', error);
    
    // Check if table doesn't exist (P2021)
    if (error?.code === 'P2021') {
      return createErrorResponse(
        'API keys table not found in database. Please run the database migration.',
        'TABLE_NOT_FOUND',
        503
      );
    }
    
    return createErrorResponse('Failed to fetch API key', 'API_KEY_FETCH_ERROR', 500);
  }
}

// PATCH: Update API key (name, expiration)
export async function PATCH(
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

    const workspaceId = context.workspaceId;
    const userId = context.userId;
    const keyId = params.id;
    const body = await request.json();
    const { name, expiresAt, scopes, allowedIps, deniedIps, rateLimitPerHour, rateLimitPerDay } = body;

    await prisma.$connect();

    // Check if api_keys model exists in Prisma client
    if (!prisma.api_keys) {
      console.error('❌ [API KEYS] Prisma client missing api_keys model. Run: npm run db:generate');
      return createErrorResponse(
        'API keys feature not available. Please regenerate Prisma client.',
        'PRISMA_CLIENT_OUTDATED',
        503
      );
    }

    // Verify ownership
    const existingKey = await prisma.api_keys.findFirst({
      where: {
        id: keyId,
        workspaceId: workspaceId,
        userId: userId,
      }
    });

    if (!existingKey) {
      return createErrorResponse('API key not found', 'API_KEY_NOT_FOUND', 404);
    }

    // Update the key
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    if (scopes !== undefined) {
      updateData.scopes = Array.isArray(scopes) ? scopes.filter((s: any) => typeof s === 'string') : [];
    }
    if (allowedIps !== undefined) {
      const { isValidIp, isValidCidr } = await import('@/platform/utils/ip-matcher');
      updateData.allowedIps = Array.isArray(allowedIps)
        ? allowedIps.filter((ip: any) => typeof ip === 'string' && (isValidIp(ip) || isValidCidr(ip) || ip.includes('*')))
        : [];
    }
    if (deniedIps !== undefined) {
      const { isValidIp, isValidCidr } = await import('@/platform/utils/ip-matcher');
      updateData.deniedIps = Array.isArray(deniedIps)
        ? deniedIps.filter((ip: any) => typeof ip === 'string' && (isValidIp(ip) || isValidCidr(ip) || ip.includes('*')))
        : [];
    }
    if (rateLimitPerHour !== undefined) {
      updateData.rateLimitPerHour = typeof rateLimitPerHour === 'number' && rateLimitPerHour > 0 ? rateLimitPerHour : null;
    }
    if (rateLimitPerDay !== undefined) {
      updateData.rateLimitPerDay = typeof rateLimitPerDay === 'number' && rateLimitPerDay > 0 ? rateLimitPerDay : null;
    }

    const updatedKey = await prisma.api_keys.update({
      where: { id: keyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
        isActive: true,
        expiresAt: true,
        scopes: true,
        allowedIps: true,
        deniedIps: true,
        rateLimitPerHour: true,
        rateLimitPerDay: true,
        lastRotatedAt: true,
        rotationGracePeriodEndsAt: true,
      }
    });

    return createSuccessResponse(updatedKey);
  } catch (error: any) {
    console.error('❌ [API KEYS] Error updating API key:', error);
    
    // Check if table doesn't exist (P2021)
    if (error?.code === 'P2021') {
      return createErrorResponse(
        'API keys table not found in database. Please run the database migration.',
        'TABLE_NOT_FOUND',
        503
      );
    }
    
    return createErrorResponse('Failed to update API key', 'API_KEY_UPDATE_ERROR', 500);
  }
}

// DELETE: Revoke API key
export async function DELETE(
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

    const workspaceId = context.workspaceId;
    const userId = context.userId;
    const keyId = params.id;

    await prisma.$connect();

    // Check if api_keys model exists in Prisma client
    if (!prisma.api_keys) {
      console.error('❌ [API KEYS] Prisma client missing api_keys model. Run: npm run db:generate');
      return createErrorResponse(
        'API keys feature not available. Please regenerate Prisma client.',
        'PRISMA_CLIENT_OUTDATED',
        503
      );
    }

    // Verify ownership
    const existingKey = await prisma.api_keys.findFirst({
      where: {
        id: keyId,
        workspaceId: workspaceId,
        userId: userId,
      }
    });

    if (!existingKey) {
      return createErrorResponse('API key not found', 'API_KEY_NOT_FOUND', 404);
    }

    // Soft delete by setting isActive to false
    await prisma.api_keys.update({
      where: { id: keyId },
      data: { isActive: false }
    });

    return createSuccessResponse({ success: true, message: 'API key revoked successfully' });
  } catch (error: any) {
    console.error('❌ [API KEYS] Error deleting API key:', error);
    
    // Check if table doesn't exist (P2021)
    if (error?.code === 'P2021') {
      return createErrorResponse(
        'API keys table not found in database. Please run the database migration.',
        'TABLE_NOT_FOUND',
        503
      );
    }
    
    return createErrorResponse('Failed to delete API key', 'API_KEY_DELETE_ERROR', 500);
  }
}
