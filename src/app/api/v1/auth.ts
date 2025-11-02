import { type NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getToken } from 'next-auth/jwt';

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  workspaceId?: string;
  activeWorkspaceId?: string;
};

/**
 * Simple, clean authentication for API v1
 * Integrates with your existing NextAuth.js system
 */
export async function getV1AuthUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    // 1. Try NextAuth.js token first (primary authentication)
    const nextAuthToken = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (nextAuthToken) {
      console.log("✅ V1 Auth: NextAuth token found for:", nextAuthToken.email);
      const workspaceId = (nextAuthToken as any)['activeWorkspaceId'] || (nextAuthToken as any)['workspaceId'] || "local-workspace";
      return {
        id: nextAuthToken.sub || (nextAuthToken as any)['userId'] || '',
        email: nextAuthToken.email || '',
        name: nextAuthToken.name || undefined,
        workspaceId: workspaceId,
        activeWorkspaceId: (nextAuthToken as any)['activeWorkspaceId'] || (nextAuthToken as any)['workspaceId'],
      };
    }

    // 2. Try auth-token cookie (from sign-in system)
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
          console.log("✅ V1 Auth: auth-token cookie found for:", decoded.email);
          const workspaceId = decoded.activeWorkspaceId || decoded.workspaceId || "local-workspace";
          return {
            id: decoded.userId || decoded.id || decoded.sub,
            email: decoded.email,
            name: decoded.name,
            workspaceId: workspaceId,
            activeWorkspaceId: decoded.activeWorkspaceId || decoded.workspaceId,
          };
        }
      }
    }

    // 3. Fallback to custom JWT token (for API clients)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1] || "";
      if (!token) {
        return null;
      }
      
      const decoded = decodeJWT(token);
      if (decoded) {
        console.log("✅ V1 Auth: Custom JWT token found for:", decoded.email);
        const workspaceId = decoded.activeWorkspaceId || decoded.workspaceId || "local-workspace";
        return {
          id: decoded.userId || decoded.id || decoded.sub,
          email: decoded.email,
          name: decoded.name,
          workspaceId: workspaceId,
          activeWorkspaceId: decoded.activeWorkspaceId || decoded.workspaceId,
        };
      }
    }

    console.log("❌ V1 Auth: No valid authentication found");
    return null;
  } catch (error) {
    console.error("❌ V1 Auth: Error during authentication check:", error);
    return null;
  }
}

/**
 * Simple JWT decoder (reusing your existing pattern)
 */
function decodeJWT(token: string): any | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET || (process.env as any)['JWT_SECRET'] || "dev-secret-key-change-in-production";
    
    const decoded = jwt.verify(token, secret);
    
    if (typeof decoded === 'object' && decoded !== null && 'exp' in decoded && (decoded as any).exp < Date.now() / 1000) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.warn("⚠️ V1 JWT verification failed:", (error as Error).message);
    return null;
  }
}
