"use client";

import React, { useEffect, useState, useCallback } from 'react';
// Removed authFetch import - using standard fetch
import { useRouter } from 'next/navigation';
import { useWorkspaceNavigation } from '@/platform/hooks/useWorkspaceNavigation';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { useProfilePopup } from '@/platform/ui/components/ProfilePopupContext';
import { extractIdFromSlug, generateSlug } from '@/platform/utils/url-utils';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { PipelineLeftPanelStandalone } from '@/products/pipeline/components/PipelineLeftPanelStandalone';
import { AIRightPanel } from '@/platform/ui/components/chat/AIRightPanel';
import { PipelineView } from './PipelineView';
import { UniversalRecordTemplate } from './UniversalRecordTemplate';
import { ProfileBox } from '@/platform/ui/components/ProfileBox';
import { SpeedrunEngineModal } from '@/platform/ui/components/SpeedrunEngineModal';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { usePipeline } from '@/products/pipeline/context/PipelineContext';
import { PanelLoader } from '@/platform/ui/components/Loader';
import { RecordContextProvider } from '@/platform/ui/context/RecordContextProvider';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';


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
  
  // Get user data from PipelineContext to match PipelineLeftPanelStandalone
  const { user: pipelineUser, company, workspace } = usePipeline();
  
  // 🚀 HYDRATION FIX: Initialize all state with consistent values
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
  
  // 🚀 HYDRATION FIX: Add hydration state to prevent mismatches
  const [isHydrated, setIsHydrated] = useState(false);
  
  // 🚀 UNIFIED LOADING: Track page transitions for smooth UX
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // 🚀 HYDRATION FIX: Set hydration state after component mounts
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
  
  // 🆕 CRITICAL FIX: Use real-time workspace ID from JWT token or session
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 🆕 CRITICAL FIX: Get workspace ID from multiple sources with priority
  const getCurrentWorkspaceId = useCallback(async () => {
    try {
      // 1. First try to get from JWT token (most reliable)
      const session = await import('@/platform/auth/service').then(m => m.UnifiedAuthService.getSession());
      if (session?.accessToken) {
        try {
          const jwt = await import('jsonwebtoken');
          const secret = process.env['NEXTAUTH_SECRET'] || "dev-secret-key-change-in-production";
          const decoded = jwt.default.verify(session.accessToken, secret) as any;
          if (decoded?.workspaceId) {
            console.log(`🔍 [PIPELINE DETAIL] Got workspace ID from JWT: ${decoded.workspaceId}`);
            return decoded.workspaceId;
          }
        } catch (error) {
          console.warn('⚠️ [PIPELINE DETAIL] Failed to decode JWT token:', error);
        }
      }
      
      // 2. Fallback to acquisitionData
      if (acquisitionData?.auth?.authUser?.activeWorkspaceId) {
        console.log(`🔍 [PIPELINE DETAIL] Got workspace ID from acquisitionData: ${acquisitionData.auth.authUser.activeWorkspaceId}`);
        return acquisitionData.auth.authUser.activeWorkspaceId;
      }
      
      // 3. Fallback to user activeWorkspaceId
      if (user?.activeWorkspaceId) {
        console.log(`🔍 [PIPELINE DETAIL] Got workspace ID from user: ${user.activeWorkspaceId}`);
        return user.activeWorkspaceId;
      }
      
      // 4. Last resort: first workspace
      if (user?.workspaces?.[0]?.id) {
        console.log(`🔍 [PIPELINE DETAIL] Got workspace ID from first workspace: ${user.workspaces[0].id}`);
        return user.workspaces[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [PIPELINE DETAIL] Error getting workspace ID:', error);
      return acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId || null;
    }
  }, [acquisitionData, user]);

  // 🆕 CRITICAL FIX: Update workspace ID when it changes
  useEffect(() => {
    const updateWorkspaceId = async () => {
      const newWorkspaceId = await getCurrentWorkspaceId();
      if (newWorkspaceId && newWorkspaceId !== currentWorkspaceId) {
        console.log(`🔄 [PIPELINE DETAIL] Workspace ID changed: ${currentWorkspaceId} -> ${newWorkspaceId}`);
        setCurrentWorkspaceId(newWorkspaceId);
        setCurrentUserId(user?.id || null);
      }
    };
    
    updateWorkspaceId();
  }, [acquisitionData, user, getCurrentWorkspaceId, currentWorkspaceId]);

  const workspaceId = currentWorkspaceId;
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
  
  // 🚀 NAVIGATION FIX: Load section data for navigation for all sections
  const { data: speedrunData, loading: speedrunLoading } = useFastSectionData('speedrun', 30);
  const { data: peopleData, loading: peopleLoading } = useFastSectionData('people', 1000);
  const { data: companiesData, loading: companiesLoading } = useFastSectionData('companies', 500);
  const { data: leadsData, loading: leadsLoading } = useFastSectionData('leads', 2000);
  const { data: prospectsData, loading: prospectsLoading } = useFastSectionData('prospects', 1000);
  
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
  const data = getNavigationData(section);
  
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
  
  // 🚀 SPEEDRUN RECORD FIX: For speedrun records, find the current record in the speedrun data array
  // instead of loading it separately to ensure navigation works correctly
  useEffect(() => {
    if (section === 'speedrun' && speedrunData && speedrunData.length > 0 && !selectedRecord && slug) {
      console.log('🔍 [SPEEDRUN RECORD] Finding current record in speedrun data array:', {
        slug,
        speedrunDataLength: speedrunData.length,
        lookingForId: slug
      });
      
      const currentRecord = speedrunData.find((record: any) => record.id === slug);
      if (currentRecord) {
        console.log('✅ [SPEEDRUN RECORD] Found current record in speedrun data:', {
          id: currentRecord.id,
          name: currentRecord.name || currentRecord.fullName
        });
        setSelectedRecord(currentRecord);
      } else {
        console.log('❌ [SPEEDRUN RECORD] Current record not found in speedrun data, falling back to direct load');
        // Fallback to direct loading if not found in speedrun data
        if (slug && !directRecordLoading) {
          loadDirectRecord(slug);
        }
      }
    }
  }, [section, speedrunData, selectedRecord, slug]); // Removed directRecordLoading to prevent infinite loops
  
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
  
  // 🚀 HYDRATION FIX: Don't show loading/error states until hydrated to prevent flashing
  const loading = isHydrated && (acquisitionData.isLoading || directRecordLoading || isTransitioning || (section === 'speedrun' && speedrunLoading && !selectedRecord));
  const error = isHydrated ? (acquisitionData.error || directRecordError) : null;
  
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
    if (directRecordError && (directRecordError.includes('Record not found') || directRecordError.includes('Speedrun record not found'))) {
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
      const response = await fetch(`/api/data/unified?type=${section}&id=${recordId}&fields=essential`);
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`⚡ [PERFORMANCE] Unified API call took ${loadTime.toFixed(2)}ms for ${section} record: ${recordId}`);
      
      if (!response.ok) {
        if (response['status'] === 404) {
          // 🚀 ID MISMATCH FIX: Try to find record by name when ID doesn't exist
          console.log(`🔄 [ID MISMATCH] Record with ID ${recordId} not found, trying to find by name...`);
          
          // Extract name from slug for fallback search
          const nameFromSlug = slug.split('-').slice(0, -1).join(' ').replace(/\b\w/g, l => l.toUpperCase());
          console.log(`🔍 [FALLBACK SEARCH] Searching for record with name: "${nameFromSlug}"`);
          
          // Try to find record by name in the section data
          const fallbackRecord = sectionData.find((record: any) => {
            const recordName = record.fullName || record.name || '';
            return recordName.toLowerCase().includes(nameFromSlug.toLowerCase()) ||
                   nameFromSlug.toLowerCase().includes(recordName.toLowerCase());
          });
          
          if (fallbackRecord) {
            console.log(`✅ [FALLBACK SUCCESS] Found record by name: ${fallbackRecord.fullName || fallbackRecord.name} (ID: ${fallbackRecord.id})`);
            
            // 🚀 URL CORRECTION: Update the URL to use the correct record ID
            const correctSlug = generateSlug(fallbackRecord.fullName || fallbackRecord.name || 'record', fallbackRecord.id);
            const currentPath = window.location.pathname;
            const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
            
            if (workspaceMatch) {
              const workspaceSlug = workspaceMatch[1];
              const correctUrl = `/${workspaceSlug}/${section}/${correctSlug}`;
              
              // Only update URL if it's different from current
              if (currentPath !== correctUrl) {
                console.log(`🔧 [URL CORRECTION] Updating URL from ${currentPath} to ${correctUrl}`);
                window.history.replaceState({}, '', correctUrl);
              }
            }
            
            setSelectedRecord(fallbackRecord);
            return;
          } else {
            throw new Error(`Record not found. It may have been deleted or moved to a different workspace.`);
          }
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
    
    // 🚫 PREVENT INFINITE LOOPS: Add debounce to prevent rapid-fire calls
    const timeoutId = setTimeout(() => {
      // Check again after timeout to ensure we still need to load
      if (directRecordLoading || (selectedRecord && selectedRecord.id === recordId)) {
        return;
      }
      
      // If we have data loaded, try to find the record in it
      if (data.length > 0) {
        console.log(`🔍 [DATA DEBUG] Looking for record ${recordId} in ${data.length} cached records`);
        console.log(`🔍 [DATA DEBUG] Available record IDs:`, data.slice(0, 5).map((r: any) => ({ id: r.id, name: r.name })));
        console.log(`🔍 [DATA DEBUG] Section: ${section}, RecordId: ${recordId}`);
        
        // For demo scenarios, also check userId field (contains demo IDs like zp-kirk-harbaugh-2025)
        const record = data.find((r: any) => r['id'] === recordId || r['userId'] === recordId);
        
        console.log(`🔍 [DATA DEBUG] Record search result:`, record ? 'FOUND' : 'NOT FOUND');
        console.log(`🔍 [DATA DEBUG] Searching for ID: ${recordId}`);
        console.log(`🔍 [DATA DEBUG] First few records:`, data.slice(0, 3).map((r: any) => ({ id: r.id, name: r.name })));
        
        if (record) {
          console.log(`🔗 [Direct URL] Found ${section} record in cached data:`, {
            id: record.id,
            name: record.name,
            description: record.description ? 'Yes' : 'No',
            website: record.website ? 'Yes' : 'No',
            source: 'cached'
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
    }, 100); // 100ms debounce to prevent rapid-fire calls
    
    // Cleanup timeout on unmount or dependency change
    return () => clearTimeout(timeoutId);
  }, [slug, section]); // 🚫 FIXED: Removed data, loading, selectedRecord to prevent infinite loops

  // Handle section navigation
  const handleSectionChange = (newSection: string) => {
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
    
    // For regular person detail pages, navigate to the people list
    if (section === 'people') {
      console.log('🔍 [BACK NAVIGATION] Navigating to people list');
      navigateToPipeline('people');
      return;
    }
    
    // Default behavior
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
  }, [data, selectedRecord, section, navigateToPipelineItem]);

  // 🚀 HYDRATION FIX: Show loading skeleton during hydration to prevent flashing
  if (!isHydrated) {
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
            {/* Hydration Loading Skeleton */}
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
                // 🚀 SPEEDRUN FIX: For speedrun records, always use sequential position in the list
                // instead of database rank to ensure navigation works correctly
                if (section === 'speedrun') {
                  const index = data.findIndex((r: any) => r['id'] === recordToShow.id);
                  const recordIndex = index >= 0 ? index + 1 : 1;
                  console.log(`🔍 [SPEEDRUN NAVIGATION] Using sequential position:`, {
                    recordId: recordToShow?.id,
                    recordName: recordToShow?.name,
                    dataLength: data.length,
                    foundIndex: index,
                    calculatedRecordIndex: recordIndex,
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
                    const index = data.findIndex((r: any) => r['id'] === selectedRecord.id);
                    return index >= 0 ? index + 1 : 1;
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