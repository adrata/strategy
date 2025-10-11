"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { generateFavicon, updateFavicon, getAppThemeFromPath } from '@/platform/utils/favicon-generator';

interface DynamicFaviconProps {
  isWebsite?: boolean;
  defaultColor?: string;
}

/**
 * Dynamic Favicon Component
 * Updates the browser favicon based on the current application route
 */
export function DynamicFavicon({ isWebsite = false, defaultColor = '#6366f1' }: DynamicFaviconProps) {
  const pathname = usePathname();

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
      
      // Generate favicon with app letter and color
      const faviconDataUrl = generateFavicon(appTheme.letter, color);
      
      // Update the favicon in the document
      updateFavicon(faviconDataUrl);
      
      console.log(`🎨 [DYNAMIC FAVICON] Updated to ${appTheme.name} (${appTheme.letter}) with color ${color}`);
    } catch (error) {
      console.error('Failed to update favicon:', error);
    }
  }, [pathname, isWebsite, defaultColor]);

  // This component doesn't render anything
  return null;
}