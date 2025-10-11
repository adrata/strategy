"use client";

import React from "react";
import { PipelineTable } from "@/frontend/components/pipeline/PipelineTable";
import { PipelineHeader } from "@/frontend/components/pipeline/PipelineHeader";
import { PipelineFilters } from "@/frontend/components/pipeline/PipelineFilters";
import { SellersView } from "./SellersView";
// Removed deleted PipelineDataStore - using unified data system
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { usePipelineData } from "@/platform/hooks/useAdrataData";
import { useFastSectionData } from "@/platform/hooks/useFastSectionData";

interface MiddlePanelProps {
  activeSection: string;
}

export function MiddlePanel({
  activeSection
}: MiddlePanelProps) {
  // EXTREME DEBUG: Log component execution
  console.log(`🚨🚨🚨 [MIDDLE PANEL EXTREME DEBUG] Component is executing! Section: ${activeSection}`);
  console.log(`🚨🚨🚨 [MIDDLE PANEL EXTREME DEBUG] Component timestamp: ${new Date().toISOString()}`);
  
  // 🚀 PERFORMANCE: Use fast section data hook for instant loading
  console.log(`🚀 [MIDDLE PANEL] Using fast section data for: ${activeSection}`);
  
  // Use fast section data hook for the active section only
  const fastSectionData = useFastSectionData(activeSection, 30);
  
  console.log(`🔍 [MIDDLE PANEL] Fast section data result:`, {
    data: fastSectionData.data?.length || 0,
    loading: fastSectionData.loading,
    error: fastSectionData.error,
    count: fastSectionData.count
  });
  
  // 🚀 PERFORMANCE: Only use fast section data - no fallback to heavy acquisition data
  const { user: authUser } = useUnifiedAuth();
  
  // 🚀 PERFORMANCE: Use fast section data hook with instant cache fallback
  const [cachedData, setCachedData] = React.useState<any[]>([]);
  const [showSkeleton, setShowSkeleton] = React.useState(false);
  
  // Check for cached data on section change for instant loading
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const cacheKey = `cached-section-${activeSection}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.data && Array.isArray(parsed.data)) {
            setCachedData(parsed.data);
            setShowSkeleton(false); // Don't show skeleton if we have cached data
            console.log(`⚡ [MIDDLE PANEL] Loaded ${parsed.data.length} cached items for ${activeSection}`);
          }
        } catch (e) {
          console.warn('Failed to parse cached data:', e);
        }
      } else {
        // Clear cached data when switching to a section without cache
        setCachedData([]);
      }
    }
  }, [activeSection]);
  
  // Show skeleton only after a short delay to prevent flickering
  React.useEffect(() => {
    if (fastSectionData.loading && cachedData.length === 0 && (fastSectionData.data || []).length === 0) {
      const timer = setTimeout(() => {
        setShowSkeleton(true);
      }, 100); // 100ms delay to prevent flickering
      
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [fastSectionData.loading, cachedData.length, fastSectionData.data]);
  
  // Use cached data if available, otherwise use fast section data
  const pipelineData = {
    data: cachedData.length > 0 ? cachedData : (fastSectionData.data || []),
    loading: fastSectionData.loading && cachedData.length === 0 && (fastSectionData.data || []).length === 0,
    error: fastSectionData.error,
    isEmpty: (cachedData.length > 0 ? cachedData : (fastSectionData.data || [])).length === 0,
    metrics: {
      totalCount: fastSectionData.count || cachedData.length || 0,
      activeCount: (cachedData.length > 0 ? cachedData : (fastSectionData.data || [])).filter((item: any) => item.status !== 'inactive').length,
      totalPipelineValue: 0,
      openDeals: 0,
      winRate: 0,
      avgDealSize: 0,
      conversionRate: 0,
      avgResponseTime: 0,
      totalLeads: 0,
      qualifiedLeads: 0,
      meetingsScheduled: 0,
      proposalsSent: 0,
      dealsClosed: 0,
      revenueGenerated: 0,
      pipelineVelocity: 0,
      stageConversionRates: {},
      monthlyGrowth: 0,
      quarterlyGrowth: 0,
      yearlyGrowth: 0,
      topPerformingSources: [],
      averageDealCycle: 0,
      customerAcquisitionCost: 0,
      lifetimeValue: 0
    } as any
  };


  // Show skeleton loading state only when actually loading (not when there's simply no data)
  if (showSkeleton) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        {/* Header skeleton */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-[var(--loading-bg)] rounded w-32 animate-pulse"></div>
            </div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Filters skeleton */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-[var(--border)]">
          <div className="flex gap-4">
            <div className="h-8 bg-[var(--loading-bg)] rounded w-48 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
          </div>
        </div>
        
        {/* Table skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-[var(--loading-bg)] rounded w-8 animate-pulse"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-28 animate-pulse"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-32 animate-pulse"></div>
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
    <div className="h-full flex flex-col bg-[var(--background)] overflow-hidden">
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
          isLoading={pipelineData.loading}
          visibleColumns={['rank', 'company', 'name', 'title', 'nextAction', 'lastAction', 'actions']}
        />
      </div>
    </div>
  );
}