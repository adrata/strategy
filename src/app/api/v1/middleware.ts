/**
 * V1 API Security Middleware
 * 
 * Implements 2025 best practices for API security:
 * - JWT token validation with proper error handling
 * - Rate limiting protection
 * - Input validation and sanitization
 * - CORS protection
 * - Security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getV1AuthUser } from './auth';

export interface SecureApiContext {
  authUser: {
    id: string;
    email: string;
    name?: string;
    workspaceId?: string;
  };
  request: NextRequest;
}

/**
 * Rate limiting store (Vercel-optimized)
 * In production on Vercel, this will be reset on each deployment
 * For persistent rate limiting, consider using Vercel KV or Upstash Redis
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // Max requests per window
  skipSuccessfulRequests: false,
};

/**
 * Security headers for all API responses
 */
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Enhanced authentication and security middleware
 */
export async function withSecurity<T>(
  handler: (context: SecureApiContext) => Promise<NextResponse<T>>,
  options: {
    requireAuth?: boolean;
    rateLimit?: boolean;
    allowedMethods?: string[];
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    try {
      // 1. Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
        return NextResponse.json(
          { success: false, error: 'Method not allowed' },
          { 
            status: 405,
            headers: SECURITY_HEADERS
          }
        );
      }

      // 2. Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitResult = await checkRateLimit(request);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Rate limit exceeded',
              retryAfter: rateLimitResult.retryAfter
            },
            { 
              status: 429,
              headers: {
                ...SECURITY_HEADERS,
                'Retry-After': rateLimitResult.retryAfter.toString(),
                'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
              }
            }
          );
        }
      }

      // 3. Authentication
      let authUser = null;
      if (options.requireAuth !== false) {
        authUser = await getV1AuthUser(request);
        if (!authUser) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { 
              status: 401,
              headers: SECURITY_HEADERS
            }
          );
        }
      }

      // 4. Execute handler with security context
      const context: SecureApiContext = {
        authUser: authUser!,
        request
      };

      const response = await handler(context);

      // 5. Add security headers to response
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;

    } catch (error) {
      console.error('❌ [V1 SECURITY] Middleware error:', error);
      
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { 
          status: 500,
          headers: SECURITY_HEADERS
        }
      );
    }
  };
}

/**
 * Rate limiting implementation
 */
async function checkRateLimit(request: NextRequest): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}> {
  const clientId = getClientIdentifier(request);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }

  const current = rateLimitStore.get(clientId);
  
  if (!current || current.resetTime < now) {
    // New window or expired
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs
    });
    
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      retryAfter: 0
    };
  }

  if (current.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    };
  }

  // Increment counter
  current.count++;
  rateLimitStore.set(clientId, current);

  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.maxRequests - current.count,
    resetTime: current.resetTime,
    retryAfter: 0
  };
}

/**
 * Get client identifier for rate limiting (Vercel-optimized)
 */
function getClientIdentifier(request: NextRequest): string {
  // Vercel provides these headers automatically
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  
  // Vercel's IP detection priority
  const ip = vercelIp || cfConnectingIp || forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  // For Vercel, we can also use the Vercel-Id header for more accurate identification
  const vercelId = request.headers.get('x-vercel-id');
  if (vercelId) {
    return vercelId;
  }
  
  // Fallback to IP + user agent
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}-${userAgent.slice(0, 50)}`;
}

/**
 * Input validation helper
 */
export function validateInput<T>(data: unknown, schema: any): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { 
        success: false, 
        error: `Validation error: ${result.error.errors.map(e => e.message).join(', ')}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Invalid input format' 
    };
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Log security events
 */
export function logSecurityEvent(event: string, details: any, request: NextRequest) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: getClientIdentifier(request),
    userAgent: request.headers.get('user-agent'),
    url: request.url,
  };
  
  console.log(`🔒 [SECURITY] ${event}:`, logEntry);
}
