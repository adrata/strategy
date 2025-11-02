import { type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  workspaceId?: string;
  activeWorkspaceId?: string;
};

/**
 * Edge Runtime compatible JWT decoder
 * Note: This is a simplified version for Edge Runtime compatibility
 * In production, you should use a proper JWT library that supports Edge Runtime
 */
function decodeJWT(token: string): any | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev-secret-key-change-in-production";
    
    // Verify the JWT signature and decode the payload
    const decoded = jwt.verify(token, secret);
    
    // Check if token is expired
    if (decoded && typeof decoded === 'object' && 'exp' in decoded && decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.warn("⚠️ JWT verification failed:", error instanceof Error ? error.message : 'Unknown error');
    return null;
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
    const decoded = decodeJWT(token);
    
    if (!decoded) {
      return { user: null, error: 'Invalid token' };
    }

    return { 
      user: {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        name: decoded.name,
        workspaceId: decoded.workspaceId
      },
      error: null
    };
  } catch (error) {
    return { user: null, error: 'Authentication failed' };
  }
}

export async function getUnifiedAuthUser(
  req: NextRequest,
): Promise<AuthUser | null> {
  logger.api.auth("Checking authentication...");

  try {
    // 1. Try JWT token from cookie (web auth)
    const cookieHeader = req.headers.get("cookie");
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
        
        const decoded = decodeJWT(actualToken);
        if (decoded) {
          logger.auth.success(`Valid token for: ${decoded.email}`);
          // Log JWT workspace fields for debugging
          console.log('🔍 [API AUTH] Decoded token workspace fields:', {
            activeWorkspaceId: decoded.activeWorkspaceId,
            workspaceId: decoded.workspaceId,
            userId: decoded.userId || decoded.id || decoded.sub,
            hasWorkspace: !!(decoded.activeWorkspaceId || decoded.workspaceId),
            email: decoded.email
          });
          // Extract workspace info - prioritize activeWorkspaceId if available
          const workspaceId = decoded.activeWorkspaceId || decoded.workspaceId || "local-workspace";
          return {
            id: decoded.userId || decoded.id || decoded.sub,
            email: decoded.email,
            name: decoded.name,
            workspaceId: workspaceId,
            activeWorkspaceId: decoded.activeWorkspaceId || decoded.workspaceId,
          };
        } else {
          logger.auth.error("JWT verification failed");
        }
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
      
      const decoded = decodeJWT(token);
      if (decoded) {
        logger.auth.success(`Valid bearer token for: ${decoded.email}`);
        // Log JWT workspace fields for debugging
        console.log('🔍 [API AUTH] Decoded bearer token workspace fields:', {
          activeWorkspaceId: decoded.activeWorkspaceId,
          workspaceId: decoded.workspaceId,
          userId: decoded.userId || decoded.id || decoded.sub,
          hasWorkspace: !!(decoded.activeWorkspaceId || decoded.workspaceId),
          email: decoded.email
        });
        // Extract workspace info - prioritize activeWorkspaceId if available
        const workspaceId = decoded.activeWorkspaceId || decoded.workspaceId || "local-workspace";
        return {
          id: decoded.userId || decoded.id || decoded.sub,
          email: decoded.email,
          name: decoded.name,
          workspaceId: workspaceId,
          activeWorkspaceId: decoded.activeWorkspaceId || decoded.workspaceId,
        };
      } else {
        logger.auth.error("Bearer token verification failed");
      }
    }

    logger.api.auth("No valid authentication found");
    return null;
  } catch (error) {
    logger.auth.error("Error during authentication check:", error);
    return null;
  }
}
