import { useEffect, useState } from "react";
import { useUnifiedAuth } from "@/platform/auth";
// Removed desktop-env-check import - using simple fallback
const getDesktopEnvInfo = () => ({ isDesktop: false });

interface UseAuthReturn {
  authUser: any;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isReady: boolean;
  error: string | null;
}

/**
 * AUTH HOOK
 * Handles authentication for the platform
 */
export function useAuth(): UseAuthReturn {
  const { user: authUser, isAuthenticated, isLoading } = useUnifiedAuth();
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Debug helper
  const debug = (phase: string, details: any) => {
    console.log(`[AUTH HOOK] ${phase}:`, details);
  };

  // Monitor authentication state
  useEffect(() => {
    debug("AUTH_STATE_CHANGED", {
      hasAuthUser: !!authUser,
      authUserDetails: authUser
        ? {
            id: authUser.id,
            email: authUser.email,
            workspaceId: authUser.workspaces?.[0]?.id || "default",
            name: authUser.name,
          }
        : null,
      isAuthenticated,
      isLoading,
      timestamp: new Date().toISOString(),
    });

    // Clear any previous errors when auth state changes
    setError(null);

    // Determine if auth is ready
    if (!isLoading) {
      if (authUser) {
        debug("AUTH_SUCCESS", {
          userId: authUser.id,
          workspace: authUser.workspaces?.[0]?.id || "default",
        });
        setIsReady(true);
      } else {
        debug("AUTH_REQUIRED", {
          message: "User needs to sign in",
          redirectUrl: "/sign-in",
        });
        setError("Authentication required");

        // Check if we're on desktop and allow emergency bypass
        const envInfo = getDesktopEnvInfo();
        if (envInfo.isDesktop) {
          debug("DESKTOP_EMERGENCY_BYPASS", {
            message: "Desktop mode detected, allowing emergency access",
          });
          setIsReady(true);
        }
      }
    }
  }, [authUser, isAuthenticated, isLoading]);

  // Emergency timeout for stuck auth
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !authUser) {
        debug("AUTH_TIMEOUT", {
          message: "Authentication taking too long",
          duration: 5000,
        });
        setError("Authentication timeout - please refresh");
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isLoading, authUser]);

  return {
    authUser,
    isAuthenticated,
    isAuthLoading: isLoading,
    isReady,
    error,
  };
}

// Legacy alias for backwards compatibility
export const useActionPlatformAuth = useAuth;
