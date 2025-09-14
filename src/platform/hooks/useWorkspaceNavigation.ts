"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { generateWorkspaceSlug, parseWorkspaceFromUrl } from "@/platform/auth/workspace-slugs";

/**
 * Workspace-aware navigation hook
 * Provides navigation functions that automatically include workspace context
 */
export function useWorkspaceNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser } = useUnifiedAuth();

  // Get current workspace info
  const getCurrentWorkspace = () => {
    if (!authUser?.workspaces || !authUser.activeWorkspaceId) return null;
    
    return authUser.workspaces.find(ws => ws['id'] === authUser.activeWorkspaceId);
  };

  // Get current workspace slug
  const getCurrentWorkspaceSlug = () => {
    const workspace = getCurrentWorkspace();
    if (!workspace) return null;
    
    return generateWorkspaceSlug(workspace.name);
  };

  // Check if we're currently in a workspace-specific URL
  const isInWorkspaceUrl = () => {
    const parsed = parseWorkspaceFromUrl(pathname);
    return parsed !== null;
  };

  // Navigate to a path with workspace context
  const navigateWithWorkspace = useCallback((path: string) => {
    // Check if we're in demo mode
    const isDemoMode = typeof window !== "undefined" && window.location.pathname.startsWith('/demo/');
    
    console.log(`🔗 [Workspace Navigation] navigateWithWorkspace called:`, {
      path,
      isDemoMode,
      currentPathname: typeof window !== "undefined" ? window.location.pathname : 'server'
    });
    
    if (isDemoMode) {
      // In demo mode, preserve the demo context
      const demoMatch = window.location.pathname.match(/^\/demo\/([^\/]+)/);
      if (demoMatch) {
        const scenarioSlug = demoMatch[1];
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        const demoPath = `/demo/${scenarioSlug}/${cleanPath}`;
        console.log(`🎯 [Demo Navigation] Navigating to: ${demoPath} (from path: ${path})`);
        router.push(demoPath);
        return;
      }
    }
    
    const workspaceSlug = getCurrentWorkspaceSlug();
    
    if (!workspaceSlug) {
      // No workspace context, navigate normally
      router.push(path);
      return;
    }

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Save last location for workspace switching
    if (typeof window !== 'undefined' && authUser.activeWorkspaceId) {
      localStorage.setItem(`lastLocation-${authUser.activeWorkspaceId}`, cleanPath);
      console.log(`💾 [WORKSPACE NAV] Saved last location: ${cleanPath} for workspace: ${authUser.activeWorkspaceId}`);
    }
    
    // If the path already includes workspace context, use it as-is
    if (cleanPath.startsWith(`${workspaceSlug}/`)) {
      router.push(`/${cleanPath}`);
      return;
    }

    // Handle different route types
    if (cleanPath.startsWith('aos') || cleanPath.startsWith('monaco')) {
      // AOS and Monaco routes get workspace query parameter
      const separator = cleanPath.includes('?') ? '&' : '?';
      const workspacePath = `/${cleanPath}${separator}workspace=${workspaceSlug}`;
      console.log(`🔄 [Workspace Navigation] AOS/Monaco route to: ${workspacePath}`);
      router.push(workspacePath);
    } else {
      // Other routes navigate normally
      router.push(path);
    }
  }, [router, authUser]);

  // Navigate to pipeline section with workspace context
  const navigateToPipeline = useCallback((section?: string) => {
    // Default to Dashboard if no section specified
    const defaultSection = section || 'dashboard';
    const basePath = defaultSection;
    navigateWithWorkspace(basePath);
  }, [navigateWithWorkspace]);

  // Navigate to pipeline item detail with workspace context
  const navigateToPipelineItem = useCallback((section: string, itemId: string, itemName?: string) => {
    // Always use slug format for better readability and consistency
    const { generateSlug } = require('@/platform/utils/url-utils');
    const name = itemName || 'record';
    const slug = generateSlug(name, itemId);
    
    // Direct section navigation without pipeline prefix
    const urlPath = `${section}/${slug}`;
    
    console.log(`🔗 [Workspace Navigation] Navigating to ${section} item:`, {
      slug,
      itemId,
      currentPathname: pathname,
      urlPath
    });
    
    navigateWithWorkspace(urlPath);
  }, [navigateWithWorkspace, pathname]);

  // Navigate to AOS with workspace context
  const navigateToAOS = useCallback((app?: string, section?: string) => {
    let basePath = 'aos';
    if (app) basePath += `/${app}`;
    if (section) basePath += `/${section}`;
    navigateWithWorkspace(basePath);
  }, [navigateWithWorkspace]);

  // Navigate to Monaco with workspace context
  const navigateToMonaco = useCallback((section?: string) => {
    const basePath = section ? `monaco/${section}` : 'monaco';
    navigateWithWorkspace(basePath);
  }, [navigateWithWorkspace]);

  // Get workspace-aware URL for a path
  const getWorkspaceUrl = (path: string): string => {
    // Check if we're in demo mode
    const isDemoMode = typeof window !== "undefined" && window.location.pathname.startsWith('/demo/');
    
    if (isDemoMode) {
      // In demo mode, preserve the demo context
      const demoMatch = window.location.pathname.match(/^\/demo\/([^\/]+)/);
      if (demoMatch) {
        const scenarioSlug = demoMatch[1];
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `/demo/${scenarioSlug}/${cleanPath}`;
      }
    }
    
    const workspaceSlug = getCurrentWorkspaceSlug();
    
    if (!workspaceSlug) {
      return path.startsWith('/') ? path : `/${path}`;
    }

    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    if (cleanPath.startsWith(`${workspaceSlug}/`)) {
      return `/${cleanPath}`;
    }

    return `/${workspaceSlug}/${cleanPath}`;
  };

  return {
    // Navigation functions
    navigateWithWorkspace,
    navigateToPipeline,
    navigateToPipelineItem,
    navigateToAOS,
    navigateToMonaco,
    
    // URL helpers
    getWorkspaceUrl,
    getCurrentWorkspace,
    getCurrentWorkspaceSlug,
    isInWorkspaceUrl,
    
    // Direct router access for special cases
    router,
  };
}
