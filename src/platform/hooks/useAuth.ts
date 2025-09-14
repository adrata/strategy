"use client";

import {
  useUnifiedAuth,
  type UnifiedUser,
  type Workspace,
} from "@/platform/auth-unified";

// Legacy interface for backward compatibility
interface User {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
  workspaces?: Workspace[];
  activeWorkspaceId?: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string | undefined;
}

interface SignInResult {
  success: boolean;
  error?: string;
  user?: User | null;
}

/**
 * 🔐 LEGACY AUTHENTICATION HOOK (Compatibility Layer)
 *
 * This hook provides backward compatibility by wrapping the new
 * useUnifiedAuth hook and converting the response to match the old interface.
 *
 * For new code, prefer useUnifiedAuth directly.
 */
export function useAuth() {
  const {
    user: unifiedUser,
    isAuthenticated,
    isLoading,
    signIn: unifiedSignIn,
    signOut: unifiedSignOut,
  } = useUnifiedAuth();

  // Convert UnifiedUser to legacy User format
  const convertUser = (unifiedUser: UnifiedUser | null): User | null => {
    if (!unifiedUser || !unifiedUser.workspaces) return null;

    const activeWorkspace =
      unifiedUser.workspaces.find(
        (w) => w['id'] === unifiedUser.activeWorkspaceId,
      ) || unifiedUser['workspaces'][0];

    return {
      id: unifiedUser.id,
      name: unifiedUser.name,
      email: unifiedUser.email,
      workspaceId: activeWorkspace?.id || "",
      workspaces: unifiedUser.workspaces,
      activeWorkspaceId: unifiedUser.activeWorkspaceId,
    };
  };

  const authState: AuthState = {
    user: convertUser(unifiedUser),
    isLoading,
    isAuthenticated,
    error: undefined,
  };

  // Legacy signIn function
  const signIn = async (
    emailOrUsername: string,
    password: string,
  ): Promise<SignInResult> => {
    try {
      const result = await unifiedSignIn(emailOrUsername, password);

      if (result.success) {
        const convertedUser = convertUser(unifiedUser);
        return {
          success: true,
          user: convertedUser,
        };
      } else {
        return {
          success: false,
          error: result.error || "Authentication failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  };

  // Legacy signOut function
  const signOut = async () => {
    await unifiedSignOut();
  };

  // clearError function for test compatibility
  const clearError = () => {
    // The unified auth system doesn't expose clearError directly
    // This is a placeholder for test compatibility
    console.log("clearError called - error handling is managed by UnifiedAuth");
  };

  const refreshAuth = () => {
    // The unified auth system handles refresh automatically
    console.log("refreshAuth called - handled automatically by UnifiedAuth");
  };

  // Platform detection for test compatibility
  const isDesktop = typeof window !== "undefined" && (window as any).__TAURI__;
  const isMobile = typeof window !== "undefined" && (window as any).Capacitor;

  return {
    ...authState,
    signIn,
    signOut,
    refreshAuth,
    clearError,
    isDesktop,
    isMobile,
  };
}
