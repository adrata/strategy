"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUnifiedAuth } from '@/platform/auth';
import { useRecordTitle } from '@/platform/hooks/useRecordTitle';

// Map URL paths to page names
const getPageName = (pathname: string): string => {
  // Remove workspace slug from pathname for matching
  const cleanPath = pathname.replace(/^\/[^\/]+/, '') || '/';
  
  // Define page mappings
  const pageMap: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/leads': 'AcquisitionOS • Leads',
    '/prospects': 'AcquisitionOS • Prospects',
    '/opportunities': 'AcquisitionOS • Opportunities',
    '/companies': 'Companies',
    '/people': 'People',
    '/clients': 'Customers',
    '/partners': 'Partners',
    '/sellers': 'Sellers',
    '/speedrun': 'AcquisitionOS • Speedrun',
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
    { pattern: /^\/leads\/[^\/]+/, name: 'Lead' },
    { pattern: /^\/prospects\/[^\/]+/, name: 'Prospect' },
    { pattern: /^\/opportunities\/[^\/]+/, name: 'Opportunity' },
    { pattern: /^\/companies\/[^\/]+/, name: 'Company' },
    { pattern: /^\/people\/[^\/]+/, name: 'Person' },
    { pattern: /^\/clients\/[^\/]+/, name: 'Customer' },
    { pattern: /^\/partners\/[^\/]+/, name: 'Partner' },
    { pattern: /^\/sellers\/[^\/]+/, name: 'Seller' },
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Always call hooks first to maintain consistent hook order
  const { user } = useUnifiedAuth();
  const { recordData, isLoading } = useRecordTitle();
  
  // Check if this is an auth/public page after calling hooks
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
  
  useEffect(() => {
    // Check if this is an auth/public page inside the effect
    if (isAuthPage) {
      // Don't run any effects on auth/public pages to prevent hydration issues
      return;
    }
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
          
          if (section === 'leads') {
            // For leads, show "Lead • [Name]"
            const name = recordData.fullName || recordData.name || 'Unknown Lead';
            title = `Lead • ${name}`;
          } else if (section === 'prospects') {
            // For prospects, show "Prospect • [Name]"
            const name = recordData.fullName || recordData.name || 'Unknown Prospect';
            title = `Prospect • ${name}`;
          } else if (section === 'people') {
            // For people, show "Person • [Name]"
            const name = recordData.fullName || recordData.name || 'Unknown Person';
            title = `Person • ${name}`;
          } else if (section === 'companies' || section === 'clients' || section === 'partners') {
            // For companies/clients/partners, show "Company • [Name]"
            const name = recordData.name || 'Unknown Company';
            title = `Company • ${name}`;
          } else if (section === 'opportunities') {
            // For opportunities, show "Opportunity • [Name]"
            const name = recordData.name || 'Unknown Opportunity';
            title = `Opportunity • ${name}`;
          } else if (section === 'sellers') {
            // For sellers, show "Seller • [Name]"
            const name = recordData.fullName || recordData.name || 'Unknown Seller';
            title = `Seller • ${name}`;
          } else {
            // Fallback to generic title
            title = getPageName(pathname);
          }
          
          console.log('🔍 [DYNAMIC TITLE] Setting document title to:', title);
          document['title'] = title;
        } else {
          // No record data available, generate title based on URL params and path
          let title = getPageName(pathname);
          
          // Handle URL parameters for enhanced titles
          const view = searchParams.get('view');
          const section = searchParams.get('section');
          
          // Handle Speedrun view changes
          if (pathname.includes('/speedrun/sprint') && view) {
            const viewLabels: Record<string, string> = {
              'actions': 'Actions',
              'targets': 'Targets', 
              'calendar': 'Calendar',
              'insights': 'Insights'
            };
            const viewLabel = viewLabels[view] || view;
            title = `Sprint • ${viewLabel}`;
          }
          
          // Handle pipeline section changes
          else if (pathname.includes('/pipeline') && section) {
            const sectionLabels: Record<string, string> = {
              'opportunities': 'Opportunities',
              'leads': 'Leads',
              'prospects': 'Prospects',
              'companies': 'Companies',
              'people': 'People',
              'clients': 'Customers',
              'partners': 'Partners',
              'sellers': 'Sellers'
            };
            const sectionLabel = sectionLabels[section] || section;
            title = sectionLabel;
          }
          
          // Handle product-specific titles
          else if (pathname.includes('/monaco')) {
            title = 'Monaco • Analytics';
          } else if (pathname.includes('/olympus')) {
            title = 'Olympus • Workflows';
          } else if (pathname.includes('/grand-central')) {
            title = 'Grand Central • Integrations';
          } else if (pathname.includes('/tower')) {
            title = 'Tower • Intelligence';
          } else if (pathname.includes('/database')) {
            title = 'Database • Records';
          } else if (pathname.includes('/atrium')) {
            title = 'Atrium • Documents';
          } else if (pathname.includes('/oasis')) {
            // Extract channel or DM name from URL
            const pathSegments = pathname.split('/').filter(Boolean);
            const oasisIndex = pathSegments.findIndex(segment => segment === 'oasis');
            
            if (oasisIndex !== -1 && pathSegments.length > oasisIndex + 1) {
              const type = pathSegments[oasisIndex + 1]; // 'channels' or 'dms'
              const name = pathSegments[oasisIndex + 2]; // channel or DM name
              
              if (type === 'channels' && name) {
                title = `Oasis • #${name}`;
              } else if (type === 'dms' && name) {
                title = `Oasis • ${name}`;
              } else {
                title = 'Oasis • Channels';
              }
            } else {
              title = 'Oasis • Channels';
            }
          }
          
          console.log('🔍 [DYNAMIC TITLE] Setting document title to:', title);
          document['title'] = title;
        }
      } else {
        // Fallback to default title
        document['title'] = 'Adrata | Dashboard';
      }
    } else {
      // No workspaces available, use default title
      document['title'] = 'Adrata | Dashboard';
    }
  }, [user?.activeWorkspaceId, user?.workspaces, pathname, recordData, isLoading, searchParams, isAuthPage]);

  // This component doesn't render anything
  return null;
}
