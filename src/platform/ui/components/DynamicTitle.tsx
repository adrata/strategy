"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { useRecordTitle } from '@/platform/hooks/useRecordTitle';

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
    '/clients': 'Customers',
    '/partners': 'Partners',
    '/sellers': 'Sellers',
    '/speedrun': 'Speedrun',
    '/speedrun/sprint': 'Sprint',
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
    { pattern: /^\/clients\/[^\/]+/, name: 'Customer Details' },
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
  const { recordData, isLoading } = useRecordTitle();
  
  useEffect(() => {
    if (user?.workspaces && user.workspaces.length > 0) {
      // Get the active workspace or the first workspace
      const activeWorkspace = user.workspaces.find(w => w['id'] === user.activeWorkspaceId) || user['workspaces'][0];
      
      if (activeWorkspace) {
        // Check if we have record data for a specific record
        if (recordData && !isLoading) {
          // Extract section from pathname
          const pathParts = pathname.split('/');
          const section = pathParts[pathParts.length - 2];
          
          console.log('🔍 [DYNAMIC TITLE] Setting title with record data:', { recordData, section });
          
          // Generate title based on record type and data
          let title = '';
          
          if (section === 'people' || section === 'leads' || section === 'prospects') {
            // For people/leads/prospects, use fullName or name
            title = recordData.fullName || recordData.name || 'Unknown Person';
          } else if (section === 'companies' || section === 'clients' || section === 'partners') {
            // For companies/clients/partners, use name
            title = recordData.name || 'Unknown Company';
          } else if (section === 'opportunities') {
            // For opportunities, use name
            title = recordData.name || 'Unknown Opportunity';
          } else if (section === 'sellers') {
            // For sellers, use fullName or name
            title = recordData.fullName || recordData.name || 'Unknown Seller';
          } else {
            // Fallback to generic title
            title = getPageName(pathname);
          }
          
          console.log('🔍 [DYNAMIC TITLE] Setting document title to:', title);
          document['title'] = title;
        } else {
          // No record data available, use generic page name
          const pageName = getPageName(pathname);
          document['title'] = pageName;
        }
      } else {
        // Fallback to default title
        document['title'] = 'Adrata | Dashboard';
      }
    } else {
      // No workspaces available, use default title
      document['title'] = 'Adrata | Dashboard';
    }
  }, [user?.activeWorkspaceId, user?.workspaces, pathname, recordData, isLoading]);

  // This component doesn't render anything
  return null;
}
