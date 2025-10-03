"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/platform/auth-fetch';
import { useRouter } from 'next/navigation';
import { useWorkspaceNavigation } from '@/platform/hooks/useWorkspaceNavigation';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { useProfilePopup } from '@/platform/ui/components/ProfilePopupContext';
import { extractIdFromSlug } from '@/platform/utils/url-utils';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { PipelineLeftPanelStandalone } from '@/products/pipeline/components/PipelineLeftPanelStandalone';
import { AIRightPanel } from '@/platform/ui/components/chat/AIRightPanel';
// import { useZoom } from '@/platform/ui/components/ZoomProvider';
import { PipelineView } from './PipelineView';
import { UniversalRecordTemplate } from './UniversalRecordTemplate';
import { ProfileBox } from '@/platform/ui/components/ProfileBox';
import { SpeedrunEngineModal } from '@/platform/ui/components/SpeedrunEngineModal';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { usePipeline } from '@/products/pipeline/context/PipelineContext';
import { PanelLoader } from '@/platform/ui/components/Loader';
import { RecordContextProvider } from '@/platform/ui/context/RecordContextProvider';


interface PipelineDetailPageProps {
  section: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners' | 'sellers' | 'speedrun';
  slug: string;
}

export function PipelineDetailPage({ section, slug }: PipelineDetailPageProps) {
  const router = useRouter();
  const { navigateToPipeline, navigateToPipelineItem } = useWorkspaceNavigation();
  const { user } = useUnifiedAuth();
  // const { zoom } = useZoom();
  const zoom = 100; // Temporary fix - use default zoom
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [previousRecord, setPreviousRecord] = useState<any>(null);
  const [isSpeedrunVisible, setIsSpeedrunVisible] = useState(true);
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(true);
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const [directRecordLoading, setDirectRecordLoading] = useState(false);
  const [directRecordError, setDirectRecordError] = useState<string | null>(null);
  const [lastLoadAttempt, setLastLoadAttempt] = useState<string | null>(null);
  const [isSpeedrunEngineModalOpen, setIsSpeedrunEngineModalOpen] = useState(false);
  
  // 🚀 UNIFIED LOADING: Track page transitions for smooth UX
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Listen for section transitions to show unified loading state
  useEffect(() => {
    const handleSectionTransition = (event: CustomEvent) => {
      const { from, to } = event.detail;
      if (from === section || to === section) {
        setIsTransitioning(true);
        // Auto-clear transition state after navigation completes
        setTimeout(() => setIsTransitioning(false), 300);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('pipeline-section-change', handleSectionTransition as EventListener);
      return () => window.removeEventListener('pipeline-section-change', handleSectionTransition as EventListener);
    }
    
    return () => {
      // Cleanup function
    };
  }, [section]);
  
  // Use centralized profile popup context
  const { isProfileOpen, setIsProfileOpen, profileAnchor, profilePopupRef } = useProfilePopup();
  
  // Load data for navigation - REQUIRED for navigation arrows to work
  const { data: acquisitionData } = useAcquisitionOS();
  
  // 🆕 CRITICAL FIX: Use provider workspace instead of URL detection
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;
  // Map workspace to correct user ID
  const getUserIdForWorkspace = (workspaceId: string) => {
    switch (workspaceId) {
      case '01K1VBYXHD0J895XAN0HGFBKJP': // Adrata workspace
        return '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan Mirolli
      case '01K1VBYV8ETM2RCQA4GNN9EG72': // RPS workspace
        return '01K1VBYYV7TRPY04NW4TW4XWRB'; // Just Dano
      case '01K5D01YCQJ9TJ7CT4DZDE79T1': // TOP Engineering Plus workspace
        return '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan Mirolli
      default:
        return user?.id;
    }
  };
  const userId = getUserIdForWorkspace(workspaceId || '');
  
  // Map acquisition data to pipeline format for compatibility (same as working leads page)
  const getSectionData = (section: string) => {
    const acquireData = acquisitionData?.acquireData || {};
    
    console.log(`🔍 [DATA PIPELINE] Getting data for section ${section}:`, {
      hasAcquisitionData: !!acquisitionData,
      hasAcquireData: !!acquisitionData?.acquireData,
      acquireDataKeys: acquisitionData?.acquireData ? Object.keys(acquisitionData.acquireData) : 'no acquireData',
      sectionDataLength: acquireData[section]?.length || 0,
      isLoading: acquisitionData?.loading?.isLoading
    });
    
    let data = [];
    switch (section) {
      case 'leads': data = acquireData.leads || []; break;
      case 'prospects': data = acquireData.prospects || []; break;
      case 'opportunities': data = acquireData.opportunities || []; break;
      case 'companies': data = acquireData.companies || []; break;
      case 'people': data = acquireData.people || []; break;
      case 'clients': data = acquireData.clients || []; break;
      case 'partners': data = acquireData.partnerships || []; break;
      case 'sellers': data = acquireData.sellers || []; break;
      case 'speedrun': data = acquireData.speedrunItems || []; break;
      default: data = []; break;
    }
    
    console.log(`🔍 [DATA PIPELINE] Section ${section} data:`, {
      dataLength: data.length,
      firstRecord: data[0] ? { id: data[0].id, name: data[0].name } : 'no records',
      sampleIds: data.slice(0, 3).map(r => r.id),
      section: section,
      hasAcquisitionData: !!acquisitionData,
      acquisitionDataKeys: acquisitionData ? Object.keys(acquisitionData) : 'no acquisition data'
    });
    
    // Companies are already properly ranked by the API - no additional sorting needed
    
    return data;
  };
  
  const data = getSectionData(section);
  
  // 🚀 MODERN 2025: Unified loading state - use acquisition data loading OR direct record loading OR transitions
  const loading = acquisitionData.isLoading || directRecordLoading || isTransitioning;
  const error = acquisitionData.error || directRecordError;
  
  console.log(`🔍 [LOADING STATE] Loading states:`, {
    acquisitionDataLoading: acquisitionData.isLoading,
    directRecordLoading,
    isTransitioning,
    totalLoading: loading,
    hasError: !!error,
    errorMessage: error
  });

  // Direct record loading function for when accessed via URL
  const loadDirectRecord = useCallback(async (recordId: string) => {
    if (!recordId || directRecordLoading) return;
    
    // 🚫 PREVENT RAPID-FIRE CALLS: Debounce API calls
    const now = Date.now();
    if (lastLoadAttempt && now - parseInt(lastLoadAttempt) < 2000) {
      console.log(`🔄 [DEBOUNCE] Skipping rapid API call for ${recordId}`);
      return;
    }
    setLastLoadAttempt(now.toString());
    
    // Prevent loading external Coresignal IDs
    if (recordId.includes('coresignal')) {
      console.error(`❌ [DIRECT LOAD] External Coresignal ID detected: ${recordId}. Cannot load external records.`);
      setDirectRecordError('External ID detected. This record may not exist in the current workspace.');
      setDirectRecordLoading(false);
      return;
    }
    
    // Prevent infinite retries
    if (directRecordError && directRecordError.includes('Record not found')) {
      console.log(`🚫 [DIRECT LOAD] Skipping retry for non-existent record: ${recordId}`);
      return;
    }
    
    // 🎯 FIRST: Try to find record in sessionStorage (instant loading)
    if (typeof window !== 'undefined') {
      // Check the optimized cache first
      const currentRecord = sessionStorage.getItem(`current-record-${section}`);
      if (currentRecord) {
        try {
          const { id, data, timestamp } = JSON.parse(currentRecord);
          if (id === recordId && Date.now() - timestamp < 300000) { // 5 minute cache
            console.log(`⚡ [INSTANT LOAD] Found record in optimized cache - instant loading:`, data.name || data.fullName || recordId);
            setSelectedRecord(data);
            return;
          }
        } catch (error) {
          console.warn('Failed to parse optimized cached record:', error);
        }
      }
      
      // Fallback to original cache
      const cachedRecord = sessionStorage.getItem(`cached-${section}-${recordId}`);
      if (cachedRecord) {
        try {
          const record = JSON.parse(cachedRecord);
          console.log(`⚡ [INSTANT LOAD] Found record in sessionStorage - instant loading:`, record.name || record.fullName || recordId);
          setSelectedRecord(record);
          return;
        } catch (error) {
          console.warn('Failed to parse cached record:', error);
        }
      }
    }
    
    // 🎯 SECOND: Try to find record in already-loaded data (no API call needed)
    const allData = acquisitionData?.acquireData || acquisitionData || {};
    const sectionData = allData[section] || [];
    
    const existingRecord = sectionData.find((record: any) => record['id'] === recordId);
    if (existingRecord) {
      console.log(`⚡ [SMART LOAD] Found record in cache - no API call needed:`, existingRecord.name || existingRecord.fullName || recordId);
      setSelectedRecord(existingRecord);
      return;
    }

    // 🎯 FALLBACK: Only make API call if record not found in cache
    setDirectRecordLoading(true);
    setDirectRecordError(null);
    
    try {
      console.log(`🔍 [DIRECT LOAD] Record not in cache, loading ${section} record directly: ${recordId}`);
      
      // ⚡ PERFORMANCE MONITORING: Track API call timing
      const startTime = performance.now();
      
      // 🚀 FAST INITIAL LOAD: Load only essential fields for Overview tab first
      const timestamp = Date.now();
      const response = await authFetch(`/api/data/unified?type=${section}&id=${recordId}&fields=essential`);
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`⚡ [PERFORMANCE] Unified API call took ${loadTime.toFixed(2)}ms for ${section} record: ${recordId}`);
      
      if (!response.ok) {
        if (response['status'] === 404) {
          throw new Error(`Record not found. It may have been deleted or moved to a different workspace.`);
        }
        throw new Error(`Failed to load ${section} record: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result['success'] && result.data) {
        // Extract the record from the unified API response
        const sectionData = result['data'][section] || [];
        console.log(`🔍 [DIRECT LOAD] Looking for record ${recordId} in ${sectionData.length} ${section} records`);
        
        const record = sectionData.find((r: any) => r['id'] === recordId);
        
        if (record) {
          console.log(`✅ [DIRECT LOAD] Successfully loaded ${section} record from unified API:`, {
            id: record.id,
            name: record.name,
            description: record.description ? 'Yes' : 'No',
            website: record.website ? 'Yes' : 'No',
            source: 'unified_api'
          });
          
          // Cache the record for future use
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`cached-${section}-${recordId}`, JSON.stringify(record));
            sessionStorage.setItem(`current-record-${section}`, JSON.stringify({ id: recordId, data: record, timestamp: Date.now() }));
            console.log(`💾 [CACHE] Cached ${section} record for future instant loading`);
          }
          
          setSelectedRecord(record);
        } else {
          console.log(`⚠️ [DIRECT LOAD] Record not found in API response, but continuing with cached data if available`);
          // Don't throw error - let the app continue with cached data
          return;
        }
      } else {
        throw new Error(result.error || `Failed to load ${section} record from unified API`);
      }
    } catch (error) {
      console.error(`❌ [DIRECT LOAD] Error loading ${section} record:`, error);
      setDirectRecordError(error instanceof Error ? error.message : `Failed to load ${section} record`);
    } finally {
      setDirectRecordLoading(false);
    }
  }, [section]); // 🚫 FIXED: Removed directRecordLoading, directRecordError to prevent infinite loops

  useEffect(() => {
    if (!slug) return;

    // Extract ID from slug
    const recordId = extractIdFromSlug(slug);
    
    console.log(`🔍 [RECORD LOADING] Slug: ${slug}, Extracted ID: ${recordId}`);
    
    // 🚫 PREVENT INFINITE LOOPS: Check if we're already loading this record
    if (directRecordLoading || (selectedRecord && selectedRecord.id === recordId)) {
      console.log(`🔄 [PREVENT LOOP] Already loading or have record: ${recordId}`);
      return;
    }
    
    // 🚫 PREVENT CACHE CLEARING: Don't clear cache unnecessarily
    // if (section === 'companies') {
    //   console.log(`🔄 [COMPANY CACHE FIX] Clearing cache for company: ${recordId}`);
    //   // Clear company-related cache
    //   if (typeof window !== 'undefined') {
    //     sessionStorage.removeItem(`cached-companies-${recordId}`);
    //     sessionStorage.removeItem(`current-record-companies`);
    //   }
    // }
    
    // If we have data loaded, try to find the record in it
    if (data.length > 0) {
      console.log(`🔍 [DATA DEBUG] Looking for record ${recordId} in ${data.length} cached records`);
      console.log(`🔍 [DATA DEBUG] Available record IDs:`, data.slice(0, 5).map(r => ({ id: r.id, name: r.name })));
      console.log(`🔍 [DATA DEBUG] Section: ${section}, RecordId: ${recordId}`);
      
      // For demo scenarios, also check userId field (contains demo IDs like zp-kirk-harbaugh-2025)
      const record = data.find((r: any) => r['id'] === recordId || r['userId'] === recordId);
      
      console.log(`🔍 [DATA DEBUG] Record search result:`, record ? 'FOUND' : 'NOT FOUND');
      console.log(`🔍 [DATA DEBUG] Searching for ID: ${recordId}`);
      console.log(`🔍 [DATA DEBUG] First few records:`, data.slice(0, 3).map(r => ({ id: r.id, name: r.name })));
      
        if (record) {
          console.log(`🔗 [Direct URL] Found ${section} record in cached data:`, {
            id: record.id,
            name: record.name,
            description: record.description ? 'Yes' : 'No',
            website: record.website ? 'Yes' : 'No',
            source: 'cached'
          });
          
          // 🚀 PRELOAD: For companies, preload buyer group data for faster tab switching
          if (section === 'companies') {
            console.log(`🚀 [BUYER GROUP PRELOAD] Preloading buyer group data for company: ${record.id}`);
            // Preload buyer group data in background
            authFetch(`/api/data/buyer-groups/fast`)
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  console.log(`⚡ [BUYER GROUP PRELOAD] Preloaded ${data.members.length} buyer group members`);
                  // Cache the preloaded data
                  if (typeof window !== 'undefined') {
                    localStorage.setItem(`buyer-groups-${record.id}-${workspaceId}`, JSON.stringify(data.members));
                  }
                }
              })
              .catch(error => {
                console.log('⚠️ [BUYER GROUP PRELOAD] Failed to preload:', error);
              });
          }
          
          // 🚫 REMOVED: Overly aggressive company record validation that was causing loading issues
          // Just use the cached record if we have it
          console.log(`✅ [COMPANY FIX] Using cached company record:`, {
            id: record.id,
            name: record.name,
            hasDescription: !!record.description,
            hasWebsite: !!record.website,
            hasIndustry: !!record.industry
          });
          
          // Keep the previous record in case we need to fall back
          if (selectedRecord && selectedRecord.id !== record.id) {
            setPreviousRecord(selectedRecord);
          }
          setSelectedRecord(record);
          return;
      } else {
        console.log(`⚠️ [DATA DEBUG] Record ${recordId} not found in cached data, will try direct load`);
      }
    }
    
    // If data is still loading but we have the record, continue
    if (loading) {
      console.log(`🔄 [Direct URL] Data still loading, but continuing with available record...`);
      // Don't return - continue to show the record if we have it
    }
    
    // If we have data but no record found, or no data at all, try direct loading
    if (!selectedRecord || selectedRecord.id !== recordId) {
      console.log(`🔍 [Direct URL] Record not found in data, attempting direct load for: ${recordId}`);
      
      // Check if this is an external ID (Coresignal format) - these should not be used for navigation
      if (recordId && recordId.includes('coresignal')) {
        console.error(`❌ [Direct URL] External Coresignal ID detected: ${recordId}. These should not be used for navigation.`);
        setDirectRecordError('External ID detected. This record may not exist in the current workspace.');
        return;
      }
      
      // Only attempt direct loading if we have a valid recordId and not already loading
      if (recordId && recordId !== 'undefined' && recordId !== 'null' && !directRecordLoading) {
        loadDirectRecord(recordId);
      } else if (directRecordLoading) {
        console.log(`⏳ [Direct URL] Already loading record, skipping duplicate request`);
      } else {
        console.error(`❌ [Direct URL] Invalid record ID: ${recordId}`);
        setDirectRecordError('Invalid record ID');
      }
    }
  }, [slug, section]); // 🚫 FIXED: Removed data, loading, selectedRecord to prevent infinite loops

  // Handle section navigation
  const handleSectionChange = (newSection: string) => {
    navigateToPipeline(newSection);
  };

  // Handle back navigation
  const handleBack = () => {
    navigateToPipeline(section);
  };

  // Navigation functions for record detail view - FIXED to work like the back arrow (URL-based)
  const handleNavigatePrevious = useCallback(() => {
    console.log(`🔍 [NAVIGATION] handleNavigatePrevious called:`, {
      hasData: !!data,
      dataLength: data?.length,
      hasSelectedRecord: !!selectedRecord,
      selectedRecordId: selectedRecord?.id
    });
    
    if (!data || !selectedRecord) {
      console.log(`❌ [NAVIGATION] Cannot navigate - missing data or selectedRecord`);
      return;
    }
    
    const currentIndex = data.findIndex((r: any) => r['id'] === selectedRecord.id);
    console.log(`🔍 [NAVIGATION] Current index in data:`, currentIndex);
    
    if (currentIndex > 0) {
      const previousRecord = data[currentIndex - 1];
      
      console.log(`✅ [NAVIGATION] Going to previous record:`, {
        from: selectedRecord.id,
        to: previousRecord.id,
        fromIndex: currentIndex,
        toIndex: currentIndex - 1
      });
      
      // Navigate to the previous record using URL (like the back arrow does)
      const recordName = previousRecord.fullName || previousRecord.name || previousRecord.firstName || 'record';
      navigateToPipelineItem(section, previousRecord.id, recordName);
    } else {
      console.log(`❌ [NAVIGATION] Cannot go previous - already at first record (index: ${currentIndex})`);
    }
  }, [data, selectedRecord, section]);

  const handleNavigateNext = useCallback(() => {
    console.log(`🔍 [NAVIGATION] handleNavigateNext called:`, {
      hasData: !!data,
      dataLength: data?.length,
      hasSelectedRecord: !!selectedRecord,
      selectedRecordId: selectedRecord?.id
    });
    
    if (!data || !selectedRecord) {
      console.log(`❌ [NAVIGATION] Cannot navigate - missing data or selectedRecord`);
      return;
    }
    
    const currentIndex = data.findIndex((r: any) => r['id'] === selectedRecord.id);
    console.log(`🔍 [NAVIGATION] Current index in data:`, currentIndex);
    
    if (currentIndex < data.length - 1) {
      const nextRecord = data[currentIndex + 1];
      
      console.log(`✅ [NAVIGATION] Going to next record:`, {
        from: selectedRecord.id,
        to: nextRecord.id,
        fromIndex: currentIndex,
        toIndex: currentIndex + 1
      });
      
      // Navigate to the next record using URL (like the back arrow does)
      const recordName = nextRecord.fullName || nextRecord.name || nextRecord.firstName || 'record';
      navigateToPipelineItem(section, nextRecord.id, recordName);
    } else {
      console.log(`❌ [NAVIGATION] Cannot go next - already at last record (index: ${currentIndex}, total: ${data.length})`);
    }
  }, [data, selectedRecord, section]);

  // Loading state - Only show loading for direct record loading, not general data loading
  if (directRecordLoading) {
    return (
      <PanelLayout
        thinLeftPanel={null}
        leftPanel={
          <PipelineLeftPanelStandalone 
            activeSection={section}
            onSectionChange={handleSectionChange}
            isSpeedrunVisible={isSpeedrunVisible}
            setIsSpeedrunVisible={setIsSpeedrunVisible}
            isOpportunitiesVisible={isOpportunitiesVisible}
            setIsOpportunitiesVisible={setIsOpportunitiesVisible}
          />
        }
        middlePanel={
          <div className="h-full flex flex-col bg-white">
            {/* Person Detail Loading Skeleton */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Tabs Skeleton */}
            <div className="flex-shrink-0 px-6 pt-2 pb-1">
              <div className="flex items-center gap-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="flex-1 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="grid grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="text-center">
                          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        rightPanel={<AIRightPanel />}
        zoom={zoom}
        isLeftPanelVisible={isLeftPanelVisible}
        isRightPanelVisible={isRightPanelVisible}
        onToggleLeftPanel={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
        onToggleRightPanel={() => setIsRightPanelVisible(!isRightPanelVisible)}
      />
    );
  }

  // Error state - Maintain layout
  if (error || directRecordError) {
    return (
      <PanelLayout
        thinLeftPanel={null}
        leftPanel={
          <PipelineLeftPanelStandalone 
            activeSection={section}
            onSectionChange={handleSectionChange}
            isSpeedrunVisible={isSpeedrunVisible}
            setIsSpeedrunVisible={setIsSpeedrunVisible}
            isOpportunitiesVisible={isOpportunitiesVisible}
            setIsOpportunitiesVisible={setIsOpportunitiesVisible}
          />
        }
        middlePanel={
          <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading {section}</h3>
              <p className="text-gray-600 mb-4">{directRecordError || error}</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            </div>
          </div>
        }
        rightPanel={<AIRightPanel />}
        zoom={zoom}
        isLeftPanelVisible={isLeftPanelVisible}
        isRightPanelVisible={isRightPanelVisible}
        onToggleLeftPanel={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
        onToggleRightPanel={() => setIsRightPanelVisible(!isRightPanelVisible)}
      />
    );
  }

  // Show record details if found (or use previous record as fallback during transitions)
  // 🚫 FALLBACK: Create a basic record if none found to prevent infinite loading
  if (selectedRecord || (previousRecord && slug)) {
    const recordToShow = selectedRecord || previousRecord;
    
    // Get user data from PipelineContext to match PipelineLeftPanelStandalone
    const { user: pipelineUser, company, workspace } = usePipeline();
    
    return (
      <>
        <PanelLayout
          thinLeftPanel={null}
          leftPanel={
            <PipelineLeftPanelStandalone 
              activeSection={section}
              onSectionChange={handleSectionChange}
              isSpeedrunVisible={isSpeedrunVisible}
              setIsSpeedrunVisible={setIsSpeedrunVisible}
              isOpportunitiesVisible={isOpportunitiesVisible}
              setIsOpportunitiesVisible={setIsOpportunitiesVisible}
            />
          }
          middlePanel={
            // Use UniversalRecordTemplate for ALL sections including leads for consistency
            <UniversalRecordTemplate
              record={recordToShow}
              recordType={section as any}
              recordIndex={(() => {
                // Use rank from database if available, otherwise calculate from index
                const dbRank = recordToShow?.rank;
                if (dbRank && dbRank > 0) {
                  console.log(`🔍 [NAVIGATION] Using database rank:`, {
                    recordId: recordToShow?.id,
                    recordName: recordToShow?.name,
                    databaseRank: dbRank
                  });
                  return dbRank;
                } else {
                  // Fallback: Calculate from index
                  const index = data.findIndex((r: any) => r['id'] === recordToShow.id);
                  console.log(`🔍 [NAVIGATION] Calculating recordIndex from position:`, {
                    recordId: recordToShow?.id,
                    recordName: recordToShow?.name,
                    dataLength: data.length,
                    foundIndex: index,
                    calculatedRecordIndex: index >= 0 ? index + 1 : 0,
                    firstFewRecords: data.slice(0, 3).map(r => ({ id: r.id, name: r.name, rank: r.rank }))
                  });
                  return index >= 0 ? index + 1 : 0;
                }
              })()}
              totalRecords={data.length}
              onBack={handleBack}
              onNavigatePrevious={handleNavigatePrevious}
              onNavigateNext={handleNavigateNext}
              onComplete={() => {
                console.log('Complete action for:', recordToShow?.name || recordToShow?.fullName);
                // TODO: Implement complete functionality
              }}
              onSnooze={(recordId: string, duration: string) => {
                console.log('Snooze action for:', recordId, duration);
                // TODO: Implement complete functionality
              }}
              onRecordUpdate={(updatedRecord) => {
                console.log('🔄 [PIPELINE] Updating record:', updatedRecord);
                setSelectedRecord(updatedRecord);
                
                console.log('✅ [PIPELINE] Record updated in UI');
              }}
            />
          }
          rightPanel={<AIRightPanel />}
          zoom={zoom}
          isLeftPanelVisible={isLeftPanelVisible}
          isRightPanelVisible={isRightPanelVisible}
          onToggleLeftPanel={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
          onToggleRightPanel={() => setIsRightPanelVisible(!isRightPanelVisible)}
        />

        {/* Profile Popup - Pipeline Detail Implementation */}
        {(() => {
          const shouldRender = isProfileOpen && profileAnchor;
          console.log('🔍 PipelineDetailPage (Record View) Profile popup render check:', { 
            isProfileOpen, 
            profileAnchor: !!profileAnchor,
            profileAnchorElement: profileAnchor,
            user: !!pipelineUser,
            company,
            workspace,
            shouldRender
          });
          if (shouldRender) {
            console.log('✅ PipelineDetailPage (Record View) ProfileBox SHOULD render - all conditions met');
          } else {
            console.log('❌ PipelineDetailPage (Record View) ProfileBox will NOT render:', {
              missingProfileOpen: !isProfileOpen,
              missingProfileAnchor: !profileAnchor
            });
          }
          return shouldRender;
        })() && profileAnchor && (
          <div
            style={{
              position: "fixed",
              left: profileAnchor.getBoundingClientRect().left,
              bottom: window.innerHeight - profileAnchor.getBoundingClientRect().top + 5,
              zIndex: 1000,
            }}
          >
            <ProfileBox
              user={pipelineUser}
              company={company}
              workspace={workspace}
              isProfileOpen={isProfileOpen}
              setIsProfileOpen={setIsProfileOpen}
              isSellersVisible={true}
              setIsSellersVisible={() => {}}
              isRtpVisible={isSpeedrunVisible}
              setIsRtpVisible={setIsSpeedrunVisible}
              onSpeedrunEngineClick={() => {
                console.log("Speedrun engine clicked in PipelineDetailPage (Record View)");
                setIsProfileOpen(false);
                setIsSpeedrunEngineModalOpen(true);
              }}
              isDemoMode={typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')}
            />
          </div>
        )}
        
        {/* Speedrun Engine Modal */}
        <SpeedrunEngineModal
          isOpen={isSpeedrunEngineModalOpen}
          onClose={() => setIsSpeedrunEngineModalOpen(false)}
        />
      </>
    );
  }


  // If we have data but no selected record, show the list
  // BUT only if we're not on a detail page URL (slug exists)
  if (data.length > 0 && !slug) {
    return <PipelineView section={section} />;
  }

  // Get user data from PipelineContext to match PipelineLeftPanelStandalone
  const { user: pipelineUser, company, workspace } = usePipeline();

  // If we have a selected record, show it immediately
  if (selectedRecord) {
    return (
      <>
        <RecordContextProvider>
          <PanelLayout
            thinLeftPanel={null}
            leftPanel={
              <PipelineLeftPanelStandalone 
                activeSection={section}
                onSectionChange={handleSectionChange}
                isSpeedrunVisible={isSpeedrunVisible}
                setIsSpeedrunVisible={setIsSpeedrunVisible}
                isOpportunitiesVisible={isOpportunitiesVisible}
                setIsOpportunitiesVisible={setIsOpportunitiesVisible}
              />
            }
            middlePanel={
              <UniversalRecordTemplate
                record={selectedRecord}
                recordType={section}
                recordIndex={(() => {
                  // Use rank from database if available, otherwise calculate from index
                  const dbRank = selectedRecord?.rank;
                  if (dbRank && dbRank > 0) {
                    return dbRank;
                  } else {
                    const index = data.findIndex(r => r['id'] === selectedRecord.id);
                    return index >= 0 ? index + 1 : 0;
                  }
                })()}
                totalRecords={data.length}
                onBack={() => navigateToPipeline(section)}
                onNavigatePrevious={handleNavigatePrevious}
                onNavigateNext={handleNavigateNext}
                onComplete={() => setIsSpeedrunEngineModalOpen(true)}
              />
            }
          rightPanel={<AIRightPanel />}
          zoom={zoom}
          isLeftPanelVisible={isLeftPanelVisible}
          isRightPanelVisible={isRightPanelVisible}
          onToggleLeftPanel={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
          onToggleRightPanel={() => setIsRightPanelVisible(!isRightPanelVisible)}
        />
        </RecordContextProvider>

      {/* Profile Popup - Pipeline Detail Implementation */}
      {(() => {
        const shouldRender = isProfileOpen && profileAnchor;
        console.log('🔍 PipelineDetailPage Profile popup render check:', { 
          isProfileOpen, 
          profileAnchor: !!profileAnchor,
          profileAnchorElement: profileAnchor,
          user: !!pipelineUser,
          company,
          workspace,
          shouldRender
        });
        if (shouldRender) {
          console.log('✅ PipelineDetailPage ProfileBox SHOULD render - all conditions met');
        } else {
          console.log('❌ PipelineDetailPage ProfileBox will NOT render:', {
            missingProfileOpen: !isProfileOpen,
            missingProfileAnchor: !profileAnchor
          });
        }
        return shouldRender;
      })() && profileAnchor && (
        <div
          ref={profilePopupRef}
          style={{
            position: "fixed",
            left: profileAnchor.getBoundingClientRect().left,
            bottom: window.innerHeight - profileAnchor.getBoundingClientRect().top + 5,
            zIndex: 1000,
          }}
        >
          <ProfileBox
            user={pipelineUser}
            company={company}
            workspace={workspace}
            isProfileOpen={isProfileOpen}
            setIsProfileOpen={setIsProfileOpen}
            isSellersVisible={true}
            setIsSellersVisible={() => {}}
            isRtpVisible={isSpeedrunVisible}
            setIsRtpVisible={setIsSpeedrunVisible}
            onSpeedrunEngineClick={() => {
              console.log("Speedrun engine clicked in PipelineDetailPage");
              setIsProfileOpen(false);
              setIsSpeedrunEngineModalOpen(true);
            }}
            isDemoMode={typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')}
          />
        </div>
      )}
      
      {/* Speedrun Engine Modal */}
      <SpeedrunEngineModal
        isOpen={isSpeedrunEngineModalOpen}
        onClose={() => setIsSpeedrunEngineModalOpen(false)}
      />
    </>
  );
  }

  // Fallback loading state - only show when we don't have a record and are loading
  return (
    <>
      <PanelLayout
        thinLeftPanel={null}
        leftPanel={
          <PipelineLeftPanelStandalone 
            activeSection={section}
            onSectionChange={handleSectionChange}
            isSpeedrunVisible={isSpeedrunVisible}
            setIsSpeedrunVisible={setIsSpeedrunVisible}
            isOpportunitiesVisible={isOpportunitiesVisible}
            setIsOpportunitiesVisible={setIsOpportunitiesVisible}
          />
        }
        middlePanel={
          <div className="h-full flex flex-col bg-white">
            {/* Person Detail Loading Skeleton */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Tabs Skeleton */}
            <div className="flex-shrink-0 px-6 pt-2 pb-1">
              <div className="flex items-center gap-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="flex-1 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="grid grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="text-center">
                          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        rightPanel={<AIRightPanel />}
        zoom={zoom}
        isLeftPanelVisible={isLeftPanelVisible}
        isRightPanelVisible={isRightPanelVisible}
        onToggleLeftPanel={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
        onToggleRightPanel={() => setIsRightPanelVisible(!isRightPanelVisible)}
      />
    </>
  );
}