"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { generateFavicon, updateFavicon, getAppThemeFromPath, generateInitials } from '@/platform/utils/favicon-generator';
import { useUnifiedAuth } from '@/platform/hooks/useUnifiedAuthCompat';

interface DynamicFaviconProps {
  isWebsite?: boolean;
  defaultColor?: string;
}

/**
 * Dynamic Favicon Component
 * Updates the browser favicon based on workspace initials and current application route
 */
export function DynamicFavicon({ isWebsite = false, defaultColor = '#6366f1' }: DynamicFaviconProps) {
  const pathname = usePathname();
  const { user: authUser } = useUnifiedAuth();

  useEffect(() => {
    // Skip favicon updates for auth/public pages to prevent unnecessary changes
    const isAuthPage = pathname === "/sign-in" || 
                       pathname === "/sign-up" || 
                       pathname === "/reset-password" || 
                       pathname === "/demo" || 
                       pathname === "/" ||
                       pathname.startsWith("/about") ||
                       pathname.startsWith("/pricing") ||
                       pathname.startsWith("/contact") ||
                       pathname.startsWith("/terms") ||
                       pathname.startsWith("/privacy") ||
                       pathname.startsWith("/cookies") ||
                       pathname.startsWith("/help") ||
                       pathname.startsWith("/support");
    
    if (isAuthPage || isWebsite) {
      return;
    }

    try {
      // Get the appropriate app theme for current route
      const appTheme = getAppThemeFromPath(pathname);
      
      // Use default color if provided and no specific theme found
      const color = appTheme.name === 'Adrata' ? defaultColor : appTheme.color;
      
      // Apps that should always use app initials instead of workspace initials
      const appsWithAppInitials = ['Revenue-OS', 'Stacks', 'Oasis', 'Workbench', 'Grand Central', 'Adrata', 'API'];
      
      // Determine favicon text: use app letter for specific apps, otherwise use workspace initials
      let faviconText = appTheme.letter; // Fallback to app letter
      
      if (!appsWithAppInitials.includes(appTheme.name)) {
        // For other apps, try to get workspace name and generate client initials
        if (authUser?.workspaces && authUser.workspaces.length > 0) {
          // Get the active workspace or first available workspace
          const activeWorkspace = authUser.workspaces.find(w => w.id === authUser.activeWorkspaceId) || authUser.workspaces[0];
          
          if (activeWorkspace?.name) {
            const clientInitials = generateInitials(activeWorkspace.name);
            if (clientInitials) {
              faviconText = clientInitials;
            }
          }
        }
      }
      // For revenue-os, stacks, oasis, and workbench, faviconText is already set to appTheme.letter
      
      // Generate favicon with app initials (for specific apps) or workspace initials (for others)
      const faviconDataUrl = generateFavicon(faviconText, color);
      
      // Update the favicon in the document
      updateFavicon(faviconDataUrl);
      
      console.log(`🎨 [DYNAMIC FAVICON] Updated to ${appTheme.name} (${faviconText}) with color ${color}`);
    } catch (error) {
      console.error('Failed to update favicon:', error);
    }
  }, [pathname, isWebsite, defaultColor, authUser]);

  // This component doesn't render anything
  return null;
}