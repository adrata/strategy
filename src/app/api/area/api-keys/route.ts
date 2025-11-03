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

// GET: List all API keys for the workspace
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

    const workspaceId = context.workspaceId;
    const userId = context.userId;

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

    const apiKeys = await prisma.api_keys.findMany({
      where: {
        workspaceId: workspaceId,
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc'
      },
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

    return createSuccessResponse(apiKeys);
  } catch (error: any) {
    console.error('❌ [API KEYS] Error fetching API keys:', error);
    
    // Check if table doesn't exist (P2021)
    if (error?.code === 'P2021') {
      return createErrorResponse(
        'API keys table not found in database. Please run the database migration.',
        'TABLE_NOT_FOUND',
        503
      );
    }
    
    return createErrorResponse('Failed to fetch API keys', 'API_KEYS_FETCH_ERROR', 500);
  }
}

// POST: Create a new API key
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

    const body = await request.json();
    const { name, scopes, allowedIps, deniedIps, rateLimitPerHour, rateLimitPerDay, expiresAt } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return createErrorResponse('API key name is required', 'VALIDATION_ERROR', 400);
    }

    // Validate scopes
    const validScopes = Array.isArray(scopes) ? scopes.filter((s: any) => typeof s === 'string') : [];
    
    // Validate IPs (sanitize and validate format)
    const { isValidIp, isValidCidr } = await import('@/platform/utils/ip-matcher');
    const validAllowedIps = Array.isArray(allowedIps) 
      ? allowedIps.filter((ip: any) => typeof ip === 'string' && (isValidIp(ip) || isValidCidr(ip) || ip.includes('*')))
      : [];
    const validDeniedIps = Array.isArray(deniedIps)
      ? deniedIps.filter((ip: any) => typeof ip === 'string' && (isValidIp(ip) || isValidCidr(ip) || ip.includes('*')))
      : [];
    
    // Validate rate limits
    const validRateLimitPerHour = typeof rateLimitPerHour === 'number' && rateLimitPerHour > 0 ? rateLimitPerHour : undefined;
    const validRateLimitPerDay = typeof rateLimitPerDay === 'number' && rateLimitPerDay > 0 ? rateLimitPerDay : undefined;
    
    // Validate expiration
    const validExpiresAt = expiresAt ? new Date(expiresAt) : null;
    if (validExpiresAt && isNaN(validExpiresAt.getTime())) {
      return createErrorResponse('Invalid expiration date', 'VALIDATION_ERROR', 400);
    }

    const workspaceId = context.workspaceId;
    const userId = context.userId;

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

    // Generate API key
    const { prefix, secret, fullKey } = generateApiKey();

    // Hash the secret portion
    const hashedSecret = await bcrypt.hash(secret, 10);

    // Store in database
    const apiKey = await prisma.api_keys.create({
      data: {
        workspaceId,
        userId,
        name: name.trim(),
        keyPrefix: prefix,
        hashedKey: hashedSecret,
        isActive: true,
        scopes: validScopes,
        allowedIps: validAllowedIps,
        deniedIps: validDeniedIps,
        rateLimitPerHour: validRateLimitPerHour,
        rateLimitPerDay: validRateLimitPerDay,
        expiresAt: validExpiresAt,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
      }
    });

    // Return the full key only once (on creation)
    return createSuccessResponse({
      ...apiKey,
      fullKey, // This will only be returned once
      keyPrefix: prefix,
    });
  } catch (error: any) {
    console.error('❌ [API KEYS] Error creating API key:', error);
    
    // Check if table doesn't exist (P2021)
    if (error?.code === 'P2021') {
      return createErrorResponse(
        'API keys table not found in database. Please run the database migration.',
        'TABLE_NOT_FOUND',
        503
      );
    }
    
    return createErrorResponse('Failed to create API key', 'API_KEY_CREATE_ERROR', 500);
  }
}
