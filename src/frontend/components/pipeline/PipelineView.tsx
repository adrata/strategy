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
import { useUnifiedAuth } from '@/platform/auth-unified';
import { getSectionColumns } from '@/platform/config/workspace-table-config';
import { usePipelineData } from '@/platform/hooks/useAdrataData';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { PipelineLeftPanelStandalone } from '@/products/pipeline/components/PipelineLeftPanelStandalone';
import { AIRightPanel } from '@/platform/ui/components/chat/AIRightPanel';
// import { useZoom } from '@/platform/ui/components/ZoomProvider';

import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { useAdrataData } from '@/platform/hooks/useAdrataData';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';
import { Pagination } from './table/Pagination';
// import { AdrataComponent } from '@/platform/ui/components/AdrataComponent'; // Component not found
import { AddModal } from '@/platform/ui/components/AddModal';
import { ProfileBox } from '@/platform/ui/components/ProfileBox';
import { useProfilePopup } from '@/platform/ui/components/ProfilePopupContext';
import { usePipeline } from '@/products/pipeline/context/PipelineContext';
import { SpeedrunEngineModal } from '@/platform/ui/components/SpeedrunEngineModal';
import { useSpeedrunSignals } from "@/platform/hooks/useSpeedrunSignals";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
// Import getCurrentWorkspaceSlug from the correct location



interface PipelineViewProps {
  section: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners' | 'sellers' | 'speedrun' | 'metrics' | 'dashboard';
}

// PERFORMANCE: Memoize component to prevent unnecessary re-renders
export const PipelineView = React.memo(function PipelineView({ section }: PipelineViewProps) {
  console.log('🔍 [PipelineView] Component rendered for section:', section);
  
  
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
  // Panel visibility is now managed by useAcquisitionOSUI context
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
        return ['Rank', 'Company', 'Person', 'Stage', 'Last Action', 'Next Action', 'Actions'];
      case 'companies':
        return ['Rank', 'Company', 'Last Action', 'Next Action', 'Actions'];
      case 'leads':
        return ['Rank', 'Name', 'Company', 'Title', 'Last Action', 'Next Action', 'Actions'];
      case 'prospects':
        return ['Rank', 'Name', 'Company', 'Title', 'Last Action', 'Next Action', 'Actions'];
      case 'opportunities':
        return ['Rank', 'Name', 'Account', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action', 'Actions'];
      case 'people':
        return ['Rank', 'Name', 'Company', 'Title', 'Last Action', 'Next Action', 'Actions'];
      case 'clients':
        return ['Rank', 'Company', 'Industry', 'Status', 'ARR', 'Health Score', 'Last Action', 'Actions'];
      case 'partners':
        return ['Rank', 'Partner', 'Type', 'Relationship', 'Strength', 'Last Action', 'Actions'];
      default:
        return ['Rank', 'Company', 'Name', 'Title', 'Last Action', 'Actions'];
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
  
  // 🆕 CRITICAL FIX: Use provider workspace instead of URL detection
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;
  
  console.log('🔍 [WORKSPACE DEBUG] Using provider workspace:', {
    acquisitionDataExists: !!acquisitionData,
    providerWorkspaceId: workspaceId,
    userActiveWorkspaceId: user?.activeWorkspaceId
  });
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
  const userId = getUserIdForWorkspace(workspaceId || '');
  
  // 🚀 PERFORMANCE: Use fast section data hook for instant loading
  // Load all data at once for client-side pagination
  const fastSectionData = useFastSectionData(section, 1000);
  
  // Fallback to old pipeline data for sections not supported by fast API
  const pipelineData = usePipelineData(section, workspaceId, userId);
  
  console.log('🔍 [PIPELINE VIEW DEBUG] Final context:', { workspaceId, userId, section });
  
  // AGGRESSIVE DEBUG: Log every render
  console.log('🔍 [PIPELINE VIEW] Component render:', {
    section,
    userWorkspaces: user?.workspaces?.map(w => ({ id: w.id, name: w.name })),
    finalWorkspaceId: workspaceId,
    finalUserId: userId,
    acquisitionDataExists: !!acquisitionData
  });
  
  // 🚀 PERFORMANCE: Use consistent data source with proper loading states
  const getSectionData = (section: string) => {
    const acquireData = acquisitionData?.acquireData || {};
    
    // 🚀 PERFORMANCE: Log data consistency for debugging
    console.log(`🔍 [PIPELINE VIEW] Getting data for section ${section}:`, {
      hasAcquisitionData: !!acquisitionData,
      hasAcquireData: !!acquisitionData?.acquireData,
      acquireDataKeys: Object.keys(acquireData),
      sectionDataLength: acquireData[section]?.length || 0,
      isLoading: acquisitionData?.loading?.isLoading,
      dataSource: 'acquisitionData'
    });
    
    switch (section) {
      case 'leads': 
      case 'prospects': 
      case 'opportunities': 
      case 'clients': 
      case 'partners': 
      case 'sellers': 
        return acquireData[section] || [];
      case 'companies': 
        const companiesData = acquireData.companies || [];
        console.log('🏢 [COMPANIES DEBUG] Companies data from API:', {
          totalCompanies: companiesData.length,
          sampleCompanies: companiesData.slice(0, 3).map(c => ({ id: c.id, name: c.name, rank: c.rank })),
          ranksRange: {
            firstRank: companiesData[0]?.rank,
            lastRank: companiesData[companiesData.length - 1]?.rank,
            maxRank: Math.max(...companiesData.map(c => c.rank || 0).filter(r => r > 0))
          }
        });
        return companiesData;
      case 'people': 
        const peopleData = acquireData.people || [];
        console.log('👥 [PEOPLE DEBUG] People data from API:', {
          totalPeople: peopleData.length,
          samplePeople: peopleData.slice(0, 3).map(p => ({ id: p.id, name: p.fullName || p.name, rank: p.rank })),
          ranksRange: {
            firstRank: peopleData[0]?.rank,
            lastRank: peopleData[peopleData.length - 1]?.rank,
            maxRank: Math.max(...peopleData.map(p => p.rank || 0).filter(r => r > 0))
          }
        });
        return peopleData;
      case 'speedrun': 
        const speedrunData = acquireData.speedrunItems || [];
        console.log('🔍 [SPEEDRUN DEBUG] Speedrun data access:', {
          hasAcquireData: !!acquireData,
          dataLength: speedrunData.length,
          sampleRecord: speedrunData[0] ? {
            id: speedrunData[0].id,
            name: speedrunData[0].name,
            fullName: speedrunData[0].fullName,
            firstName: speedrunData[0].firstName,
            lastName: speedrunData[0].lastName,
            company: speedrunData[0].company,
            title: speedrunData[0].title,
            jobTitle: speedrunData[0].jobTitle
          } : null
        });
        
        // 🎯 STRATEGIC RANKING: Apply UniversalRankingEngine to speedrun data for company-based alphanumeric ranks
        if (speedrunData.length > 0) {
          try {
            // Import and apply the UniversalRankingEngine
            const { UniversalRankingEngine } = require('@/products/speedrun/UniversalRankingEngine');
            
            // Transform data to SpeedrunPerson format for ranking
            const transformedData = speedrunData.map((item: any) => ({
              id: item.id || `speedrun-${Math.random()}`,
              name: item.name || item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
              email: item.email || '',
              company: item.company || item.companyName || '-',
              title: item.title || item.jobTitle || '-',
              phone: item.phone || item.phoneNumber || '',
              location: item.location || item.city || '',
              industry: item.industry || 'Technology',
              status: item.status || 'active',
              priority: item.priority || 'medium',
              lastContact: item.lastContact || item.updatedAt,
              notes: item.notes || '',
              tags: item.tags || [],
              source: item.source || 'speedrun',
              enrichmentScore: item.enrichmentScore || 0,
              buyerGroupRole: item.buyerGroupRole || 'unknown',
              currentStage: item.currentStage || 'initial',
              nextAction: item.nextAction || '',
              nextActionDate: item.nextActionDate || '',
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString(),
              assignedUser: item.assignedUser || null,
              workspaceId: item.workspaceId || '',
              relationship: item.relationship || 'prospect',
              bio: item.bio || '',
              interests: item.interests || [],
              recentActivity: item.recentActivity || '',
              commission: item.commission || '50K',
              linkedin: item.linkedin || item.linkedinUrl || '',
              photo: item.photo || null,
              ...item // Include any additional fields
            }));
            
            // Apply strategic ranking
            const rankedData = UniversalRankingEngine.rankProspectsForWinning(
              transformedData,
              workspaceName || 'workspace'
            );
            
            console.log('🏆 [SPEEDRUN RANKING] Applied strategic ranking:', {
              originalCount: speedrunData.length,
              rankedCount: rankedData.length,
              sampleRanks: rankedData.slice(0, 5).map(p => ({
                name: p.name,
                company: p.company,
                rank: p.winningScore?.rank,
                totalScore: p.winningScore?.totalScore
              }))
            });
            
            return rankedData;
          } catch (error) {
            console.error('❌ [SPEEDRUN RANKING] Failed to apply strategic ranking:', error);
            return speedrunData; // Fallback to original data
          }
        }
        
        return speedrunData;
      default: return [];
    }
  };
  
  const sectionData = getSectionData(section);
  
  // DEBUG: Log the data loading
  console.log(`🔍 [PIPELINE VIEW DEBUG] Section: ${section}`, {
    hasAcquisitionData: !!acquisitionData,
    hasAcquireData: !!acquisitionData?.acquireData,
    sectionDataLength: sectionData?.length || 0,
    sectionDataSample: sectionData?.slice(0, 2) || [],
    acquisitionDataKeys: acquisitionData?.acquireData ? Object.keys(acquisitionData.acquireData) : [],
    rawAcquisitionData: acquisitionData,
    // Specific debugging for companies and people
    companiesData: acquisitionData?.acquireData?.companies || [],
    peopleData: acquisitionData?.acquireData?.people || [],
    companiesLength: acquisitionData?.acquireData?.companies?.length || 0,
    peopleLength: acquisitionData?.acquireData?.people?.length || 0
  });
  
  // 🚀 PERFORMANCE: Use fast section data for instant loading
  const finalData = fastSectionData.data || pipelineData.data || [];
  const finalLoading = fastSectionData.loading || pipelineData.loading;
  const finalError = fastSectionData.error || pipelineData.error;
  const finalIsEmpty = (fastSectionData.data || []).length === 0;
  
  // 🔍 DEBUG: Log data sources for People section
  if (section === 'people') {
    console.log('🔍 [PEOPLE DEBUG] Data sources:', {
      section,
      fastSectionData: {
        hasData: !!fastSectionData.data,
        dataLength: fastSectionData.data?.length || 0,
        loading: fastSectionData.loading,
        error: fastSectionData.error,
        firstPerson: fastSectionData.data?.[0] ? {
          rank: fastSectionData.data[0].rank,
          name: fastSectionData.data[0].name,
          company: fastSectionData.data[0].company?.name || fastSectionData.data[0].company
        } : null
      },
      pipelineData: {
        hasData: !!pipelineData.data,
        dataLength: pipelineData.data?.length || 0,
        loading: pipelineData.loading,
        error: pipelineData.error,
        firstPerson: pipelineData.data?.[0] ? {
          rank: pipelineData.data[0].rank,
          name: pipelineData.data[0].name,
          company: pipelineData.data[0].company?.name || pipelineData.data[0].company
        } : null
      },
      finalData: {
        hasData: !!finalData,
        dataLength: finalData?.length || 0,
        firstPerson: finalData?.[0] ? {
          rank: finalData[0].rank,
          name: finalData[0].name,
          company: finalData[0].company?.name || finalData[0].company
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

  // CRITICAL FIX: Define sectionDataArray before using it in filteredData
  // 🚀 PERFORMANCE: Use fast section data for instant loading
  const sectionDataArray = finalData;
  const hasData = Array.isArray(sectionDataArray) && sectionDataArray.length > 0;
  
  // Calculate isEmpty based on actual data
  const isEmpty = !hasData;

  // CRITICAL DEBUG: Log the final data state with source information
  console.log(`🚨 [CRITICAL DEBUG] Final data state for section ${section}:`, {
    hasData,
    dataLength: Array.isArray(sectionDataArray) ? sectionDataArray.length : 0,
    data: Array.isArray(sectionDataArray) ? sectionDataArray.slice(0, 3) : [],
    error,
    isEmpty,
    workspaceId,
    userId,
    dataSource: {
      fastSectionDataLength: fastSectionData.data?.length || 0,
      pipelineDataLength: pipelineData.data?.length || 0,
      usingFastSectionData: (fastSectionData.data && fastSectionData.data.length > 0),
      usingPipelineData: !(fastSectionData.data && fastSectionData.data.length > 0)
    }
  });

  // Filter and sort data based on all filters and sort criteria
  const filteredData = React.useMemo(() => {
    // CRITICAL FIX: Use sectionDataArray (acquisition data) instead of pipelineData.data
    const dataToFilter = Array.isArray(sectionDataArray) ? sectionDataArray : [];
    if (!dataToFilter || dataToFilter.length === 0) return dataToFilter;
    
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

      // Last contacted filter
      const matchesLastContacted = lastContactedFilter === 'all' || (() => {
        const lastContact = record.lastContactDate || record.lastContact || record.lastAction;
        if (!lastContact && lastContactedFilter === 'never') return true;
        if (!lastContact) return false;
        
        const contactDate = new Date(lastContact);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (lastContactedFilter) {
          case 'today': return daysDiff === 0;
          case 'week': return daysDiff <= 7;
          case 'month': return daysDiff <= 30;
          case 'quarter': return daysDiff <= 90;
          case 'overdue': return daysDiff > 14; // Overdue if not contacted in 2 weeks
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

      return matchesSearch && matchesVertical && matchesRevenue && matchesLastContacted && matchesStatus && matchesPriority && matchesTimezone;
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

    return filtered;
  }, [sectionDataArray, searchQuery, verticalFilter, statusFilter, priorityFilter, revenueFilter, lastContactedFilter, sortField, sortDirection, timeframeFilter, section, timezoneFilter]);

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
    
    // For sellers, navigate to the companies page instead of the main seller page
    if (section === 'sellers') {
      // Navigate to seller companies page
      const slug = `${recordName.toLowerCase().replace(/\s+/g, '-')}-${recordId}`;
      window['location']['href'] = `/demo/zeropoint/sellers/${slug}/companies`;
    } else {
      navigateToPipelineItem(section, recordId, recordName);
    }
    
    const navEndTime = performance.now();
    const totalTime = navEndTime - clickStartTime;
    console.log(`⚡ [PERFORMANCE] Total click-to-navigation took ${totalTime.toFixed(2)}ms (navigation: ${(navEndTime - navStartTime).toFixed(2)}ms)`);
  }, [section]);

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

  // 🆕 AUTO FORCE REFRESH: Automatically force refresh when page changes
  useEffect(() => {
    const handlePageChange = () => {
      console.log(`🔄 [AUTO REFRESH] Page changed, force refreshing ${section} data...`);
      handleForceRefresh();
    };

    // Listen for page changes
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePageChange);
      return () => window.removeEventListener('popstate', handlePageChange);
    }
  }, [section]);

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
    setSortField(field);
    setSortDirection('asc'); // Always start with ascending from dropdown
    console.log(`🔧 Dropdown sort: ${field}`);
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
      dataExists: Array.isArray(sectionDataArray),
      dataLength: Array.isArray(sectionDataArray) ? sectionDataArray.length : 0,
      rawData: Array.isArray(sectionDataArray) ? sectionDataArray.slice(0, 2) : [], // Show first 2 records for debugging
      filteredDataLength: filteredData?.length || 0,
      isEmpty
    });
  }
  

  // Error state
  if (error) {
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
    <div className="h-full flex flex-col bg-white">
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
      <div className="flex-1 p-6">
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
    <div className="h-full flex flex-col bg-white">

      {/* Header with metrics and actions */}
      <PipelineHeader
        section={section}
        metrics={metrics}
        onSectionChange={handleSectionChange}
        onRefresh={handleRefresh}
        onClearCache={handleClearCache}
        onAddRecord={handleAddRecord}
        recordCount={fastSectionData.count || (Array.isArray(sectionDataArray) ? sectionDataArray.length : 0)}
      />

      {/* Filters */}
      <div className={`flex-shrink-0 px-6 pb-1 w-full ${section === 'opportunities' ? 'pt-1' : 'pt-2'}`}>
        <PipelineFilters 
          section={section}
          totalCount={Array.isArray(sectionDataArray) ? sectionDataArray.length : 0}
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
        />
      </div>

      {/* Main content */}
      <div className={`flex-1 px-6 min-h-0 ${section === 'speedrun' ? 'pb-4' : 'pb-2'}`}>
        {Array.isArray(sectionDataArray) && sectionDataArray.length > 0 && (filteredData?.length === 0) ? (
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
        ) : !hasData && !error && section !== 'opportunities' && workspaceId && userId ? (
          // Show simple centered empty state instead of table with placeholder
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-6" style={{ marginTop: '-40px' }}>
              <h4 className="text-lg font-medium text-black mb-2">
                No {section} yet
              </h4>
              <p className="text-sm text-black max-w-sm mb-4">
                {section === 'leads' ? 'Start building your warm relationships by adding your first lead.' :
                 section === 'prospects' ? 'Begin your outreach by adding prospects to your pipeline.' :
                 section === 'clients' ? 'Track your successful relationships and client success.' :
                 section === 'people' ? 'Build your network by adding people to your database.' :
                 section === 'companies' ? 'Expand your company intelligence by adding organizations.' :
                 section === 'speedrun' ? 'Add your first speedrun to get started.' :
                 `Add your first ${section.slice(0, -1)} to get started.`}
              </p>
              <button
                onClick={handleAddRecord}
                className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                Add {section === 'people' ? 'Person' : section === 'companies' ? 'Company' : section === 'speedrun' ? 'Speedrun' : section.slice(0, -1)}
              </button>
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
                pageSize={30} // Speedrun shows 30 items per page
                isLoading={isLoading}
                totalCount={fastSectionData.count} // Pass total count for correct pagination
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
                  isLoading={isLoading}
                  totalCount={fastSectionData.count} // Pass total count for correct pagination
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
                  isLoading={isLoading}
                  totalCount={fastSectionData.count} // Pass total count for correct pagination
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
                  isLoading={isLoading}
                  totalCount={fastSectionData.count} // Pass total count for correct pagination
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
                  totalCount={fastSectionData.count} // Pass total count for correct pagination
                />
              ) : section === 'sellers' ? (
                // Buyer Group style design for Sellers
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Header Section */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">S</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sales Team</h1>
                    <p className="text-gray-600">4 sellers mapped • Enterprise Sales</p>
                  </div>
                </div>
                
                {/* Summary Cards */}
                <div className="flex gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                    <div className="text-2xl font-bold text-gray-900">2</div>
                    <div className="text-sm text-gray-600">Ahead of Target</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                    <div className="text-2xl font-bold text-gray-900">2</div>
                    <div className="text-sm text-gray-600">On Track</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                    <div className="text-2xl font-bold text-gray-900">3</div>
                    <div className="text-sm text-gray-600">Online Now</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                    <div className="text-2xl font-bold text-gray-900">149</div>
                    <div className="text-sm text-gray-600">Active Buyer Groups</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                    <div className="text-2xl font-bold text-gray-900">875</div>
                    <div className="text-sm text-gray-600">Total Stakeholders</div>
                  </div>
                </div>
              </div>
              
              {/* Sellers List */}
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {filteredData?.filter(seller => seller != null).map((seller: any, index: number) => {
                  // Seller data matching the buyer group style
                  const sellerData = [
                    {
                      name: 'Kirk Harbaugh',
                      title: 'Senior Account Executive',
                      region: 'Enterprise West',
                      activeGroups: 40,
                      maxGroups: 50,
                      dmEngagement: 89,
                      stakeholders: 213,
                      isOnline: true,
                      pacing: 'Ahead',
                      percentToGoal: 105,
                      status: 'Online'
                    },
                    {
                      name: 'Sarah Chen',
                      title: 'Strategic Account Manager',
                      region: 'Fortune 500',
                      activeGroups: 42,
                      maxGroups: 60,
                      dmEngagement: 92,
                      stakeholders: 341,
                      isOnline: false,
                      pacing: 'On Track',
                      percentToGoal: 95,
                      status: 'Offline'
                    },
                    {
                      name: 'Marcus Rodriguez',
                      title: 'Enterprise Sales Director',
                      region: 'Financial Services',
                      activeGroups: 38,
                      maxGroups: 45,
                      dmEngagement: 85,
                      stakeholders: 187,
                      isOnline: true,
                      pacing: 'Ahead',
                      percentToGoal: 115,
                      status: 'Online'
                    },
                    {
                      name: 'Amanda Thompson',
                      title: 'Account Executive',
                      region: 'Technology Sector',
                      activeGroups: 29,
                      maxGroups: 40,
                      dmEngagement: 78,
                      stakeholders: 134,
                      isOnline: false,
                      pacing: 'On Track',
                      percentToGoal: 88,
                      status: 'Offline'
                    }
                  ];
                  
                  const data = sellerData[index] || sellerData[0];
                  
                  return (
                    <div
                      key={seller?.id || `seller-${index}`}
                      onClick={() => handleRecordClick(seller)}
                      className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {data.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {data.name}
                              </h4>
                              <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                data['pacing'] === 'Ahead' 
                                  ? 'bg-green-100 text-green-800' 
                                  : data['pacing'] === 'Behind'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {data.pacing}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {data.title}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">
                                {data.region}
                              </span>
                              <span className="text-sm text-gray-500">
                                {data.activeGroups}/{data.maxGroups} Groups
                              </span>
                              <span className="text-sm text-gray-500">
                                {data.dmEngagement}% DM Engagement
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {data.stakeholders} Stakeholders
                            </div>
                            <div className="text-xs text-gray-500">
                              {data.percentToGoal}% to Goal
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${data.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-gray-600">
                              {data.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
        middlePanel={middlePanel}
        rightPanel={<AIRightPanel />}
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
  );
});

