"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/platform/utils/url-utils';

interface HierarchicalBreadcrumbProps {
  record: any;
  recordType: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners' | 'sellers' | 'deals' | 'speedrun';
  onBack: () => void;
  workspaceId?: string;
}

export function HierarchicalBreadcrumb({ 
  record, 
  recordType, 
  onBack, 
  workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP' 
}: HierarchicalBreadcrumbProps) {
  const router = useRouter();

  // Debug logging for record data
  console.log(`🔍 [BREADCRUMB] Record data for ${recordType}:`, {
    recordId: record?.id,
    recordKeys: Object.keys(record || {}),
    recordName: record?.name,
    recordFullName: record?.fullName,
    recordFirstName: record?.firstName,
    recordLastName: record?.lastName,
    recordCompany: record?.company,
    recordCompanyId: record?.companyId
  });

  // Get record display name with fallbacks
  const getDisplayName = () => {
    // Try to get person's name first - prioritize person-specific fields over generic 'name'
    const personName = record?.fullName || 
                      (record?.firstName && record?.lastName ? `${record.firstName} ${record.lastName}` : null) ||
                      record?.firstName ||
                      record?.lastName ||
                      record?.name; // Only use generic 'name' as last resort
    
    // Debug logging
    console.log(`🔍 [BREADCRUMB] getDisplayName for record ${record?.id}:`, {
      recordName: record?.name,
      recordFullName: record?.fullName,
      recordFirstName: record?.firstName,
      recordLastName: record?.lastName,
      computedPersonName: personName,
      recordCompany: record?.company
    });
    
    // Only fall back to company name if we have no person name at all
    if (personName && personName.trim() !== '') {
      return personName;
    }
    
    // Last resort fallbacks
    return 'Unknown Person';
  };

  // Get company name
  const getCompanyName = () => {
    if (!record?.company) return 'Unknown Company';
    if (typeof record.company === 'string') return record.company;
    if (typeof record.company === 'object') return record.company.name || 'Unknown Company';
    return 'Unknown Company';
  };

  // Get company ID from record
  const getCompanyId = () => {
    return record?.companyId || record?.id; // Fallback to record ID if no companyId
  };

  // Handle navigation to company page
  const handleCompanyClick = () => {
    const companyId = getCompanyId();
    const companyName = getCompanyName();
    
    if (companyId && companyName) {
      // Generate proper company slug using name and ID
      const companySlug = generateSlug(companyName, companyId);
      
      // Navigate to company page
      const currentPath = window.location.pathname;
      console.log(`🔍 [BREADCRUMB] Current path for company navigation: ${currentPath}`);
      console.log(`🔍 [BREADCRUMB] Generated company slug: ${companySlug}`);
      
      // Fix malformed URLs like /leads/prospects
      if (currentPath.includes('/leads/prospects') || currentPath.includes('/prospects/leads')) {
        console.warn(`⚠️ [BREADCRUMB] Detected malformed URL for company navigation: ${currentPath}`);
      }
      
      const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
      
      if (workspaceMatch) {
        const workspaceSlug = workspaceMatch[1];
        const newUrl = `/${workspaceSlug}/companies/${companySlug}`;
        console.log(`🔗 [BREADCRUMB] Navigating to company: ${newUrl}`);
        router.push(newUrl);
      } else {
        const newUrl = `/companies/${companySlug}`;
        console.log(`🔗 [BREADCRUMB] Navigating to company: ${newUrl}`);
        router.push(newUrl);
      }
    }
  };

  // Handle navigation back to person record
  const handlePersonClick = () => {
    const currentPath = window.location.pathname;
    console.log(`🔍 [BREADCRUMB] Current path: ${currentPath}`);
    
    // Fix malformed URLs like /leads/prospects
    if (currentPath.includes('/leads/prospects') || currentPath.includes('/prospects/leads')) {
      console.warn(`⚠️ [BREADCRUMB] Detected malformed URL: ${currentPath}`);
      // Redirect to correct URL immediately
      const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
      if (workspaceMatch) {
        const workspaceSlug = workspaceMatch[1];
        const correctUrl = `/${workspaceSlug}/${recordType}/${record.id}`;
        console.log(`🔧 [BREADCRUMB] Redirecting to correct URL: ${correctUrl}`);
        router.push(correctUrl);
        return;
      }
    }
    
    const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
    
    if (workspaceMatch) {
      const workspaceSlug = workspaceMatch[1];
      const newUrl = `/${workspaceSlug}/${recordType}/${record.id}`;
      console.log(`🔗 [BREADCRUMB] Navigating back to person: ${newUrl}`);
      router.push(newUrl);
    } else {
      const newUrl = `/${recordType}/${record.id}`;
      console.log(`🔗 [BREADCRUMB] Navigating back to person: ${newUrl}`);
      router.push(newUrl);
    }
  };

  // Only show hierarchical breadcrumb for leads and prospects (not for companies or people)
  if (recordType === 'companies' || recordType === 'people') {
    // Simple breadcrumb for companies and people
    return (
      <div className="flex items-center gap-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-gray-700 transition-colors capitalize"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All {recordType === 'people' ? 'People' : recordType}
        </button>
        <span className="text-sm text-[var(--muted)]">/</span>
        <span className="text-sm font-medium text-[var(--foreground)]">{getDisplayName()}</span>
      </div>
    );
  }

  // Hierarchical breadcrumb for leads and prospects
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-gray-700 transition-colors capitalize"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        All {recordType === 'people' ? 'People' : recordType}
      </button>
      <span className="text-sm text-[var(--muted)]">/</span>
      
      {/* Company Link */}
      <button
        onClick={handleCompanyClick}
        className="text-sm text-[var(--muted)] hover:text-gray-700 transition-colors"
        title={`View ${getCompanyName()} company details`}
      >
        {getCompanyName()}
      </button>
      <span className="text-sm text-[var(--muted)]">/</span>
      
      {/* Person Link */}
      <button
        onClick={handlePersonClick}
        className="text-sm font-medium text-[var(--foreground)] hover:text-blue-600 transition-colors"
        title={`View ${getDisplayName()} details`}
      >
        {getDisplayName()}
      </button>
    </div>
  );
}
