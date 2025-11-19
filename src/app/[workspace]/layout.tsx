"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { getWorkspaceBySlug, parseWorkspaceFromUrl, generateWorkspaceSlug } from "@/platform/auth/workspace-slugs";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import { useWorkspaceSwitch } from "@/platform/hooks/useWorkspaceSwitch";
import { initSpeedrunPrefetch } from "@/platform/services/speedrun-prefetch";
import { initCompaniesPrefetch } from "@/platform/services/companies-prefetch";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname(); // 🔧 CRITICAL FIX: Use Next.js pathname hook to track URL changes
  const { user: authUser, isLoading } = useUnifiedAuth();
  const { switchToWorkspaceFromUrl } = useWorkspaceSwitch();
  const [isValidating, setIsValidating] = useState(true);
  
  // 🔧 FIX: Use refs to prevent validation loop
  const isValidatingRef = useRef(false);
  const lastValidatedPathnameRef = useRef<string | null>(null);
  const lastValidatedWorkspaceIdRef = useRef<string | null>(null);

  // 🔧 FIX: Extract primitive values to prevent unnecessary re-runs
  const activeWorkspaceId = authUser?.activeWorkspaceId;
  const hasWorkspaces = !!authUser?.workspaces;
  const workspacesLength = authUser?.workspaces?.length || 0;
  
  // 🔧 CRITICAL FIX: Extract workspace slug from pathname to prevent validation on every pathname change
  // Only validate when workspace slug changes, not when navigating within the same workspace
  const parsed = parseWorkspaceFromUrl(pathname);
  const workspaceSlugFromUrl = parsed?.slug || null;
  
  // 🔧 CRITICAL FIX: Only validate when workspace slug or activeWorkspaceId changes
  // This prevents validation loops when navigating between routes in the same workspace
  // (e.g., /top/leads → /top/leads/record-slug should NOT trigger validation)
  const lastValidatedWorkspaceSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    
    // 🔧 FIX: Prevent re-entry if validation is already in progress
    if (isValidatingRef.current) {
      console.log("⏭️ [WORKSPACE LAYOUT] Validation already in progress, skipping");
      return;
    }
    
    // 🔧 CRITICAL FIX: Skip validation if workspace slug hasn't changed
    // This prevents validation loops when navigating within the same workspace
    if (workspaceSlugFromUrl === lastValidatedWorkspaceSlugRef.current && 
        activeWorkspaceId === lastValidatedWorkspaceIdRef.current) {
      console.log("✅ [WORKSPACE LAYOUT] Workspace slug and ID unchanged, skipping validation");
      setIsValidating(false);
      return;
    }

    const validateWorkspace = async () => {
      if (!hasWorkspaces || !authUser?.workspaces) {
        console.log("❌ No workspaces available");
        router.push("/workspaces");
        return;
      }

      // 🔧 CRITICAL FIX: Use pathname from hook instead of window.location.pathname
      // This ensures React tracks pathname changes properly
      
      // 🔧 FIX: Skip validation if we've already validated this workspace slug with this workspace ID
      if (lastValidatedPathnameRef.current === pathname && 
          lastValidatedWorkspaceIdRef.current === activeWorkspaceId) {
        console.log("✅ [WORKSPACE LAYOUT] Already validated this pathname with current workspace, skipping");
        setIsValidating(false);
        return;
      }
      
      if (!parsed || !workspaceSlugFromUrl) {
        console.log("❌ Invalid workspace URL");
        router.push("/workspaces");
        return;
      }

      const { slug } = parsed;
      
      // 🔧 CRITICAL: Get workspace from slug and verify slug generation matches
      const workspace = getWorkspaceBySlug(authUser.workspaces, slug);
      
      // 🔧 CRITICAL DEBUG: Log workspace matching details
      const activeWorkspace = authUser.workspaces.find(w => w.id === activeWorkspaceId);
      const activeWorkspaceSlug = activeWorkspace ? generateWorkspaceSlug(activeWorkspace.name) : null;
      
      console.log(`🔍 [WORKSPACE VALIDATION] Workspace matching check:`, {
        urlSlug: slug,
        activeWorkspaceId,
        activeWorkspaceName: activeWorkspace?.name,
        activeWorkspaceSlug,
        foundWorkspaceId: workspace?.id,
        foundWorkspaceName: workspace?.name,
        foundWorkspaceSlug: workspace ? generateWorkspaceSlug(workspace.name) : null,
        slugMatches: activeWorkspaceSlug === slug,
        idMatches: workspace?.id === activeWorkspaceId
      });

      if (!workspace) {
        console.error(`❌ [WORKSPACE VALIDATION] Workspace not found for slug: ${slug}`, {
          availableWorkspaces: authUser.workspaces.map(w => ({
            id: w.id,
            name: w.name,
            generatedSlug: generateWorkspaceSlug(w.name)
          }))
        });
        router.push("/workspaces");
        return;
      }

      // 🔧 CRITICAL FIX: Check if slug matches active workspace slug BEFORE checking ID
      // This catches cases where workspace name changed but ID is the same
      if (activeWorkspaceSlug !== slug) {
        console.warn(`⚠️ [WORKSPACE VALIDATION] Slug mismatch detected:`, {
          urlSlug: slug,
          activeWorkspaceSlug,
          activeWorkspaceName: activeWorkspace?.name,
          foundWorkspaceName: workspace.name,
          foundWorkspaceSlug: generateWorkspaceSlug(workspace.name),
          note: 'URL slug does not match active workspace slug - this may cause reload loops'
        });
        
        // If the workspace ID matches but slug doesn't, this is a slug generation mismatch
        // We should still allow access but log the issue
        if (workspace.id === activeWorkspaceId) {
          console.warn(`⚠️ [WORKSPACE VALIDATION] Workspace ID matches but slug differs - allowing access but slug mismatch may cause issues`);
          // Update refs and continue - workspace is correct, just slug generation issue
          lastValidatedWorkspaceIdRef.current = activeWorkspaceId;
          lastValidatedPathnameRef.current = pathname;
          setIsValidating(false);
          return;
        }
      }

      // Check if this is the active workspace
      if (workspace.id !== activeWorkspaceId) {
        console.log(`🔄 [WORKSPACE VALIDATION] Workspace ID mismatch: URL wants ${workspace.name} (${slug}, ID: ${workspace.id}), but active is ${activeWorkspaceId}`);
        console.log(`🔄 [WORKSPACE VALIDATION] Attempting to switch to the correct workspace...`);
        
        // 🔧 FIX: Set flag to prevent re-entry during switch
        isValidatingRef.current = true;
        
        try {
          // Try to switch to the correct workspace
          const switchSuccess = await switchToWorkspaceFromUrl(pathname);
          if (!switchSuccess) {
            console.warn(`⚠️ [WORKSPACE VALIDATION] Failed to switch workspace, but allowing access to prevent navigation issues`);
          } else {
            // Update tracking refs after successful switch
            lastValidatedWorkspaceIdRef.current = workspace.id;
          }
        } finally {
          isValidatingRef.current = false;
        }
      } else {
        // Workspace matches - update tracking refs
        lastValidatedWorkspaceIdRef.current = activeWorkspaceId;
      }
      
      // Always update the refs AFTER validation completes
      lastValidatedPathnameRef.current = pathname;
      lastValidatedWorkspaceSlugRef.current = workspaceSlugFromUrl;

      console.log(`✅ Valid workspace: ${workspace.name} (${slug})`);
      setIsValidating(false);
    };

    validateWorkspace();
    // 🔧 CRITICAL FIX: Only validate when workspace slug or activeWorkspaceId changes
    // NOT on every pathname change - this prevents infinite loops when navigating
    // between routes in the same workspace (e.g., /top/leads → /top/leads/record-slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlugFromUrl, hasWorkspaces, workspacesLength, activeWorkspaceId, isLoading, router, switchToWorkspaceFromUrl]);

  // Initialize speedrun background prefetch service
  useEffect(() => {
    if (!authUser?.id || !authUser?.activeWorkspaceId) return;

    console.log('🚀 [WORKSPACE LAYOUT] Initializing speedrun prefetch service');
    
    const cleanup = initSpeedrunPrefetch(
      authUser.activeWorkspaceId,
      authUser.id
    );

    // Cleanup on unmount or when workspace/user changes
    return cleanup;
  }, [authUser?.id, authUser?.activeWorkspaceId]);

  // 🚀 WORLD-CLASS SPEED: Initialize companies accurate data prefetch service
  // This prefetches accurate lastAction/nextAction on login/workspace load
  // so when users navigate to companies, data is already accurate
  useEffect(() => {
    if (!authUser?.id || !authUser?.activeWorkspaceId) return;

    console.log('🚀 [WORKSPACE LAYOUT] Initializing companies prefetch service');
    
    const cleanup = initCompaniesPrefetch(
      authUser.activeWorkspaceId,
      authUser.id
    );

    // Cleanup on unmount or when workspace/user changes
    return cleanup;
  }, [authUser?.id, authUser?.activeWorkspaceId]);

  // EMERGENCY BYPASS: Skip authentication blocking for production demo
  // if (false) { // TEMPORARILY DISABLED
  //   return (
  //     <PipelineSkeleton message="Loading workspace..." />
  //   );
  // }

  return (
    <RevenueOSProvider>
      {children}
    </RevenueOSProvider>
  );
}
