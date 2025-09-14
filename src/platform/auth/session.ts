/**
 * Session Management
 * Handles session storage, retrieval, validation, and cleanup
 */

import type { UnifiedSession, AuthConfig } from "./types";
import { getPlatform } from "./platform";
import { AUTH_API_ROUTES } from "./routes";

// Session Configuration
export const AUTH_CONFIG: AuthConfig = {
  version: "ADRATA_AUTH_v2.1_2025",
  sessionKey: "adrata_unified_session_v3",
  sessionDuration: 8 * 60 * 60 * 1000, // 8 hours
};

// Session Storage
export async function storeSession(session: UnifiedSession): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    console.log("💾 [SESSION] Storing session to localStorage...");
    localStorage.setItem(AUTH_CONFIG.sessionKey, JSON.stringify(session));
    console.log("✅ [SESSION] Session stored successfully");
  } catch (error) {
    console.error("❌ [SESSION] Failed to store session:", error);
    throw error;
  }
}

// Session Retrieval
export async function getSession(): Promise<UnifiedSession | null> {
  if (typeof window === "undefined") return null;

  try {
    // Check for recent sign-out flag
    const justSignedOut = sessionStorage.getItem("adrata_signed_out");
    if (justSignedOut) {
      console.log("🔐 [GET SESSION] Just signed out - blocking session retrieval");
      await clearSession();
      return null;
    }

    const stored = localStorage.getItem(AUTH_CONFIG.sessionKey);
    if (!stored) return null;

    const session: UnifiedSession = JSON.parse(stored);

    // Check expiry
    if (new Date(session.expires) < new Date()) {
      await clearSession();
      return null;
    }

    // Update last activity timestamp in memory only (don't trigger storage events)
    session['lastActivity'] = new Date().toISOString();

    return session;
  } catch (error) {
    console.error("❌ [SESSION] Error getting session:", error);
    return null;
  }
}

// Session Clearing
export async function clearSession(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    console.log("🔐 [SESSION] Clearing session...");
    localStorage.removeItem(AUTH_CONFIG.sessionKey);
    sessionStorage.removeItem("adrata_signed_out");
    console.log("✅ [SESSION] Session cleared successfully");
  } catch (error) {
    console.error("❌ [SESSION] Failed to clear session:", error);
  }
}

// Session Validation
export function isSessionValid(session: UnifiedSession): boolean {
  if (!session || !session.user || !session.expires) return false;

  // Check if session has expired
  if (new Date(session.expires) < new Date()) return false;

  // Check if user has required fields
  if (!session.user.id || !session.user.email) return false;

  return true;
}

// Create Session Helper
export function createSession(
  user: any,
  platform: "web" | "desktop" | "mobile",
  deviceId: string,
  accessToken?: string,
  refreshToken?: string,
): UnifiedSession {
  const userWorkspaces = user.workspaces || [];
  
  // 🆕 CRITICAL FIX: Use the user's actual activeWorkspaceId from database, not hardcoded first workspace
  const activeWorkspaceId = user.activeWorkspaceId || (userWorkspaces[0] ? userWorkspaces[0].id : null);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      workspaces: userWorkspaces,
      activeWorkspaceId: activeWorkspaceId,
      deviceId,
      lastSeen: user.lastSeen || new Date().toISOString(),
    },
    accessToken,
    refreshToken,
    expires: new Date(Date.now() + AUTH_CONFIG.sessionDuration).toISOString(),
    lastActivity: new Date().toISOString(),
    platform,
    deviceId,
    syncEnabled: true,
  };
}

// Sign Out
export async function signOut(): Promise<void> {
  console.log("�� [SIGNOUT] Starting immediate sign out process...");

  try {
    const platform = getPlatform();
    console.log("🔐 [SIGNOUT] Platform:", platform);

    // Mark as signed out (immediate flag)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("adrata_signed_out", Date.now().toString());
    }

    // Clear speedrun engine settings for demo reset
    if (typeof window !== "undefined") {
      localStorage.removeItem('speedrun-engine-settings');
      console.log("🎯 Auth signOut: Speedrun engine settings cleared for demo reset");
      
      // Clear auto-login credentials for security
      localStorage.removeItem("adrata_remembered_password");
      document['cookie'] = "adrata_remember_me=false; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log("🔐 Auth signOut: Auto-login credentials cleared for security");
    }

    // Clear the session immediately
    await clearSession();

    // Platform-specific cleanup
    if (platform === "web") {
      try {
        // Attempt to call logout API
        const response = await fetch(AUTH_API_ROUTES.SIGN_OUT, {
          method: "POST",
          credentials: "include",
        });
        console.log("🔐 [SIGNOUT] Web logout API response:", response.status);
      } catch (error) {
        console.warn("🔐 [SIGNOUT] Web logout API failed (non-critical):", error);
      }
    }

    console.log("✅ [SIGNOUT] Sign out completed immediately");

    // Note: Removed the setTimeout delay - let the calling component handle navigation
  } catch (error) {
    console.error("❌ [SIGNOUT] Error during sign out:", error);
    throw error;
  }
}
