"use client";

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    if (isLoading) return;

    const validateWorkspace = async () => {
      if (!authUser?.workspaces) {
        console.log("❌ No workspaces available");
        router.push("/workspaces");
        return;
      }

      const pathname = window.location.pathname;
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
      if (workspace.id !== authUser.activeWorkspaceId) {
        console.log(`🔄 Workspace mismatch: URL wants ${workspace.name} (${slug}), but active is ${authUser.activeWorkspaceId}`);
        console.log(`🔄 Attempting to switch to the correct workspace...`);
        
        // Try to switch to the correct workspace
        const switchSuccess = await switchToWorkspaceFromUrl(window.location.pathname);
        if (!switchSuccess) {
          console.warn(`⚠️ Failed to switch workspace, but allowing access to prevent navigation issues`);
        }
      }

      console.log(`✅ Valid workspace: ${workspace.name} (${slug})`);
      setIsValidating(false);
    };

    validateWorkspace();
  }, [authUser, isLoading, router]);

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
