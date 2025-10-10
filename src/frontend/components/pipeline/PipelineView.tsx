"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PipelineTable } from './PipelineTableRefactored';
import { PipelineFilters } from './PipelineFilters';
import { PipelineHeader } from './PipelineHeader';
import { OpportunitiesKanban } from './OpportunitiesKanban';
import { MetricsDashboard } from './MetricsDashboard';
import { Dashboard } from './Dashboard';
import { EmptyStateDashboard } from './EmptyStateDashboard';
import { SpeedrunMiddlePanel } from '@/platform/ui/panels/speedrun-middle-panel';
import { DashboardSkeleton, ListSkeleton, KanbanSkeleton } from '@/platform/ui/components/skeletons';
import { useUnifiedAuth } from '@/platform/auth';
import { getSectionColumns } from '@/platform/config/workspace-table-config';
import { usePipelineData } from '@/platform/hooks/useAdrataData';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { LeftPanel } from '@/products/pipeline/components/LeftPanel';
import { RightPanel } from '@/platform/ui/components/chat/RightPanel';
// import { useZoom } from '@/platform/ui/components/ZoomProvider';

import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { useAdrataData } from '@/platform/hooks/useAdrataData';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';
// Removed unused individual section data hooks to eliminate duplicate API calls
import { Pagination } from './table/Pagination';
// import { AdrataComponent } from '@/platform/ui/components/AdrataComponent'; // Component not found
import { AddModal } from '@/platform/ui/components/AddModal';
import { ProfileBox } from '@/platform/ui/components/ProfileBox';
import { useProfilePopup } from '@/platform/ui/components/ProfilePopupContext';
import { usePipeline } from '@/products/pipeline/context/PipelineContext';
import { SpeedrunEngineModal } from '@/platform/ui/components/SpeedrunEngineModal';
import { useSpeedrunSignals } from "@/platform/hooks/useSpeedrunSignals";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import { PipelineHydrationFix } from './PipelineHydrationFix';
// Import getCurrentWorkspaceSlug from the correct location



interface PipelineViewProps {
  section: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners' | 'sellers' | 'speedrun' | 'metrics' | 'dashboard';
  sellerId?: string;
  companyId?: string;
  title?: string;
  subtitle?: string;
}

// PERFORMANCE: Memoize component to prevent unnecessary re-renders
export const PipelineView = React.memo(function PipelineView({ 
  section, 
  sellerId, 
  companyId, 
  title, 
  subtitle 
}: PipelineViewProps) {
  // console.log('🔍 [PipelineView] Component rendered for section:', section, 'sellerId:', sellerId, 'companyId:', companyId);
  
  
  const router = useRouter();
  const { navigateToPipeline, navigateToPipelineItem } = useWorkspaceNavigation();
  const { user } = useUnifiedAuth();
  // const { zoom } = useZoom();
  const zoom = 100; // Temporary fix - use default zoom
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
  
  // Check if we're in demo mode to set appropriate defaults
  const isDemoMode = typeof window !== "undefined" && window.location.pathname.startsWith('/demo/');
  
  const [isSpeedrunVisible, setIsSpeedrunVisible] = useState(true);
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(!isDemoMode); // true for production, false for demo
  const [isProspectsVisible, setIsProspectsVisible] = useState(!isDemoMode); // true for production, false for demo
  const [isLeadsVisible, setIsLeadsVisible] = useState(!isDemoMode); // true for production, false for demo
  const [isCustomersVisible, setIsCustomersVisible] = useState(false); // Hidden for this workspace
  const [isPartnersVisible, setIsPartnersVisible] = useState(!isDemoMode); // true for production, false for demo
  // Panel visibility is now managed by useUI context
  const [searchQuery, setSearchQuery] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [lastContactedFilter, setLastContactedFilter] = useState('all');
  const [isSpeedrunEngineModalOpen, setIsSpeedrunEngineModalOpen] = useState(false);
  // Default sorting: prospects by oldest Last Action, others by rank
  const [sortField, setSortField] = useState<string>(section === 'prospects' ? 'lastContactDate' : 'rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(section === 'prospects' ? 'asc' : 'desc');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('now');
  const [timezoneFilter, setTimezoneFilter] = useState<string>('all');
  // 🎯 NEW SELLER FILTERS
  const [companySizeFilter, setCompanySizeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  
  // Get workspace context at component level
  const workspaceName = user?.workspaces?.find(w => w['id'] === user?.activeWorkspaceId)?.['name'] || '';
  
  // Section-specific default visible columns with workspace-specific configuration
  const getDefaultVisibleColumns = (section: string): string[] => {
    // Get workspace-specific column configuration
    const currentWorkspaceId = user?.activeWorkspaceId || '';
    const sectionConfig = getSectionColumns(currentWorkspaceId, section, workspaceName);
    
    // Use workspace-specific column display names if available, otherwise use defaults
    if (sectionConfig.columns) {
      return sectionConfig.columns;
    }
    
    // Fallback to default configuration (display names)
    switch (section) {
      case 'speedrun':
        return ['rank', 'company', 'name', 'status', 'nextAction', 'lastAction', 'actions'];
      case 'companies':
        return ['rank', 'company', 'lastAction', 'nextAction', 'actions'];
      case 'leads':
        return ['rank', 'company', 'name', 'title', 'nextAction', 'lastAction', 'actions'];
      case 'prospects':
        return ['rank', 'company', 'name', 'title', 'nextAction', 'lastAction', 'actions'];
      case 'opportunities':
        return ['rank', 'name', 'company', 'status', 'nextAction', 'lastAction', 'actions'];
      case 'people':
        return ['rank', 'company', 'name', 'title', 'nextAction', 'lastAction', 'actions'];
      case 'clients':
        return ['rank', 'company', 'industry', 'status', 'nextAction', 'lastAction', 'actions'];
      case 'partners':
        return ['rank', 'company', 'nextAction', 'lastAction', 'actions'];
      default:
        return ['rank', 'company', 'name', 'title', 'lastAction', 'actions'];
    }
  };
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(getDefaultVisibleColumns(section));
  
  // Update visible columns and sort when section changes
  useEffect(() => {
    setVisibleColumns(getDefaultVisibleColumns(section));
    // Reset sort to default for new section
    if (section === 'prospects') {
      setSortField('lastContactDate');
      setSortDirection('asc'); // Oldest first
    } else {
      setSortField('rank');
      setSortDirection('asc'); // Lowest rank first (1, 2, 3...)
    }
  }, [section]);
  
  // Monaco Signal popup state for Speedrun section
  const [isSlideUpVisible, setIsSlideUpVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // 🚀 UNIFIED LOADING: Track section transitions for smooth UX
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
  }, [section]);
  
  // Use single data source from useAcquisitionOS for dashboard only
  const { data: acquisitionData } = useAcquisitionOS();
  
  // 🆕 CRITICAL FIX: Use workspace ID directly from user object (synchronous)
  const currentWorkspaceId = user?.activeWorkspaceId || null;
  const currentUserId = user?.id || null;

  const workspaceId = currentWorkspaceId;
  
  // console.log('🔍 [WORKSPACE DEBUG] Using real-time workspace:', {
  //   acquisitionDataExists: !!acquisitionData,
  //   providerWorkspaceId: workspaceId,
  //   userActiveWorkspaceId: user?.activeWorkspaceId,
  //   currentWorkspaceId
  // });
  // Map workspace to correct user ID
  const getUserIdForWorkspace = (workspaceId: string) => {
    switch (workspaceId) {
      case '01K1VBYXHD0J895XAN0HGFBKJP': // Adrata workspace
        return '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan Mirolli
      case '01K1VBYV8ETM2RCQA4GNN9EG72': // RPS workspace
        return '01K1VBYYV7TRPY04NW4TW4XWRB'; // Just Dano
      case 'cmezxb1ez0001pc94yry3ntjk': // NE (Notary Everyday) workspace
        return '01K1VBYYV7TRPY04NW4TW4XWRB'; // Just Dano (same user in both workspaces)
      case '01K5D01YCQJ9TJ7CT4DZDE79T1': // TOP Engineering Plus workspace
        return '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan Mirolli
      default:
        return user?.id;
    }
  };
  const userId = currentUserId;
  
  // 🚀 PERFORMANCE: Use only the data hook needed for the current section
  // This eliminates 6 unnecessary API calls that were firing simultaneously
  
  // Use higher limit for people section to ensure all records are loaded
  const limit = section === 'people' ? 10000 : 1000;
  const fastSectionData = useFastSectionData(section, limit);
  
  // Fallback to old pipeline data for sections not supported by fast API
  const pipelineData = usePipelineData(section, workspaceId, userId);
  
  // console.log('🔍 [PIPELINE VIEW DEBUG] Final context:', { workspaceId, userId, section });
  
  // AGGRESSIVE DEBUG: Log every render
  // console.log('🔍 [PIPELINE VIEW] Component render:', {
  //   section,
  //   userWorkspaces: user?.workspaces?.map(w => ({ id: w.id, name: w.name })),
  //   finalWorkspaceId: workspaceId,
  //   finalUserId: userId,
  //   acquisitionDataExists: !!acquisitionData
  // });
  
  // Removed legacy getSectionData(section) relying on acquisitionData; using dedicated hooks below
  
  // 🚀 PERFORMANCE: Use fast section data for all sections
  // This eliminates duplicate API calls and uses the optimized data loading
  const getSectionData = () => {
    // Use fastSectionData for all sections - it handles the API calls efficiently
    // Prioritize fastSectionData if it has data, otherwise fall back to pipelineData
    const hasFastData = fastSectionData.data && fastSectionData.data.length > 0;
    const hasPipelineData = pipelineData.data && pipelineData.data.length > 0;
    
    const data = hasFastData ? fastSectionData.data : (hasPipelineData ? pipelineData.data : []);
    const loading = fastSectionData.loading || pipelineData.loading;
    const error = hasFastData ? null : (fastSectionData.error || pipelineData.error);
    const count = hasFastData ? fastSectionData.count : (hasPipelineData ? pipelineData.count : 0);
    
    console.log(`🔍 [PIPELINE VIEW] getSectionData for ${section}:`, {
      fastSectionData: {
        dataLength: fastSectionData.data?.length || 0,
        loading: fastSectionData.loading,
        error: fastSectionData.error,
        count: fastSectionData.count
      },
      pipelineData: {
        dataLength: pipelineData.data?.length || 0,
        loading: pipelineData.loading,
        error: pipelineData.error
      },
      finalData: {
        dataLength: data.length,
        loading,
        error,
        count,
        firstRecord: data[0] ? {
          id: data[0].id,
          name: data[0].fullName || data[0].name,
          status: data[0].status
        } : null
      }
    });
    
    return { data, loading, error, count };
  };

  const sectionData = getSectionData();
  const finalData = sectionData.data;
  const finalLoading = sectionData.loading;
  const finalError = sectionData.error;
  const finalIsEmpty = finalData.length === 0;
  
  // 🔍 DEBUG: Log data sources for People section
  if (section === 'people') {
    console.log('🔍 [PEOPLE DEBUG] Data sources:', {
      section,
      v1ApiData: {
        hasData: !!finalData,
        dataLength: finalData?.length || 0,
        loading: finalLoading,
        error: finalError,
        firstPerson: finalData?.[0] ? {
          id: finalData[0].id,
          name: finalData[0].name,
          company: finalData[0].company
        } : null
      }
    });
  }
  
  // Set loading to false when data is actually loaded
  useEffect(() => {
    if (finalData !== undefined && !finalError) {
      setIsLoading(false);
    }
  }, [finalData, finalError]);
  
  // 🚀 PERFORMANCE: Pre-load speedrun data in background when on other sections
  useEffect(() => {
    if (section !== 'speedrun' && workspaceId && userId) {
      console.log('🚀 [SPEEDRUN PRELOAD] Pre-loading speedrun data in background for faster navigation');
      // Pre-load speedrun data using v1 API
      const preloadSpeedrunData = async () => {
        try {
          await fetch(`/api/v1/people?limit=50&sortBy=rank&sortOrder=asc`);
        } catch (error) {
          console.warn('⚠️ [SPEEDRUN PRELOAD] Failed to pre-load speedrun data:', error);
        }
      };
      
      // Pre-load after a short delay to not interfere with current section loading
      const timeoutId = setTimeout(preloadSpeedrunData, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [section, workspaceId, userId]);

  // Speedrun signals hook for automatic Monaco Signal popup (only for speedrun section)
  console.log('🔍 [Pipeline Speedrun] About to initialize useSpeedrunSignals hook for section:', section);
  console.log('🔍 [Pipeline Speedrun] Section type check:', typeof section, 'Value:', section);
  console.log('🔍 [Pipeline Speedrun] Is speedrun section?', section === 'speedrun');
  console.log('🔍 [Pipeline Speedrun] Workspace ID:', workspaceId || '01K1VBYV8ETM2RCQA4GNN9EG72');
  console.log('🔍 [Pipeline Speedrun] User ID:', userId || '01K1VBYYV7TRPY04NW4TW4XWRB');
  
  const { activeSignal, acceptSignal, dismissSignal } = useSpeedrunSignals(
    workspaceId || '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's workspace
    userId || '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's user ID
    (signal) => {
      console.log('🎯 [Pipeline Speedrun] Signal accepted:', signal);
      setIsSlideUpVisible(false);
    }
  );
  

  // Show data immediately - no loading states
  console.log(`🔍 [PIPELINE VIEW] Data state:`, {
    section,
    dataLength: finalData?.length || 0,
    error: finalError,
    isEmpty: finalIsEmpty,
    isLoading,
    acquisitionDataStructure: {
      hasAcquireData: !!acquisitionData?.acquireData,
      hasDirectData: !!acquisitionData && !acquisitionData.acquireData,
      dataKeys: acquisitionData ? Object.keys(acquisitionData) : [],
      acquireDataKeys: acquisitionData?.acquireData ? Object.keys(acquisitionData.acquireData) : []
    }
  });
  
  // Debug Pusher connection for speedrun section
  useEffect(() => {
    if (section === 'speedrun') {
      console.log('🔍 [Pipeline Speedrun] Debug info:', {
        workspaceId: workspaceId || '01K1VBYV8ETM2RCQA4GNN9EG72',
        userId: userId || '01K1VBYYV7TRPY04NW4TW4XWRB',
        section,
        activeSignal: !!activeSignal,
        isSlideUpVisible
      });
    }
  }, [section, workspaceId, userId, activeSignal, isSlideUpVisible]);
  
  // Automatically show popup when signal is received (for speedrun section only)
  useEffect(() => {
    if (section === 'speedrun' && activeSignal && !isSlideUpVisible) {
      console.log('🚨 [Pipeline Speedrun] Auto-showing Monaco Signal popup for:', activeSignal?.contact?.name || 'Unknown');
      setIsSlideUpVisible(true);
    }
  }, [section, activeSignal, isSlideUpVisible]);

  // Keyboard shortcuts for Monaco Signal popup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('🎯 Key pressed:', event.key, 'Meta:', event.metaKey, 'Ctrl:', event.ctrlKey);
      
      // Command+I (Mac) or Ctrl+I (Windows/Linux) - Monaco Signal popup
      if ((event.metaKey || event.ctrlKey) && event['key'] === 'i') {
        event.preventDefault();
        event.stopPropagation();
        console.log('🎯 Command+I pressed, toggling Monaco Signal. Current state:', isSlideUpVisible);
        setIsSlideUpVisible(prev => {
          console.log('🎯 Setting Monaco Signal visible to:', !prev);
          return !prev;
        });
      }
      
      // Command+Enter (Mac) or Ctrl+Enter (Windows/Linux) - Activate Monaco Signal
      if ((event.metaKey || event.ctrlKey) && event['key'] === 'Enter') {
        const target = event.target as HTMLElement;
        const isInput = target['tagName'] === "INPUT" || target['tagName'] === "TEXTAREA" || target.isContentEditable;
        if (!isInput && isSlideUpVisible) {
          event.preventDefault();
          console.log('🎯 Command+Enter pressed, activating Monaco Signal');
          if (activeSignal) {
            acceptSignal();
            setIsSlideUpVisible(false);
          }
        }
      }
      
      // Escape to close Monaco Signal popup
      if (event['key'] === 'Escape' && isSlideUpVisible) {
        console.log('🎯 Escape pressed, closing Monaco Signal');
        setIsSlideUpVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSlideUpVisible, activeSignal, acceptSignal]);
  
  const { 
    data, 
    error, 
    refresh, 
    clearCache 
  } = section === 'metrics' 
    ? { 
        data: [], 
        error: null, 
        refresh: () => Promise.resolve([]), 
        clearCache: () => {} 
      }
    : pipelineData;
    
  // CRITICAL FIX: Add metrics for metrics section compatibility
  const metrics = section === 'metrics' 
    ? { 
        total: 16, 
        active: 16, 
        completed: 0, 
        conversionRate: 0, 
        avgResponseTime: 0,
        data: [] // Include data for unique company calculation
      }
    : { 
        total: data?.length || 0, 
        totalLeads: data?.length || 0, // Add totalLeads property for PipelineHeader
        active: data?.length || 0, 
        completed: 0, 
        conversionRate: 0, 
        avgResponseTime: 0,
        data: data || [] // Include data for unique company calculation
      };



  // Listen for timeframe changes and sync with URL
  useEffect(() => {
    // Set initial timeframe from URL - no automatic redirect for speedrun
    if (section === 'speedrun') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = urlParams.get('view');
      
      if (urlView === 'week' || urlView === 'month' || urlView === 'quarter' || urlView === 'now') {
        setTimeframeFilter(urlView);
      } else {
        // No view parameter - use default 'now' without redirecting
        setTimeframeFilter('now');
      }
    }

    // Listen for timeframe change events
    const handleTimeframeChange = (event: CustomEvent) => {
      const { timeframe } = event.detail;
      setTimeframeFilter(timeframe);
    };

    window.addEventListener('speedrun-timeframe-change', handleTimeframeChange as EventListener);
    
    // Listen for pipeline data refresh events (from drag and drop operations)
    const handleDataRefresh = (event: CustomEvent) => {
      const { section: refreshSection } = event.detail;
      if (refreshSection === section) {
        console.log(`🔄 Refreshing ${section} data after operation`);
        refresh();
      }
    };
    
    window.addEventListener('pipeline-data-refresh', handleDataRefresh as EventListener);
    
    return () => {
      window.removeEventListener('speedrun-timeframe-change', handleTimeframeChange as EventListener);
      window.removeEventListener('pipeline-data-refresh', handleDataRefresh as EventListener);
    };
  }, [section, refresh]);

  // Helper function to get data count based on timeframe
  const getTimeframeDataCount = (timeframe: string): number => {
    switch (timeframe) {
      case 'now': return 30;    // Today's speedrun targets
      case 'week': return 150;  // This week's targets  
      case 'month': return 300; // This month's targets
      case 'quarter': return 500; // This quarter's targets
      default: return 30;
    }
  };






  // Helper function to get sortable value from record
  const getSortableValue = useCallback((record: any, field: string) => {
    // Handle common field variations
    switch (field) {
      case 'name':
        return (record['firstName'] && record['lastName'] ? `${record['firstName']} ${record['lastName']}` : '') || record['fullName'] || record.name || '';
      
      case 'company':
        return record.company || record.companyName || '';
      
      case 'title':
        return record.title || 
               record.jobTitle || 
               record?.customFields?.enrichedData?.overview?.title ||
               record?.customFields?.rawData?.active_experience_title ||
               '-';
      
      case 'lastContact':
      case 'lastContactDate':
      case 'lastAction':
        // Handle different date field variations
        const dateValue = record.lastContact || record.lastContactDate || record.lastAction || record.updatedAt;
        if (dateValue) {
          return new Date(dateValue);
        }
        return new Date(0); // Very old date for null values
      
      case 'status':
        return record.status || '';
      
      case 'rank':
        // Handle rank field - prioritize winningScore.rank for alphanumeric display
        const winningRank = record.winningScore?.rank;
        const fallbackRank = record.rank || record.stableIndex || 0;
        
        // 🎯 STRATEGIC RANKING: Use full alphanumeric rank for display and sorting
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
      
      case 'email':
        return record.email || '';
      
      case 'phone':
        return record.phone || record.mobilePhone || '';
      
      case 'industry':
        return record.industry || record.vertical || record.company?.industry || '';
      
      case 'revenue':
        // Handle company size/revenue for sorting
        const revenue = record.revenue || record.company?.revenue || record.annualRevenue || 0;
        if (typeof revenue === 'string') {
          return parseFloat(revenue.replace(/[^0-9.-]/g, '')) || 0;
        }
        return typeof revenue === 'number' ? revenue : 0;
      
      case 'amount':
        // Handle currency amounts
        const amount = record.amount || record.dealValue || record.value || 0;
        if (typeof amount === 'string') {
          return parseFloat(amount.replace(/[^0-9.-]/g, '')) || 0;
        }
        return typeof amount === 'number' ? amount : 0;
      
      case 'stage':
        return record.stage || record.dealStage || '';
      
      case 'smart_rank':
        // Use smart ranking score if available
        return record.smartRankScore || 0;
      
      case 'engagement':
        // Use engagement score if available
        return record.engagementScore || 0;
      
      case 'created_at':
        return record.createdAt || record.created_at || record.createdDate || new Date(0);
      
      case 'updated_at':
        return record.updatedAt || record.updated_at || record.updatedDate || new Date(0);
      
      default:
        // Fallback to direct property access
        return record[field] || '';
    }
  }, []);

  // 🚀 PERFORMANCE: Use dedicated hooks data for instant loading
  const hasData = Array.isArray(finalData) && finalData.length > 0;
  
  // Calculate isEmpty based on actual data
  const isEmpty = !hasData;
  
  console.log(`🔍 [PIPELINE VIEW] Data state for ${section}:`, {
    hasData,
    dataLength: Array.isArray(finalData) ? finalData.length : 0,
    isEmpty,
    finalLoading,
    finalError,
    workspaceId,
    userId,
    willShowEmptyState: !hasData && !finalError && workspaceId && userId
  });

  // CRITICAL DEBUG: Log the final data state with source information
  console.log(`🚨 [CRITICAL DEBUG] Final data state for section ${section}:`, {
    hasData,
    dataLength: Array.isArray(finalData) ? finalData.length : 0,
    data: Array.isArray(finalData) ? finalData.slice(0, 3) : [],
    error: finalError,
    isEmpty,
    workspaceId,
    userId,
    dataSource: 'v1-api-hooks'
  });

  // Filter and sort data based on all filters and sort criteria
  const filteredData = React.useMemo(() => {
    // Use finalData from v1 API hooks
    const dataToFilter = Array.isArray(finalData) ? finalData : [];
    
    console.log(`🔍 [FILTERING] Starting filter for ${section}:`, {
      originalDataLength: dataToFilter.length,
      firstRecord: dataToFilter[0] ? {
        id: dataToFilter[0].id,
        name: dataToFilter[0].fullName || dataToFilter[0].name,
        status: dataToFilter[0].status
      } : null,
      filters: {
        searchQuery,
        verticalFilter,
        statusFilter,
        priorityFilter,
        revenueFilter,
        lastContactedFilter,
        timezoneFilter,
        companySizeFilter,
        locationFilter
      }
    });
    
    if (!dataToFilter || dataToFilter.length === 0) {
      console.log(`🔍 [FILTERING] No data to filter for ${section}`);
      return dataToFilter;
    }
    
    // Apply timeframe filtering for speedrun section
    let timeframeFilteredData = dataToFilter;
    if (section === 'speedrun') {
      const dataCount = getTimeframeDataCount(timeframeFilter);
      timeframeFilteredData = dataToFilter.slice(0, dataCount);
    }

    let filtered = timeframeFilteredData.filter((record: any) => {
      // Search filter
      const matchesSearch = !searchQuery || 
        (record['name'] && record.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record['fullName'] && record.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record['title'] && record.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record['company'] && record.company && (typeof record.company === 'string' ? record.company : record.company.name) && (typeof record.company === 'string' ? record.company : record.company.name).toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record['email'] && record.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record['companyName'] && record.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

      // Vertical filter
      const matchesVertical = verticalFilter === 'all' ||
        (record['vertical'] && record.vertical.toLowerCase().replace(/\s+/g, '_') === verticalFilter) ||
        (record['industry'] && record.industry.toLowerCase().replace(/\s+/g, '_') === verticalFilter) ||
        (record.company?.vertical && record.company.vertical.toLowerCase().replace(/\s+/g, '_') === verticalFilter) ||
        (record.company?.industry && record.company.industry.toLowerCase().replace(/\s+/g, '_') === verticalFilter);

      // Revenue filter
      const matchesRevenue = revenueFilter === 'all' || (() => {
        const revenue = record.revenue || record.company?.revenue || record.annualRevenue || 0;
        const revenueNum = typeof revenue === 'string' ? parseFloat(revenue.replace(/[^0-9.]/g, '')) : revenue;
        switch (revenueFilter) {
          case 'enterprise': return revenueNum >= 1000000000; // $1B+
          case 'large': return revenueNum >= 100000000 && revenueNum < 1000000000; // $100M-$1B
          case 'medium': return revenueNum >= 10000000 && revenueNum < 100000000; // $10M-$100M
          case 'small': return revenueNum >= 1000000 && revenueNum < 10000000; // $1M-$10M
          case 'startup': return revenueNum < 1000000; // <$1M
          default: return true;
        }
      })();


      // Status filter - handle both status and stage fields for different record types
      const matchesStatus = statusFilter === 'all' ||
        (record['status'] && record.status.toLowerCase() === statusFilter.toLowerCase()) ||
        (record['stage'] && record.stage.toLowerCase() === statusFilter.toLowerCase()); // CRITICAL FIX: Add stage field support for opportunities

      // DEBUG: Log status filtering for opportunities
      if (section === 'opportunities' && statusFilter !== 'all') {
        console.log(`🔍 [STATUS FILTER DEBUG] Record: ${record.name}, Stage: ${record.stage}, Filter: ${statusFilter}, Matches: ${matchesStatus}`);
      }

      // Priority filter - handle sections that don't use priority filtering
      const sectionsWithPriority = ['leads', 'prospects', 'opportunities', 'speedrun'];
      const matchesPriority = !sectionsWithPriority.includes(section) || // Skip priority filter for sections that don't use it
        priorityFilter === 'all' ||
        (record['priority'] && record.priority.toLowerCase() === priorityFilter.toLowerCase()) ||
        (!record['priority'] && priorityFilter === 'none'); // Allow filtering for records without priority

      // Timezone filter - only apply for speedrun and leads sections
      const matchesTimezone = !['speedrun', 'leads'].includes(section) || // Skip timezone filter for other sections
        timezoneFilter === 'all' ||
        (record['timezone'] && record['timezone'] === timezoneFilter) ||
        (record['timeZone'] && record['timeZone'] === timezoneFilter);

      // DEBUG: Log timezone filtering for debugging
      if (section === 'speedrun' && timezoneFilter !== 'all') {
        console.log(`🔍 [TIMEZONE FILTER DEBUG] Record: ${record.name || record.fullName}, Timezone: ${record.timezone || record.timeZone || 'null'}, Filter: ${timezoneFilter}, Matches: ${matchesTimezone}`);
      }

      // 🎯 NEW SELLER FILTERS
      // Company Size filter
      const matchesCompanySize = companySizeFilter === 'all' || (() => {
        const employeeCount = record.employeeCount || record.company?.employeeCount || 0;
        const empCount = typeof employeeCount === 'string' ? parseInt(employeeCount, 10) : employeeCount;
        
        switch (companySizeFilter) {
          case 'startup': return empCount >= 1 && empCount <= 10;
          case 'small': return empCount >= 11 && empCount <= 50;
          case 'medium': return empCount >= 51 && empCount <= 200;
          case 'large': return empCount >= 201 && empCount <= 1000;
          case 'enterprise': return empCount > 1000;
          default: return true;
        }
      })();

      // Location filter (State-based)
      const matchesLocation = locationFilter === 'all' || (() => {
        const hqState = record.hqState || record.company?.hqState;
        const state = record.state || record.company?.state;
        
        const location = locationFilter.toLowerCase().replace(/\s+/g, '_');
        
        return (hqState && hqState.toLowerCase().replace(/\s+/g, '_') === location) ||
               (state && state.toLowerCase().replace(/\s+/g, '_') === location);
      })();

      // Last contacted filter
      const matchesLastContacted = lastContactedFilter === 'all' || (() => {
        const lastContact = record.lastContactDate || record.lastContact || record.lastAction;
        if (!lastContact) {
          return lastContactedFilter === 'never';
        }
        
        const contactDate = new Date(lastContact);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (lastContactedFilter) {
          case 'never': return false; // Already handled above
          case 'today': return daysDiff === 0;
          case 'week': return daysDiff <= 7;
          case 'month': return daysDiff <= 30;
          case 'quarter': return daysDiff <= 90;
          case 'overdue': return daysDiff > 90;
          default: return true;
        }
      })();

      return matchesSearch && matchesVertical && matchesRevenue && matchesStatus && matchesPriority && matchesTimezone && matchesCompanySize && matchesLocation && matchesLastContacted;
    });

    // Apply smart ranking or sorting
    if (section === 'speedrun') {
      // For speedrun, sort by rank to show 1, 2, 3, 4, 5... in order
      filtered = [...filtered].sort((a: any, b: any) => {
        const aRank = parseInt(a.winningScore?.rank || a.rank || '999', 10);
        const bRank = parseInt(b.winningScore?.rank || b.rank || '999', 10);
        return aRank - bRank; // Lower rank number first (1, 2, 3...)
      });
    } else if (section === 'companies') {
      // For companies, preserve API ranking order - no additional sorting
      // The search filter has already been applied above
    } else if (sortField === 'smart_rank' || (verticalFilter !== 'all' || revenueFilter !== 'all' || lastContactedFilter !== 'all')) {
      // Smart combined ranking based on multiple criteria
      filtered = [...filtered].sort((a: any, b: any) => {
        // Calculate smart ranking score for each record
        const aScore = calculateSmartRankScore(a, verticalFilter, revenueFilter, lastContactedFilter);
        const bScore = calculateSmartRankScore(b, verticalFilter, revenueFilter, lastContactedFilter);
        
        return bScore - aScore; // Higher score first
      });
    } else if (sortField) {
      // Regular field sorting with robust field handling
      console.log(`🔍 [SORTING DEBUG] Sorting by field: "${sortField}", direction: "${sortDirection}"`);
      console.log(`🔍 [SORTING DEBUG] Sample records before sorting:`, filtered.slice(0, 3).map(r => ({
        id: r.id,
        name: r.name,
        priority: r.priority,
        nextAction: r.nextAction,
        sortValue: getSortableValue(r, sortField)
      })));
      
      filtered = [...filtered].sort((a: any, b: any) => {
        let aVal = getSortableValue(a, sortField);
        let bVal = getSortableValue(b, sortField);

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
        if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

        // Convert to comparable values
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        // Handle numeric values
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // Handle date values
        if (aVal instanceof Date && bVal instanceof Date) {
          return sortDirection === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
        }

        // String comparison
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      console.log(`🔍 [SORTING DEBUG] Sample records after sorting:`, filtered.slice(0, 3).map(r => ({
        id: r.id,
        name: r.name,
        priority: r.priority,
        nextAction: r.nextAction,
        sortValue: getSortableValue(r, sortField)
      })));
    }

    // Note: Removed rank limiting logic - user wants to see all records

    console.log(`🔍 [FILTERING] Filter result for ${section}:`, {
      originalLength: dataToFilter.length,
      filteredLength: filtered.length,
      firstFilteredRecord: filtered[0] ? {
        id: filtered[0].id,
        name: filtered[0].fullName || filtered[0].name,
        status: filtered[0].status
      } : null
    });

    return filtered;
  }, [finalData, searchQuery, verticalFilter, statusFilter, priorityFilter, revenueFilter, lastContactedFilter, sortField, sortDirection, timeframeFilter, section, timezoneFilter, companySizeFilter, locationFilter]);

  // Handle record selection - OPTIMIZED NAVIGATION with instant transitions
  const handleRecordClick = useCallback((record: any) => {
    // ⚡ PERFORMANCE MONITORING: Track click-to-navigation timing
    const clickStartTime = performance.now();
    
    // OPTIMISTIC: Update UI immediately for instant feedback
    setSelectedRecord(record);
    
    // Get the best available name for human-readable URL
    const recordName = record.fullName || record.name || record.firstName || 'record';
    
    console.log(`🔗 [PipelineView] Record clicked: ${recordName} (${record.id}) in section: ${section}`);
    
    // 🚀 LIGHTNING-FAST: Pre-cache record data for instant loading
    if (typeof window !== 'undefined') {
      const cacheStartTime = performance.now();
      
      // Store the record in sessionStorage for instant access on detail page
      sessionStorage.setItem(`cached-${section}-${record.id}`, JSON.stringify(record));
      
      // Pre-cache in a more accessible format for faster retrieval
      sessionStorage.setItem(`current-record-${section}`, JSON.stringify({
        id: record.id,
        name: recordName,
        data: record,
        timestamp: Date.now()
      }));
      
      const cacheEndTime = performance.now();
      console.log(`⚡ [PERFORMANCE] Caching took ${(cacheEndTime - cacheStartTime).toFixed(2)}ms`);
    }
    
    // ⚡ OPTIMIZED: Use existing navigation hook for consistency
    const navStartTime = performance.now();
    // Use the ULID (record.id) for all record types including sellers
    const recordId = record.id;
    
    // Handle navigation based on current context
    if (section === 'sellers') {
      // Navigate to seller companies page - use proper workspace slug
      const slug = `${recordName.toLowerCase().replace(/\s+/g, '-')}-${recordId}`;
      const currentWorkspace = user?.workspaces?.find(w => w.id === user?.activeWorkspaceId);
      // Use proper workspace slug generation
      const workspaceSlug = currentWorkspace?.name === 'Demo Workspace' ? 'demo' : 
                           currentWorkspace?.name?.toLowerCase().replace(/\s+/g, '-') || 'demo';
      window['location']['href'] = `/${workspaceSlug}/sellers/${slug}/companies`;
    } else if (section === 'companies' && sellerId) {
      // Navigate from seller companies to buyer group - use proper workspace slug
      const companySlug = `${recordName.toLowerCase().replace(/\s+/g, '-')}-${recordId}`;
      const currentWorkspace = user?.workspaces?.find(w => w.id === user?.activeWorkspaceId);
      const workspaceSlug = currentWorkspace?.name === 'Demo Workspace' ? 'demo' : 
                           currentWorkspace?.name?.toLowerCase().replace(/\s+/g, '-') || 'demo';
      window['location']['href'] = `/${workspaceSlug}/sellers/${sellerId}/companies/${companySlug}/buyer-group`;
    } else if (section === 'people' && sellerId && companyId) {
      // Navigate from buyer group to person record - use proper workspace slug
      const personSlug = `${recordName.toLowerCase().replace(/\s+/g, '-')}-${recordId}`;
      const currentWorkspace = user?.workspaces?.find(w => w.id === user?.activeWorkspaceId);
      const workspaceSlug = currentWorkspace?.name === 'Demo Workspace' ? 'demo' : 
                           currentWorkspace?.name?.toLowerCase().replace(/\s+/g, '-') || 'demo';
      window['location']['href'] = `/${workspaceSlug}/sellers/${sellerId}/companies/${companyId}/buyer-group/${personSlug}`;
    } else {
      navigateToPipelineItem(section, recordId, recordName);
    }
    
    const navEndTime = performance.now();
    const totalTime = navEndTime - clickStartTime;
    console.log(`⚡ [PERFORMANCE] Total click-to-navigation took ${totalTime.toFixed(2)}ms (navigation: ${(navEndTime - navStartTime).toFixed(2)}ms)`);
  }, [section, sellerId, companyId]);

  // Navigation functions for record detail view
  const handleNavigatePrevious = useCallback(() => {
    if (!data || !selectedRecord) return;
    
    const currentIndex = data.findIndex((r: any) => r['id'] === selectedRecord.id);
    if (currentIndex > 0) {
      const previousRecord = data[currentIndex - 1];
      setSelectedRecord(previousRecord);
      
      // Get the best available name for human-readable URL
      const recordName = previousRecord.fullName || previousRecord.name || previousRecord.firstName || 'record';
      
      // Update URL to reflect the new record with workspace context
      navigateToPipelineItem(section, previousRecord.id, recordName);
    }
  }, [data, selectedRecord, section]);

  const handleNavigateNext = useCallback(() => {
    if (!data || !selectedRecord) return;
    
    const currentIndex = data.findIndex((r: any) => r['id'] === selectedRecord.id);
    if (currentIndex < data.length - 1) {
      const nextRecord = data[currentIndex + 1];
      setSelectedRecord(nextRecord);
      
      // Get the best available name for human-readable URL
      const recordName = nextRecord.fullName || nextRecord.name || nextRecord.firstName || 'record';
      
      // Update URL to reflect the new record with workspace context
      navigateToPipelineItem(section, nextRecord.id, recordName);
    }
  }, [data, selectedRecord, section]);

  // Handle record reordering for drag-and-drop
  const handleReorderRecords = useCallback((fromIndex: number, toIndex: number) => {
    if (!data || fromIndex === toIndex) return;
    
    // Create a new array with the reordered items
    const newData = [...data];
    const [movedItem] = newData.splice(fromIndex, 1);
    if (!movedItem) return; // Safety check
    newData.splice(toIndex, 0, movedItem);
    
    // For now, just log the reorder - in a real app, you'd update the backend
    console.log(`Reordered ${section}: moved item from index ${fromIndex} to ${toIndex}`, {
      movedItem,
      newOrder: newData.map((item, index) => ({ index, id: item.id, name: item.name }))
    });
    
    // TODO: Implement backend update to persist the new order
    // await updateRecordOrder(section, newData.map(item => item.id));
  }, [data, section]);

  // Handle section navigation - UNIFIED with consistent loading states
  const handleSectionChange = useCallback((newSection: string) => {
    console.log(`🔄 [UNIFIED NAV] Switching from ${section} to ${newSection}`);
    
    // Use workspace-aware navigation for consistency
    navigateToPipeline(newSection);
    
    // Dispatch unified event for consistent state management
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pipeline-section-change', {
        detail: { 
          from: section, 
          to: newSection, 
          workspaceId, 
          userId,
          timestamp: Date.now()
        }
      }));
    }
  }, [section, navigateToPipeline, workspaceId, userId]);

  // Handle refresh
  const handleRefresh = async () => {
    console.log(`🔄 Refreshing ${section} data...`);
    await refresh();
  };

  // Handle cache clear
  const handleClearCache = () => {
    console.log(`🧹 Clearing ${section} cache...`);
    clearCache();
    refresh();
  };

  // 🆕 FORCE REFRESH: Add force refresh mechanism for pagination issues
  const handleForceRefresh = async () => {
    console.log(`🔄 Force refreshing ${section} data...`);
    // Clear all caches and force fresh data load
    clearCache();
    // Force refresh with timestamp to bypass cache
    const timestamp = Date.now();
    await refresh();
    console.log(`✅ Force refresh completed for ${section} at ${timestamp}`);
  };

  // 🚀 CACHE OPTIMIZATION: Removed aggressive auto-refresh that was causing unnecessary reloads
  // The cache system now handles data freshness intelligently without forcing refreshes on navigation

  // Handle add record
  const handleAddRecord = () => {
    // Set the active section and open the modal
    ui.setActiveSection(section);
    ui.setIsAddModalOpen(true);
  };

  const handleSortChange = useCallback((field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    console.log(`🔧 Sort changed: ${field} ${sortField === field ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc'}`);
  }, [sortField, sortDirection]);

  // Handle sort from dropdown (different from column clicks)
  const handleDropdownSortChange = useCallback((field: string) => {
    // Map dropdown field names to actual data field names
    const fieldMapping: Record<string, string> = {
      'rank': 'rank',
      'company': 'company',
      'name': 'name',
      'status': 'status',
      'stage': 'stage',
      'lastContact': 'lastActionDate',
      'nextAction': 'nextAction'
    };
    
    const actualField = fieldMapping[field] || field;
    setSortField(actualField);
    setSortDirection('asc'); // Always start with ascending from dropdown
    console.log(`🔧 Dropdown sort: ${field} -> ${actualField}`);
  }, []);

  const handleColumnSort = useCallback((columnName: string) => {
    // Map column display names to actual data field names (section-specific)
    const getFieldMapping = () => {
      const baseMap: Record<string, string> = {
        'Rank': 'rank',
        'Company': 'company',
        'Person': 'name',
        'Name': 'name',
        'Title': 'title',
        'Status': 'status',
        'Priority': 'priority',
        'Industry': 'industry',
        'Email': 'email',
        'Phone': 'phone',
        'Last Action': 'lastContactDate',
        'Next Action': 'nextAction'
      };

      // Section-specific field mappings
      if (section === 'speedrun') {
        return {
          ...baseMap,
          'Last Action': 'lastContact', // Speedrun uses 'lastContact' not 'lastContactDate'
          'Advice': 'nextAction',
        };
      } else if (section === 'opportunities') {
        return {
          ...baseMap,
          'Amount': 'amount',
          'Stage': 'stage',
          'Last Action': 'lastContactDate',
        };
      } else {
        return {
          ...baseMap,
          // Base map already includes Last Action and Next Action
        };
      }
    };

    const fieldMap = getFieldMapping();
    const field = fieldMap[columnName as keyof typeof fieldMap] || columnName.toLowerCase().replace(/\s+/g, '');
    
    console.log(`🔧 Column sort: ${columnName} -> ${field}`);
    handleSortChange(field);
  }, [handleSortChange, section]);

  const handleColumnVisibilityChange = useCallback((columns: string[]) => {
    setVisibleColumns(columns);
  }, []);

  // Smart ranking calculation function
  const calculateSmartRankScore = useCallback((record: any, vertical: string, revenue: string, lastContacted: string) => {
    let score = 0;
    
    // Vertical/Industry match score (40% weight)
    if (vertical !== 'all') {
      const recordVertical = record.vertical || record.industry || record.company?.vertical || record.company?.industry || '';
      if (recordVertical.toLowerCase().replace(/\s+/g, '_') === vertical) {
        score += 40;
      }
    }
    
    // Revenue size score (35% weight) - higher revenue = higher score
    if (revenue !== 'all') {
      const recordRevenue = record.revenue || record.company?.revenue || record.annualRevenue || 0;
      const revenueNum = typeof recordRevenue === 'string' ? parseFloat(recordRevenue.replace(/[^0-9.]/g, '')) : recordRevenue;
      
      switch (revenue) {
        case 'enterprise': score += revenueNum >= 1000000000 ? 35 : 0; break;
        case 'large': score += (revenueNum >= 100000000 && revenueNum < 1000000000) ? 30 : 0; break;
        case 'medium': score += (revenueNum >= 10000000 && revenueNum < 100000000) ? 25 : 0; break;
        case 'small': score += (revenueNum >= 1000000 && revenueNum < 10000000) ? 20 : 0; break;
        case 'startup': score += revenueNum < 1000000 ? 15 : 0; break;
      }
    }
    
    // Last contacted urgency score (25% weight) - more urgent = higher score
    if (lastContacted !== 'all') {
      const lastContact = record.lastContactDate || record.lastContact || record.lastAction;
      if (lastContacted === 'never' && !lastContact) {
        score += 25; // Never contacted = highest urgency
      } else if (lastContact) {
        const contactDate = new Date(lastContact);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (lastContacted) {
          case 'overdue': score += daysDiff > 14 ? 25 : 0; break;
          case 'quarter': score += daysDiff <= 90 ? 20 : 0; break;
          case 'month': score += daysDiff <= 30 ? 15 : 0; break;
          case 'week': score += daysDiff <= 7 ? 10 : 0; break;
          case 'today': score += daysDiff === 0 ? 5 : 0; break;
        }
      }
    }
    
    // Additional scoring factors
    // Status bonus
    if (record.status) {
      const status = record.status.toLowerCase();
      if (['qualified', 'opportunity', 'proposal', 'negotiation'].includes(status)) {
        score += 10;
      } else if (['prospect', 'contacted', 'engaged'].includes(status)) {
        score += 5;
      }
    }
    
    // Title/Role bonus (decision makers get priority)
    if (record.title) {
      const title = record.title.toLowerCase();
      if (title.includes('ceo') || title.includes('president') || title.includes('founder')) {
        score += 10;
      } else if (title.includes('cto') || title.includes('cfo') || title.includes('vp') || title.includes('director')) {
        score += 7;
      } else if (title.includes('manager') || title.includes('lead')) {
        score += 3;
      }
    }
    
    return score;
  }, []);

  
  // CLIENTS DEBUG: Extra logging for clients section
  if (section === 'clients') {
    console.log(`🛒 [CLIENTS DEBUG] Detailed state:`, {
      section,
      workspaceId,
      userId,
      error,
      dataExists: Array.isArray(finalData),
      dataLength: Array.isArray(finalData) ? finalData.length : 0,
      rawData: Array.isArray(finalData) ? finalData.slice(0, 2) : [], // Show first 2 records for debugging
      filteredDataLength: filteredData?.length || 0,
      isEmpty
    });
  }
  

  // 🚀 CACHE ERROR FIX: Only show error state for persistent errors, not during loading
  if (error && !finalLoading && finalData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading {section}
          </h3>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : String(error)}</p>
          <div className="space-x-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create the middle panel content
  const middlePanel = section === 'metrics' ? (
    <MetricsDashboard />
  ) : section === 'dashboard' ? (
    (() => {
      console.log('🚨 [PipelineView CRITICAL] Rendering Dashboard component!');
      return <Dashboard />;
    })()
  ) : finalLoading ? (
    // 🚀 PERFORMANCE: Show XL loading skeleton while fast section data loads
    <div className="h-full flex flex-col bg-white max-w-full overflow-hidden">
      {/* Top header skeleton - includes title, count, and action buttons */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Search and filters skeleton - includes search bar, filter buttons, and count */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-gray-200">
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="h-10 bg-gray-200 rounded w-80 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="flex-1 p-6 max-w-full overflow-hidden">
        <div className="space-y-4">
          {/* Table header skeleton */}
          <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          
          {/* Table rows skeleton */}
          {[...Array(15)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 py-3">
              <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="h-full flex flex-col bg-white overflow-hidden">

      {/* Header with metrics and actions */}
      <PipelineHeader
        section={section}
        metrics={metrics}
        onSectionChange={handleSectionChange}
        onRefresh={handleRefresh}
        onClearCache={handleClearCache}
        onAddRecord={handleAddRecord}
        title={title}
        subtitle={subtitle}
        recordCount={sectionData.count}
      />

      {/* Filters - Hide search/filter/sort/columns when there is no data */}
      {finalData.length > 0 && (
        <div className={`flex-shrink-0 px-6 pb-1 w-full ${section === 'opportunities' ? 'pt-1' : 'pt-2'}`}>
          <PipelineFilters 
            section={section}
            totalCount={sectionData.count}
            onSearchChange={setSearchQuery}
            onVerticalChange={setVerticalFilter}
            onStatusChange={setStatusFilter}
            onPriorityChange={setPriorityFilter}
            onRevenueChange={setRevenueFilter}
            onLastContactedChange={setLastContactedFilter}
            onTimezoneChange={setTimezoneFilter}
            onSortChange={handleDropdownSortChange}
            onAddRecord={handleAddRecord}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            visibleColumns={visibleColumns}
            // 🎯 NEW SELLER FILTERS
            onCompanySizeChange={setCompanySizeFilter}
          onLocationChange={setLocationFilter}
        />
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 px-6 min-h-0 ${section === 'speedrun' ? 'pb-4' : 'pb-2'}`} style={{
        minHeight: 'calc(100vh - 150px)', // Extend table height further down
        maxWidth: '100%', // Prevent overflow into right panel
        overflowX: 'hidden' // Prevent horizontal overflow
      }}>
        {Array.isArray(finalData) && finalData.length > 0 && (filteredData?.length === 0) ? (
          // Filtered empty state (data exists but filters hide it)
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No results found
              </h4>
              <p className="text-sm text-gray-600 max-w-sm">
                No {section} match your current filters. Try adjusting your search or filters.
              </p>
            </div>
          </div>
        ) : !hasData && !error && workspaceId && userId ? (
          // Show simple centered empty state instead of table with placeholder
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-6" style={{ marginTop: '-40px' }}>
              <h4 className="text-lg font-medium text-black mb-2">
                No {section} yet
              </h4>
              <p className="text-sm text-black max-w-sm">
                {section === 'leads' ? 'Start building your warm relationships by adding your first lead.' :
                 section === 'prospects' ? 'Begin your outreach by adding prospects to your pipeline.' :
                 section === 'clients' ? 'Track your successful relationships and client success.' :
                 section === 'people' ? 'Build your network by adding people to your database.' :
                 section === 'companies' ? 'Expand your company intelligence by adding organizations.' :
                 section === 'speedrun' ? 'Add your first speedrun to get started.' :
                 `Add your first ${section.slice(0, -1)} to get started.`}
              </p>
            </div>
          </div>
        ) : (
          // Data view - Different content types based on section
          <>
            {section === 'opportunities' ? (
              <OpportunitiesKanban
                data={(filteredData || []) as any[]} // Type assertion for compatibility
                onRecordClick={handleRecordClick}
              />
            ) : section === 'speedrun' ? (
              // Speedrun table with same design as other sections
              <PipelineTable
                section={section}
                data={filteredData || []}
                onRecordClick={handleRecordClick}
                onReorderRecords={handleReorderRecords}
                onColumnSort={handleColumnSort}
                sortField={sortField}
                sortDirection={sortDirection}
                visibleColumns={visibleColumns}
                pageSize={50} // Speedrun shows all 50 items on one page
                isLoading={isLoading}
                totalCount={sectionData.count} // Pass total count for correct pagination
              />
              ) : section === 'prospects' ? (
                // Prospects table with same design as other sections
                <PipelineTable
                  section={section}
                  data={filteredData || []}
                  onRecordClick={handleRecordClick}
                  onReorderRecords={handleReorderRecords}
                  onColumnSort={handleColumnSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  visibleColumns={visibleColumns}
                  pageSize={100}
                  isLoading={sectionData.loading}
                  totalCount={sectionData.count}
                />
              ) : section === 'leads' ? (
                // Leads table with same design as prospects
                <PipelineTable
                  section={section}
                  data={filteredData || []}
                  onRecordClick={handleRecordClick}
                  onReorderRecords={handleReorderRecords}
                  onColumnSort={handleColumnSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  visibleColumns={visibleColumns}
                  pageSize={100}
                  isLoading={sectionData.loading}
                  totalCount={sectionData.count}
                />
              ) : section === 'people' ? (
                // People table with same design as prospects
                <PipelineTable
                  section={section}
                  data={filteredData || []}
                  onRecordClick={handleRecordClick}
                  onReorderRecords={handleReorderRecords}
                  onColumnSort={handleColumnSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  visibleColumns={visibleColumns}
                  pageSize={100}
                  isLoading={sectionData.loading}
                  totalCount={sectionData.count}
                />
              ) : section === 'companies' ? (
                // Companies table with same design as prospects
                <PipelineTable
                  section={section}
                  data={filteredData || []}
                  onRecordClick={handleRecordClick}
                  onReorderRecords={handleReorderRecords}
                  onColumnSort={handleColumnSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  visibleColumns={visibleColumns}
                  pageSize={100}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  totalCount={sectionData.count} // Pass total count for correct pagination
                />
              ) : section === 'sellers' ? (
                // Sellers table with same design as people and companies
                <PipelineTable
                  section={section}
                  data={filteredData || []}
                  onRecordClick={handleRecordClick}
                  onReorderRecords={handleReorderRecords}
                  onColumnSort={handleColumnSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  visibleColumns={visibleColumns}
                  pageSize={100}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  totalCount={sectionData.count} // Pass total count for correct pagination
                />
          ) : (
            <PipelineTable
              section={section}
              data={filteredData || []}
              onRecordClick={handleRecordClick}
              onReorderRecords={handleReorderRecords}
              onColumnSort={handleColumnSort}
              sortField={sortField}
              sortDirection={sortDirection}
              visibleColumns={visibleColumns}
              pageSize={100} // Default page size for other sections
              isLoading={isLoading}
              totalCount={fastSectionData.count} // Pass total count for correct pagination
            />
          )}
          </>
        )}
      </div>
    </div>
  );

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

        {/* Navigation Transition Overlay */}
        
        <PanelLayout
        thinLeftPanel={null}
        leftPanel={
          <LeftPanel 
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
        middlePanel={middlePanel}
        rightPanel={<RightPanel />}
        zoom={zoom}
        isLeftPanelVisible={ui.isLeftPanelVisible}
        isRightPanelVisible={ui.isRightPanelVisible}
        onToggleLeftPanel={ui.toggleLeftPanel}
        onToggleRightPanel={ui.toggleRightPanel}
      />
    
    {/* Profile Popup - Pipeline Implementation */}
    {(() => {
      const shouldRender = isProfileOpen && profileAnchor;
      console.log('🔍 PipelineView Profile popup render check:', { 
        isProfileOpen, 
        profileAnchor: !!profileAnchor,
        profileAnchorElement: profileAnchor,
        user: !!pipelineUser,
        company,
        workspace,
        shouldRender
      });
      if (shouldRender) {
        console.log('✅ PipelineView ProfileBox SHOULD render - all conditions met');
      } else {
        console.log('❌ PipelineView ProfileBox will NOT render:', {
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
          isProspectsVisible={isProspectsVisible}
          setIsProspectsVisible={setIsProspectsVisible}
          isLeadsVisible={isLeadsVisible}
          setIsLeadsVisible={setIsLeadsVisible}
          isOpportunitiesVisible={isOpportunitiesVisible}
          setIsOpportunitiesVisible={setIsOpportunitiesVisible}
          isCustomersVisible={isCustomersVisible}
          setIsCustomersVisible={setIsCustomersVisible}
          isPartnersVisible={isPartnersVisible}
          setIsPartnersVisible={setIsPartnersVisible}
          onSpeedrunEngineClick={() => {
            console.log("Speedrun engine clicked in PipelineView");
            setIsProfileOpen(false);
            setIsSpeedrunEngineModalOpen(true);
          }}
          isDemoMode={typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')}
          currentDemoScenario={typeof window !== "undefined" && window.location.pathname.startsWith('/demo/') ? window.location.pathname.split('/')[2] : null}
          onDemoScenarioChange={(scenarioSlug) => {
            console.log(`🎯 PipelineView: Demo scenario selected: ${scenarioSlug}`);
            // The ProfileBox will handle the navigation
          }}
        />
      </div>
    )}
    
    {/* Speedrun Engine Modal */}
    <SpeedrunEngineModal
      isOpen={isSpeedrunEngineModalOpen}
      onClose={() => setIsSpeedrunEngineModalOpen(false)}
    />

    {/* Monaco Signal Popup - Only show for speedrun section */}
    {section === 'speedrun' && isSlideUpVisible && (
      <div className="fixed bottom-6 right-4 z-[9999] animate-in slide-in-from-right duration-300">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-[520px] p-7">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Buying Intent Detected</h3>
                <p className="text-gray-600 text-sm">Pipeline Speedrun Signal</p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log('❌ [Monaco Signal] X button clicked - dismissing popup');
                if (activeSignal) {
                  dismissSignal();
                }
                setIsSlideUpVisible(false);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                  {activeSignal?.contact.name?.charAt(0) || 'R'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activeSignal?.contact.name || 'Real Time'}</p>
                  <p className="text-sm text-gray-600">{(activeSignal?.contact as any)?.title || 'IT Director'} at {activeSignal?.contact.company || 'RealTime Corp'}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                "{activeSignal?.note?.content || 'URGENT: Budget approved for $500K implementation. Need to move fast - decision makers ready to sign.'}"
              </p>
            </div>
            
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="text-gray-900 font-medium">Recommendation:</span> Move to #1 on Speedrun (prime timing for outreach)
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (activeSignal) {
                    const contactName = activeSignal?.contact?.name || 'Contact';
                    try {
                      console.log(`🚨 [Pipeline Speedrun] Accepting signal for: ${contactName}`);
                      await acceptSignal();
                      
                      // Only set success message after successful API call
                      setSuccessMessage(`✅ ${contactName} added to Speedrun!`);
                      setTimeout(() => setSuccessMessage(null), 5000);
                      
                      console.log(`✅ [Pipeline Speedrun] Signal accepted successfully for: ${contactName}`);
                      
                      // Refresh the pipeline data to show the new lead
                      refresh(); // Use the refresh function instead of reload
                      
                      // Force refresh of Speedrun data specifically
                      window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
                        detail: { 
                          section: 'speedrun', 
                          type: 'signal-accepted', 
                          contact: activeSignal.contact 
                        }
                      }));
                      
                      // Also dispatch speedrun-specific refresh event for speedrun components
                      window.dispatchEvent(new CustomEvent('speedrun-data-refresh', {
                        detail: { type: 'signal-accepted', contact: activeSignal.contact }
                      }));
                      
                      console.log(`🔄 [Pipeline Speedrun] Refresh events dispatched for: ${contactName}`);
                      
                    } catch (error) {
                      console.error(`❌ [Pipeline Speedrun] Failed to accept signal for ${contactName}:`, error);
                      setSuccessMessage(`❌ Failed to add ${contactName} to Speedrun. Please try again.`);
                      setTimeout(() => setSuccessMessage(null), 5000);
                    }
                  }
                  setIsSlideUpVisible(false);
                }}
                className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-3"
              >
                Accept
                <kbd className="px-2 py-1 bg-green-200 text-green-700 rounded text-sm font-mono">⌘↵</kbd>
              </button>
              <button
                onClick={() => {
                  if (activeSignal) {
                    dismissSignal();
                  }
                  setIsSlideUpVisible(false);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    
        <AddModal refreshData={async () => { await refresh(); }} />
      </>
    </PipelineHydrationFix>
  );
});

