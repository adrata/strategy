"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUnifiedAuth } from '@/platform/auth-unified';

// Map URL paths to page names
const getPageName = (pathname: string): string => {
  // Remove workspace slug from pathname for matching
  const cleanPath = pathname.replace(/^\/[^\/]+/, '') || '/';
  
  // Define page mappings
  const pageMap: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/leads': 'Leads',
    '/prospects': 'Prospects',
    '/opportunities': 'Opportunities',
    '/companies': 'Companies',
    '/people': 'People',
    '/customers': 'Customers',
    '/partners': 'Partners',
    '/sellers': 'Sellers',
    '/speedrun': 'Speedrun',
    '/metrics': 'Metrics',
    '/aos': 'AOS Platform',
    '/monaco': 'Monaco',
    '/settings': 'Settings',
    '/profile': 'Profile',
    '/workspaces': 'Workspaces',
    '/sign-in': 'Sign In',
    '/about': 'About',
    '/pricing': 'Pricing',
    '/contact': 'Contact',
    '/help': 'Help',
    '/support': 'Support',
  };

  // Check for exact matches first
  if (pageMap[cleanPath]) {
    return pageMap[cleanPath];
  }

  // Check for dynamic routes (e.g., /leads/[id], /companies/[id])
  const dynamicPatterns = [
    { pattern: /^\/leads\/[^\/]+/, name: 'Lead Details' },
    { pattern: /^\/prospects\/[^\/]+/, name: 'Prospect Details' },
    { pattern: /^\/opportunities\/[^\/]+/, name: 'Opportunity Details' },
    { pattern: /^\/companies\/[^\/]+/, name: 'Company Details' },
    { pattern: /^\/people\/[^\/]+/, name: 'Person Details' },
    { pattern: /^\/customers\/[^\/]+/, name: 'Customer Details' },
    { pattern: /^\/partners\/[^\/]+/, name: 'Partner Details' },
    { pattern: /^\/sellers\/[^\/]+/, name: 'Seller Details' },
    { pattern: /^\/aos\/[^\/]+/, name: 'AOS Platform' },
    { pattern: /^\/monaco\/[^\/]+/, name: 'Monaco' },
  ];

  for (const { pattern, name } of dynamicPatterns) {
    if (pattern.test(cleanPath)) {
      return name;
    }
  }

  // Default fallback
  return 'Dashboard';
};

export function DynamicTitle() {
  const { user } = useUnifiedAuth();
  const pathname = usePathname();
  
  useEffect(() => {
    if (user?.workspaces && user.workspaces.length > 0) {
      // Get the active workspace or the first workspace
      const activeWorkspace = user.workspaces.find(w => w['id'] === user.activeWorkspaceId) || user['workspaces'][0];
      
      if (activeWorkspace) {
        // Get the current page name
        const pageName = getPageName(pathname);
        // Update the document title
        document['title'] = `Adrata | ${pageName}`;
      } else {
        // Fallback to default title
        document['title'] = 'Adrata | Dashboard';
      }
    } else {
      // No workspaces available, use default title
      document['title'] = 'Adrata | Dashboard';
    }
  }, [user?.activeWorkspaceId, user?.workspaces, pathname]);

  // This component doesn't render anything
  return null;
}
