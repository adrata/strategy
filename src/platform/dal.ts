import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { AUTH_UI_ROUTES } from "./auth/routes";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  workspaceId: string;
  activeWorkspaceId?: string | null;
}

/**
 * 🔐 MODERN AUTHENTICATION DATA ACCESS LAYER (2025)
 * Centralizes all authentication logic following Next.js best practices
 */

export const verifySession = cache(async (): Promise<AuthUser | null> => {
  if (process['env']['NODE_ENV'] === "development") {
    console.log("🔍 DAL: Verifying session...");
  }

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth-token")?.value;

    if (!sessionToken) {
      if (process['env']['NODE_ENV'] === "development") {
        console.log("❌ DAL: No session token found");
      }
      return null;
    }

    const secret = process['env']['NEXTAUTH_SECRET'] || "dev-secret";
    const decoded = jwt.verify(sessionToken, secret) as any;

    // Check if token is expired
    if (decoded['exp'] && Date.now() >= decoded.exp * 1000) {
      if (process['env']['NODE_ENV'] === "development") {
        console.log("❌ DAL: Token expired");
      }
      return null;
    }

    const user: AuthUser = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name,
      workspaceId: decoded.workspaceId || "local-workspace",
    };

    if (process['env']['NODE_ENV'] === "development") {
      console.log("✅ DAL: Valid session for:", user.email);
    }
    return user;
  } catch (error) {
    console.error("❌ DAL: Session verification failed:", error);
    return null;
  }
});

export const requireAuth = cache(async (): Promise<AuthUser> => {
  const session = await verifySession();

  if (!session) {
    if (process['env']['NODE_ENV'] === "development") {
      console.log("🔄 DAL: Redirecting to signin - authentication required");
    }
    redirect(AUTH_UI_ROUTES.SIGN_IN);
  }

  return session;
});

export const getUser = cache(async (): Promise<AuthUser | null> => {
  const session = await verifySession();

  if (!session) {
    return null;
  }

  // In a real app, you might fetch additional user data from database here
  // For now, return the session data
  return session;
});

/**
 * Check if user has specific role/permission
 */
export const hasRole = cache(async (role: string): Promise<boolean> => {
  const user = await getUser();

  if (!user) {
    return false;
  }

  // For demo purposes, make dan and ross admins
  if (role === "admin") {
    return ["dan", "ross"].includes(user.id);
  }

  return true; // Default: all authenticated users have basic access
});

/**
 * Workspace-aware data access
 */
export const getUserWorkspace = cache(async (): Promise<string | null> => {
  const user = await getUser();
  return user?.workspaceId || null;
});

/**
 * For OAuth operations - ensures user is authenticated
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthUser> => {
  const user = await requireAuth();
  return user;
});

// ==================== WORKSPACE UTILITIES ====================

import { Session } from "next-auth";

export async function getWorkspaceFromSession(session: Session) {
  if (!session.user?.email) return null;

  // Get the user's primary workspace
  const membership = await prisma.workspaceMembership.findFirst({
    where: {
      user: {
        email: session.user.email,
      },
    },
    include: {
      workspace: true,
    },
  });

  return membership?.workspace || null;
}
