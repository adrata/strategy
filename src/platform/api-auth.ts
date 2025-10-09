import { type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  workspaceId?: string;
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
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.warn("⚠️ JWT verification failed:", error.message);
    return null;
  }
}

import { logger } from "./logger";

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
          if (key && value) acc[key] = decodeURIComponent(value);
          return acc;
        },
        {} as Record<string, string>,
      );

      const token = cookies["auth-token"];
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded) {
          logger.auth.success(`Valid token for: ${decoded.email}`);
          return {
            id: decoded.userId || decoded.id,
            email: decoded.email,
            name: decoded.name,
            workspaceId: decoded.workspaceId || "local-workspace",
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
        return {
          id: decoded.userId || decoded.id,
          email: decoded.email,
          name: decoded.name,
          workspaceId: decoded.workspaceId || "local-workspace",
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
