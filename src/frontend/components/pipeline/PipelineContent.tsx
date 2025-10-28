"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Kbd, formatShortcutForDisplay } from '@/platform/utils/keyboard-shortcut-display';
import { useRouter } from 'next/navigation';
import { PipelineTable } from './PipelineTableRefactored';
import { PipelineFilters } from './PipelineFilters';
import { PipelineHeader } from './PipelineHeader';
import { OpportunitiesKanban } from './OpportunitiesKanban';
import { MetricsDashboard } from './MetricsDashboard';
import { MetricsWall } from './MetricsWall';
import { MetricsEnhanced } from './MetricsEnhanced';
import { ChronicleList } from './ChronicleList';
import { ChronicleReport } from './ChronicleReport';
import { ChronicleListEnhanced } from './ChronicleListEnhanced';
import { ChronicleReportEnhanced } from './ChronicleReportEnhanced';
import { Dashboard } from './Dashboard';
import { EmptyStateDashboard } from './EmptyStateDashboard';
import { SpeedrunMiddlePanel } from '@/platform/ui/panels/speedrun-middle-panel';
import { DashboardSkeleton, ListSkeleton, KanbanSkeleton } from '@/platform/ui/components/skeletons';
import { StandardHeader } from '@/platform/ui/components/layout/StandardHeader';
import { useUnifiedAuth } from '@/platform/auth';
import { getSectionColumns } from '@/platform/config/workspace-table-config';
// Removed usePipelineData import - using useFastSectionData exclusively
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useAdrataData } from '@/platform/hooks/useAdrataData';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';
import { Pagination } from './table/Pagination';
import { AddModal } from '@/platform/ui/components/AddModal';
import { ProfileBox } from '@/platform/ui/components/ProfileBox';
import { useProfilePopup } from '@/platform/ui/components/ProfilePopupContext';
import { ThemePickerModal } from '@/platform/ui/components/ThemePickerModal';
import { usePipeline } from '@/products/pipeline/context/PipelineContext';
import { SpeedrunEngineModal } from '@/platform/ui/components/SpeedrunEngineModal';
import { useSpeedrunSignals } from "@/platform/hooks/useSpeedrunSignals";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import { PipelineHydrationFix } from './PipelineHydrationFix';

interface PipelineContentProps {
  section: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners' | 'sellers' | 'speedrun' | 'metrics' | 'dashboard';
  sellerId?: string;
  companyId?: string;
  title?: string;
  subtitle?: string;
}

// PERFORMANCE: Memoize component to prevent unnecessary re-renders
export const PipelineContent = React.memo(function PipelineContent({ 
  section, 
  sellerId, 
  companyId, 
  title, 
  subtitle 
}: PipelineContentProps) {
  const [showHeader, setShowHeader] = useState(true);
  // console.log('🔍 [PipelineContent] Component rendered for section:', section, 'sellerId:', sellerId, 'companyId:', companyId);
  
  // Keyboard shortcut to toggle header (only for metrics section)
  useEffect(() => {
    if (section !== 'metrics') return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'h' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowHeader(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [section]);
  
  const router = useRouter();
  const { navigateToPipeline, navigateToPipelineItem } = useWorkspaceNavigation();
  const { user } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  
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
  const [selectedChronicleReport, setSelectedChronicleReport] = useState<any>(null);
  
  // Check if we're in demo mode to set appropriate defaults
  const isDemoMode = typeof window !== "undefined" && window.location.pathname.startsWith('/demo/');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [lastContactedFilter, setLastContactedFilter] = useState('all');
  const [isSpeedrunEngineModalOpen, setIsSpeedrunEngineModalOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
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
    
    console.log(`🔍 [COLUMN CONFIG] Section: ${section}, WorkspaceId: ${currentWorkspaceId}`, {
      sectionConfig,
      hasColumns: !!sectionConfig.columns,
      hasColumnOrder: !!sectionConfig.columnOrder,
      columns: sectionConfig.columns,
      columnOrder: sectionConfig.columnOrder
    });
    
    // Use workspace-specific column order (field names) if available, otherwise use defaults
    if (sectionConfig.columnOrder) {
      console.log(`✅ [COLUMN CONFIG] Using workspace config for ${section}:`, sectionConfig.columnOrder);
      return sectionConfig.columnOrder;
    }
    
    console.log(`⚠️ [COLUMN CONFIG] Using fallback config for ${section}`);
    
    // Fallback to default configuration (display names)
    switch (section) {
      case 'speedrun':
        return ['rank', 'name', 'company', 'state', 'stage', 'actions', 'lastAction', 'nextAction'];
      case 'companies':
        return ['rank', 'company', 'actions', 'lastAction', 'nextAction'];
      case 'leads':
        return ['rank', 'company', 'name', 'title', 'actions', 'lastAction', 'nextAction'];
      case 'prospects':
        return ['rank', 'company', 'name', 'title', 'actions', 'lastAction', 'nextAction'];
      case 'opportunities':
        return ['rank', 'name', 'company', 'status', 'lastAction', 'nextAction'];
      case 'people':
        return ['rank', 'company', 'name', 'title', 'actions', 'lastAction', 'nextAction'];
      case 'clients':
        return ['rank', 'company', 'industry', 'status', 'lastAction', 'nextAction'];
      case 'partners':
        return ['rank', 'company', 'lastAction', 'nextAction'];
      default:
        return ['rank', 'company', 'name', 'title', 'lastAction'];
    }
  };
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(getDefaultVisibleColumns(section));
  
  // 🆕 CRITICAL FIX: Get workspace ID early for localStorage access
  const currentWorkspaceId = user?.activeWorkspaceId || null;
  const currentUserId = user?.id || null;
  
  // Update visible columns and sort when section changes
  useEffect(() => {
    setVisibleColumns(getDefaultVisibleColumns(section));
    // Reset sort to default for new section
    if (section === 'prospects') {
      setSortField('lastActionDate');
      setSortDirection('asc'); // Oldest first
    } else {
      setSortField('rank');
      setSortDirection('desc'); // Highest rank first (largest to smallest)
    }
  }, [section]);
  
  // Load saved sort preferences from localStorage for speedrun section
  useEffect(() => {
    if (section === 'speedrun' && currentWorkspaceId && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`speedrun-sort-${currentWorkspaceId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.field) setSortField(parsed.field);
          if (parsed.direction) setSortDirection(parsed.direction);
        } catch (e) {
          console.warn('Failed to parse saved sort preferences:', e);
        }
      }
    }
  }, [section, currentWorkspaceId]);
  
  // Save sort preferences to localStorage for speedrun section
  useEffect(() => {
    if (section === 'speedrun' && currentWorkspaceId && typeof window !== 'undefined') {
      localStorage.setItem(`speedrun-sort-${currentWorkspaceId}`, JSON.stringify({
        field: sortField,
        direction: sortDirection
      }));
    }
  }, [sortField, sortDirection, section, currentWorkspaceId]);
  
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
  
  // Use single data source from useRevenueOS for dashboard only
  const { data: acquisitionData } = useRevenueOS();
  
  const workspaceId = currentWorkspaceId;
  
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
  
  // 🚀 PERFORMANCE: Use only fast section data hook
  // This eliminates all duplicate API calls and uses optimized v1 APIs
  
  // Use higher limit for people section to ensure all records are loaded
  // Speedrun should only load 50 records (Top 50 concept)
  const limit = section === 'people' ? 10000 : section === 'speedrun' ? 50 : 1000;
  const fastSectionData = useFastSectionData(section, limit);

  // 🚀 PERFORMANCE: Use fast section data exclusively
  // This eliminates all duplicate API calls and uses optimized v1 APIs
  const getSectionData = () => {
    return {
      data: fastSectionData.data || [],
      loading: fastSectionData.loading,
      error: fastSectionData.error,
      count: fastSectionData.count
    };
  };

  const sectionData = getSectionData();
  const finalData = sectionData.data;
  const finalLoading = sectionData.loading;
  const finalError = sectionData.error;
  const finalIsEmpty = finalData.length === 0;
  
  // Set loading to false when data is actually loaded
  useEffect(() => {
    if (finalData !== undefined && !finalError) {
      setIsLoading(false);
    }
  }, [finalData, finalError]);

  // Speedrun signals hook for automatic Monaco Signal popup (only for speedrun section)
  const { activeSignal, acceptSignal, dismissSignal } = useSpeedrunSignals(
    workspaceId || '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's workspace
    userId || '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's user ID
    (signal) => {
      console.log('🎯 [Pipeline Speedrun] Signal accepted:', signal);
      setIsSlideUpVisible(false);
    }
  );

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
      // Command+I (Mac) or Ctrl+I (Windows/Linux) - Monaco Signal popup
      if ((event.metaKey || event.ctrlKey) && event['key'] === 'i') {
        event.preventDefault();
        event.stopPropagation();
        setIsSlideUpVisible(prev => !prev);
      }
      
      // Command+Enter (Mac) or Ctrl+Enter (Windows/Linux) - Activate Monaco Signal
      if ((event.metaKey || event.ctrlKey) && event['key'] === 'Enter') {
        const target = event.target as HTMLElement;
        const isInput = target['tagName'] === "INPUT" || target['tagName'] === "TEXTAREA" || target.isContentEditable;
        if (!isInput && isSlideUpVisible) {
          event.preventDefault();
          event.stopPropagation();
          if (activeSignal) {
            acceptSignal();
            setIsSlideUpVisible(false);
          }
        }
      }
      
      // Escape to close Monaco Signal popup
      if (event['key'] === 'Escape' && isSlideUpVisible) {
        setIsSlideUpVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSlideUpVisible, activeSignal, acceptSignal]);
  
  // Listen for action creation events to refresh speedrun data
  useEffect(() => {
    if (section !== 'speedrun') return;
    
    const handleActionCreated = (event: CustomEvent) => {
      console.log('🔄 [PipelineContent] Action created event received for speedrun refresh:', event.detail);
      // Clear any relevant caches and refresh data
      fastSectionData.clearCache();
      fastSectionData.refresh();
    };

    const handleSpeedrunRefresh = (event: CustomEvent) => {
      console.log('🔄 [PipelineContent] Speedrun refresh event received:', event.detail);
      // Clear any relevant caches and refresh data
      fastSectionData.clearCache();
      fastSectionData.refresh();
    };

    document.addEventListener('actionCreated', handleActionCreated as EventListener);
    document.addEventListener('speedrunRefresh', handleSpeedrunRefresh as EventListener);
    
    return () => {
      document.removeEventListener('actionCreated', handleActionCreated as EventListener);
      document.removeEventListener('speedrunRefresh', handleSpeedrunRefresh as EventListener);
    };
  }, [section, fastSectionData]);
  
    
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
        total: finalData?.length || 0, 
        totalLeads: finalData?.length || 0, // Add totalLeads property for PipelineHeader
        active: finalData?.length || 0, 
        completed: 0, 
        conversionRate: 0, 
        avgResponseTime: 0,
        data: finalData || [] // Include data for unique company calculation
      };

  // Helper function to get sortable value from record
  const getSortableValue = useCallback((record: any, field: string) => {
    // Handle common field variations
    switch (field) {
      case 'name':
        return (record['firstName'] && record['lastName'] ? `${record['firstName']} ${record['lastName']}` : '') || record['fullName'] || record.name || '';
      
      case 'company':
        // Handle both string and object company data
        const company = record['company'];
        let companyName = '';
        
        if (typeof company === 'object' && company !== null) {
          companyName = company.name || company.companyName || '';
        } else {
          companyName = company || record['companyName'] || '';
        }
        
        return companyName;
      
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
      case 'globalRank':
        // Handle rank field - prioritize winningScore.rank for alphanumeric display
        const winningRank = record.winningScore?.rank;
        const fallbackRank = record.rank || record.globalRank || record.stableIndex || 0;
        
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
      
      case 'priority':
        return record.priority || '';
      
      case 'nextAction':
        return record.nextAction || record.nextActionDescription || '';
      
      case 'stage':
        return record.stage || record.dealStage || '';
      
      case 'amount':
        // Handle currency amounts
        const amount = record.amount || record.dealValue || record.value || 0;
        if (typeof amount === 'string') {
          return parseFloat(amount.replace(/[^0-9.-]/g, '')) || 0;
        }
        return typeof amount === 'number' ? amount : 0;
      
      case 'state':
      case 'hqState':
        return record.hqState || record.state || record.company?.hqState || record.company?.state || '';
      
      case 'actions':
        // Handle action count for sorting
        return record._count?.actions || 0;
      
      default:
        // Fallback to direct property access
        return record[field] || '';
    }
  }, []);

  // 🚀 PERFORMANCE: Use dedicated hooks data for instant loading
  const hasData = Array.isArray(finalData) && finalData.length > 0;
  
  // Calculate isEmpty based on actual data
  const isEmpty = !hasData;

  // Filter and sort data based on all filters and sort criteria
  const filteredData = React.useMemo(() => {
    // Use finalData from v1 API hooks
    const dataToFilter = Array.isArray(finalData) ? finalData : [];
    
    if (!dataToFilter || dataToFilter.length === 0) {
      return dataToFilter;
    }
    
    let filtered = dataToFilter.filter((record: any) => {
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
        (record['stage'] && record.stage.toLowerCase() === statusFilter.toLowerCase());

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

      // Company Size filter - handle both numeric employeeCount and string size fields
      const matchesCompanySize = companySizeFilter === 'all' || (() => {
        // Try numeric employeeCount first
        const employeeCount = record.employeeCount || record.company?.employeeCount || 0;
        const empCount = typeof employeeCount === 'string' ? parseInt(employeeCount, 10) : employeeCount;
        
        // If we have employeeCount, use it
        if (empCount > 0) {
          switch (companySizeFilter) {
            case 'startup': return empCount >= 1 && empCount <= 10;
            case 'small': return empCount >= 11 && empCount <= 50;
            case 'medium': return empCount >= 51 && empCount <= 200;
            case 'large': return empCount >= 201 && empCount <= 1000;
            case 'enterprise': return empCount > 1000;
            default: return true;
          }
        }
        
        // Fallback: Try to match company.size string
        const companySize = record.company?.size?.toLowerCase() || '';
        switch (companySizeFilter) {
          case 'startup': return companySize.includes('1-10') || companySize.includes('<10');
          case 'small': return companySize.includes('11-50') || companySize.includes('1-50');
          case 'medium': return companySize.includes('51-200') || companySize.includes('50-200');
          case 'large': return companySize.includes('201-1000') || companySize.includes('200-1000');
          case 'enterprise': return companySize.includes('1000+') || companySize.includes('5000+') || companySize.includes('10000+');
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

    // Apply sorting for all fields including rank
    if (sortField) {
      // Regular field sorting with robust field handling
      console.log(`🔧 [SORT FIX] Applying sort: field=${sortField}, direction=${sortDirection}, section=${section}`);
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
    }

    return filtered;
  }, [finalData, searchQuery, verticalFilter, statusFilter, priorityFilter, revenueFilter, 
      lastContactedFilter, timezoneFilter, companySizeFilter, locationFilter, 
      sortField, sortDirection, section, getSortableValue]);

  // Handle record selection - OPTIMIZED NAVIGATION with instant transitions
  const handleRecordClick = useCallback((record: any) => {
    // ⚡ PERFORMANCE MONITORING: Track click-to-navigation timing
    const clickStartTime = performance.now();
    
    // OPTIMISTIC: Update UI immediately for instant feedback
    setSelectedRecord(record);
    
    // Get the best available name for human-readable URL
    const recordName = record.fullName || record.name || record.firstName || 'record';
    
    console.log(`🔗 [PipelineContent] Record clicked: ${recordName} (${record.id}) in section: ${section}`);
    
    // 🚀 LIGHTNING-FAST: Pre-cache record data for instant loading
    if (typeof window !== 'undefined') {
      const cacheStartTime = performance.now();
      
      // Store the record in sessionStorage for instant access on detail page
      sessionStorage.setItem(`cached-${section}-${record.id}`, JSON.stringify(record));
      
      // Pre-cache in a more accessible format for faster retrieval
      // Include version number to enable staleness detection
      const currentVersion = parseInt(sessionStorage.getItem(`edit-version-${section}-${record.id}`) || '0', 10);
      
      console.log(`💾 [LIST CACHE] Caching record from list view:`, {
        recordId: record.id,
        recordName,
        currentVersion,
        legalName: record.legalName,
        localName: record.localName,
        tradingName: record.tradingName,
        description: record.description,
        website: record.website,
        phone: record.phone
      });
      
      sessionStorage.setItem(`current-record-${section}`, JSON.stringify({
        id: record.id,
        name: recordName,
        data: record,
        timestamp: Date.now(),
        version: currentVersion
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
  }, [section, sellerId, companyId, navigateToPipelineItem, user]);

  // Handle record reordering for drag-and-drop
  const handleReorderRecords = useCallback((fromIndex: number, toIndex: number) => {
    if (!finalData || fromIndex === toIndex) return;
    
    // Create a new array with the reordered items
    const newData = [...finalData];
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
  }, [finalData, section]);

  // Handle section navigation - UNIFIED with consistent loading states
  const handleSectionChange = useCallback((newSection: string) => {
    console.log(`🔄 [UNIFIED NAV] Switching from ${section} to ${newSection}`);
    
    // Update browser title
    const sectionLabels: Record<string, string> = {
      'opportunities': 'Opportunities',
      'leads': 'Leads',
      'prospects': 'Prospects',
      'companies': 'Companies',
      'people': 'People',
      'clients': 'Customers',
      'partners': 'Partners',
      'sellers': 'Sellers'
    };
    const sectionLabel = sectionLabels[newSection] || newSection;
    document.title = sectionLabel;
    
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
    await fastSectionData.refresh();
  };

  // Handle cache clear
  const handleClearCache = async () => {
    console.log(`🧹 Clearing ${section} cache...`);
    fastSectionData.clearCache();
    // Also refresh data to show new records immediately
    await fastSectionData.refresh();
  };

  // Handle add record
  const handleAddRecord = () => {
    try {
      console.log(`🔧 [PipelineContent] Opening add modal for section: ${section}`);
      
      // First, set the active section
      ui.setActiveSection(section);
      
      // Then, open the modal after a brief delay to ensure state propagation
      setTimeout(() => {
        ui.setIsAddModalOpen(true);
        console.log(`✅ [PipelineContent] Modal opened for ${section}`);
      }, 0);
      
    } catch (error) {
      console.error(`❌ [PipelineContent] Error opening add modal for ${section}:`, error);
    }
  };

  const handleSortChange = useCallback((field: string) => {
    if (sortField === field) {
      // Three-state cycle: asc → desc → unsorted (null)
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        // Third click: reset to unsorted (use original data order)
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      // New field - check if it's speedrun rank for special default
      const isSpeedrunRank = section === 'speedrun' && (field === 'globalRank' || field === 'rank');
      setSortField(field);
      setSortDirection(isSpeedrunRank ? 'desc' : 'asc'); // Descending for speedrun rank
    }
    console.log(`🔧 [THREE-STATE SORT] Field: ${field}, Current: ${sortField}, Direction: ${sortDirection}, Next: ${sortField === field ? (sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? 'null' : 'asc') : 'asc'}`);
  }, [sortField, sortDirection, section]);

  // Handle sort from dropdown (different from column clicks)
  const handleDropdownSortChange = useCallback((field: string) => {
    // Map dropdown field names to actual data field names
    const fieldMapping: Record<string, string> = {
      'rank': 'rank',
      'company': 'company',
      'name': 'name',
      'title': 'title',
      'status': 'status',
      'stage': 'stage',
      'priority': 'priority',
      'amount': 'amount',
      'lastContact': 'lastContact', // Keep as lastContact since getSortableValue handles both
      'nextAction': 'nextAction'
    };
    
    const actualField = fieldMapping[field] || field;
    
    // If clicking the same field, toggle direction; otherwise start with ascending
    if (sortField === actualField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(actualField);
      setSortDirection('asc');
    }
    
    console.log(`🔧 [SORT FIX] Dropdown sort: ${field} -> ${actualField} (section: ${section}, direction: ${sortField === actualField ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc'})`);
  }, [section, sortField, sortDirection]);

  const handleColumnSort = useCallback((columnName: string) => {
    console.log(`🔧 [PipelineContent] handleColumnSort called for section: ${section}, column: ${columnName}`);
    
    // Map column display names to actual data field names (section-specific)
    const getFieldMapping = () => {
      const baseMap: Record<string, string> = {
        'Rank': 'rank',
        'rank': 'rank',
        'Company': 'company',
        'company': 'company',
        'Person': 'name',
        'person': 'name',
        'Name': 'name',
        'name': 'name',
        'Title': 'title',
        'title': 'title',
        'Status': 'status',
        'status': 'status',
        'Priority': 'priority',
        'priority': 'priority',
        'Industry': 'industry',
        'industry': 'industry',
        'Email': 'email',
        'email': 'email',
        'Phone': 'phone',
        'phone': 'phone',
        'Last Action': 'lastActionDate',
        'lastAction': 'lastActionDate',
        'Next Action': 'nextAction',
        'nextAction': 'nextAction',
        'Amount': 'amount',
        'amount': 'amount',
        'Stage': 'stage',
        'stage': 'stage',
        'Value': 'value',
        'value': 'value',
        'State': 'state',
        'state': 'state'
      };

      // Section-specific field mappings
      if (section === 'speedrun') {
        return {
          ...baseMap,
          'Rank': 'globalRank', // Speedrun uses 'globalRank' for rank field
          'rank': 'globalRank',
          'Last Action': 'lastActionDate',
          'lastAction': 'lastActionDate',
          'Advice': 'nextAction',
          'advice': 'nextAction',
        };
      } else if (section === 'opportunities') {
        return {
          ...baseMap,
          'Amount': 'amount',
          'amount': 'amount',
          'Stage': 'stage',
          'stage': 'stage',
          'Last Action': 'lastActionDate',
          'lastAction': 'lastActionDate',
          'Value': 'value',
          'value': 'value',
        };
      } else if (section === 'companies') {
        return {
          ...baseMap,
          'Rank': 'globalRank',
          'rank': 'globalRank',
          'Company': 'name',
          'company': 'name',
          'State': 'hqState',
          'state': 'hqState',
        };
      } else {
        return {
          ...baseMap,
        };
      }
    };

    const fieldMap = getFieldMapping();
    const field = fieldMap[columnName as keyof typeof fieldMap] || columnName.toLowerCase().replace(/\s+/g, '');
    
    console.log(`🔧 [PipelineContent] Column sort mapping: ${columnName} -> ${field} (section: ${section})`);
    handleSortChange(field);
  }, [handleSortChange, section]);

  const handleColumnVisibilityChange = useCallback((columns: string[]) => {
    setVisibleColumns(columns);
  }, []);

  // 🚀 CACHE ERROR FIX: Only show error state for persistent errors, not during loading
  if (finalError && !finalLoading && finalData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Error Loading {section}
          </h3>
          <p className="text-[var(--muted)] mb-4">{finalError instanceof Error ? finalError.message : String(finalError)}</p>
          <div className="space-x-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
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
    <div className="h-full flex flex-col">
      {showHeader && (
        <StandardHeader
          title="Metrics"
          subtitle="Sales performance and KPIs"
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md">
                <div className="w-6 h-6 rounded-lg bg-gray-300 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {user?.name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {user?.name || user?.email || 'User'}
                </span>
              </div>
            </div>
          }
        />
      )}
      <div className="flex-1 overflow-auto">
        <MetricsEnhanced />
      </div>
    </div>
  ) : section === 'chronicle' ? (
    <div className="h-full flex flex-col">
      {!selectedChronicleReport && (
        <StandardHeader
          title="Chronicle"
          subtitle="Weekly reports and business intelligence"
        />
      )}
      <div className="flex-1 overflow-auto">
        {selectedChronicleReport ? (
          <ChronicleReportEnhanced 
            report={selectedChronicleReport} 
            onBack={() => setSelectedChronicleReport(null)}
          />
        ) : (
          <ChronicleListEnhanced onReportSelect={setSelectedChronicleReport} />
        )}
      </div>
    </div>
  ) : section === 'dashboard' ? (
    (() => {
      console.log('🚨 [PipelineContent] Rendering Dashboard component!');
      return <Dashboard />;
    })()
  ) : finalLoading ? (
    // 🚀 PERFORMANCE: Show XL loading skeleton while fast section data loads
    <div className="h-full flex flex-col bg-[var(--background)] max-w-full overflow-hidden">
      {/* Top header skeleton - includes title, count, and action buttons */}
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
      
      {/* Search and filters skeleton - includes search bar, filter buttons, and count */}
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
          {/* Table header skeleton */}
          <div className="grid grid-cols-6 gap-4 py-3 border-b border-[var(--border)]">
            <div className="h-4 bg-[var(--loading-bg)] rounded w-12 animate-pulse"></div>
            <div className="h-4 bg-[var(--loading-bg)] rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-[var(--loading-bg)] rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-[var(--loading-bg)] rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-[var(--loading-bg)] rounded w-20 animate-pulse"></div>
          </div>
          
          {/* Table rows skeleton */}
          {[...Array(15)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 py-3">
              <div className="h-4 bg-[var(--loading-bg)] rounded w-8 animate-pulse"></div>
              <div className="h-4 bg-[var(--loading-bg)] rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-[var(--loading-bg)] rounded w-28 animate-pulse"></div>
              <div className="h-4 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-[var(--loading-bg)] rounded w-40 animate-pulse"></div>
              <div className="h-4 bg-[var(--loading-bg)] rounded w-36 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="h-full flex flex-col bg-[var(--background)] overflow-hidden">

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
        <div className={`flex-shrink-0 px-4 pb-1 w-full ${section === 'opportunities' ? 'pt-1' : 'pt-2'}`}>
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
      <div className={`flex-1 px-4 min-h-0 ${section === 'speedrun' ? 'pb-4' : 'pb-2'}`} style={{
        minHeight: section === 'people' ? 'calc(100vh - 170px)' : 'calc(100vh - 150px)', // People table shorter
        maxWidth: '100%', // Prevent overflow into right panel
        overflowX: 'hidden' // Prevent horizontal overflow
      }}>
        {Array.isArray(finalData) && finalData.length > 0 && (filteredData?.length === 0) ? (
          // Filtered empty state (data exists but filters hide it)
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-[var(--muted)] p-6">
              <h4 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No results found
              </h4>
              <p className="text-sm text-[var(--muted)] max-w-sm">
                No {section} match your current filters. Try adjusting your search or filters.
              </p>
            </div>
          </div>
        ) : !hasData && !finalError && workspaceId && userId ? (
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

        {/* Main content */}
        {middlePanel}

        {/* Profile Popup - Pipeline Implementation */}
        {(() => {
          const shouldRender = isProfileOpen && profileAnchor;
          if (shouldRender) {
            console.log('✅ PipelineContent ProfileBox SHOULD render - all conditions met');
          } else {
            console.log('❌ PipelineContent ProfileBox will NOT render:', {
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
              zIndex: 9999,
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
              isRtpVisible={true}
              setIsRtpVisible={() => {}}
              isProspectsVisible={true}
              setIsProspectsVisible={() => {}}
              isLeadsVisible={true}
              setIsLeadsVisible={() => {}}
              isOpportunitiesVisible={true}
              setIsOpportunitiesVisible={() => {}}
              isCustomersVisible={false}
              setIsCustomersVisible={() => {}}
              isPartnersVisible={true}
              setIsPartnersVisible={() => {}}
              onSpeedrunEngineClick={() => {
                console.log("Speedrun engine clicked in PipelineContent");
                setIsProfileOpen(false);
                setIsSpeedrunEngineModalOpen(true);
              }}
              isDemoMode={typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')}
              currentDemoScenario={typeof window !== "undefined" && window.location.pathname.startsWith('/demo/') ? window.location.pathname.split('/')[2] : null}
              onDemoScenarioChange={(scenarioSlug) => {
                console.log(`🎯 PipelineContent: Demo scenario selected: ${scenarioSlug}`);
                // The ProfileBox will handle the navigation
              }}
              isThemePickerOpen={isThemePickerOpen}
              setIsThemePickerOpen={setIsThemePickerOpen}
            />
          </div>
        )}
        
        {/* Speedrun Engine Modal */}
        <SpeedrunEngineModal
          isOpen={isSpeedrunEngineModalOpen}
          onClose={() => setIsSpeedrunEngineModalOpen(false)}
        />

        {/* Theme Picker Modal */}
        <ThemePickerModal
          isOpen={isThemePickerOpen}
          onClose={() => setIsThemePickerOpen(false)}
          onThemeSelect={(theme) => {
            console.log(`🎨 Theme selected: ${theme.displayName}`);
          }}
        />

        {/* Monaco Signal Popup - Only show for speedrun section */}
        {section === 'speedrun' && isSlideUpVisible && (
          <div className="fixed bottom-6 right-4 z-[9999] animate-in slide-in-from-right duration-300">
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl w-[520px] p-7">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] text-lg">Buying Intent Detected</h3>
                    <p className="text-[var(--muted)] text-sm">Pipeline Speedrun Signal</p>
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
                  className="text-[var(--muted)] hover:text-[var(--muted)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-[var(--panel-background)] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                      {activeSignal?.contact.name?.charAt(0) || 'R'}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{activeSignal?.contact.name || 'Real Time'}</p>
                      <p className="text-sm text-[var(--muted)]">{(activeSignal?.contact as any)?.title || 'IT Director'} at {activeSignal?.contact.company || 'RealTime Corp'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    "{activeSignal?.note?.content || 'URGENT: Budget approved for $500K implementation. Need to move fast - decision makers ready to sign.'}"
                  </p>
                </div>
                
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="text-[var(--foreground)] font-medium">Recommendation:</span> Move to #1 on Speedrun (prime timing for outreach)
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
                          fastSectionData.refresh(); // Use the refresh function instead of reload
                          
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
                    <Kbd variant="green" size="sm">{formatShortcutForDisplay(['⌘⏎', 'Ctrl+Enter'])}</Kbd>
                  </button>
                  <button
                    onClick={() => {
                      if (activeSignal) {
                        dismissSignal();
                      }
                      setIsSlideUpVisible(false);
                    }}
                    className="bg-[var(--hover)] hover:bg-[var(--loading-bg)] text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <AddModal refreshData={useCallback(async () => { 
          await fastSectionData.refresh(); 
        }, [fastSectionData])} />
      </>
    </PipelineHydrationFix>
  );
});
