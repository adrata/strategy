"use client";

/**
 * React Authentication Hooks
 * React hooks for managing authentication state and actions
 */

import { useState, useEffect, useCallback } from "react";
import type { UnifiedSession, UnifiedUser } from "./types";
import { getSession, signOut as sessionSignOut } from "./session";
import { UnifiedAuthService } from "./service";
import { getPlatform } from "./platform";

// 🚀 GLOBAL AUTH STATE MANAGEMENT - Single source of truth
let globalAuthState: {
  user: UnifiedUser | null;
  session: UnifiedSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
} = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isInitialized: false
};

let globalAuthInitializing = false;
const authStateListeners = new Set<() => void>();

// Global auth state manager
const updateGlobalAuthState = (updates: Partial<typeof globalAuthState>) => {
  globalAuthState = { ...globalAuthState, ...updates };
  authStateListeners.forEach(listener => listener());
};

// Unified Auth Hook
export function useUnifiedAuth() {
  const [localState, setLocalState] = useState(globalAuthState);

  // Initialize authentication state with global debouncing
  const initAuth = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (globalAuthInitializing) {
      return;
    }

    if (globalAuthState.isInitialized) {
      return;
    }

    globalAuthInitializing = true;
    updateGlobalAuthState({ isLoading: true });

    try {
      const currentSession = await getSession();

      if (currentSession) {
        updateGlobalAuthState({
          session: currentSession,
          user: currentSession.user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true
        });
      } else {
        updateGlobalAuthState({
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true
        });
      }
    } catch (error) {
      console.error("❌ [INIT AUTH] Error during initialization:", error);
      updateGlobalAuthState({
        session: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true
      });
    } finally {
      globalAuthInitializing = false;
    }
  }, []);

  // Listen for global auth state changes
  useEffect(() => {
    const listener = () => setLocalState({ ...globalAuthState });
    authStateListeners.add(listener);
    
    // Initialize if not already done
    if (!globalAuthState.isInitialized) {
      initAuth();
    }
    
    return () => {
      authStateListeners.delete(listener);
    };
  }, [initAuth]);

  // Use local state (synced with global)
  const { user, session, isLoading, isAuthenticated } = localState;
  const [isDesktop] = useState(getPlatform() === "desktop");

  // 🆕 SESSION CHANGE DETECTION: Listen for external session changes (like workspace switching)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isInitialized = false;

    const handleStorageChange = (e: StorageEvent) => {
      // Check if the session key changed
      if (e['key'] === "adrata_unified_session_v3" && e.newValue !== e.oldValue) {
        console.log("🔄 [SESSION CHANGE] Detected external session change, refreshing auth state...");
        if (!isInitialized) {
          initAuth();
          isInitialized = true;
        }
      }
    };

    // Listen for localStorage changes
    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events (for same-tab session updates)
    const handleSessionUpdate = () => {
      console.log("🔄 [SESSION UPDATE] Custom session update event received, refreshing auth state...");
      if (!isInitialized) {
        initAuth();
        isInitialized = true;
      }
    };

    window.addEventListener("adrata-session-updated", handleSessionUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("adrata-session-updated", handleSessionUpdate);
    };
  }, [initAuth]);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    console.log("🔐 [HOOK] Starting sign in for:", email);
    updateGlobalAuthState({ isLoading: true });

    try {
      const result = await UnifiedAuthService.signIn(email, password);

      if (result['success'] && result.session) {
        console.log("✅ [HOOK] Sign in successful");
        updateGlobalAuthState({
          session: result.session,
          user: result.session.user,
          isAuthenticated: true,
          isLoading: false
        });
        
        // Return the full result so the sign-in page can access redirectTo and platformRoute
        return result;
      } else {
        console.log("❌ [HOOK] Sign in failed:", result.error);
        return { success: false, error: result.error || "Sign in failed" };
      }
    } catch (error) {
      console.error("❌ [HOOK] Sign in error:", error);
      return { success: false, error: "Network error occurred" };
    } finally {
      updateGlobalAuthState({ isLoading: false });
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    console.log("🔐 [HOOK] Starting sign out...");
    updateGlobalAuthState({ isLoading: true });

    try {
      await sessionSignOut();
      updateGlobalAuthState({
        session: null,
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      console.log("✅ [HOOK] Sign out successful");
    } catch (error) {
      console.error("❌ [HOOK] Sign out error:", error);
    } finally {
      updateGlobalAuthState({ isLoading: false });
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    console.log("🔐 [HOOK] Refreshing session...");
    await initAuth();
  }, [initAuth]);

  // Password Reset - Request Reset Email
  const forgotPassword = useCallback(async (email: string) => {
    console.log("🔐 [HOOK] Requesting password reset for:", email);
    updateGlobalAuthState({ isLoading: true });

    try {
      const result = await UnifiedAuthService.forgotPassword(email);
      return result;
    } catch (error) {
      console.error("❌ [HOOK] Forgot password error:", error);
      return { success: false, error: "Network error occurred" };
    } finally {
      updateGlobalAuthState({ isLoading: false });
    }
  }, []);

  // Password Reset - Reset with Token
  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    console.log("🔐 [HOOK] Resetting password with token");
    updateGlobalAuthState({ isLoading: true });

    try {
      const result = await UnifiedAuthService.resetPassword(token, newPassword);
      return result;
    } catch (error) {
      console.error("❌ [HOOK] Reset password error:", error);
      return { success: false, error: "Network error occurred" };
    } finally {
      updateGlobalAuthState({ isLoading: false });
    }
  }, []);

  // Token Refresh
  const refreshToken = useCallback(async () => {
    console.log("🔄 [HOOK] Refreshing authentication token");
    updateGlobalAuthState({ isLoading: true });

    try {
      const result = await UnifiedAuthService.refreshToken();

      if (result['success'] && result.session) {
        console.log("✅ [HOOK] Token refresh successful");
        updateGlobalAuthState({
          session: result.session,
          user: result.session.user,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true };
      } else {
        console.log("❌ [HOOK] Token refresh failed:", result.error);
        // If token refresh fails, user needs to sign in again
        updateGlobalAuthState({
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        return { success: false, error: result.error || "Token refresh failed" };
      }
    } catch (error) {
      console.error("❌ [HOOK] Token refresh error:", error);
      return { success: false, error: "Network error occurred" };
    } finally {
      updateGlobalAuthState({ isLoading: false });
    }
  }, []);

  // Validate Reset Token
  const validateResetToken = useCallback(async (token: string) => {
    console.log("🔐 [HOOK] Validating reset token");
    
    try {
      const result = await UnifiedAuthService.validateResetToken(token);
      return result;
    } catch (error) {
      console.error("❌ [HOOK] Validate token error:", error);
      return { success: false, error: "Network error occurred" };
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return {
    // State
    user,
    session,
    isLoading,
    isAuthenticated,
    isDesktop,

    // Actions
    signIn,
    signOut,
    refreshSession,
    forgotPassword,
    resetPassword,
    refreshToken,
    validateResetToken,

    // Utilities
    initAuth,
  };
}
