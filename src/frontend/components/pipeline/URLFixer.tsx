"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * URLFixer Component
 * 
 * Automatically detects and fixes malformed URLs like /leads/prospects
 * by redirecting to the correct URL structure.
 */
export function URLFixer() {
  const router = useRouter();

  useEffect(() => {
    const fixMalformedURLs = () => {
      const currentPath = window.location.pathname;
      console.log(`🔍 [URL_FIXER] Checking current path: ${currentPath}`);
      
      // 🔧 FIX: Extract workspace prefix if present (e.g., /top/leads/prospects -> workspace: top, path: /leads/prospects)
      const workspaceMatch = currentPath.match(/^\/([^\/]+)\/(.+)$/);
      const workspacePrefix = workspaceMatch ? `/${workspaceMatch[1]}` : '';
      const pathWithoutWorkspace = workspaceMatch ? `/${workspaceMatch[2]}` : currentPath;
      
      // Check for malformed URLs (workspace-aware)
      const malformedPatterns = [
        { pattern: /\/leads\/prospects/, fix: (path: string) => path.replace('/leads/prospects', '/prospects') },
        { pattern: /\/prospects\/leads/, fix: (path: string) => path.replace('/prospects/leads', '/leads') },
        { pattern: /\/leads\/opportunities/, fix: (path: string) => path.replace('/leads/opportunities', '/opportunities') },
        { pattern: /\/prospects\/opportunities/, fix: (path: string) => path.replace('/prospects/opportunities', '/opportunities') },
        { pattern: /\/opportunities\/leads/, fix: (path: string) => path.replace('/opportunities/leads', '/leads') },
        { pattern: /\/opportunities\/prospects/, fix: (path: string) => path.replace('/opportunities/prospects', '/prospects') }
      ];
      
      // Check if path (without workspace) matches malformed patterns
      for (const { pattern, fix } of malformedPatterns) {
        if (pattern.test(pathWithoutWorkspace)) {
          const correctedPathWithoutWorkspace = fix(pathWithoutWorkspace);
          const correctedPath = workspacePrefix ? `${workspacePrefix}${correctedPathWithoutWorkspace}` : correctedPathWithoutWorkspace;
          console.warn(`⚠️ [URL_FIXER] Detected malformed URL: ${currentPath}`);
          console.log(`🔧 [URL_FIXER] Redirecting to corrected URL: ${correctedPath}`);
          
          // Use replace instead of push to avoid adding to history
          router.replace(correctedPath);
          return;
        }
      }
      
      console.log(`✅ [URL_FIXER] URL is valid: ${currentPath}`);
    };

    // Run the fix on mount (only once to prevent reload loops)
    fixMalformedURLs();
  }, [router]);

  // This component doesn't render anything
  return null;
}

