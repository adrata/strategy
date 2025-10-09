"use client";

import { useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

interface DynamicFaviconProps {
  defaultColor?: string;
  isWebsite?: boolean;
}

export function DynamicFavicon({ defaultColor = '#3b82f6', isWebsite = false }: DynamicFaviconProps) {
  const { user: authUser, isLoading } = useUnifiedAuth();

  useEffect(() => {
    const updateFavicon = async () => {
      try {
        // Use the standard favicon
        const faviconUrl = '/favicon.ico';
        updateFaviconElement(faviconUrl);
      } catch (error) {
        console.warn('Failed to update favicon:', error);
        // Fallback to static favicon
        updateFaviconElement('/favicon.ico');
      }
    };

    updateFavicon();
  }, [authUser?.activeWorkspaceId, isLoading, defaultColor, isWebsite]);

  return null; // This component doesn't render anything
}

function updateFaviconElement(href: string) {
  // Remove ALL existing favicon links
  const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
  existingFavicons.forEach(favicon => favicon.remove());

  // Add new favicon with proper types
  const favicon = document.createElement('link');
  favicon['rel'] = 'icon';
  favicon['type'] = href.endsWith('.svg') ? 'image/svg+xml' : href.endsWith('.ico') ? 'image/x-icon' : 'image/png';
  favicon['href'] = href;
  document.head.appendChild(favicon);

  // Add shortcut icon for older browsers
  const shortcutFavicon = document.createElement('link');
  shortcutFavicon['rel'] = 'shortcut icon';
  shortcutFavicon['type'] = href.endsWith('.svg') ? 'image/svg+xml' : href.endsWith('.ico') ? 'image/x-icon' : 'image/png';
  shortcutFavicon['href'] = href;
  document.head.appendChild(shortcutFavicon);

  // Add apple-touch-icon (use the standard apple touch icon)
  const appleFavicon = document.createElement('link');
  appleFavicon['rel'] = 'apple-touch-icon';
  appleFavicon['href'] = '/apple-touch-icon.png';
  document.head.appendChild(appleFavicon);

  // Force browser to reload favicon by triggering a small DOM change
  const title = document.querySelector('title');
  if (title) {
    const originalTitle = title.textContent;
    title['textContent'] = originalTitle + ' ';
    setTimeout(() => {
      title['textContent'] = originalTitle;
    }, 10);
  }
}

