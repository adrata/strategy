"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { getWorkspaceBySlug, parseWorkspaceFromUrl } from "@/platform/auth/workspace-slugs";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import { useWorkspaceSwitch } from "@/platform/hooks/useWorkspaceSwitch";
import { initSpeedrunPrefetch } from "@/platform/services/speedrun-prefetch";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const params = useParams();
  const router = useRouter();
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

  useEffect(() => {
    if (isLoading) return;
    
    // 🔧 FIX: Prevent re-entry if validation is already in progress
    if (isValidatingRef.current) {
      console.log("⏭️ [WORKSPACE LAYOUT] Validation already in progress, skipping");
      return;
    }

    const validateWorkspace = async () => {
      if (!hasWorkspaces) {
        console.log("❌ No workspaces available");
        router.push("/workspaces");
        return;
      }

      const pathname = window.location.pathname;
      
      // 🔧 FIX: Skip validation if we've already validated this pathname with this workspace
      if (lastValidatedPathnameRef.current === pathname && 
          lastValidatedWorkspaceIdRef.current === activeWorkspaceId) {
        console.log("✅ [WORKSPACE LAYOUT] Already validated this pathname with current workspace, skipping");
        return;
      }
      
      const parsed = parseWorkspaceFromUrl(pathname);
      
      if (!parsed) {
        console.log("❌ Invalid workspace URL");
        router.push("/workspaces");
        return;
      }

      const { slug } = parsed;
      const workspace = getWorkspaceBySlug(authUser.workspaces, slug);

      if (!workspace) {
        console.log(`❌ Workspace not found for slug: ${slug}`);
        router.push("/workspaces");
        return;
      }

      // Check if this is the active workspace
      if (workspace.id !== activeWorkspaceId) {
        console.log(`🔄 Workspace mismatch: URL wants ${workspace.name} (${slug}), but active is ${activeWorkspaceId}`);
        console.log(`🔄 Attempting to switch to the correct workspace...`);
        
        // 🔧 FIX: Set flag to prevent re-entry during switch
        isValidatingRef.current = true;
        
        try {
          // Try to switch to the correct workspace
          const switchSuccess = await switchToWorkspaceFromUrl(window.location.pathname);
          if (!switchSuccess) {
            console.warn(`⚠️ Failed to switch workspace, but allowing access to prevent navigation issues`);
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
      
      // Always update the pathname ref
      lastValidatedPathnameRef.current = pathname;

      console.log(`✅ Valid workspace: ${workspace.name} (${slug})`);
      setIsValidating(false);
    };

    validateWorkspace();
  }, [hasWorkspaces, workspacesLength, activeWorkspaceId, isLoading, router, switchToWorkspaceFromUrl, authUser?.workspaces]);

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
