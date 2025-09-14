"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { generateWorkspaceSlug } from "@/platform/auth/workspace-slugs";

export default function MonacoRedirectPage() {
  const router = useRouter();
  const { user: authUser, isLoading } = useUnifiedAuth();

  useEffect(() => {
    if (isLoading) return;

    const redirectToWorkspaceMonaco = () => {
      // Get current workspace
      const currentWorkspace = authUser?.workspaces?.find(ws => ws['id'] === authUser.activeWorkspaceId);
      
      if (currentWorkspace) {
        // Redirect to workspace-aware Monaco
        const workspaceSlug = generateWorkspaceSlug(currentWorkspace.name);
        const workspaceUrl = `/monaco/companies?workspace=${workspaceSlug}`;
        console.log(`🔄 Redirecting from /monaco to workspace-aware URL: ${workspaceUrl}`);
        router.push(workspaceUrl);
      } else {
        // Fallback to default companies view
        router.push('/monaco/companies');
      }
    };

    redirectToWorkspaceMonaco();
  }, [authUser, isLoading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your workspace...</p>
      </div>
    </div>
  );
} 