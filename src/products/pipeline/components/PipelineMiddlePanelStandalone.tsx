"use client";

import React from "react";
import { PipelineTable } from "@/frontend/components/pipeline/PipelineTable";
import { PipelineHeader } from "@/frontend/components/pipeline/PipelineHeader";
import { PipelineFilters } from "@/frontend/components/pipeline/PipelineFilters";
import { SellersView } from "./SellersView";
// Removed deleted PipelineDataStore - using unified data system
import { useUnifiedAuth } from "@/platform/auth-unified";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { usePipelineData } from "@/platform/hooks/useAdrataData";

interface PipelineMiddlePanelStandaloneProps {
  activeSection: string;
}

export function PipelineMiddlePanelStandalone({
  activeSection
}: PipelineMiddlePanelStandaloneProps) {
  // EXTREME DEBUG: Log component execution
  console.log(`🚨🚨🚨 [MIDDLE PANEL EXTREME DEBUG] Component is executing! Section: ${activeSection}`);
  console.log(`🚨🚨🚨 [MIDDLE PANEL EXTREME DEBUG] Component timestamp: ${new Date().toISOString()}`);
  
  // 🆕 CRITICAL FIX: Use useAcquisitionOS for consistent data source (no hardcoded IDs)
  console.log(`🚨🚨🚨 [MIDDLE PANEL EXTREME DEBUG] Using useAcquisitionOS data source`);
  
  // Use the same data source as the left panel for consistency
  const { user: authUser } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  
  // Get workspace and user IDs
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const userId = authUser?.id;
  
  // Use individual pipeline data hooks like the left panel
  const safeWorkspaceId = (workspaceId && workspaceId !== 'default') ? workspaceId : undefined;
  const safeUserId = (userId && userId !== 'default') ? userId : undefined;
  
  const leadsData = usePipelineData('leads', safeWorkspaceId, safeUserId);
  const prospectsData = usePipelineData('prospects', safeWorkspaceId, safeUserId);
  const opportunitiesData = usePipelineData('opportunities', safeWorkspaceId, safeUserId);
  const companiesData = usePipelineData('companies', safeWorkspaceId, safeUserId);
  const peopleData = usePipelineData('people', safeWorkspaceId, safeUserId);
  const clientsData = usePipelineData('clients', safeWorkspaceId, safeUserId);
  const partnersData = usePipelineData('partners', safeWorkspaceId, safeUserId);
  
  // CRITICAL FIX: Use the same data source as left panel
  const getSectionData = (section: string) => {
    switch (section) {
      case 'leads': return leadsData.data || [];
      case 'prospects': return prospectsData.data || [];
      case 'opportunities': return opportunitiesData.data || [];
      case 'companies': return companiesData.data || [];
      case 'people': return peopleData.data || [];
      case 'clients': return clientsData.data || [];
      case 'partners': return partnersData.data || [];
      case 'speedrun': return acquisitionData?.acquireData?.speedrunItems || [];
      default: return [];
    }
  };
  
  // Get the correct loading state for the active section
  const getLoadingState = (section: string) => {
    switch (section) {
      case 'leads': return leadsData.loading;
      case 'prospects': return prospectsData.loading;
      case 'opportunities': return opportunitiesData.loading;
      case 'companies': return companiesData.loading;
      case 'people': return peopleData.loading;
      case 'clients': return clientsData.loading;
      case 'partners': return partnersData.loading;
      case 'speedrun': return acquisitionData?.loading?.isLoading || false;
      default: return false;
    }
  };

  const pipelineData = {
    data: getSectionData(activeSection),
    loading: getLoadingState(activeSection),
    error: null, // Individual hooks handle their own errors
    isEmpty: getSectionData(activeSection).length === 0,
    metrics: {
      totalCount: getSectionData(activeSection).length,
      activeCount: getSectionData(activeSection).filter((item: any) => item.status !== 'inactive').length
    }
  };


  // Show skeleton loading state instead of empty message
  if (pipelineData['loading'] && pipelineData['data']['length'] === 0) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header skeleton */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Filters skeleton */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        
        {/* Table skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle record click (navigation)
  const handleRecordClick = (record: any) => {
    console.log(`🔍 [MIDDLE PANEL] Record clicked:`, record);
    // TODO: Handle record navigation/details
  };

  console.log(`✅ [MIDDLE PANEL] Rendering PipelineTable with ${pipelineData.data.length} ${activeSection} records`);

  // Note: Removed special case for sellers - now uses standard PipelineTable rendering

  // Use metrics from pipeline data (same as original PipelineView)
  const metrics = pipelineData.metrics || {
    totalCount: pipelineData.data.length,
    activeCount: pipelineData.data.filter((item: any) => item.status !== 'inactive').length
  };
  
  console.log(`🔍 [MIDDLE PANEL] Metrics:`, metrics);

  // FULL-FEATURED: Use complete pipeline layout with header and filters
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with metrics and actions */}
      <PipelineHeader
        section={activeSection}
        metrics={metrics}
        onSectionChange={() => {}} // Not needed in 3-panel layout
        onRefresh={() => {}} // TODO: Add refresh functionality
        onClearCache={() => {}} // TODO: Add clear cache functionality
        onAddRecord={() => console.log('Add record clicked')} // TODO: Add record functionality
        loading={pipelineData.loading}
        recordCount={pipelineData.data.length}
      />

      {/* Filters - Match original PipelineView structure exactly */}
      <div className="flex-shrink-0 px-6 pt-2 pb-1 w-full">
        <PipelineFilters 
          section={activeSection}
          totalCount={pipelineData.data.length}
          onSearchChange={() => {}} // TODO: Add search functionality
          onVerticalChange={() => {}} // TODO: Add filter functionality
          onStatusChange={() => {}}
          onPriorityChange={() => {}}
          onRevenueChange={() => {}}
          onLastContactedChange={() => {}}
          onSortChange={() => {}}
          onAddRecord={() => console.log('Add record clicked')}
          onColumnVisibilityChange={() => {}}
          visibleColumns={['rank', 'company', 'name', 'title', 'nextAction', 'lastAction', 'actions']}
        />
      </div>

      {/* Main table content - Match original PipelineView structure exactly */}
      <div className="flex-1 px-6 min-h-0 pb-8">
        <PipelineTable 
          section={activeSection}
          data={pipelineData.data}
          onRecordClick={handleRecordClick}
          loading={pipelineData.loading}
          visibleColumns={['rank', 'company', 'name', 'title', 'nextAction', 'lastAction', 'actions']}
        />
      </div>
    </div>
  );
}