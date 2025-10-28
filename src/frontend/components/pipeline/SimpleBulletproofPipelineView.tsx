"use client";

/**
 * 🚀 SIMPLE BULLETPROOF PIPELINE VIEW
 * 
 * This is a minimal, bulletproof implementation that just shows the data
 * without any complex logic that could cause crashes.
 */

import React from 'react';
// Removed deleted PipelineDataStore - using unified data system
import { PipelineTable } from './PipelineTable';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';

interface SimpleBulletproofPipelineViewProps {
  section: string;
}

export function SimpleBulletproofPipelineView({ section }: SimpleBulletproofPipelineViewProps) {
  console.log(`🚨🚨🚨 [BULLETPROOF VIEW] Starting for section: ${section}`);
  
  // 🆕 CRITICAL FIX: Use useRevenueOS for consistent data source
  const { data: acquisitionData } = useRevenueOS();
  
  console.log(`🚨🚨🚨 [BULLETPROOF VIEW] Using useRevenueOS data source`);
  
  // Map acquisition data to the requested section
  const getSectionData = (section: string) => {
    // The useData hook returns acquireData, not data
    const acquireData = acquisitionData?.acquireData || {};
    switch (section) {
      case 'leads': return acquireData.leads || [];
      case 'prospects': return acquireData.prospects || [];
      case 'opportunities': return acquireData.opportunities || [];
      case 'companies': return acquireData.companies || []; // Companies data
      case 'people': return acquireData.people || []; // People data
      case 'clients': return acquireData.clients || [];
      case 'partners': return acquireData.partnerships || [];
      case 'speedrun': return acquireData.speedrunItems || [];
      default: return [];
    }
  };
  
  const data = getSectionData(section);
  const error = null;
  
  // Show error state
  if (error) {
    return (
      <div className="h-full bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h4 className="text-lg font-medium text-[var(--foreground)] mb-2">Error loading data</h4>
          <p className="text-sm text-[var(--muted)]">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }
  
  // Show empty state
  if (data['length'] === 0) {
    return (
      <div className="h-full bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--muted)] text-2xl mb-4">📋</div>
          <h4 className="text-lg font-medium text-[var(--foreground)] mb-2">No {section} yet</h4>
          <p className="text-sm text-[var(--muted)]">Add your first {section.slice(0, -1)} to get started</p>
        </div>
      </div>
    );
  }
  
  // Show data table
  console.log(`🚨🚨🚨 [BULLETPROOF VIEW] Rendering table with ${data.length} records`);
  
  const visibleColumns = ['rank', 'company', 'name', 'title', 'lastAction', 'nextAction', 'actions'];
  
  return (
    <div className="h-full bg-[var(--background)]">
      <div className="p-6 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)] capitalize">
          {section} ({data.length})
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Showing all {data.length} {section}
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <PipelineTable
          section={section}
          data={data}
          onRecordClick={(record) => console.log('Record clicked:', record)}
          // loading={loading} // Removed - not part of PipelineTableProps
          visibleColumns={visibleColumns}
        />
      </div>
    </div>
  );
}
