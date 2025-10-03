/**
 * SECURE API HELPER
 * 
 * Provides standardized authentication and authorization for all API endpoints.
 * Ensures consistent security patterns across the entire platform.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { validateWorkspaceAccess } from '@/platform/services/workspace-access-control';

export interface SecureApiContext {
  userId: string;
  userEmail: string;
  workspaceId: string;
  userName?: string;
  role?: string;
  permissions?: string[];
}

export interface SecureApiOptions {
  requireAuth?: boolean;
  requireWorkspaceAccess?: boolean;
  requiredRole?: 'admin' | 'member' | 'viewer';
  requiredPermission?: string;
  allowPublicAccess?: boolean;
}

/**
 * Secure API endpoint wrapper that handles authentication and authorization
 * 
 * @param request - The NextRequest object
 * @param options - Security options for the endpoint
 * @returns Promise<{ context: SecureApiContext; response?: NextResponse }>
 */
export async function getSecureApiContext(
  request: NextRequest,
  options: SecureApiOptions = {}
): Promise<{ context: SecureApiContext | null; response?: NextResponse }> {
  const {
    requireAuth = true,
    requireWorkspaceAccess = true,
    requiredRole,
    requiredPermission,
    allowPublicAccess = false
  } = options;

  try {
    // 1. Handle public access
    if (allowPublicAccess && !requireAuth) {
      return { context: null };
    }

    // 2. Authenticate user
    const authUser = await getUnifiedAuthUser(request);
    
    if (!authUser) {
      if (requireAuth) {
        console.log(`❌ [SECURE API] Authentication required but not provided`);
        return {
          context: null,
          response: NextResponse.json(
            { 
              success: false, 
              error: 'Authentication required',
              code: 'AUTH_REQUIRED'
            },
            { status: 401 }
          )
        };
      } else {
        return { context: null };
      }
    }

    // 3. Build context
    const context: SecureApiContext = {
      userId: authUser.id,
      userEmail: authUser.email,
      workspaceId: authUser.workspaceId || '',
      userName: authUser.name
    };

    // 4. Validate workspace access if required
    if (requireWorkspaceAccess && authUser.workspaceId) {
      const workspaceAccess = await validateWorkspaceAccess(
        authUser.id,
        authUser.workspaceId,
        requiredRole
      );

      if (!workspaceAccess.hasAccess) {
        console.log(`❌ [SECURE API] Workspace access denied for user ${authUser.id}`);
        return {
          context: null,
          response: NextResponse.json(
            { 
              success: false, 
              error: workspaceAccess.error || 'Workspace access denied',
              code: 'WORKSPACE_ACCESS_DENIED'
            },
            { status: 403 }
          )
        };
      }

      // Add role and permissions to context
      context.role = workspaceAccess.role;
      context.permissions = workspaceAccess.permissions;
    }

    // 5. Check specific permission if required
    if (requiredPermission && context.permissions) {
      if (!context.permissions.includes(requiredPermission)) {
        console.log(`❌ [SECURE API] Permission denied: ${requiredPermission}`);
        return {
          context: null,
          response: NextResponse.json(
            { 
              success: false, 
              error: `Permission denied: ${requiredPermission}`,
              code: 'PERMISSION_DENIED'
            },
            { status: 403 }
          )
        };
      }
    }

    console.log(`✅ [SECURE API] Context created for user ${authUser.email}`);
    return { context };

  } catch (error) {
    console.error('❌ [SECURE API] Error creating secure context:', error);
    return {
      context: null,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed',
          code: 'AUTH_ERROR'
        },
        { status: 401 }
      )
    };
  }
}

/**
 * Standard error response for API endpoints
 */
export function createErrorResponse(
  message: string,
  code: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    { 
      success: false, 
      error: message,
      code 
    },
    { status }
  );
}

/**
 * Standard success response for API endpoints
 */
export function createSuccessResponse(
  data: any,
  meta?: any
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
}

/**
 * Extract user context from request headers (set by middleware)
 */
export function getUserContextFromHeaders(request: NextRequest): SecureApiContext | null {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const workspaceId = request.headers.get('x-workspace-id');
  const userName = request.headers.get('x-user-name');

  if (!userId || !userEmail || !workspaceId) {
    return null;
  }

  return {
    userId,
    userEmail,
    workspaceId,
    userName: userName || undefined
  };
}

/**
 * Validate that the authenticated user can access the requested workspace
 */
export async function validateWorkspaceContext(
  context: SecureApiContext,
  requestedWorkspaceId?: string
): Promise<{ valid: boolean; response?: NextResponse }> {
  // If no specific workspace requested, use user's default workspace
  const targetWorkspaceId = requestedWorkspaceId || context.workspaceId;

  // If requesting a different workspace, validate access
  if (requestedWorkspaceId && requestedWorkspaceId !== context.workspaceId) {
    const workspaceAccess = await validateWorkspaceAccess(
      context.userId,
      requestedWorkspaceId
    );

    if (!workspaceAccess.hasAccess) {
      return {
        valid: false,
        response: NextResponse.json(
          { 
            success: false, 
            error: 'Access denied to requested workspace',
            code: 'WORKSPACE_ACCESS_DENIED'
          },
          { status: 403 }
        )
      };
    }
  }

  return { valid: true };
}

/**
 * Log security events for audit trail
 */
export function logSecurityEvent(
  event: string,
  context: SecureApiContext,
  details?: any
): void {
  console.log(`🔐 [SECURITY EVENT] ${event}`, {
    userId: context.userId,
    userEmail: context.userEmail,
    workspaceId: context.workspaceId,
    timestamp: new Date().toISOString(),
    details
  });
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    // Reset or create new entry
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }

  // Increment count
  current.count++;
  rateLimitMap.set(key, current);

  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime
  };
}
