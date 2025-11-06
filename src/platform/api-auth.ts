import { type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  workspaceId?: string;
  activeWorkspaceId?: string;
  _apiKey?: {
    id: string;
    scopes: string[];
    rateLimitInfo: {
      remaining: number;
      resetAt: number;
    };
  };
};

/**
 * JWT decode result type
 */
type JWTDecodeResult = {
  decoded: any;
  error: null;
} | {
  decoded: null;
  error: 'TOKEN_EXPIRED' | 'INVALID_TOKEN' | 'NO_SECRET';
};

/**
 * Edge Runtime compatible JWT decoder
 * Note: This is a simplified version for Edge Runtime compatibility
 * In production, you should use a proper JWT library that supports Edge Runtime
 */
function decodeJWT(token: string): JWTDecodeResult {
  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev-secret-key-change-in-production";
    
    if (!secret) {
      console.error("❌ [JWT] No JWT secret found in environment variables");
      return { decoded: null, error: 'NO_SECRET' };
    }
    
    // Verify the JWT signature and decode the payload
    const decoded = jwt.verify(token, secret);
    
    // Check if token is expired
    if (decoded && typeof decoded === 'object' && 'exp' in decoded && decoded.exp && decoded.exp < Date.now() / 1000) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("⚠️ [JWT] Token expired:", {
          expiredAt: new Date((decoded.exp as number) * 1000).toISOString(),
          currentTime: new Date().toISOString()
        });
      }
      return { decoded: null, error: 'TOKEN_EXPIRED' };
    }
    
    return { decoded, error: null };
  } catch (error) {
    // Check if it's a TokenExpiredError specifically
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      if (process.env.NODE_ENV === 'development') {
        console.warn("⚠️ [JWT] Token expired:", {
          expiredAt: (error as any).expiredAt ? new Date((error as any).expiredAt).toISOString() : 'unknown',
          currentTime: new Date().toISOString()
        });
      } else {
        console.warn("⚠️ [JWT] Token expired");
      }
      return { decoded: null, error: 'TOKEN_EXPIRED' };
    }
    
    // Enhanced error logging for other JWT verification failures
    if (process.env.NODE_ENV === 'development') {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        name: error.name
      } : { message: String(error) };
      
      console.warn("⚠️ [JWT] Verification failed:", {
        ...errorDetails,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 30) + '...',
        hasSecret: !!process.env.NEXTAUTH_SECRET || !!process.env.JWT_SECRET
      });
    } else {
      // Production: minimal logging
      console.warn("⚠️ [JWT] Verification failed:", error instanceof Error ? error.name : 'Unknown error');
    }
    return { decoded: null, error: 'INVALID_TOKEN' };
  }
}

import { logger } from "./logger";

export async function getSecureApiContext(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No valid authorization header' };
    }

    const token = authHeader.substring(7);
    const jwtResult = decodeJWT(token);
    
    if (!jwtResult.decoded) {
      return { 
        user: null, 
        error: jwtResult.error === 'TOKEN_EXPIRED' ? 'Token expired' : 'Invalid token' 
      };
    }

    return { 
      user: {
        id: jwtResult.decoded.sub || jwtResult.decoded.id,
        email: jwtResult.decoded.email,
        name: jwtResult.decoded.name,
        workspaceId: jwtResult.decoded.workspaceId
      },
      error: null
    };
  } catch (error) {
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Get unified auth user with error tracking
 */
export type UnifiedAuthResult = {
  user: AuthUser;
  error: null;
} | {
  user: null;
  error: 'TOKEN_EXPIRED' | 'INVALID_TOKEN' | 'NO_AUTH';
};

export async function getUnifiedAuthUserWithError(
  req: NextRequest,
): Promise<UnifiedAuthResult> {
  logger.api.auth("Checking authentication...");

  try {
    // 1. Try JWT token from cookie (web auth)
    const cookieHeader = req.headers.get("cookie");
    
    // Enhanced cookie diagnostics (without logging actual values)
    const hasCookies = !!cookieHeader;
    const cookieCount = cookieHeader ? cookieHeader.split(";").length : 0;
    const cookieNames = cookieHeader ? cookieHeader.split(";").map(c => c.trim().split("=")[0]).filter(Boolean) : [];
    
    // Track token expiration errors
    let tokenExpired = false;
    
    // Try cookie-based authentication first (but don't block Authorization header check if it fails)
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          if (key && value) {
            try {
              acc[key] = decodeURIComponent(value);
            } catch (e) {
              acc[key] = value; // Use raw value if decoding fails
            }
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      // Try different cookie names
      const token = cookies["auth-token"] || cookies["adrata_unified_session"];
      
      if (token) {
        // If it's the unified session cookie, it might be JSON encoded
        let actualToken = token;
        try {
          const sessionData = JSON.parse(token);
          if (sessionData.accessToken) {
            actualToken = sessionData.accessToken;
          }
        } catch (e) {
          // Not JSON, use as-is
        }
        
        const jwtResult = decodeJWT(actualToken);
        if (jwtResult.decoded) {
          logger.auth.success(`Valid token for: ${jwtResult.decoded.email}`);
          // Log JWT workspace fields for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [API AUTH] Decoded token workspace fields:', {
              activeWorkspaceId: jwtResult.decoded.activeWorkspaceId,
              workspaceId: jwtResult.decoded.workspaceId,
              userId: jwtResult.decoded.userId || jwtResult.decoded.id || jwtResult.decoded.sub,
              hasWorkspace: !!(jwtResult.decoded.activeWorkspaceId || jwtResult.decoded.workspaceId),
              email: jwtResult.decoded.email
            });
          }
          // Extract workspace info - prioritize activeWorkspaceId if available
          const workspaceId = jwtResult.decoded.activeWorkspaceId || jwtResult.decoded.workspaceId || "local-workspace";
          return {
            user: {
              id: jwtResult.decoded.userId || jwtResult.decoded.id || jwtResult.decoded.sub,
              email: jwtResult.decoded.email,
              name: jwtResult.decoded.name,
              workspaceId: workspaceId,
              activeWorkspaceId: jwtResult.decoded.activeWorkspaceId || jwtResult.decoded.workspaceId,
            },
            error: null
          };
        } else {
          // Track if token expired
          if (jwtResult.error === 'TOKEN_EXPIRED') {
            tokenExpired = true;
            logger.auth.error("JWT token expired");
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ [API AUTH] JWT token expired from cookies');
            }
          } else {
            logger.auth.error("JWT verification failed");
            
            // Enhanced error logging for JWT verification failures
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ [API AUTH] JWT verification failed from cookies:', {
                error: jwtResult.error,
                tokenLength: actualToken.length,
                tokenPrefix: actualToken.substring(0, 20) + '...',
                possibleCauses: [
                  'Token expired',
                  'Invalid signature',
                  'Invalid token format',
                  'Missing JWT secret'
                ]
              });
            }
          }
        }
      } else {
        // No auth token found in cookies - log but continue to check Authorization header
        const hasAuthCookie = cookieNames.some(name => 
          name.includes('auth') || name.includes('session') || name.includes('token')
        );
        
        logger.api.auth(`No auth token cookie found. Available cookies: ${cookieNames.length > 0 ? cookieNames.join(', ') : 'none'}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.warn('🔍 [API AUTH] Cookie diagnostics:', {
            cookieCount,
            cookieNames: cookieNames.slice(0, 10), // First 10 cookie names
            hasAuthCookie,
            lookingFor: ['auth-token', 'adrata_unified_session'],
            willCheckAuthHeader: true
          });
        }
        // Don't return null - continue to check Authorization header
      }
    }

    // 2. Try Authorization header (Bearer token)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1] || "";
      if (!token) {
        console.warn("⚠️ API Auth: No token found in Bearer header");
        return null;
      }

      // First, try API key authentication (if token starts with adrata_)
      if (token.startsWith("adrata_")) {
        try {
          const { prisma } = await import('@/platform/database/prisma-client');
          const bcrypt = await import('bcryptjs');
          const { getClientIp, checkIpAccess, checkRateLimit } = await import('@/platform/api-rate-limiter');
          
          // SECURITY: Validate token format before database lookup
          // This prevents potential timing attacks and invalid queries
          
          await prisma.$connect();
          
          // Extract prefix and secret
          // Format is: adrata_live_<secret>
          const prefix = "adrata_live_";
          
          if (!token.startsWith(prefix) || token.length <= prefix.length) {
            // Invalid format - don't proceed (prevents timing attacks)
            return null;
          }
          
          const secret = token.substring(prefix.length);
          
          // Find ALL API keys with this prefix (to prevent enumeration)
          // We'll verify against all of them to prevent timing attacks
          const now = new Date();
          // Find all active keys with this prefix
          // Include keys that haven't expired AND are still in grace period (if rotated)
          const apiKeys = await prisma.api_keys.findMany({
            where: {
              keyPrefix: prefix,
              isActive: true,
              AND: [
                {
                  expiresAt: {
                    OR: [
                      { equals: null },
                      { gt: now }
                    ]
                  }
                },
                {
                  // Either no rotation grace period (never rotated) OR grace period hasn't expired
                  OR: [
                    { rotationGracePeriodEndsAt: null },
                    { rotationGracePeriodEndsAt: { gt: now } }
                  ]
                }
              ]
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  activeWorkspaceId: true
                }
              },
              workspace: {
                select: {
                  id: true
                }
              }
            }
          });

          // Verify against all keys with this prefix (prevents timing attacks)
          // Always perform bcrypt comparison to prevent enumeration
          let apiKey: typeof apiKeys[0] | null = null;
          
          for (const key of apiKeys) {
            // Use bcrypt.compare which is constant-time
            const isValid = await bcrypt.default.compare(secret, key.hashedKey);
            if (isValid) {
              apiKey = key;
              break;
            }
          }
          
          if (apiKey) {
              // Check IP restrictions
              const clientIp = getClientIp(req as any);
              const ipCheck = checkIpAccess(
                clientIp,
                apiKey.allowedIps || [],
                apiKey.deniedIps || []
              );
              
              if (!ipCheck.allowed) {
                // Log without revealing which key was attempted (security)
                logger.auth.error(`API key IP blocked: ${ipCheck.reason}`);
                return null;
              }
              
              // Check rate limiting
              const rateLimitResult = await checkRateLimit(apiKey.id, {
                perHour: apiKey.rateLimitPerHour || undefined,
                perDay: apiKey.rateLimitPerDay || undefined
              });
              
              if (!rateLimitResult.allowed) {
                // Log without revealing key ID (security)
                logger.auth.error(`API key rate limit exceeded`);
                // Throw a special error that can be caught for 429 response
                throw new Error(`RATE_LIMIT_EXCEEDED:${rateLimitResult.retryAfter}`);
              }

              // Update lastUsedAt
              await prisma.api_keys.update({
                where: { id: apiKey.id },
                data: { lastUsedAt: new Date() }
              });

              logger.auth.success(`Valid API key for workspace: ${apiKey.workspaceId}`);
              
              // Return with API key metadata for scope checking
              return {
                id: apiKey.user.id,
                email: apiKey.user.email,
                name: apiKey.user.name || '',
                workspaceId: apiKey.workspaceId,
                activeWorkspaceId: apiKey.user.activeWorkspaceId || apiKey.workspaceId,
                // Store API key info for scope checking
                _apiKey: {
                  id: apiKey.id,
                  scopes: apiKey.scopes || [],
                  rateLimitInfo: {
                    remaining: rateLimitResult.remaining,
                    resetAt: rateLimitResult.resetAt
                  }
                }
              };
            }
        } catch (error: any) {
          // Check if it's a rate limit error
          if (error?.message?.startsWith('RATE_LIMIT_EXCEEDED:')) {
            // Rate limit errors should propagate - don't catch them here
            // They'll be caught by the outer try/catch and should be handled by the caller
            throw error;
          }
          // Log other errors but continue to JWT fallback
          console.error('❌ [API AUTH] API key verification error:', error);
          // Fall through to JWT check
        }
      }
      
      // Fall back to JWT token verification
      const jwtResult = decodeJWT(token);
      if (jwtResult.decoded) {
        logger.auth.success(`Valid bearer token for: ${jwtResult.decoded.email}`);
        // Log JWT workspace fields for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [API AUTH] Successfully authenticated via Authorization header:', {
            activeWorkspaceId: jwtResult.decoded.activeWorkspaceId,
            workspaceId: jwtResult.decoded.workspaceId,
            userId: jwtResult.decoded.userId || jwtResult.decoded.id || jwtResult.decoded.sub,
            hasWorkspace: !!(jwtResult.decoded.activeWorkspaceId || jwtResult.decoded.workspaceId),
            email: jwtResult.decoded.email,
            cookieAuthAttempted: hasCookies
          });
        }
        // Extract workspace info - prioritize activeWorkspaceId if available
        const workspaceId = jwtResult.decoded.activeWorkspaceId || jwtResult.decoded.workspaceId || "local-workspace";
        return {
          user: {
            id: jwtResult.decoded.userId || jwtResult.decoded.id || jwtResult.decoded.sub,
            email: jwtResult.decoded.email,
            name: jwtResult.decoded.name,
            workspaceId: workspaceId,
            activeWorkspaceId: jwtResult.decoded.activeWorkspaceId || jwtResult.decoded.workspaceId,
          },
          error: null
        };
      } else {
        // Track if token expired
        if (jwtResult.error === 'TOKEN_EXPIRED') {
          tokenExpired = true;
          logger.auth.error("Bearer token expired");
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [API AUTH] Authorization header Bearer token expired');
          }
        } else {
          logger.auth.error("Bearer token verification failed");
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [API AUTH] Authorization header Bearer token verification failed:', {
              error: jwtResult.error,
              tokenLength: token.length,
              tokenPrefix: token.substring(0, 20) + '...',
              cookieAuthAttempted: hasCookies
            });
          }
        }
      }
    }

    logger.api.auth("No valid authentication found");
    
    // Enhanced diagnostics when no auth found
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔍 [API AUTH] Authentication check complete - no valid auth found:', {
        hasCookieHeader: !!cookieHeader,
        cookieCount: cookieHeader ? cookieHeader.split(";").length : 0,
        hasAuthHeader: !!req.headers.get("authorization")
      });
    }
    
    // Return error based on what we found
    if (tokenExpired) {
      return { user: null, error: 'TOKEN_EXPIRED' };
    }
    return { user: null, error: 'NO_AUTH' };
  } catch (error) {
    // Check if it's a rate limit error - these should be re-thrown to be handled by caller
    if (error instanceof Error && error.message?.startsWith('RATE_LIMIT_EXCEEDED:')) {
      throw error; // Re-throw rate limit errors so caller can return 429
    }
    
    logger.auth.error("Error during authentication check:", error);
    
    // Enhanced error logging
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [API AUTH] Error during authentication check:', {
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    
    // For all other errors, return NO_AUTH
    return { user: null, error: 'NO_AUTH' };
  }
}

/**
 * Get unified auth user (backward-compatible wrapper)
 * This maintains the original API while using the new error-aware implementation
 */
export async function getUnifiedAuthUser(
  req: NextRequest,
): Promise<AuthUser | null> {
  const result = await getUnifiedAuthUserWithError(req);
  return result.user;
}
