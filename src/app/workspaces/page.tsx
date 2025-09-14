"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import { getWorkspaceUrl } from "@/platform/auth/workspace-slugs";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import {
  BuildingOffice2Icon,
  CheckIcon,
  ChevronRightIcon,
  UserIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface Workspace {
  id: string;
  name: string;
  companyName?: string;
  role: string;
  isActive?: boolean;
}

export default function WorkspacesPage() {
  const router = useRouter();
  const { navigateToPipeline } = useWorkspaceNavigation();
  const { user: authUser } = useUnifiedAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Load user's workspaces
  useEffect(() => {
    if (authUser?.workspaces) {
      const userWorkspaces = authUser.workspaces.map((ws) => ({
        id: ws.id,
        name: ws.name,
        companyName: ws.name, // For now, use workspace name as company name
        role: ws.role || "member",
        isActive: ws['id'] === authUser.activeWorkspaceId,
      }));
      setWorkspaces(userWorkspaces);
    }
  }, [authUser?.workspaces, authUser?.activeWorkspaceId]);

  const handleWorkspaceSelect = async (workspace: Workspace) => {
    setIsSwitching(true);
    try {
      // DEBUG: Log the workspace data being sent
      console.log("🔍 [WORKSPACE SWITCH] Attempting to switch to:", {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        workspaceType: typeof workspace.id,
        isSlug: workspace.id.length < 20, // Database IDs are typically long
        authUserWorkspaces: authUser?.workspaces?.map(w => ({ id: w.id, name: w.name }))
      });
      
      // Get the access token from the current session
      const session = await import("@/platform/auth/session").then(m => m.getSession());
      const accessToken = session?.accessToken;

      if (!accessToken) {
        throw new Error("No authentication token available");
      }

      const response = await fetch("/api/auth/unified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          action: "switch-workspace",
          workspaceId: workspace.id 
        }),
        credentials: "include", // Include cookies for fallback auth
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Workspace switch failed:", errorData);
        
        // If it's an auth error, try to refresh the session
        if (response['status'] === 401 && errorData.error?.includes("authentication token")) {
          console.log("🔄 Attempting to refresh authentication...");
          
          try {
            // Try to refresh the session by re-authenticating
            const refreshResponse = await fetch("/api/auth/refresh-token", {
              method: "POST",
              credentials: "include",
            });
            
            if (refreshResponse.ok) {
              console.log("✅ Session refreshed, retrying workspace switch...");
              // Retry the workspace switch with the refreshed session
              window.location.reload(); // Simple approach: reload and let user try again
              return;
            }
          } catch (refreshError) {
            console.warn("⚠️ Session refresh failed:", refreshError);
          }
          
          // If refresh fails, redirect to sign-in
          console.log("🔐 Redirecting to sign-in page...");
          window['location']['href'] = "/sign-in";
          return;
        }
        
        throw new Error(errorData.error || "Failed to switch workspace");
      }

      const result = await response.json();
      console.log("✅ Workspace switch successful:", result);

      // 🆕 CRITICAL FIX: Update the session with the NEW JWT token from the response
      try {
        const { UnifiedAuthService } = await import("@/platform/auth/service");
        const { createSession, storeSession } = await import("@/platform/auth/session");
        
        // Handle unified auth API response format
        const newToken = result.auth?.token || result.newToken;
        if (newToken) {
          // Get current session to extract user data
          const currentSession = await UnifiedAuthService.getSession();
          
          if (currentSession && currentSession.user) {
            // Create a new session with the new JWT token and updated workspace
            const updatedUser = {
              ...currentSession.user,
              activeWorkspaceId: result.auth?.workspaceId || workspace.id
            };
            
            const newSession = createSession(
              updatedUser,
              currentSession.platform,
              currentSession.deviceId,
              newToken // Use the new JWT token
            );
            
            // Store the new session
            await storeSession(newSession);
            console.log("✅ New session created with new JWT token and workspace:", workspace.id);
            
            // 🆕 CRITICAL: Verify the session was stored correctly
            const verifySession = await UnifiedAuthService.getSession();
            console.log("🔍 [WORKSPACE SWITCH] Session verification:", {
              hasSession: !!verifySession,
              activeWorkspaceId: verifySession?.user?.activeWorkspaceId,
              expectedWorkspaceId: workspace.id,
              match: verifySession?.user?.activeWorkspaceId === workspace.id
            });
            
            // 🆕 CRITICAL: Force auth state refresh to ensure the new workspace is recognized
            try {
              const { UnifiedAuthService } = await import("@/platform/auth/service");
              await UnifiedAuthService.refreshAuthState();
              console.log("🔄 [WORKSPACE SWITCH] Auth state refreshed");
            } catch (error) {
              console.warn("⚠️ [WORKSPACE SWITCH] Failed to refresh auth state:", error);
            }
            
            // 🆕 PERSIST LAST ACTIVE WORKSPACE: Save to localStorage for login persistence
            if (typeof window !== 'undefined') {
              localStorage.setItem('adrata_last_active_workspace', workspace.id);
              console.log(`💾 [WORKSPACE SWITCH] Saved last active workspace to localStorage: ${workspace.id}`);
              
            // 🆕 CRITICAL FIX: Clear all workspace-related cache before dispatching session update
            try {
              const { cache } = await import('@/platform/services/unified-cache');
              const currentWorkspaceId = currentSession?.user?.activeWorkspaceId;
              if (currentWorkspaceId && currentWorkspaceId !== workspace.id) {
                await cache.clearWorkspaceCache(currentWorkspaceId, workspace.id);
                console.log(`🧹 [WORKSPACE SWITCH] Cleared cache for workspace switch: ${currentWorkspaceId} -> ${workspace.id}`);
              }
            } catch (error) {
              console.warn('⚠️ [WORKSPACE SWITCH] Failed to clear workspace cache:', error);
            }
            
            // 🆕 CRITICAL FIX: Dispatch custom event to notify useUnifiedAuth of session change
            window.dispatchEvent(new CustomEvent('adrata-session-updated'));
            console.log("🔄 [WORKSPACE SWITCH] Dispatched session update event");
            
            // 🆕 CRITICAL FIX: Wait for session to be fully updated before navigation
            console.log("⏳ [WORKSPACE SWITCH] Waiting for session to be fully updated...");
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for session update
            
            // Verify the session was updated correctly
            const { UnifiedAuthService } = await import("@/platform/auth/service");
            const verifySession = await UnifiedAuthService.getSession();
            if (verifySession?.user?.activeWorkspaceId === workspace.id) {
              console.log("✅ [WORKSPACE SWITCH] Session verified - workspace updated correctly");
            } else {
              console.warn("⚠️ [WORKSPACE SWITCH] Session verification failed - workspace may not be updated");
              // Force another session update if verification failed
              try {
                await UnifiedAuthService.refreshSession();
                console.log("🔄 [WORKSPACE SWITCH] Forced session refresh");
              } catch (error) {
                console.warn("⚠️ [WORKSPACE SWITCH] Failed to refresh session:", error);
              }
            }
            }
          } else {
            console.warn("⚠️ No current session found to update");
          }
        } else {
          console.warn("⚠️ No new token received from workspace switch");
        }
      } catch (error) {
        console.error("❌ Failed to update session with new token:", error);
        // Continue with redirect even if session update fails
      }
      
      // 🆕 CRITICAL FIX: Use hard reload to ensure fresh data and session
      console.log("🔄 Navigating to new workspace with hard reload:", result.redirectUrl);
      // Use the getWorkspaceUrl function to generate the correct URL
      const redirectUrl = result.redirectUrl || getWorkspaceUrl(workspace, 'dashboard');
      
      // Clear all possible caches before hard reload
      try {
        // Clear localStorage workspace-related data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('workspace') || key.includes('cache') || key.includes('swr'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🧹 [CACHE CLEAR] Cleared ${keysToRemove.length} localStorage entries`);
        
        // Clear sessionStorage
        sessionStorage.clear();
        console.log(`🧹 [CACHE CLEAR] Cleared sessionStorage`);
        
        // Clear SWR cache if available
        if (typeof window !== 'undefined' && (window as any).__SWR_CACHE__) {
          (window as any).__SWR_CACHE__.clear();
          console.log(`🧹 [CACHE CLEAR] Cleared SWR cache`);
        }
      } catch (error) {
        console.warn('⚠️ [CACHE CLEAR] Failed to clear some caches:', error);
      }
      
      // Show simple loading message before hard reload
      document['body']['innerHTML'] = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
          background: #f8fafc;
        ">
          <h2 style="color: #1e293b; margin: 0;">Loading...</h2>
        </div>
      `;
      
      // Use hard reload to ensure all caches are cleared and fresh data is loaded
      setTimeout(() => {
        console.log("🔄 [WORKSPACE SWITCH] Redirecting to:", redirectUrl);
        window['location']['href'] = redirectUrl;
      }, 2000); // Longer delay to ensure session is fully processed

    } catch (error) {
      console.error("❌ Failed to switch workspace:", error);
      alert(`Failed to switch workspace: ${error instanceof Error ? error.message : String(error)}`);
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PipelineSkeleton message="Loading workspaces..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Workspaces</h1>
                <p className="text-sm text-gray-500">
                  Choose which workspace to work in
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {authUser?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <span className="text-sm text-gray-700">{authUser?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {workspaces.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
                  workspace.isActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => !isSwitching && handleWorkspaceSelect(workspace)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BuildingOffice2Icon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {workspace.companyName || workspace.name}
                        </h3>
                        {workspace['isActive'] && (
                          <CheckIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {workspace.name}
                      </p>

                    </div>
                  </div>
                  {!workspace['isActive'] && (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {workspace['isActive'] && (
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      Current Workspace
                    </p>
                  </div>
                )}

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No workspaces available
            </h3>
            <p className="text-gray-500 mb-6">
              Contact your administrator to get access to workspaces
            </p>
            <button
              onClick={() => {
                // Use workspace-aware navigation for fallback
                navigateToPipeline('');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            About Workspaces
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Separate Data</h4>
              <p className="text-sm text-gray-600">
                Each workspace has its own leads, contacts, and company data.
                Switching workspaces keeps your information organized.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Easy Switching</h4>
              <p className="text-sm text-gray-600">
                You can switch between workspaces at any time from your profile
                menu or this dedicated page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
