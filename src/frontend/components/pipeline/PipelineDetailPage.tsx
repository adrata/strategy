"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { authFetch } from '@/platform/api-fetch';
import { useRouter } from 'next/navigation';
import { useWorkspaceNavigation } from '@/platform/hooks/useWorkspaceNavigation';
import { useUnifiedAuth } from '@/platform/auth';
import { useWorkspaceContext } from '@/platform/hooks/useWorkspaceContext';
import { useProfilePopup } from '@/platform/ui/components/ProfilePopupContext';
import { extractIdFromSlug } from '@/platform/utils/url-utils';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { PipelineLeftPanelStandalone } from '@/products/pipeline/components/LeftPanel';
import { RightPanel } from '@/platform/ui/components/chat/RightPanel';
// import { useZoom } from '@/platform/ui/components/ZoomProvider';
import { PipelineView } from './PipelineView';
import { UniversalRecordTemplate } from './UniversalRecordTemplate';
import { ProfileBox } from '@/platform/ui/components/ProfileBox';
import { SpeedrunEngineModal } from '@/platform/ui/components/SpeedrunEngineModal';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { usePipeline } from '@/products/pipeline/context/PipelineContext';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';
import { RecordContextProvider } from '@/platform/ui/context/RecordContextProvider';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';


interface PipelineDetailPageProps {
  section: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners' | 'sellers' | 'speedrun';
  slug: string;
  standalone?: boolean; // If true, renders with PanelLayout. If false, renders only middle panel content
}

export function PipelineDetailPage({ section, slug, standalone = false }: PipelineDetailPageProps) {
  const DEBUG_PIPELINE = process.env.NODE_ENV === 'development' && false; // Enable manually when needed
  const router = useRouter();
  const { navigateToPipeline, navigateToPipelineItem } = useWorkspaceNavigation();
  const { user } = useUnifiedAuth();
  // const { zoom } = useZoom();
  const zoom = 100; // Temporary fix - use default zoom
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [previousRecord, setPreviousRecord] = useState<any>(null);
  const [isSpeedrunVisible, setIsSpeedrunVisible] = useState(true);
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(true);
  const [isProspectsVisible, setIsProspectsVisible] = useState(true);
  const [isLeadsVisible, setIsLeadsVisible] = useState(true);
  const [isCustomersVisible, setIsCustomersVisible] = useState(false);
  const [isPartnersVisible, setIsPartnersVisible] = useState(true);
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const [directRecordLoading, setDirectRecordLoading] = useState(false);
  const [directRecordError, setDirectRecordError] = useState<string | null>(null);
  const [lastLoadAttempt, setLastLoadAttempt] = useState<string | null>(null);
  const [isSpeedrunEngineModalOpen, setIsSpeedrunEngineModalOpen] = useState(false);
  const [navigationTargetIndex, setNavigationTargetIndex] = useState<number | null>(null);
  
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
  const { isProfileOpen, setIsProfileOpen, profileAnchor, setProfileAnchor, profilePopupRef } = useProfilePopup();
  
  // Get user data from PipelineContext - MOVED TO TOP to fix hooks order violation
  const { user: pipelineUser, company, workspace } = usePipeline();
  
  // Load data for navigation - REQUIRED for navigation arrows to work
  const { data: acquisitionData } = useRevenueOS();
  
  // 🆕 CRITICAL FIX: Use real-time workspace ID from JWT token or session
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 🆕 PERFORMANCE FIX: Simplified workspace ID resolution without JWT verification
  const getCurrentWorkspaceId = useCallback(() => {
    // 1. Use acquisitionData as primary source (most reliable)
    if (acquisitionData?.auth?.authUser?.activeWorkspaceId) {
      if (DEBUG_PIPELINE) console.log(`🔍 [PIPELINE DETAIL] Got workspace ID from acquisitionData: ${acquisitionData.auth.authUser.activeWorkspaceId}`);
      return acquisitionData.auth.authUser.activeWorkspaceId;
    }
    
    // 2. Fallback to user activeWorkspaceId
    if (user?.activeWorkspaceId) {
      if (DEBUG_PIPELINE) console.log(`🔍 [PIPELINE DETAIL] Got workspace ID from user: ${user.activeWorkspaceId}`);
      return user.activeWorkspaceId;
    }
    
    // 3. Last resort: first workspace
    if (user?.workspaces?.[0]?.id) {
      if (DEBUG_PIPELINE) console.log(`🔍 [PIPELINE DETAIL] Got workspace ID from first workspace: ${user.workspaces[0].id}`);
      return user.workspaces[0].id;
    }
    
    return null;
  }, [acquisitionData?.auth?.authUser?.activeWorkspaceId, user?.activeWorkspaceId, user?.workspaces]);

  // 🆕 PERFORMANCE FIX: Update workspace ID when it changes (synchronous)
  useEffect(() => {
    const newWorkspaceId = getCurrentWorkspaceId();
    if (newWorkspaceId && newWorkspaceId !== currentWorkspaceId) {
      if (DEBUG_PIPELINE) console.log(`🔄 [PIPELINE DETAIL] Workspace ID changed: ${currentWorkspaceId} -> ${newWorkspaceId}`);
      setCurrentWorkspaceId(newWorkspaceId);
      setCurrentUserId(user?.id || null);
    }
  }, [getCurrentWorkspaceId, currentWorkspaceId, user?.id]);

  const workspaceId = currentWorkspaceId;
  // Use dynamic workspace context instead of hardcoded mappings
  const { workspaceId: contextWorkspaceId, userId: contextUserId } = useWorkspaceContext();
  
  // Use context workspace ID with fallback
  const finalWorkspaceId = contextWorkspaceId || workspaceId;
  const userId = contextUserId || user?.id;
  
  // 🚀 PERFORMANCE FIX: Load only necessary section data for navigation
  // Only load data for the current section to prevent excessive hook calls
  const currentSectionHook = useFastSectionData(section, section === 'speedrun' ? 30 : 1000);
  const { data: currentSectionData, loading: currentSectionLoading } = currentSectionHook;
  
  // Map to legacy variable names for compatibility
  const speedrunData = section === 'speedrun' ? currentSectionData : [];
  const peopleData = section === 'people' ? currentSectionData : [];
  const companiesData = section === 'companies' ? currentSectionData : [];
  const leadsData = section === 'leads' ? currentSectionData : [];
  const prospectsData = section === 'prospects' ? currentSectionData : [];
  const opportunitiesData = section === 'opportunities' ? currentSectionData : [];
  
  const speedrunLoading = section === 'speedrun' ? currentSectionLoading : false;
  const peopleLoading = section === 'people' ? currentSectionLoading : false;
  const companiesLoading = section === 'companies' ? currentSectionLoading : false;
  const leadsLoading = section === 'leads' ? currentSectionLoading : false;
  const prospectsLoading = section === 'prospects' ? currentSectionLoading : false;
  const opportunitiesLoading = section === 'opportunities' ? currentSectionLoading : false;
  
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
      sampleIds: data.slice(0, 3).map((r: any) => r.id),
      section: section,
      hasAcquisitionData: !!acquisitionData,
      acquisitionDataKeys: acquisitionData ? Object.keys(acquisitionData) : 'no acquisition data',
      // Speedrun specific debugging
      speedrunItems: acquisitionData?.acquireData?.speedrunItems?.length || 0,
      leadsCount: acquisitionData?.acquireData?.leads?.length || 0,
      prospectsCount: acquisitionData?.acquireData?.prospects?.length || 0
    });
    
    // Companies are already properly ranked by the API - no additional sorting needed
    
    return data;
  };

  // Helper function to get sortable value from record (matches PipelineContent logic)
  const getSortableValue = useCallback((record: any, field: string) => {
    switch (field) {
      case 'name':
        return (record['firstName'] && record['lastName'] ? `${record['firstName']} ${record['lastName']}` : '') || record['fullName'] || record.name || '';
      
      case 'company':
        const company = record['company'];
        let companyName = '';
        if (typeof company === 'object' && company !== null) {
          companyName = company.name || company.companyName || '';
        } else {
          companyName = company || record['companyName'] || '';
        }
        return companyName;
      
      case 'rank':
      case 'globalRank':
        // Handle rank field - prioritize winningScore.rank for alphanumeric display
        const winningRank = record.winningScore?.rank;
        const fallbackRank = record.rank || record.globalRank || record.stableIndex || 0;
        
        // Use full alphanumeric rank for display and sorting
        if (winningRank && typeof winningRank === 'string') {
          // For sorting alphanumeric ranks (1A, 1B, 2A, 2B, etc.)
          const numMatch = winningRank.match(/^(\d+)([A-Z])$/);
          if (numMatch) {
            const companyRank = parseInt(numMatch[1], 10);
            const prospectLetter = numMatch[2];
            // Convert to sortable number: Company rank * 100 + letter position
            // 1A = 100, 1B = 101, 2A = 200, 2B = 201, etc.
            const letterValue = prospectLetter.charCodeAt(0) - 64; // A=1, B=2, C=3
            return companyRank * 100 + letterValue;
          }
        }
        
        // Fallback for numeric ranks
        if (typeof fallbackRank === 'string') {
          const numMatch = fallbackRank.match(/^(\d+)/);
          return numMatch?.[1] ? parseInt(numMatch[1], 10) : 0;
        }
        return typeof fallbackRank === 'number' ? fallbackRank : 0;
      
      case 'lastContact':
      case 'lastContactDate':
      case 'lastAction':
        const dateValue = record.lastContact || record.lastContactDate || record.lastAction || record.updatedAt;
        if (dateValue) {
          return new Date(dateValue);
        }
        return new Date(0);
      
      default:
        return record[field] || '';
    }
  }, []);

  // 🚀 NAVIGATION FIX: Get navigation data using fast section data for proper record indexing
  const getNavigationData = (section: string) => {
    console.log(`🔍 [NAVIGATION DATA] Getting navigation data for section ${section}:`, {
      section,
      hasPeopleData: !!peopleData,
      peopleDataLength: peopleData?.length || 0,
      hasCompaniesData: !!companiesData,
      companiesDataLength: companiesData?.length || 0,
      hasLeadsData: !!leadsData,
      leadsDataLength: leadsData?.length || 0,
      hasProspectsData: !!prospectsData,
      prospectsDataLength: prospectsData?.length || 0,
      hasSpeedrunData: !!speedrunData,
      speedrunDataLength: speedrunData?.length || 0
    });
    
    let data = [];
    switch (section) {
      case 'people': data = peopleData || []; break;
      case 'companies': data = companiesData || []; break;
      case 'leads': data = leadsData || []; break;
      case 'prospects': data = prospectsData || []; break;
      case 'opportunities': data = opportunitiesData || []; break;
      case 'speedrun': data = speedrunData || []; break;
      default: data = getSectionData(section); break;
    }
    
    console.log(`🔍 [NAVIGATION DATA] Navigation data for ${section}:`, {
      dataLength: data.length,
      firstRecord: data[0] ? { id: data[0].id, name: data[0].name } : 'no records',
      sampleIds: data.slice(0, 3).map((r: any) => r.id)
    });
    
    return data;
  };
  
  // 🚀 NAVIGATION FIX: Use fast section data for navigation for all sections
  const rawData = getNavigationData(section);

  // 🎯 FIX: Sort navigation data to match list view order
  // Default sort: leads by rank descending (highest rank first), prospects by lastContactDate ascending
  const sortedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return rawData;

    // Determine default sort field and direction based on section (matching PipelineContent defaults)
    const defaultSortField = section === 'prospects' ? 'lastContactDate' : 'rank';
    const defaultSortDirection = section === 'prospects' ? 'asc' : 'desc';

    // Sort the data to match list view order
    const sorted = [...rawData].sort((a: any, b: any) => {
      let aVal = getSortableValue(a, defaultSortField);
      let bVal = getSortableValue(b, defaultSortField);

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return defaultSortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return defaultSortDirection === 'asc' ? -1 : 1;

      // Convert to comparable values
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      // Handle numeric values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return defaultSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle date values
      if (aVal instanceof Date && bVal instanceof Date) {
        return defaultSortDirection === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
      }

      // String comparison
      if (aVal < bVal) return defaultSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return defaultSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    console.log(`🔧 [NAVIGATION SORT] Sorted ${section} data:`, {
      section,
      sortField: defaultSortField,
      sortDirection: defaultSortDirection,
      dataLength: sorted.length,
      firstRecord: sorted[0] ? { id: sorted[0].id, name: sorted[0].name || sorted[0].fullName, rank: sorted[0].rank || sorted[0].globalRank } : 'no records',
      sampleIds: sorted.slice(0, 5).map((r: any) => ({ id: r.id, name: r.name || r.fullName, rank: r.rank || r.globalRank }))
    });

    return sorted;
  }, [rawData, section, getSortableValue]);

  // Use sorted data for navigation
  const data = sortedData;
  
  // 🚀 DEBUG: Log navigation data for all sections
  console.log(`🔍 [NAVIGATION DEBUG] Navigation data for ${section}:`, {
    section,
    dataLength: data.length,
    selectedRecordId: selectedRecord?.id,
    selectedRecordName: selectedRecord?.name,
    dataFirstRecord: data[0] ? { id: data[0].id, name: data[0].name } : 'no records',
    // Section-specific data
    peopleDataLength: peopleData?.length || 0,
    companiesDataLength: companiesData?.length || 0,
    leadsDataLength: leadsData?.length || 0,
    prospectsDataLength: prospectsData?.length || 0,
    speedrunDataLength: speedrunData?.length || 0,
    // Loading states
    peopleLoading,
    companiesLoading,
    leadsLoading,
    prospectsLoading,
    speedrunLoading
  });
  
  // Direct record loading function for when accessed via URL
  const loadDirectRecord = useCallback(async (recordId: string) => {
    if (!recordId || directRecordLoading) return;
    
    // 🔧 FIX: Skip refetching if record was just updated (within 2 seconds)
    // This prevents overwriting recent updates with stale data from refetch
    if (typeof window !== 'undefined') {
      const updateTimestamp = sessionStorage.getItem(`record-updated-${recordId}`);
      if (updateTimestamp) {
        const timeSinceUpdate = Date.now() - parseInt(updateTimestamp, 10);
        if (timeSinceUpdate < 2000) {
          console.log(`🔄 [SKIP REFETCH] Record ${recordId} was updated ${timeSinceUpdate}ms ago, skipping refetch to preserve update`);
          // Clear the timestamp after checking
          sessionStorage.removeItem(`record-updated-${recordId}`);
          return;
        }
        // Clear old timestamp if more than 2 seconds have passed
        sessionStorage.removeItem(`record-updated-${recordId}`);
      }
    }
    
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
    if (directRecordError && (directRecordError.includes('Record not found') || directRecordError.includes('Speedrun record not found'))) {
      console.log(`🚫 [DIRECT LOAD] Skipping retry for non-existent record: ${recordId}`);
      return;
    }
    
    // 🎯 CRITICAL FIX: Check for force-refresh flags FIRST before ANY cache checks
    // This ensures saved changes are fetched fresh instead of serving stale cached data
    let shouldSkipAllCaches = false;
    
    if (typeof window !== 'undefined') {
      const forceRefreshKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('force-refresh-') && (key.includes(section) || key.includes(recordId))
      );
      
      console.log(`🔍 [loadDirectRecord] Checking for force-refresh flags:`, {
        section,
        recordId,
        allSessionStorageKeys: Object.keys(sessionStorage).filter(key => key.startsWith('force-refresh-')),
        matchingKeys: forceRefreshKeys
      });
      
      if (forceRefreshKeys.length > 0) {
        console.log(`🔄 [loadDirectRecord] Force refresh detected, clearing flags and ALL session caches:`, {
          section,
          recordId,
          forceRefreshKeys
        });
        
        // Clear the force-refresh flags
        forceRefreshKeys.forEach(key => sessionStorage.removeItem(key));
        
        // 🚀 CRITICAL: Also clear the optimized caches that might have stale data
        sessionStorage.removeItem(`current-record-${section}`);
        sessionStorage.removeItem(`cached-${section}-${recordId}`);
        
        console.log(`🗑️ [loadDirectRecord] Cleared session caches for section ${section} and record ${recordId}`);
        
        // Set flag to skip ALL cache checks and go directly to API
        shouldSkipAllCaches = true;
      }
    }
    
    console.log(`🔄 [loadDirectRecord] shouldSkipAllCaches: ${shouldSkipAllCaches}`);
    
    // Only check caches if NO force-refresh flags were detected
    if (!shouldSkipAllCaches) {
      // 🚀 CACHE VERSIONING: Check version-based staleness first
      const versionKey = `edit-version-${section}-${recordId}`;
      const currentVersion = parseInt(sessionStorage.getItem(versionKey) || '0', 10);
      
      // Check the optimized cache first
      const currentRecord = sessionStorage.getItem(`current-record-${section}`);
      if (currentRecord) {
        try {
          const { id, data, timestamp, version: cachedVersion } = JSON.parse(currentRecord);
          const cacheAge = Date.now() - timestamp;
          const isStaleByTime = cacheAge > 30000; // 30 seconds threshold
          const isStaleByVersion = cachedVersion !== undefined && cachedVersion < currentVersion;
          const isStale = isStaleByTime || isStaleByVersion;
          
            console.log(`🔍 [CACHE CHECK] Optimized cache:`, {
              recordId: id,
              targetId: recordId,
              cacheAge: `${Math.round(cacheAge / 1000)}s`,
              currentVersion,
              cachedVersion,
              isStaleByTime,
              isStaleByVersion,
              isStale,
              willUseCache: id === recordId && !isStale,
              dataKeys: Object.keys(data || {}).length,
              legalName: data?.legalName,
              localName: data?.localName,
              tradingName: data?.tradingName,
              description: data?.description,
              website: data?.website,
              phone: data?.phone
            });
          
          if (id === recordId && !isStale) {
            console.log(`⚡ [INSTANT LOAD] Found fresh record in optimized cache - instant loading:`, data.name || data.fullName || recordId);
            console.log(`🔍 [INSTANT LOAD DEBUG] Cached data:`, {
              legalName: data?.legalName,
              localName: data?.localName,
              tradingName: data?.tradingName,
              description: data?.description,
              phone: data?.phone
            });
            setSelectedRecord(data);
            console.log(`✅ [INSTANT LOAD] Record set from optimized cache: ${data.name || data.id}`);
            return;
          } else if (isStaleByVersion) {
            console.log(`🔄 [CACHE CHECK] Cache version is stale (${cachedVersion} < ${currentVersion}), fetching fresh data`);
          } else if (isStaleByTime) {
            console.log(`🔄 [CACHE CHECK] Cache is stale (${Math.round(cacheAge / 1000)}s old), fetching fresh data`);
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
          const recordAge = record.updatedAt ? Date.now() - new Date(record.updatedAt).getTime() : 0;
          const isStaleByTime = recordAge > 30000; // 30 seconds threshold
          const isStaleByVersion = currentVersion > 0; // If we have edits, this cache is definitely stale
          const isStale = isStaleByTime || isStaleByVersion;
          
          console.log(`🔍 [CACHE CHECK] SessionStorage cache:`, {
            recordId: record.id,
            targetId: recordId,
            recordAge: `${Math.round(recordAge / 1000)}s`,
            currentVersion,
            isStaleByTime,
            isStaleByVersion,
            isStale,
            willUseCache: record.id === recordId && !isStale
          });
          
          if (record.id === recordId && !isStale) {
            console.log(`⚡ [INSTANT LOAD] Found fresh record in sessionStorage - instant loading:`, record.name || record.fullName || recordId);
            setSelectedRecord(record);
            console.log(`✅ [INSTANT LOAD] Record set from sessionStorage: ${record.name || record.id}`);
            return;
          } else if (isStaleByVersion) {
            console.log(`🔄 [CACHE CHECK] SessionStorage cache is stale due to version (${currentVersion} > 0), fetching fresh data`);
          } else if (isStaleByTime) {
            console.log(`🔄 [CACHE CHECK] SessionStorage cache is stale (${Math.round(recordAge / 1000)}s old), fetching fresh data`);
          }
        } catch (error) {
          console.warn('Failed to parse cached record:', error);
        }
      }
    }
    
    // 🎯 SECOND: Try to find record in already-loaded data (no API call needed)
    // Note: Skip this if force-refresh flags were detected (shouldSkipAllCaches = true)
    if (!shouldSkipAllCaches) {
      const allData = acquisitionData?.acquireData || acquisitionData || {};
      const sectionData = allData[section] || [];
      
      const existingRecord = sectionData.find((record: any) => record['id'] === recordId);
      if (existingRecord) {
        console.log(`⚡ [SMART LOAD] Found record in acquisition data - no API call needed:`, existingRecord.name || existingRecord.fullName || recordId);
        setSelectedRecord(existingRecord);
        console.log(`✅ [SMART LOAD] Record set from acquisition data: ${existingRecord.name || existingRecord.id}`);
        return;
      }
    } else {
      console.log(`🔄 [DIRECT LOAD] Skipping acquisition data check due to force-refresh flags - fetching fresh from API`);
    }

    // 🎯 FALLBACK: Only make API call if record not found in cache
    setDirectRecordLoading(true);
    setDirectRecordError(null);
    
    try {
      // 🚀 PERFORMANCE: Check pre-fetched cache first for instant loading
      const cacheKey = `adrata-record-${section}-${recordId}`;
      const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
      
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const RECORD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
          const cacheAge = Date.now() - (parsed.ts || 0);
          
          if (parsed.data && parsed.ts && cacheAge < RECORD_CACHE_TTL) {
            console.log(`⚡ [CACHE HIT] Loaded ${section} record ${recordId} from pre-fetched cache (${Math.round(cacheAge)}ms old)`);
            setSelectedRecord(parsed.data);
            setDirectRecordLoading(false);
            return;
          }
        } catch (e) {
          // Invalid cache, proceed with API call
          console.warn(`⚠️ [CACHE] Invalid cache format, fetching from API:`, e);
        }
      }
      
      console.log(`🔍 [DIRECT LOAD] Record not in cache, loading ${section} record directly: ${recordId}`);
      
      // ⚡ PERFORMANCE MONITORING: Track API call timing
      const startTime = performance.now();
      
      // 🚀 FAST INITIAL LOAD: Load record using v1 APIs
      const timestamp = Date.now();
      let response: Response;
      let record: any;
      
      // Use appropriate v1 API based on section
      if (section === 'companies' || section === 'opportunities') {
        // Opportunities are companies
        response = await fetch(`/api/v1/companies/${recordId}`, {
          credentials: 'include'
        });
      } else if (section === 'people' || section === 'leads' || section === 'prospects' || section === 'speedrun') {
        // First try the people API
        response = await fetch(`/api/v1/people/${recordId}`, {
          credentials: 'include'
        });
        
        // If 404, this might be a company-only record, try companies API
        if (!response.ok && response.status === 404) {
          console.log(`🔍 [DIRECT LOAD] People API returned 404, trying companies API for record: ${recordId}`);
          response = await fetch(`/api/v1/companies/${recordId}`, {
            credentials: 'include'
          });
        }
      } else {
        // For other record types, throw error since unified API is no longer available
        throw new Error(`Record type '${section}' is not yet supported in v1 APIs. Please use companies or people records.`);
      }
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`⚡ [PERFORMANCE] v1 API call took ${loadTime.toFixed(2)}ms for ${section} record: ${recordId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // 🚀 GRACEFUL 404 HANDLING: Try to find record in data array before throwing error
          console.log(`⚠️ [DIRECT LOAD] 404 error, checking if record exists in data array:`, {
            recordId,
            section,
            dataLength: data.length,
            dataIds: data.slice(0, 5).map((r: any) => r.id)
          });
          
          // Try to find the record in the current data array
          const recordInData = data.find((r: any) => r.id === recordId);
          if (recordInData) {
            console.log(`✅ [DIRECT LOAD] Found record in data array, using cached data:`, {
              id: recordInData.id,
              name: recordInData.name || recordInData.fullName
            });
            setSelectedRecord(recordInData);
            return; // Use cached data instead of throwing error
          }
          
          // If not found in data array, check if we're navigating and should skip to next available record
          console.log(`❌ [DIRECT LOAD] Record not found in API or data array:`, {
            recordId,
            section,
            navigationTargetIndex
          });
          
          // If we're navigating and the record doesn't exist, try to find the next valid record
          if (navigationTargetIndex !== null && data.length > 0) {
            const targetIndex = Math.min(navigationTargetIndex, data.length - 1);
            const fallbackRecord = data[targetIndex];
            if (fallbackRecord && fallbackRecord.id !== recordId) {
              console.log(`🔄 [DIRECT LOAD] Navigating to fallback record at index ${targetIndex}:`, {
                fallbackId: fallbackRecord.id,
                fallbackName: fallbackRecord.name || fallbackRecord.fullName
              });
              const recordName = fallbackRecord.fullName || fallbackRecord.name || fallbackRecord.firstName || 'record';
              navigateToPipelineItem(section, fallbackRecord.id, recordName);
              return;
            }
          }
          
          // Last resort: throw error
          throw new Error(`Record not found. It may have been deleted or moved to a different workspace.`);
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ [DIRECT LOAD] Failed to load record:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: response.url,
          section,
          recordId
        });
        throw new Error(`Failed to load ${section} record: ${response.status} ${response.statusText || errorText}`);
      }
      
      const result = await response.json();
      
      if (result['success'] && result.data) {
        // For v1 APIs, the data is directly in result.data
        if (section === 'companies' || section === 'people' || section === 'leads' || section === 'prospects' || section === 'opportunities' || section === 'speedrun') {
          record = result.data;
          
          // 🚀 PERFORMANCE: Cache the fetched record for future instant loading
          if (typeof window !== 'undefined' && record) {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: record,
              ts: Date.now(),
              version: 1
            }));
          }
        } else {
          // Fallback for unified API response format
          const sectionData = result['data'][section] || [];
          console.log(`🔍 [DIRECT LOAD] Looking for record ${recordId} in ${sectionData.length} ${section} records`);
          record = sectionData.find((r: any) => r['id'] === recordId);
          
          // Cache if found
          if (typeof window !== 'undefined' && record) {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: record,
              ts: Date.now(),
              version: 1
            }));
          }
        }
        
        if (record) {
          console.log(`✅ [DIRECT LOAD] Successfully loaded ${section} record from v1 API:`, {
            id: record.id,
            name: record.name || record.fullName,
            description: record.description ? 'Yes' : 'No',
            website: record.website ? 'Yes' : 'No',
            source: 'v1_api'
          });
          
          // Cache the record for future use
          if (typeof window !== 'undefined') {
            const currentVersion = parseInt(sessionStorage.getItem(`edit-version-${section}-${recordId}`) || '0', 10);
            sessionStorage.setItem(`cached-${section}-${recordId}`, JSON.stringify(record));
            sessionStorage.setItem(`current-record-${section}`, JSON.stringify({ id: recordId, data: record, timestamp: Date.now(), version: currentVersion }));
            console.log(`💾 [CACHE] Cached ${section} record for future instant loading with version ${currentVersion}`);
          }
          
          setSelectedRecord(record);
          console.log(`✅ [DIRECT LOAD] Updated selectedRecord state with fresh API data:`, {
            id: record.id,
            name: record.name,
            tradingName: record.tradingName,
            description: record.description,
            updatedAt: record.updatedAt,
            allFields: Object.keys(record).length
          });
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
  
  // 🚀 SPEEDRUN RECORD FIX: For speedrun records, find the current record in the speedrun data array
  // instead of loading it separately to ensure navigation works correctly
  useEffect(() => {
    if (section === 'speedrun' && speedrunData && speedrunData.length > 0 && slug) {
      // Extract the record ID from the slug
      const recordId = extractIdFromSlug(slug);
      
      // 🔧 VALIDATION: Check if extracted ID is valid
      if (!recordId || recordId === 'undefined' || recordId === 'null' || recordId.trim() === '') {
        console.error(`❌ [SPEEDRUN RECORD] Invalid record ID extracted from slug:`, {
          slug,
          extractedId: recordId
        });
        return;
      }
      
      // Only update if the selected record doesn't match the current slug
      if (selectedRecord?.id !== recordId) {
        console.log('🔍 [SPEEDRUN RECORD] Finding current record in speedrun data array:', {
          slug,
          recordId,
          selectedRecordId: selectedRecord?.id,
          speedrunDataLength: speedrunData.length,
          lookingForId: recordId
        });
        
        const currentRecord = speedrunData.find((record: any) => record.id === recordId);
        if (currentRecord) {
          console.log('✅ [SPEEDRUN RECORD] Found current record in speedrun data:', {
            id: currentRecord.id,
            name: currentRecord.name || currentRecord.fullName
          });
          setSelectedRecord(currentRecord);
        } else {
          console.log('❌ [SPEEDRUN RECORD] Current record not found in speedrun data, falling back to direct load');
          // Fallback to direct loading if not found in speedrun data
          if (recordId && !directRecordLoading) {
            loadDirectRecord(recordId);
          }
        }
      } else {
        console.log('🔄 [SPEEDRUN RECORD] Record already matches current selection, skipping update:', {
          recordId,
          selectedRecordId: selectedRecord?.id
        });
      }
    }
  }, [section, speedrunData, selectedRecord, slug, directRecordLoading, loadDirectRecord]); // Added loadDirectRecord to dependencies
  
  // Debug speedrun data loading
  if (section === 'speedrun') {
    console.log('🔍 [SPEEDRUN NAVIGATION] Speedrun data for navigation:', {
      speedrunDataLength: speedrunData?.length || 0,
      speedrunLoading,
      section,
      workspaceId,
      userId,
      firstRecord: speedrunData?.[0] ? { id: speedrunData[0].id, name: speedrunData[0].name } : 'no records'
    });
  }
  
  // 🚀 MODERN 2025: Unified loading state - use acquisition data loading OR direct record loading OR transitions
  // For speedrun records, don't show loading if we have the record from speedrun data
  const loading = acquisitionData.isLoading || directRecordLoading || isTransitioning || (section === 'speedrun' && speedrunLoading && !selectedRecord);
  const error = acquisitionData.error || directRecordError;
  
  console.log(`🔍 [LOADING STATE] Loading states:`, {
    acquisitionDataLoading: acquisitionData.isLoading,
    directRecordLoading,
    isTransitioning,
    totalLoading: loading,
    hasError: !!error,
    errorMessage: error
  });

  // 🔍 BLANK PAGE FIX: Fallback to find record in data array if not loaded yet
  useEffect(() => {
    if (!slug || selectedRecord || directRecordLoading || loading) return;
    
    const recordId = extractIdFromSlug(slug);
    if (!recordId || recordId === 'undefined' || recordId === 'null' || recordId.trim() === '') return;
    
    // Try to find the record in the data array
    const recordInData = data.find((r: any) => r.id === recordId);
    if (recordInData) {
      console.log(`✅ [BLANK PAGE FIX] Found record in data array, using it as fallback:`, {
        recordId,
        recordName: recordInData.name || recordInData.fullName,
        dataLength: data.length
      });
      setSelectedRecord(recordInData);
    }
  }, [slug, selectedRecord, directRecordLoading, loading, data, section]);

  useEffect(() => {
    if (!slug) return;

    // Extract ID from slug
    const recordId = extractIdFromSlug(slug);
    
    // 🔧 VALIDATION: Check if extracted ID is valid
    if (!recordId || recordId === 'undefined' || recordId === 'null' || recordId.trim() === '') {
      console.error(`❌ [RECORD LOADING] Invalid record ID extracted from slug:`, {
        slug,
        extractedId: recordId,
        section
      });
      setDirectRecordError(`Invalid ${section} ID in URL. Please check the link and try again.`);
      return;
    }
    
    console.log(`🔍 [RECORD LOADING] Slug: ${slug}, Extracted ID: ${recordId}`, {
      hasSelectedRecord: !!selectedRecord,
      selectedRecordId: selectedRecord?.id,
      directRecordLoading,
      dataLength: data.length
    });

    // 🚀 INDUSTRY BEST PRACTICE: Always call loadDirectRecord when navigating to a record
    // This ensures fresh data is always fetched, with proper caching handled inside loadDirectRecord
    // No more complex sessionStorage flag management with race conditions
    if (directRecordLoading) {
      console.log(`🔄 [RECORD LOADING] Already loading record: ${recordId}`);
      return;
    }
    
    // Always call loadDirectRecord - it will handle caching and force-refresh logic internally
    console.log(`🔄 [RECORD LOADING] Loading record: ${recordId} (always fresh)`);
    loadDirectRecord(recordId);
    return; // Exit early - loadDirectRecord handles everything
  }, [slug, section, data.length, selectedRecord?.id, loadDirectRecord, setDirectRecordError]); // 🚀 FIX: Added loadDirectRecord to dependencies

  // Handle section navigation
  const handleSectionChange = (newSection: string) => {
    // Clear selected record when navigating to a different section or same section (to go back to list)
    if (selectedRecord) {
      setSelectedRecord(null);
    }
    navigateToPipeline(newSection);
  };

  // Handle back navigation
  const handleBack = () => {
    // Check if we're in a complex nested route (like buyer-group with person parameter)
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
    
    console.log('🔍 [BACK NAVIGATION] Current path:', currentPath, 'Search:', currentSearch);
    
    // If we're in a buyer-group route with a person parameter, navigate back to the buyer group
    if (currentPath.includes('/buyer-group') && currentSearch.includes('person=')) {
      console.log('🔍 [BACK NAVIGATION] Detected buyer-group with person, navigating back to buyer group');
      // Remove the person parameter to go back to the buyer group
      const newUrl = currentPath; // Keep the same path, just remove the person parameter
      router.push(newUrl);
      return;
    }
    
    // For person-related sections, navigate to their respective list views
    if (section === 'people') {
      console.log('🔍 [BACK NAVIGATION] Navigating to people list');
      navigateToPipeline('people');
      return;
    }
    
    if (section === 'leads') {
      console.log('🔍 [BACK NAVIGATION] Navigating to leads list');
      navigateToPipeline('leads');
      return;
    }
    
    if (section === 'prospects') {
      console.log('🔍 [BACK NAVIGATION] Navigating to prospects list');
      navigateToPipeline('prospects');
      return;
    }
    
    if (section === 'opportunities') {
      console.log('🔍 [BACK NAVIGATION] Navigating to opportunities list');
      navigateToPipeline('opportunities');
      return;
    }
    
    if (section === 'speedrun') {
      console.log('🔍 [BACK NAVIGATION] Navigating to speedrun list');
      navigateToPipeline('speedrun');
      return;
    }
    
    if (section === 'companies') {
      console.log('🔍 [BACK NAVIGATION] Navigating to companies list');
      navigateToPipeline('companies');
      return;
    }
    
    // Default behavior for other sections
    navigateToPipeline(section);
  };

  // Navigation functions for record detail view - FIXED to work like the back arrow (URL-based)
  const handleNavigatePrevious = useCallback(() => {
    console.log(`🔍 [NAVIGATION] handleNavigatePrevious called for ${section}:`, {
      hasData: !!data,
      dataLength: data?.length,
      hasSelectedRecord: !!selectedRecord,
      selectedRecordId: selectedRecord?.id,
      selectedRecordName: selectedRecord?.name,
      dataFirstRecord: data[0] ? { id: data[0].id, name: data[0].name } : 'no records',
      dataLastRecord: data[data.length - 1] ? { id: data[data.length - 1].id, name: data[data.length - 1].name } : 'no records'
    });
    
    if (!data || !selectedRecord) {
      console.log(`❌ [NAVIGATION] Cannot navigate - missing data or selectedRecord`);
      return;
    }
    
    const currentIndex = data.findIndex((r: any) => r['id'] === selectedRecord.id);
    console.log(`🔍 [NAVIGATION] Current index in data:`, currentIndex);
    
    if (currentIndex < 0) {
      console.log(`⚠️ [NAVIGATION] Current record not found in data array, cannot navigate`);
      return;
    }
    
    if (currentIndex > 0) {
      // Find the previous valid record (skip any that might be invalid)
      let prevIndex = currentIndex - 1;
      let previousRecord = data[prevIndex];
      
      // Skip records that don't have valid IDs
      while (previousRecord && (!previousRecord.id || previousRecord.id === 'undefined' || previousRecord.id === 'null')) {
        prevIndex--;
        if (prevIndex < 0) {
          console.log(`❌ [NAVIGATION] No valid previous record found`);
          return;
        }
        previousRecord = data[prevIndex];
      }
      
      if (!previousRecord || !previousRecord.id) {
        console.log(`❌ [NAVIGATION] Invalid previous record at index ${prevIndex}`);
        return;
      }
      
      console.log(`✅ [NAVIGATION] Going to previous record:`, {
        from: selectedRecord.id,
        to: previousRecord.id,
        fromIndex: currentIndex,
        toIndex: prevIndex,
        recordName: previousRecord.name || previousRecord.fullName
      });
      
      // 🎯 FIX: Set navigation target index BEFORE navigation to prevent count flash
      setNavigationTargetIndex(prevIndex);
      
      // Navigate to the previous record using URL (like the back arrow does)
      const recordName = previousRecord.fullName || previousRecord.name || previousRecord.firstName || 'record';
      navigateToPipelineItem(section, previousRecord.id, recordName);
    } else {
      console.log(`❌ [NAVIGATION] Cannot go previous - already at first record (index: ${currentIndex})`);
    }
  }, [data, selectedRecord, section, navigateToPipelineItem]);

  const handleNavigateNext = useCallback(() => {
    console.log(`🔍 [NAVIGATION] handleNavigateNext called for ${section}:`, {
      hasData: !!data,
      dataLength: data?.length,
      hasSelectedRecord: !!selectedRecord,
      selectedRecordId: selectedRecord?.id,
      selectedRecordName: selectedRecord?.name,
      dataFirstRecord: data[0] ? { id: data[0].id, name: data[0].name } : 'no records',
      dataLastRecord: data[data.length - 1] ? { id: data[data.length - 1].id, name: data[data.length - 1].name } : 'no records'
    });
    
    if (!data || !selectedRecord) {
      console.log(`❌ [NAVIGATION] Cannot navigate - missing data or selectedRecord`);
      return;
    }
    
    const currentIndex = data.findIndex((r: any) => r['id'] === selectedRecord.id);
    console.log(`🔍 [NAVIGATION] Current index in data:`, currentIndex);
    
    if (currentIndex < 0) {
      console.log(`⚠️ [NAVIGATION] Current record not found in data array, cannot navigate`);
      return;
    }
    
    if (currentIndex < data.length - 1) {
      // Find the next valid record (skip any that might be invalid)
      let nextIndex = currentIndex + 1;
      let nextRecord = data[nextIndex];
      
      // Skip records that don't have valid IDs
      while (nextRecord && (!nextRecord.id || nextRecord.id === 'undefined' || nextRecord.id === 'null')) {
        nextIndex++;
        if (nextIndex >= data.length) {
          console.log(`❌ [NAVIGATION] No valid next record found`);
          return;
        }
        nextRecord = data[nextIndex];
      }
      
      if (!nextRecord || !nextRecord.id) {
        console.log(`❌ [NAVIGATION] Invalid next record at index ${nextIndex}`);
        return;
      }
      
      console.log(`✅ [NAVIGATION] Going to next record:`, {
        from: selectedRecord.id,
        to: nextRecord.id,
        fromIndex: currentIndex,
        toIndex: nextIndex,
        recordName: nextRecord.name || nextRecord.fullName
      });
      
      // 🎯 FIX: Set navigation target index BEFORE navigation to prevent count flash
      setNavigationTargetIndex(nextIndex);
      
      // Navigate to the next record using URL (like the back arrow does)
      const recordName = nextRecord.fullName || nextRecord.name || nextRecord.firstName || 'record';
      navigateToPipelineItem(section, nextRecord.id, recordName);
    } else {
      console.log(`❌ [NAVIGATION] Cannot go next - already at last record (index: ${currentIndex}, total: ${data.length})`);
    }
  }, [data, selectedRecord, section, navigateToPipelineItem]);

  // 🎯 FIX: Clear navigation target when record loads to prevent stale state
  useEffect(() => {
    if (selectedRecord && navigationTargetIndex !== null) {
      // Verify the loaded record matches our expectation
      const actualIndex = data.findIndex((r: any) => r.id === selectedRecord.id);
      if (actualIndex >= 0) {
        console.log(`🔍 [NAVIGATION CLEANUP] Clearing navigation target:`, {
          selectedRecordId: selectedRecord.id,
          actualIndex,
          navigationTargetIndex,
          recordName: selectedRecord.name || selectedRecord.fullName
        });
        setNavigationTargetIndex(null); // Clear once loaded
      }
    }
  }, [selectedRecord, navigationTargetIndex, data]);

  // 🚀 LOADING SKELETON: Show skeleton during navigation transitions for better UX
  if (loading && !selectedRecord && !previousRecord) {
    return <CompanyDetailSkeleton message="Loading record details..." />;
  }

  // ⚠️ ERROR HANDLING: Show error message if record loading failed
  if (directRecordError && !selectedRecord && !previousRecord && slug) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-error/10 border border-error text-error px-6 py-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-2">Failed to Load Record</h3>
            <p className="text-sm mb-4">{directRecordError}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setDirectRecordError(null);
                  const recordId = extractIdFromSlug(slug);
                  loadDirectRecord(recordId);
                }}
                className="px-4 py-2 bg-error text-white rounded hover:bg-error/90 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={handleBack}
                className="px-4 py-2 bg-background border border-border text-foreground rounded hover:bg-hover transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show record details if found (or use previous record as fallback during transitions)
  // 🚫 FALLBACK: Create a basic record if none found to prevent infinite loading
  if (selectedRecord || (previousRecord && slug)) {
    const recordToShow = selectedRecord || previousRecord;
    
    // Get user data from PipelineContext to match PipelineLeftPanelStandalone
    // Note: pipelineUser, company, workspace are now available from the top-level hook call
    
    // Create the middle panel content (record template)
    const middlePanelContent = (
      <UniversalRecordTemplate
        record={recordToShow}
        recordType={section as any}
        recordIndex={(() => {
          // 🎯 FIX: Use navigation target index if set to prevent count flash during transitions
          if (navigationTargetIndex !== null) {
            const targetIndex = navigationTargetIndex + 1; // +1 for 1-based display
            console.log(`🔍 [NAVIGATION TARGET] Using target index:`, {
              navigationTargetIndex,
              targetIndex,
              recordId: recordToShow?.id,
              recordName: recordToShow?.name
            });
            return targetIndex;
          }
          
          // 🚀 SPEEDRUN FIX: For speedrun records, use countdown rank (N-1) format
          // Data is sorted by globalRank descending (50-1), so we need countdown format
          if (section === 'speedrun') {
            const index = data.findIndex((r: any) => r['id'] === recordToShow.id);
            // Use countdown format: totalRecords - index (50, 49, 48... 3, 2, 1)
            const recordIndex = index >= 0 ? data.length - index : (recordToShow?.globalRank || recordToShow?.rank || 1);
            console.log(`🔍 [SPEEDRUN NAVIGATION] Using countdown rank:`, {
              recordId: recordToShow?.id,
              recordName: recordToShow?.name,
              dataLength: data.length,
              foundIndex: index,
              calculatedRecordIndex: recordIndex,
              recordGlobalRank: recordToShow?.globalRank,
              recordRank: recordToShow?.rank,
              dataSample: data.slice(0, 3).map((r: any) => ({ id: r.id, name: r.name, rank: r.rank }))
            });
            return recordIndex;
          } else {
            // For other sections, always use sequential position like speedrun for consistent navigation
            const index = data.findIndex((r: any) => r['id'] === recordToShow.id);
            const recordIndex = index >= 0 ? index + 1 : 1;
            console.log(`🔍 [NAVIGATION] Using sequential position for ${section}:`, {
              recordId: recordToShow?.id,
              recordName: recordToShow?.name,
              dataLength: data.length,
              foundIndex: index,
              calculatedRecordIndex: recordIndex,
              dataSample: data.slice(0, 3).map((r: any) => ({ id: r.id, name: r.name }))
            });
            return recordIndex;
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
        onRecordUpdate={async (updatedRecord) => {
          console.log('🔄 [PIPELINE] Updating record:', updatedRecord);
          console.log('🔍 [PIPELINE DEBUG] onRecordUpdate called for section:', section, 'recordType:', updatedRecord?.recordType || 'unknown');
          
          // 🔧 FIX: Track update timestamp for all updates to prevent refetch from overwriting
          if (updatedRecord?.id && typeof window !== 'undefined') {
            sessionStorage.setItem(`record-updated-${updatedRecord.id}`, Date.now().toString());
          }
          
          // Check if status changed and determine new section
          const newStatus = updatedRecord?.status || updatedRecord?.stage;
          const oldStatus = selectedRecord?.status || selectedRecord?.stage;
          
          // Determine target section based on status
          const getSectionFromStatus = (status: string): string => {
            if (!status) return section; // Default to current section
            const statusUpper = status.toUpperCase();
            if (statusUpper === 'LEAD') return 'leads';
            if (statusUpper === 'PROSPECT') return 'prospects';
            if (statusUpper === 'OPPORTUNITY') return 'opportunities';
            if (statusUpper === 'CLIENT' || statusUpper === 'CUSTOMER' || statusUpper === 'SUPERFAN') return 'clients';
            return section; // Default to current section
          };
          
          const newSection = getSectionFromStatus(newStatus);
          const statusChanged = newStatus && oldStatus && newStatus.toUpperCase() !== oldStatus.toUpperCase();
          const sectionChanged = newSection !== section;
          
          console.log('🔍 [PIPELINE] Status change detection:', {
            oldStatus,
            newStatus,
            oldSection: section,
            newSection,
            statusChanged,
            sectionChanged
          });
          
          // Update selected record
          setSelectedRecord(updatedRecord);
          
          // If status changed and section changed, navigate to new section
          if (statusChanged && sectionChanged) {
            console.log(`🔄 [PIPELINE] Status changed from ${oldStatus} to ${newStatus}, navigating from ${section} to ${newSection}`);
            
            // Generate record name for navigation
            const recordName = updatedRecord?.fullName || updatedRecord?.name || updatedRecord?.firstName || 'record';
            
            // Navigate to the new section with the same record
            navigateToPipelineItem(newSection, updatedRecord.id, recordName);
            
            // Refresh counts for both old and new sections
            window.dispatchEvent(new CustomEvent('refresh-counts', {
              detail: { 
                section: newSection,
                type: 'status-change',
                oldSection: section,
                oldStatus,
                newStatus,
                recordId: updatedRecord.id
              }
            }));
            
            // Also refresh old section counts
            window.dispatchEvent(new CustomEvent('refresh-counts', {
              detail: { 
                section: section,
                type: 'status-change',
                oldSection: section,
                oldStatus,
                newStatus,
                recordId: updatedRecord.id
              }
            }));
          } else {
            // Trigger refresh of data hooks to ensure parent components get updated data
            // Since records can move between sections (e.g., lead → prospect), refresh multiple hooks
            try {
              const refreshPromises = [];
              
              // Always refresh the current section
              refreshPromises.push(currentSectionHook.refresh());
              
              // If status changed, refresh counts for both old and new sections
              if (statusChanged) {
                // Determine sections for old and new status
                const getSectionForStatus = (status: string): string | null => {
                  if (!status) return null;
                  const statusUpper = status.toUpperCase();
                  if (statusUpper === 'LEAD') return 'leads';
                  if (statusUpper === 'PROSPECT') return 'prospects';
                  if (statusUpper === 'OPPORTUNITY') return 'opportunities';
                  if (statusUpper === 'CLIENT' || statusUpper === 'CUSTOMER' || statusUpper === 'SUPERFAN') return 'clients';
                  return null;
                };
                
                const oldSection = getSectionForStatus(oldStatus);
                const newSection = getSectionForStatus(newStatus);
                
                // Refresh counts for both old and new sections
                if (oldSection) {
                  window.dispatchEvent(new CustomEvent('refresh-counts', {
                    detail: { 
                      section: oldSection,
                      type: 'status-change',
                      oldStatus,
                      newStatus,
                      recordId: updatedRecord.id
                    }
                  }));
                }
                
                if (newSection && newSection !== oldSection) {
                  window.dispatchEvent(new CustomEvent('refresh-counts', {
                    detail: { 
                      section: newSection,
                      type: 'status-change',
                      oldStatus,
                      newStatus,
                      recordId: updatedRecord.id
                    }
                  }));
                }
                
                // Also refresh the current section if it's different from old/new sections
                if (section !== oldSection && section !== newSection) {
                  window.dispatchEvent(new CustomEvent('refresh-counts', {
                    detail: { 
                      section: section,
                      type: 'status-update',
                      oldStatus,
                      newStatus,
                      recordId: updatedRecord.id
                    }
                  }));
                }
                
                // Refresh the record from API to ensure we have the latest data
                // This is important because the status change might affect other fields
                // Use longer delay to ensure database transaction has fully completed
                // Note: Update timestamp is already tracked at the top of onRecordUpdate
                console.log('🔄 [PIPELINE] Refreshing record from API after status change');
                setTimeout(async () => {
                  try {
                    await loadDirectRecord(updatedRecord.id);
                  } catch (error) {
                    console.error('⚠️ [PIPELINE] Error refreshing record after status change:', error);
                  }
                }, 1000); // Increased delay to ensure API has fully processed the update and database transaction is complete
              }
              
              // Note: With the performance optimization, we only load the current section's data
              // Cross-section refreshes are handled by the parent layout's data providers
              // This reduces the number of API calls and improves performance
              
              // Wait for all refreshes to complete
              await Promise.all(refreshPromises);
              console.log('🔄 [PIPELINE] Refreshed all relevant data hooks');
            } catch (error) {
              console.error('⚠️ [PIPELINE] Error refreshing data after update:', error);
            }
          }
          
          console.log('✅ [PIPELINE] Record updated in UI and data refreshed');
        }}
        profilePopupContext={{
          isProfileOpen,
          setIsProfileOpen,
          profileAnchor,
          setProfileAnchor
        }}
      />
    );

    // If standalone mode, render with full PanelLayout
    if (standalone) {
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
                isProspectsVisible={isProspectsVisible}
                setIsProspectsVisible={setIsProspectsVisible}
                isLeadsVisible={isLeadsVisible}
                setIsLeadsVisible={setIsLeadsVisible}
                isCustomersVisible={isCustomersVisible}
                setIsCustomersVisible={setIsCustomersVisible}
                isPartnersVisible={isPartnersVisible}
                setIsPartnersVisible={setIsPartnersVisible}
              />
            }
            middlePanel={middlePanelContent}
            rightPanel={<RightPanel />}
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
            ref={profilePopupRef}
            style={{
              position: "fixed",
              left: profileAnchor?.getBoundingClientRect().left || 0,
              bottom: window.innerHeight - (profileAnchor?.getBoundingClientRect().top || 0) + 5,
              zIndex: 9999,
            }}
          >
            <ProfileBox
              user={pipelineUser}
              company={company}
              workspace={workspace?.name || ''}
              isProfileOpen={isProfileOpen}
              setIsProfileOpen={setIsProfileOpen}
              userId={user?.id}
              userEmail={user?.email}
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
    } else {
      // When used within pipeline layout, render only the middle panel content
      return (
        <>
          {middlePanelContent}
          
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
              ref={profilePopupRef}
              style={{
                position: "fixed",
                left: profileAnchor?.getBoundingClientRect().left || 0,
                bottom: window.innerHeight - (profileAnchor?.getBoundingClientRect().top || 0) + 5,
                zIndex: 9999,
              }}
            >
              <ProfileBox
                user={pipelineUser}
                company={company}
                workspace={workspace?.name || ''}
                isProfileOpen={isProfileOpen}
                setIsProfileOpen={setIsProfileOpen}
                userId={user?.id}
                userEmail={user?.email}
                isSellersVisible={true}
                setIsSellersVisible={() => {}}
                isRtpVisible={isSpeedrunVisible}
                setIsRtpVisible={setIsSpeedrunVisible}
                onSpeedrunEngineClick={() => {
                  console.log("Speedrun engine clicked in PipelineDetailPage (Record View)");
                  setIsProfileOpen(false);
                  setIsSpeedrunEngineModalOpen(true);
                }}
                isProspectsVisible={isProspectsVisible}
                setIsProspectsVisible={setIsProspectsVisible}
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
  }


  // If we have data but no selected record, show the list
  // BUT only if we're not on a detail page URL (slug exists)
  if (data.length > 0 && !slug) {
    return <PipelineView section={section} />;
  }

  // Get user data from PipelineContext to match PipelineLeftPanelStandalone
  // Note: pipelineUser, company, workspace are now available from the top-level hook call

  // 🔍 BLANK PAGE FIX: If we have a slug but no record and not loading, show helpful message
  // Note: The useEffect above will try to find the record in data array first
  if (slug && !selectedRecord && !previousRecord && !loading && !directRecordLoading) {
    console.error(`❌ [BLANK PAGE] No record found and not loading:`, {
      slug,
      section,
      recordId: extractIdFromSlug(slug),
      directRecordError,
      acquisitionDataError: acquisitionData.error,
      hasData: data.length > 0,
      dataLength: data.length,
      searchedInData: true
    });
    
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-warning/10 border border-warning text-warning px-6 py-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-2">Record Not Found</h3>
            <p className="text-sm mb-4">
              The {section} record you're looking for could not be found. It may have been deleted or moved.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const recordId = extractIdFromSlug(slug);
                  console.log(`🔄 [BLANK PAGE FIX] Retrying load for record: ${recordId}`);
                  setDirectRecordError(null);
                  loadDirectRecord(recordId);
                }}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={handleBack}
                className="px-4 py-2 bg-background border border-border text-foreground rounded hover:bg-hover transition-colors"
              >
                Go Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Final fallback - show loading skeleton
  if (slug && !selectedRecord && !previousRecord) {
    console.log(`🔄 [FALLBACK] Showing loading skeleton as final fallback for slug: ${slug}`);
    return <CompanyDetailSkeleton message="Loading record details..." />;
  }

  // No fallback states - only show real data
  return null;
}