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
    // Prioritize activeWorkspaceId over workspaceId if available
    const workspaceId = (authUser as any).activeWorkspaceId || authUser.workspaceId || '';
    const context: SecureApiContext = {
      userId: authUser.id,
      userEmail: authUser.email,
      workspaceId: workspaceId,
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
      code,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Environment-aware error logging and response creation
 * Logs detailed errors in development, sanitized errors in production
 */
export function logAndCreateErrorResponse(
  error: unknown,
  context: {
    endpoint: string;
    userId?: string;
    workspaceId?: string;
    requestId?: string;
  },
  fallbackMessage: string = 'Internal server error',
  fallbackCode: string = 'INTERNAL_ERROR',
  fallbackStatus: number = 500
): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Extract error details
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  
  // Determine error type and appropriate response
  let responseMessage = fallbackMessage;
  let responseCode = fallbackCode;
  let responseStatus = fallbackStatus;
  
  // Handle specific error types
  if (error instanceof Error) {
    // Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;
      console.error('❌ [SECURE API] Prisma error details:', {
        code: prismaError.code,
        meta: prismaError.meta,
        clientVersion: prismaError.clientVersion
      });
      
      // Handle specific Prisma error codes
      if (prismaError.code === 'P2003') {
        responseMessage = 'Foreign key constraint failed - referenced record does not exist';
        responseCode = 'FOREIGN_KEY_ERROR';
      } else if (prismaError.code === 'P2002') {
        responseMessage = 'Unique constraint violation - record already exists';
        responseCode = 'DUPLICATE_ERROR';
      } else if (prismaError.code === 'P2000') {
        responseMessage = 'Value too long for column';
        responseCode = 'VALUE_TOO_LONG';
      } else {
        responseMessage = `Database operation failed (${prismaError.code || 'unknown'})`;
        responseCode = 'DATABASE_ERROR';
      }
      responseStatus = 500;
    }
    // Validation errors
    else if (error.name === 'ValidationError' || error.message.includes('validation')) {
      responseMessage = 'Invalid request data';
      responseCode = 'VALIDATION_ERROR';
      responseStatus = 400;
    }
    // Authentication errors
    else if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
      responseMessage = 'Authentication required';
      responseCode = 'AUTH_REQUIRED';
      responseStatus = 401;
    }
    // Authorization errors
    else if (error.message.includes('Access denied') || error.message.includes('Permission')) {
      responseMessage = 'Access denied';
      responseCode = 'ACCESS_DENIED';
      responseStatus = 403;
    }
  }
  
  // Log error with appropriate detail level
  if (isDevelopment) {
    console.error(`❌ [${context.endpoint}] Error:`, {
      message: errorMessage,
      name: errorName,
      stack: errorStack,
      context: {
        userId: context.userId,
        workspaceId: context.workspaceId,
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      }
    });
  } else {
    // Production logging - sanitized
    console.error(`❌ [${context.endpoint}] Error:`, {
      message: responseMessage,
      code: responseCode,
      context: {
        userId: context.userId ? '***' : undefined,
        workspaceId: context.workspaceId ? '***' : undefined,
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  return createErrorResponse(responseMessage, responseCode, responseStatus);
}

/**
 * Standard success response for API endpoints
 */
export function createSuccessResponse(
  data: any,
  meta?: any
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });

  // Add caching headers for better performance
  response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
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
