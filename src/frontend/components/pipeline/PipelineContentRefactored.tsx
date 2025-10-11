"use client";

/**
 * PipelineContentRefactored - Configuration-driven pipeline content
 * 
 * Refactored version that uses configuration instead of hardcoded logic.
 * This makes the component more maintainable and easier to extend.
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { usePipeline } from "@/products/pipeline/context/PipelineContext";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import { useProfilePopup } from "@/platform/ui/components/ProfilePopupContext";
import { ProfileBox } from "@/platform/ui/components/ProfileBox";
import { PipelineHydrationFix } from "./PipelineHydrationFix";
import { PipelineFiltersRefactored } from "./PipelineFiltersRefactored";
import { ConfigurableTable } from "./table/ConfigurableTable";
import { EmptyStateDashboard } from "./EmptyStateDashboard";
import { Dashboard } from "./Dashboard";
import { MetricsDashboard } from "./MetricsDashboard";
import { SpeedrunSprintView } from "./SpeedrunSprintView";
import { getPipelineContentConfig } from "./config/pipeline-content-config";
import { mapAcquisitionDataToSection } from "./config/section-config";

interface PipelineContentRefactoredProps {
  section: string;
  sellerId?: string;
  companyId?: string;
  title?: string;
  subtitle?: string;
}

export function PipelineContentRefactored({ 
  section, 
  sellerId, 
  companyId, 
  title, 
  subtitle 
}: PipelineContentRefactoredProps) {
  const router = useRouter();
  const { navigateToPipeline, navigateToPipelineItem } = useWorkspaceNavigation();
  const { user } = useUnifiedAuth();
  const { ui } = useAcquisitionOS();
  
  // Pipeline context for user data
  const { 
    user: pipelineUser, 
    company, 
    workspace
  } = usePipeline();
  
  // ProfilePopupContext for profile popup functionality
  const { 
    isProfileOpen,
    setIsProfileOpen,
    profileAnchor,
    setProfileAnchor,
    profilePopupRef
  } = useProfilePopup();
  
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Get configuration for this section
  const config = getPipelineContentConfig(section);
  
  // Get data from acquisition context
  const { data: acquisitionData } = useAcquisitionOS();
  const data = mapAcquisitionDataToSection(acquisitionData?.acquireData, section);
  
  // Local state for filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Handle section changes
  const handleSectionChange = (newSection: string) => {
    console.log(`🔄 [PipelineContentRefactored] Section change: ${section} -> ${newSection}`);
    navigateToPipeline(newSection);
  };

  // Handle record clicks
  const handleRecordClick = (record: any) => {
    console.log(`🔄 [PipelineContentRefactored] Record clicked:`, record);
    setSelectedRecord(record);
    navigateToPipelineItem(section, record.id);
  };

  // Handle record reordering
  const handleReorderRecords = (reorderedRecords: any[]) => {
    console.log(`🔄 [PipelineContentRefactored] Records reordered:`, reorderedRecords);
    // TODO: Implement record reordering logic
  };

  // Handle column sorting
  const handleColumnSort = (field: string, direction: 'asc' | 'desc') => {
    console.log(`🔄 [PipelineContentRefactored] Column sort:`, field, direction);
    setSortField(field);
    setSortDirection(direction);
  };

  // Handle column visibility changes
  const handleColumnVisibilityChange = (columns: string[]) => {
    console.log(`🔄 [PipelineContentRefactored] Column visibility changed:`, columns);
    setVisibleColumns(columns);
  };

  // Handle adding new records
  const handleAddRecord = () => {
    console.log(`🔄 [PipelineContentRefactored] Add record for section:`, section);
    // TODO: Implement add record logic
  };

  // Handle custom actions
  const handleCustomAction = (actionId: string) => {
    const action = config?.customActions?.find(a => a.id === actionId);
    if (action) {
      action.action();
    }
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="h-full flex flex-col bg-[var(--background)] max-w-full overflow-hidden">
      {/* Top header skeleton */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-[var(--loading-bg)] rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-[var(--loading-bg)] rounded w-48 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-[var(--loading-bg)] rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Search and filters skeleton */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-[var(--border)]">
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="h-10 bg-[var(--loading-bg)] rounded w-80 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-4 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="flex-1 p-6 max-w-full overflow-hidden">
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--loading-bg)] rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render special sections
  const renderSpecialSection = () => {
    switch (section) {
      case 'metrics':
        return <MetricsDashboard />;
      case 'dashboard':
        return <Dashboard />;
      case 'speedrun':
        if (window.location.pathname.includes('/sprint')) {
          return <SpeedrunSprintView />;
        }
        break;
    }
    return null;
  };

  // Render main content
  const renderMainContent = () => {
    const specialSection = renderSpecialSection();
    if (specialSection) {
      return specialSection;
    }

    if (isLoading) {
      return renderLoadingSkeleton();
    }

    return (
      <div className="h-full flex flex-col bg-[var(--background)] max-w-full overflow-hidden">
        {/* Top header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {title || config?.title || section.charAt(0).toUpperCase() + section.slice(1)}
              </h1>
              {(subtitle || config?.description) && (
                <p className="text-sm text-[var(--muted)] mt-1">
                  {subtitle || config?.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {/* Custom actions */}
              {config?.customActions?.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleCustomAction(action.id)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-[var(--hover)] hover:bg-[var(--loading-bg)] rounded-lg transition-colors"
                >
                  {action.icon && <span>{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              ))}
              
              {/* Add record button */}
              {config?.showAddButton && (
                <button
                  onClick={handleAddRecord}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {config.addButtonText || `Add ${section.slice(0, -1)}`}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Search and filters */}
        {(config?.showFilters || config?.showSearch) && (
          <div className="flex-shrink-0 px-6 py-3 border-b border-[var(--border)]">
            <PipelineFiltersRefactored
              section={section}
              totalCount={data.length}
              onSearchChange={setSearchQuery}
              onVerticalChange={(value) => setActiveFilters(prev => ({ ...prev, vertical: value }))}
              onStatusChange={(value) => setActiveFilters(prev => ({ ...prev, status: value }))}
              onPriorityChange={(value) => setActiveFilters(prev => ({ ...prev, priority: value }))}
              onRevenueChange={(value) => setActiveFilters(prev => ({ ...prev, revenue: value }))}
              onLastContactedChange={(value) => setActiveFilters(prev => ({ ...prev, lastContacted: value }))}
              onTimezoneChange={(value) => setActiveFilters(prev => ({ ...prev, timezone: value }))}
              onSortChange={handleColumnSort}
              onAddRecord={handleAddRecord}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              visibleColumns={visibleColumns}
            />
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 p-6 max-w-full overflow-hidden">
          {data.length === 0 ? (
            <EmptyStateDashboard section={section} />
          ) : (
            <ConfigurableTable
              section={section}
              data={data}
              onRowClick={handleRecordClick}
              onSort={handleColumnSort}
              sortField={sortField}
              sortDirection={sortDirection}
              selectedRecord={selectedRecord}
              loading={isLoading}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <PipelineHydrationFix>
      <>
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] bg-green-50 border border-green-200 rounded-lg shadow-lg px-4 py-2">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-700 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Main content */}
        {renderMainContent()}

        {/* Profile Popup */}
        {isProfileOpen && profileAnchor && (
          <ProfileBox
            ref={profilePopupRef}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            anchorElement={profileAnchor}
            user={pipelineUser}
            company={company}
            workspace={workspace}
          />
        )}
      </>
    </PipelineHydrationFix>
  );
}
