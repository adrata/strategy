import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Vercel compatibility

// Generate a secure API key
function generateApiKey(): { prefix: string; secret: string; fullKey: string } {
  const prefix = 'adrata_live_';
  const secret = randomBytes(32).toString('base64url');
  const fullKey = `${prefix}${secret}`;
  return { prefix, secret, fullKey };
}

// POST: Rotate an API key (creates new key, keeps old one active during grace period)
export async function POST(
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

    // Check if api_keys model exists
    if (!prisma.api_keys) {
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
        isActive: true,
      }
    });

    if (!existingKey) {
      return createErrorResponse('API key not found', 'API_KEY_NOT_FOUND', 404);
    }

    // Get grace period from request body (default: 7 days)
    const body = await request.json().catch(() => ({}));
    const gracePeriodDays = typeof body.gracePeriodDays === 'number' 
      ? Math.max(1, Math.min(30, body.gracePeriodDays)) // Clamp between 1-30 days
      : 7;

    const gracePeriodEndsAt = new Date();
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + gracePeriodDays);

    // Generate new API key
    const { prefix, secret, fullKey } = generateApiKey();
    const hashedSecret = await bcrypt.hash(secret, 10);

    // Update existing key with grace period
    await prisma.api_keys.update({
      where: { id: keyId },
      data: {
        rotationGracePeriodEndsAt: gracePeriodEndsAt,
        lastRotatedAt: new Date(),
      }
    });

    // Create new active key with same settings
    const newApiKey = await prisma.api_keys.create({
      data: {
        workspaceId: existingKey.workspaceId,
        userId: existingKey.userId,
        name: `${existingKey.name} (rotated)`,
        keyPrefix: prefix,
        hashedKey: hashedSecret,
        isActive: true,
        scopes: existingKey.scopes || [],
        allowedIps: existingKey.allowedIps || [],
        deniedIps: existingKey.deniedIps || [],
        rateLimitPerHour: existingKey.rateLimitPerHour,
        rateLimitPerDay: existingKey.rateLimitPerDay,
        expiresAt: existingKey.expiresAt,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
      }
    });

    // Return the new key (only time it's returned)
    return createSuccessResponse({
      ...newApiKey,
      fullKey, // Only returned once
      gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
      oldKeyId: keyId,
      message: `Old key will remain active until ${gracePeriodEndsAt.toISOString()}`
    });

  } catch (error: any) {
    console.error('❌ [API KEY ROTATE] Error:', error);
    
    if (error?.code === 'P2021') {
      return createErrorResponse(
        'API keys table not found in database.',
        'TABLE_NOT_FOUND',
        503
      );
    }
    
    return createErrorResponse('Failed to rotate API key', 'API_KEY_ROTATE_ERROR', 500);
  }
}

