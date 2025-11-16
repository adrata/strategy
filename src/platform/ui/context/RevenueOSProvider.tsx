"use client";

import React, { createContext, useContext, useEffect, useRef, useMemo } from "react";
import type { RevenueOSContextType } from "../../types";

// Import all the modular hooks
import { useAuth } from "@/platform/hooks/useAuth";
import { useUI } from "@/platform/hooks/useUI";
import { useData } from "@/platform/hooks/useData";
import { useChat } from "@/platform/hooks/useChat";
import { useForms } from "@/platform/hooks/useForms";
import { useProgress } from "@/platform/hooks/useProgress";

// Import workspace mapping
import { getWorkspaceIdBySlug, getAllWorkspaceSlugs } from "@/platform/config/workspace-mapping";

// Import RecordContextProvider to provide record context to AI chat
import { RecordContextProvider } from './RecordContextProvider';

// Import modern loading components

// Create context
const RevenueOSContext = createContext<
  RevenueOSContextType | undefined
>(undefined);

// Provider component
interface RevenueOSProviderProps {
  children: React.ReactNode;
  initialApp?: string;
  initialSection?: string | null;
}

/**
 * 🚀 MODULAR REVENUE OS PROVIDER
 *
 * This provider orchestrates all the focused hooks:
 * 🔐 Auth Hook - Authentication & user management
 * 📊 Data Hook - Data loading & management
 * 🎨 UI Hook - UI state & navigation
 * 💬 Chat Hook - Chat functionality
 * 📝 Forms Hook - Form handling & CRUD operations
 * 📈 Progress Hook - Progress tracking & completion
 *
 * Benefits:
 * ✅ Easy to debug - Each hook is isolated
 * ✅ Easy to test - Mock individual hooks
 * ✅ Clear responsibilities - One job per hook
 * ✅ Better performance - Optimized re-renders
 */
export function RevenueOSProvider({
  children,
  initialApp,
  initialSection,
}: RevenueOSProviderProps) {
  // Reduced logging for performance - only log in debug mode
  if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_PROVIDER'] === 'true') {
    console.log("🔥🔥🔥 [CRITICAL] RevenueOSProvider INSTANTIATION - Function called!");
    console.log("🚀 [MODULAR RevenueOSProvider] STARTING INITIALIZATION...");
  }

  // Track if initial app/section have been set to prevent interference with client-side navigation
  const initialAppSetRef = React.useRef(false);
  const initialSectionSetRef = React.useRef(false);

  // CRITICAL FIX: Move hooks OUTSIDE try-catch to follow React's rules
  const auth = useAuth();
  const ui = useUI();
  
  // INSTANT LOADING FIX: Set initial app/section IMMEDIATELY after hook creation
  // This overrides the hardcoded "Speedrun" default in useUI
  if (initialApp && !initialAppSetRef.current) {
    if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_PROVIDER'] === 'true') {
      console.log(`⚡ [PROVIDER] Setting initial app INSTANTLY: ${initialApp}`);
    }
    ui.setActiveSubApp(initialApp);
    initialAppSetRef['current'] = true;
  }
  if (initialSection && !initialSectionSetRef.current) {
    if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_PROVIDER'] === 'true') {
      console.log(`⚡ [PROVIDER] Setting initial section INSTANTLY: ${initialSection}`);
    }
    ui.setActiveSection(initialSection);
    initialSectionSetRef['current'] = true;
  }
  
  // 🆕 CRITICAL FIX: Force data hook to re-initialize when workspace changes
  const data = useData({
    authUser: auth.authUser,
    isAuthenticated: auth.isAuthenticated,
    isAuthLoading: auth.isAuthLoading,
    activeWorkspace: ui.activeWorkspace,
  });
  
  // 🚀 PERFORMANCE: Removed redundant workspace change handling
  // The useData hook already handles workspace changes internally
  const chat = useChat();
  const forms = useForms();
  const progress = useProgress();

  // 🚨 CRITICAL FIX: ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Memoize context value to prevent unnecessary re-renders
  const contextValue: RevenueOSContextType = useMemo(() => ({
    auth,
    ui,
    data,
    chat,
    forms,
    progress,
  }), [auth, ui, data, chat, forms, progress]);

  // Auto-select workspace on successful authentication or provide development fallback
  const hasSetupWorkspace = useRef(false);
  const lastAuthUserActiveWorkspaceId = useRef<string | null>(null);
  
  useEffect(() => {
    
    // CRITICAL FIX: Only proceed if we have a valid authenticated user
    if (!auth.authUser || !auth.isAuthenticated) {
      console.log("⏳ [PROVIDER] Waiting for authentication to complete...");
      return;
    }
    
    // 🆕 CRITICAL FIX: Check if the user's activeWorkspaceId has changed
    const currentActiveWorkspaceId = auth.authUser.activeWorkspaceId;
    const workspaceChanged = lastAuthUserActiveWorkspaceId.current !== null && 
                            lastAuthUserActiveWorkspaceId.current !== currentActiveWorkspaceId;
    
    if (workspaceChanged) {
      console.log("🔄 [PROVIDER] User's activeWorkspaceId changed from", lastAuthUserActiveWorkspaceId.current, "to", currentActiveWorkspaceId);
      // Reset the setup flag to allow workspace re-selection
      hasSetupWorkspace['current'] = false;
    }
    
    // CRITICAL FIX: Don't proceed if we already have an active workspace AND it matches the user's active workspace
    if (ui['activeWorkspace'] && ui['activeWorkspace']['id'] === currentActiveWorkspaceId && !workspaceChanged) {
      console.log("✅ [PROVIDER] Workspace already set and matches user's active workspace:", ui.activeWorkspace.id);
      hasSetupWorkspace['current'] = true;
      lastAuthUserActiveWorkspaceId['current'] = currentActiveWorkspaceId;
      return;
    }
    
    // CRITICAL FIX: Only proceed if user has valid workspaces
    if (!auth.authUser.workspaces || auth.authUser['workspaces']['length'] === 0) {
      console.warn("⚠️ [PROVIDER] User has no workspaces - waiting for proper workspace setup");
      return;
    }
    
    // 🆕 CRITICAL FIX: Use the user's activeWorkspaceId to find the correct workspace
    let selectedWorkspace = null;
    
    if (currentActiveWorkspaceId) {
      // Find the workspace that matches the user's activeWorkspaceId
      selectedWorkspace = auth.authUser.workspaces.find((w: any) => w['id'] === currentActiveWorkspaceId);
      console.log("🔍 [PROVIDER] Using user's activeWorkspaceId:", {
        activeWorkspaceId: currentActiveWorkspaceId,
        foundWorkspace: selectedWorkspace ? { id: selectedWorkspace.id, name: selectedWorkspace.name } : null
      });
    }
    
    // Fallback: Find the first non-demo workspace if no active workspace found
    if (!selectedWorkspace) {
      selectedWorkspace = auth.authUser.workspaces.find((w: any) => 
        w['id'] && !w.id.includes('demo') && !w.id.includes('default')
      );
      console.log("🔍 [PROVIDER] Fallback to first valid workspace:", selectedWorkspace ? { id: selectedWorkspace.id, name: selectedWorkspace.name } : null);
    }
    
    if (!selectedWorkspace) {
      console.warn("⚠️ [PROVIDER] No valid workspace found");
      return;
    }
    
    console.log("✅ [PROVIDER] Auto-selecting workspace:", {
      selectedId: selectedWorkspace.id,
      selectedName: selectedWorkspace.name,
      userActiveWorkspaceId: currentActiveWorkspaceId,
      workspaceChanged: workspaceChanged,
      allWorkspaces: auth.authUser.workspaces.map((w: any) => ({ id: w.id, name: w.name }))
    });
    
    ui.setWorkspaces(auth.authUser.workspaces);
    ui.setActiveWorkspace(selectedWorkspace);
    hasSetupWorkspace['current'] = true;
    lastAuthUserActiveWorkspaceId['current'] = currentActiveWorkspaceId;
    
  }, [auth.authUser, auth.isAuthenticated, ui.setActiveWorkspace, ui.setWorkspaces]);

  // CRITICAL FIX: Don't render children until workspace is properly set
  // This prevents the "default" workspace data loading that causes wrong numbers
  if (!ui.activeWorkspace || !auth.authUser || !auth.isAuthenticated) {
    // Reduced logging for performance
    if (process.env.NODE_ENV === 'development' && process.env.ADRATA_DEBUG_PROVIDER === 'true') {
      console.log("⏳ [PROVIDER] Waiting for workspace and authentication before rendering children", {
        hasActiveWorkspace: !!ui.activeWorkspace,
        hasAuthUser: !!auth.authUser,
        isAuthenticated: auth.isAuthenticated,
        isAuthLoading: auth.isAuthLoading,
        activeWorkspaceId: ui.activeWorkspace?.id,
        authUserWorkspaces: auth.authUser?.workspaces?.length || 0
      });
    }

    // Show nothing while loading
    return null;
  }

  // CRITICAL FIX: Don't render children if we have no workspace at all
  // This prevents the "default" workspace from being used, but allow demo workspaces
  if (!ui.activeWorkspace.id || (ui.activeWorkspace.id.includes('default') && !ui.activeWorkspace.id.includes('demo'))) {
    // Reduced logging for performance
    if (process.env.NODE_ENV === 'development' && process.env.ADRATA_DEBUG_PROVIDER === 'true') {
      console.log("⏳ [PROVIDER] Invalid workspace - waiting for proper setup", {
        workspaceId: ui.activeWorkspace.id,
        isDemo: ui.activeWorkspace.id?.includes('demo')
      });
    }
    return null;
  }

  // Show nothing while authentication is initializing
  if (auth['isAuthLoading'] && !auth.authUser) {
    return null;
  }

  // Reduced logging for performance - only log in debug mode
  if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_PROVIDER'] === 'true') {
    console.log("🔥 [DEBUG] About to create context value...");
    console.log("🎉 [MODULAR RevenueOSProvider] INITIALIZATION COMPLETE");
    console.log("📊 [MODULAR] Final context state:", {
      hasAuth: !!auth.authUser,
      authReady: auth.isReady,
      dataLoaded: !data.loading,
      leadsCount: data.acquireData.leads.length,
      activeApp: ui.activeSubApp,
      activeSection: ui.activeSection,
    });
    console.log("🔥 [DEBUG] About to return JSX from RevenueOSProvider");
  }

  return (
    <RevenueOSContext.Provider value={contextValue}>
      <RecordContextProvider>
        {children}
      </RecordContextProvider>
    </RevenueOSContext.Provider>
  );
}

// Hook to use the context
export function useRevenueOS() {
  const context = useContext(RevenueOSContext);
  if (context === undefined) {
    throw new Error(
      "useRevenueOS must be used within a RevenueOSProvider",
    );
  }
  return context;
}

// Legacy alias for backwards compatibility
export const useActionPlatform = useRevenueOS;

/**
 * 🎯 DEBUGGING GUIDE
 *
 * Each hook has its own debug logs with prefixes:
 * 🔐 [AUTH HOOK] - Authentication issues
 * 📊 [DATA HOOK] - Data loading issues
 * 🎨 [UI HOOK] - UI state issues
 * 💬 [CHAT HOOK] - Chat functionality issues
 * 📝 [FORMS HOOK] - Form/CRUD issues
 * 📈 [PROGRESS HOOK] - Progress tracking issues
 *
 * To debug specific functionality:
 * 1. Filter console by hook prefix (e.g., "[DATA HOOK]")
 * 2. Look for ERROR or FAILED messages
 * 3. Check the sequence of debug messages
 * 4. Test individual hooks in isolation if needed
 */