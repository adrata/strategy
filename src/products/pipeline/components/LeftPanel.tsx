"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { authFetch } from '@/platform/api-fetch';
import { useRouter } from "next/navigation";
import { WorkspaceDataRouter } from "@/platform/services/workspace-data-router";
import { usePipeline } from "@/products/pipeline/context/PipelineContext";
import { useProfilePopup } from "@/platform/ui/components/ProfilePopupContext";
import { ProfileBox } from "@/platform/ui/components/ProfileBox";
import { useUnifiedAuth } from "@/platform/auth";
// CRITICAL FIX: Re-enable PipelineDataStore for proper data loading
import { usePipelineData } from "@/platform/hooks/useAdrataData";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useFastCounts } from "@/platform/hooks/useFastCounts";
import { useFastSectionData } from "@/platform/hooks/useFastSectionData";
import { useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { getWorkspaceBySlug } from "@/platform/config/workspace-mapping";
import { useChronicleCount } from "@/platform/hooks/useChronicleCount";
import { useMetricsCount } from "@/platform/hooks/useMetricsCount";
import { getPlatform } from "@/platform/platform-detection";
import { useStacksAccess, useOasisAccess, useWorkshopAccess, useMetricsAccess, useChronicleAccess, useDesktopDownloadAccess } from "@/platform/ui/context/FeatureAccessProvider";
import { CheckIcon } from '@heroicons/react/24/outline';
import { getFilteredSectionsForWorkspace } from "@/platform/utils/section-filter";
import { getCustomSectionOrder } from "@/platform/services/user-restrictions-service";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";


// Utility function to convert hex color to CSS filter for SVG recoloring
function getColorFilter(hexColor: string): string {
  // Predefined color filters for common workspace colors
  const colorFilters: Record<string, string> = {
    '#AE3033': 'hue-rotate(350deg) saturate(2.5) brightness(0.7) contrast(1.5)', // Red for retail - more aggressive
    '#0A1F49': 'hue-rotate(220deg) saturate(2) brightness(0.4)', // Dark blue for notary
    '#1f2937': 'hue-rotate(220deg) saturate(0.3) brightness(0.3)', // Dark gray default
    '#3b82f6': 'hue-rotate(220deg) saturate(1.2) brightness(0.8)', // Standard blue
  };
  
  const filter = colorFilters[hexColor] || `hue-rotate(0deg) saturate(1) brightness(0.5)`;
  console.log('🎨 Color filter applied:', { hexColor, filter });
  return filter;
}


interface PipelineLeftPanelStandaloneProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isSpeedrunVisible?: boolean;
  setIsSpeedrunVisible?: (visible: boolean) => void;
  isOpportunitiesVisible?: boolean;
  setIsOpportunitiesVisible?: (visible: boolean) => void;
  isProspectsVisible?: boolean;
  setIsProspectsVisible?: (visible: boolean) => void;
  isLeadsVisible?: boolean;
  setIsLeadsVisible?: (visible: boolean) => void;
  isCustomersVisible?: boolean;
  setIsCustomersVisible?: (visible: boolean) => void;
  isPartnersVisible?: boolean;
  setIsPartnersVisible?: (visible: boolean) => void;
}

function PipelineSections({ 
  activeSection, 
  handleSectionClick,
  isSpeedrunVisible,
  isOpportunitiesVisible,
  isProspectsVisible,
  isLeadsVisible,
  isCustomersVisible,
  isPartnersVisible,
  fastCounts,
  fastCountsLoading,
  isMoreExpanded,
  setIsMoreExpanded
}: { 
  activeSection: string;
  handleSectionClick: (section: string) => void;
  isSpeedrunVisible?: boolean;
  isOpportunitiesVisible?: boolean;
  isProspectsVisible?: boolean;
  isLeadsVisible?: boolean;
  isCustomersVisible?: boolean;
  isPartnersVisible?: boolean;
  fastCounts?: any;
  fastCountsLoading?: boolean;
  isMoreExpanded: boolean;
  setIsMoreExpanded: (expanded: boolean) => void;
}) {
  // Get auth context in this component
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  // 🆕 CRITICAL FIX: Use provider workspace instead of URL detection
  const { data: acquisitionData } = useRevenueOS();
  
  // 🆕 CRITICAL FIX: Use provider workspace instead of URL detection
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const userId = authUser?.id;

  // Feature access hooks
  const hasOasis = useOasisAccess();
  const hasStacks = useStacksAccess();
  const hasWorkshop = useWorkshopAccess();
  const hasMetrics = useMetricsAccess();
  const hasChronicle = useChronicleAccess();
  const hasDesktopDownload = useDesktopDownloadAccess();
  
  // Get workspace name for Nova visibility check
  const activeWorkspace = authUser?.workspaces?.find(w => w['id'] === workspaceId);
  const workspaceName = activeWorkspace?.name || "";
  // Get workspace slug for filtering (use slug if available, otherwise fall back to name)
  const workspaceSlug = activeWorkspace?.slug || activeWorkspace?.name || workspaceName || 'default';
  
  // Check user restrictions immediately (synchronous) to prevent showing restricted sections on initial load
  const { getUserRestrictions } = require('@/platform/services/user-restrictions-service');
  const userRestrictions = userId && authUser?.email ? 
    getUserRestrictions(userId, authUser.email, workspaceName) : 
    { hasRestrictions: false, disabledFeatures: [], allowedSections: {} };

  // Check if we're in pinpoint workspace
  const isPinpointWorkspace = workspaceName?.toLowerCase() === 'pinpoint' || 
                              workspaceId === '01K90EQWJCCN2JDMRQF12F49GN';
  
  // Check if we're in TOP workspace
  const isTopWorkspace = workspaceName?.toLowerCase().includes('top') || false;
  
  // Check if we're in CloudCaddie workspace
  const isCloudCaddieWorkspace = workspaceName?.toLowerCase().includes('cloudcaddie') || 
                                  workspaceSlug?.toLowerCase() === 'cloudcaddie' ||
                                  workspaceId === '01K7DSWP8ZBA75K5VSWVXPEMAH';
  
  // Override feature access hooks with user restrictions (synchronous check)
  const shouldShowChronicle = hasChronicle && (!userRestrictions.hasRestrictions || 
    !userRestrictions.disabledFeatures.includes('CHRONICLE'));
  const shouldShowMetrics = hasMetrics && (!userRestrictions.hasRestrictions || 
    !userRestrictions.disabledFeatures.includes('METRICS'));
  // Partners section removed from RevenueOS - only available in PartnerOS
  const shouldShowPartners = false;
  const shouldShowClients = !userRestrictions.hasRestrictions || 
    (userRestrictions.allowedSections['pipeline']?.includes('clients') ?? false);
  
  // Debug logging for Nova visibility (can be removed in production)
  if (authUser?.email === "ross@adrata.com") {
    console.log('🌌 Nova visibility check:', {
      workspaceName: workspaceName,
      novaVisible: authUser?.email === "ross@adrata.com" && workspaceName.toLowerCase() === "adrata"
    });
  }
  
  // 🚀 WORKSPACE-AWARE: Always call hooks (React rule) but pass null for invalid IDs
  const safeWorkspaceId = (workspaceId && workspaceId !== 'default') ? workspaceId : undefined;
  const safeUserId = (userId && userId !== 'default') ? userId : undefined;
  
  // CRITICAL FIX: Use acquisitionData counts that were working before
  // const leadsData = usePipelineData('leads', safeWorkspaceId, safeUserId);
  // const prospectsData = usePipelineData('prospects', safeWorkspaceId, safeUserId);
  // const opportunitiesData = usePipelineData('opportunities', safeWorkspaceId, safeUserId);
  // const accountsData = usePipelineData('accounts', safeWorkspaceId, safeUserId);
  // const contactsData = usePipelineData('contacts', safeWorkspaceId, safeUserId);
  // const clientsData = usePipelineData('clients', safeWorkspaceId, safeUserId);
  // const partnersData = usePipelineData('partners', safeWorkspaceId, safeUserId);
  // const sellersData = usePipelineData('sellers', safeWorkspaceId, safeUserId);
  
  // CRITICAL FIX: Map acquisition data to pipeline format for compatibility
  // Use actual counts from API instead of limited array lengths
  const actualCounts = acquisitionData?.acquireData?.counts || {};
  
  // Check if we're in demo workspace (by workspace name or URL)
  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                    (workspaceId && workspaceId.includes('demo')) ||
                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
  console.log('🔍 [LEFT PANEL] Demo mode check:', { 
    isDemoMode, 
    workspaceId,
    pathname: typeof window !== "undefined" ? window.location.pathname : 'server' 
  });

  // Check if we're in Notary Everyday workspace (check both old and new IDs)
  const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || 
                          workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' ||
                          workspaceId === 'cmezxb1ez0001pc94yry3ntjk' ||
                          (typeof window !== "undefined" && window.location.pathname.startsWith('/ne/'));
  
  // Check if this is Ryan Serrato user
  const isRyanSerrato = authUser?.id === 'cmf0kew2z0000pcsexylorpxp';
  console.log('🔍 [LEFT PANEL] Notary Everyday check:', { 
    isNotaryEveryday, 
    isRyanSerrato,
    workspaceId,
    userId: authUser?.id,
    pathname: typeof window !== "undefined" ? window.location.pathname : 'server'
  });
  
  // For demo mode, override visibility to only show the 4 required sections
  const demoModeVisibility = {
    isSpeedrunVisible: true,
    isOpportunitiesVisible: false,
    isProspectsVisible: false,
    isLeadsVisible: false,
    isCustomersVisible: false,
    isPartnersVisible: false
  };
  
  // 🚀 PERFORMANCE: Use cached acquisition data only - no fallback API calls
  // The acquisition data should already contain all the counts we need
  const [fallbackCounts, setFallbackCounts] = useState<any>({});
  const [fallbackLoading, setFallbackLoading] = useState(false);
  
  // 🚀 PERFORMANCE: Use fast counts API instead of heavy dashboard API
  // REMOVED: This was causing duplicate API calls - useFastCounts hook already handles this
  // The useFastCounts hook is already being used above and provides the counts
  
  // Use fastCounts from useFastCounts hook as primary source, with fallbacks
  const finalCounts = fastCounts && Object.keys(fastCounts).length > 0 ? fastCounts : 
                     (actualCounts && Object.keys(actualCounts).length > 0 ? actualCounts : fallbackCounts);

  // Get chronicle count for Notary Everyday
  const { count: chronicleCount, unreadCount: chronicleUnreadCount, loading: chronicleLoading } = useChronicleCount();
  
  // Get metrics count for Notary Everyday
  const { count: metricsCount } = useMetricsCount();
  
  // 🔍 DEBUG: Log counts after hooks are called
  console.log('🔍 [LEFT PANEL] Metrics and Chronicle counts:', {
    isNotaryEveryday,
    isRyanSerrato,
    metricsCount,
    chronicleCount,
    workspaceId,
    userId: authUser?.id
  });
  
  // 🔍 DEBUG: Log counts for debugging
  console.log('🔍 [LEFT PANEL DEBUG] Counts sources:', {
    fastCounts,
    actualCounts,
    fallbackCounts,
    finalCounts,
    fastCountsLoading,
    authLoading,
    loading: fastCountsLoading || authLoading || false
  });
  
  
  // 🚀 PERFORMANCE: Use fast counts loading state for instant feedback
  // CRITICAL FIX: Only show loading if we have no data at all (not even cached or zeros)
  // This prevents the panel from being stuck in loading when data is available
  const hasAnyCounts = fastCounts && Object.keys(fastCounts).length > 0 && 
                       Object.values(fastCounts).some(count => count !== 0 && count !== '0');
  const hasCachedData = actualCounts && Object.keys(actualCounts).length > 0;
  
  // 🚀 FIX: Removed useFastSectionData call - left panel doesn't need section data, only counts
  // This prevents unnecessary data fetching when navigating between sections
  // The left panel should remain stable during navigation
  
  // Show loading if: fastCounts is loading AND no counts exist, OR auth is loading
  // Removed activeSectionLoading dependency to prevent left panel reload on navigation
  const loading = (fastCountsLoading && !hasAnyCounts && !hasCachedData) || authLoading;
  
  // Use acquisitionData counts that were working before
  const leadsData = {
    data: acquisitionData?.acquireData?.leads || [],
    loading: loading || fallbackLoading,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.leads || []).length === 0,
    count: finalCounts.leads || 0
  };
  
  const prospectsData = {
    data: acquisitionData?.acquireData?.prospects || [],
    loading: loading || fallbackLoading,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.prospects || []).length === 0,
    count: finalCounts.prospects || 0
  };
  
  const opportunitiesData = {
    data: acquisitionData?.acquireData?.opportunities || [],
    loading: loading || fallbackLoading,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.opportunities || []).length === 0,
    count: finalCounts.opportunities || 0
  };
  
  const companiesData = {
    data: acquisitionData?.acquireData?.companies || [],
    loading: loading || fallbackLoading,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.companies || []).length === 0,
    count: finalCounts.companies || 0
  };
  
  const peopleData = {
    data: acquisitionData?.acquireData?.people || [],
    loading: loading || fallbackLoading,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.people || []).length === 0,
    count: finalCounts.people || 0 // Use database count instead of limited array length
  };
  
  const clientsData = {
    data: acquisitionData?.acquireData?.clients || [],
    loading: loading || fallbackLoading,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.clients || []).length === 0,
    count: finalCounts.clients || 0
  };
  
  const partnersData = {
    data: acquisitionData?.acquireData?.partners || [],
    loading: loading || fallbackLoading,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.partners || []).length === 0,
    count: finalCounts.partners || 0
  };
  
  const sellersData = {
    data: acquisitionData?.acquireData?.sellers || [],
    loading: loading || fallbackLoading,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.sellers || []).length === 0,
    count: finalCounts.sellers || 0
  };
  
  // Debug logging to understand glitch
  console.log('🔍 [LEFT PANEL] Loading states:', {
    authLoading,
    loading,
    leadsLoading: leadsData.loading,
    prospectsLoading: prospectsData.loading,
    prospectsDataLength: prospectsData.data?.length || 0,
    prospectsEmpty: prospectsData.isEmpty,
    workspaceId,
    userId
  });
  
  // 🔍 DEBUG: Log data counts for troubleshooting
  console.log('🔍 [LEFT PANEL] Data counts:', {
    leads: leadsData.count,
    prospects: prospectsData.count,
    opportunities: opportunitiesData.count,
    companies: companiesData.count,
    people: peopleData.count,
    clients: clientsData.count,
    partners: partnersData.count,
    sellers: sellersData.count
  });
  
  // 🔄 SYNC: Listen for section changes to update counts immediately
  const [currentSection, setCurrentSection] = useState<string>('leads');
  
  // Single effect to handle all section changes
  useEffect(() => {
    const updateSection = () => {
      const pathname = window.location.pathname;
      // Updated regex to match workspace/section pattern instead of pipeline/section
      const sectionMatch = pathname.match(/\/[^\/]+\/([^\/]+)/);
      const section = sectionMatch?.[1] || 'leads';
      setCurrentSection(section);
    };
    
    const handlePipelineSectionChange = (event: CustomEvent) => {
      const { section: newSection } = event.detail;
      setCurrentSection(newSection);
      console.log(`🔄 [LEFT PANEL] Section changed to: ${newSection}`);
    };
    
    // Initial section detection
    updateSection();
    
    // Event listeners for navigation
    window.addEventListener('popstate', updateSection);
    window.addEventListener('pipeline-section-change', handlePipelineSectionChange as EventListener);
    
    return () => {
      window.removeEventListener('popstate', updateSection);
      window.removeEventListener('pipeline-section-change', handlePipelineSectionChange as EventListener);
    };
  }, []); // Only run once on mount
  
  // State for real counts - initialize with zeros and let useEffect update them
  const [stableCounts, setStableCounts] = useState({
    speedrun: 0, // Use actual speedrun count from data
    opportunities: 0,
    leads: 0,
    prospects: 0,
    clients: 0,
    partners: 0,
    companies: 0,
    people: 0,
    sellers: 0
  });
  
  // SIMPLE WORKING APPROACH: Use data lengths from individual hooks
  useEffect(() => {
    // Filter opportunities to only count open ones - with null safety
    const openOpportunities = (opportunitiesData.data || []).filter((opp: any) => {
      const stage = opp.stage?.toLowerCase() || '';
      const status = opp.status?.toLowerCase() || '';
      
      // Exclude closed opportunities
      return !stage.includes('closed') && 
             !status.includes('closed') && 
             !stage.includes('won') && 
             !stage.includes('lost') &&
             stage !== 'closed' &&
             status !== 'closed';
    });
    
    // Use actual people and companies data from hooks instead of calculating from leads/prospects
    // This ensures we get the real counts from the database
    
    // Use real data from hooks
    const speedrunItems = acquisitionData?.acquireData?.speedrunItems || [];
    console.log('🔍 [SPEEDRUN DEBUG] Speedrun data:', {
      hasAcquisitionData: !!acquisitionData,
      hasAcquireData: !!acquisitionData?.acquireData,
      speedrunItemsLength: speedrunItems.length,
      speedrunItems: speedrunItems.slice(0, 3), // Show first 3 items
      allDataKeys: acquisitionData?.acquireData ? Object.keys(acquisitionData.acquireData) : []
    });
    
    const hookCounts = {
      speedrun: fastCounts?.speedrun || 0, // Use actual speedrun count from API
      opportunities: openOpportunities.length, // Only open opportunities
      leads: leadsData.count,
      prospects: prospectsData.count,
      clients: clientsData.count,
      partners: partnersData.count,
      companies: companiesData.count, // Use actual companies count from database
      people: finalCounts.people || 0, // Use database count directly to ensure accuracy
      sellers: fastCounts?.sellers || sellersData.count // Use fast counts for sellers
    };
    
  // Only update counts if they've actually changed to prevent infinite loops
  setStableCounts(prevCounts => {
    const hasChanged = Object.keys(hookCounts).some(key => 
      prevCounts[key as keyof typeof prevCounts] !== hookCounts[key as keyof typeof hookCounts]
    );
    
    if (hasChanged) {
      console.log('✅ [LEFT PANEL] Updated counts from hook data:', hookCounts);
      console.log('🔍 [LEFT PANEL] Opportunity filtering:', {
        totalOpportunities: opportunitiesData.data?.length || 0,
        openOpportunities: openOpportunities.length
      });
      return hookCounts;
    }
    
    return prevCounts;
  });
}, [
  leadsData.count,
  prospectsData.count,
  opportunitiesData.count,
  companiesData.count,
  peopleData.count,
  sellersData.count,
  clientsData.count,
  partnersData.count,
  acquisitionData?.acquireData?.speedrunItems // Add speedrun data dependency
]);
  
  // 🚀 PERFORMANCE: Use fast counts for instant navigation
  const productionCounts = fastCounts && Object.keys(fastCounts).length > 0 ? fastCounts : finalCounts;
  
  console.log('⚡ [LEFT PANEL] Displaying counts:', productionCounts, '(FROM HOOKS)');
  console.log('🔍 [LEFT PANEL] Seller count debug:', {
    fastCountsSellers: fastCounts?.sellers,
    sellersDataCount: sellersData.count,
    finalCountsSellers: finalCounts.sellers,
    productionCountsSellers: productionCounts.sellers,
    fastCountsKeys: fastCounts ? Object.keys(fastCounts) : 'no fastCounts',
    fastCountsLength: fastCounts ? Object.keys(fastCounts).length : 0
  });
  console.log('🔍 [LEFT PANEL] Debug info:', {
    hookDataCounts: {
      leads: leadsData.count,
      prospects: prospectsData.count,
      opportunities: opportunitiesData.count
    },
    actualCounts: actualCounts,
    fallbackCounts: fallbackCounts,
    finalCounts: finalCounts,
    totalCount: Object.values(productionCounts).reduce((sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0), 0)
  });
  const [dashboardStats, setDashboardStats] = useState({
    revenue: '$0.0M',
    opportunities: 0,
    winRate: '0%',
    monthlyGrowth: '+0%'
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // 🆕 IMPROVED LOADING TIMEOUT: Better error handling and fallback states
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('⏰ [DASHBOARD] Loading timeout reached, forcing stats to load');
      setStatsLoading(false);
      
      // 🆕 IMPROVED FALLBACK: Show actual data if available, otherwise show zeros
      if ((opportunitiesData.data?.length || 0) > 0 && dashboardStats['opportunities'] === 0) {
        console.log('🚨 [DASHBOARD] TIMEOUT FALLBACK: Showing actual data stats');
        setDashboardStats({
          revenue: '$0.0M', // Show actual value based on data
          opportunities: opportunitiesData.data?.length || 0,
          winRate: '0%', // Show actual value
          monthlyGrowth: '0%'
        });
      } else if ((opportunitiesData.data?.length || 0) === 0) {
        console.log('🚨 [DASHBOARD] TIMEOUT FALLBACK: No data available, showing zeros');
        setDashboardStats({
          revenue: '$0.0M',
          opportunities: 0,
          winRate: '0%',
          monthlyGrowth: '0%'
        });
      }
    }, 1000); // Increased to 1 second to allow for proper data loading
    
    return () => clearTimeout(timeout);
  }, [opportunitiesData.data?.length, dashboardStats.opportunities]);

  // Calculate dashboard stats from opportunities data
  useEffect(() => {
    console.log('🔍 [DASHBOARD] useEffect triggered:', {
      loading,
      acquisitionDataExists: !!acquisitionData?.data,
      opportunitiesDataLength: opportunitiesData.data?.length || 0,
      opportunitiesData: opportunitiesData.data,
      acquisitionData: acquisitionData,
      actualCounts: actualCounts
    });
    
    // IMMEDIATE DEBUG: Check if we have any data at all
    if ((opportunitiesData.data?.length || 0) > 0) {
      console.log('🚨 [DASHBOARD] IMMEDIATE: Found opportunities data!', opportunitiesData.data);
    } else {
      console.log('🚨 [DASHBOARD] IMMEDIATE: No opportunities data found, using counts:', actualCounts);
    }
    
    // Process data if we have opportunities data OR if we have counts from the database
    if ((opportunitiesData.data?.length || 0) > 0) {
      console.log('🔍 [DASHBOARD] Found opportunities data, processing it');
    } else if (loading || !acquisitionData?.data) {
      console.log('🔍 [DASHBOARD] Still loading or no data, keeping loading state');
      return;
    } else if (actualCounts.opportunities > 0) {
      console.log('🔍 [DASHBOARD] No opportunities data but have counts, using counts for stats');
    } else {
      console.log('🔍 [DASHBOARD] No opportunities data or counts available');
      return;
    }
    
    // Data has finished loading, process it
    console.log('🔍 [DASHBOARD] Processing opportunities data:', {
      dataLength: opportunitiesData.data?.length || 0,
      loading: loading,
      acquisitionDataExists: !!acquisitionData?.data,
      acquisitionDataKeys: acquisitionData?.data ? Object.keys(acquisitionData.data) : [],
      acquireDataKeys: acquisitionData?.acquireData ? Object.keys(acquisitionData.acquireData) : [],
      data: opportunitiesData.data
    });
    
    // Filter for only open opportunities (exclude closed won, closed lost, etc.)
    const openOpportunities = (opportunitiesData.data || []).filter((opp: any) => {
      const stage = opp.stage?.toLowerCase() || '';
      const status = opp.status?.toLowerCase() || '';
      
      console.log('🔍 [DASHBOARD] Filtering opportunity:', {
        name: opp.name,
        stage,
        status,
        amount: opp.amount
      });
      
      // Exclude closed opportunities
      const isOpen = !stage.includes('closed') && 
             !status.includes('closed') && 
             !stage.includes('won') && 
             !stage.includes('lost') &&
             stage !== 'closed' &&
             status !== 'closed';
             
      console.log('🔍 [DASHBOARD] Is open?', isOpen);
      return isOpen;
    });
    
    console.log('🔍 [DASHBOARD] Opportunity filtering:', {
      totalOpportunities: opportunitiesData.data?.length || 0,
      openOpportunities: openOpportunities.length,
      stages: (opportunitiesData.data || []).map((opp: any) => opp.stage),
      statuses: (opportunitiesData.data || []).map((opp: any) => opp.status),
      sampleOpportunity: (opportunitiesData.data || [])[0] // Show structure of first opportunity
    });
    
    // Calculate total value from open opportunities
    const totalValue = openOpportunities.reduce((sum: number, opp: any) => {
      // Handle different value field names
      const valueField = opp.value || opp.amount || opp.estimatedValue || opp.dealValue || '0';
      const value = parseFloat(valueField.toString().replace(/[^0-9.-]+/g, '') || '0');
      
      console.log('💰 [DASHBOARD] Value calculation:', {
        opportunity: opp.name || opp.id,
        valueField,
        parsedValue: value,
        runningSum: sum + value
      });
      
      return sum + value;
    }, 0);
    
    const activeDeals = openOpportunities.length;
    
    // FIXED: Use counts from database when data arrays are empty
    const opportunitiesToUse = openOpportunities.length > 0 ? openOpportunities : opportunitiesData.data;
    const dealsToShow = opportunitiesToUse.length > 0 ? opportunitiesToUse.length : actualCounts.opportunities;
    
    console.log('🔍 [DASHBOARD] Using opportunities:', {
      openOpportunities: openOpportunities.length,
      allOpportunities: opportunitiesData.data?.length || 0,
      usingAll: openOpportunities['length'] === 0,
      usingCounts: dealsToShow === actualCounts.opportunities
    });
    
    // Calculate win rate from closed opportunities
    const closedOpportunities = (opportunitiesData.data || []).filter((opp: any) => {
      const stage = opp.stage?.toLowerCase() || '';
      return stage.includes('closed') || stage.includes('won') || stage.includes('lost');
    });
    
    const closedWon = closedOpportunities.filter((opp: any) => {
      const stage = opp.stage?.toLowerCase() || '';
      return stage.includes('won') || stage.includes('closed won');
    }).length;
    
    const totalClosed = closedOpportunities.length;
    const winRate = totalClosed > 0 ? Math.round((closedWon / totalClosed) * 100) : 0;
    
    // FIXED: Use demo-appropriate values when data arrays are empty
    const newStats = {
      revenue: totalValue > 0 ? `$${(totalValue / 1000000).toFixed(1)}M` : '$0.0M',
      opportunities: dealsToShow,
      winRate: totalClosed > 0 ? `${winRate}%` : '0%',
      monthlyGrowth: '0%' // Could be calculated from historical data
    };
    
    // Only update stats if they've actually changed to prevent infinite loops
    setDashboardStats(prevStats => {
      const hasChanged = JSON.stringify(prevStats) !== JSON.stringify(newStats);
      
      if (hasChanged) {
        console.log('🎯 [DASHBOARD] Setting new stats:', newStats);
        return newStats;
      }
      
      return prevStats;
    });
    
    // Set loading to false after processing
    console.log('🎯 [DASHBOARD] Setting statsLoading to false');
    // EMERGENCY FALLBACK: If we still have no data, show basic counts
    if (dealsToShow === 0 && (opportunitiesData.data?.length || 0) > 0) {
      console.log('🚨 [DASHBOARD] EMERGENCY FALLBACK: Using all opportunities');
      setDashboardStats({
        revenue: '$1.0M', // Placeholder
        opportunities: opportunitiesData.data?.length || 0,
        winRate: '50%', // Placeholder
        monthlyGrowth: '0%'
      });
    }
    
    // Set loading to false after processing (outside of the main effect logic)
    setTimeout(() => {
      setStatsLoading(false);
    }, 0);
    
    console.log('✅ [DASHBOARD] Stats calculated:', {
      openOpportunities: activeDeals,
      dealsToShow,
      totalValue: `$${(totalValue / 1000000).toFixed(1)}M`,
      rawValue: totalValue,
      winRate: `${winRate}%`,
      closedWon,
      totalClosed,
      loading: false
    });
  }, [opportunitiesData.data?.length, loading, acquisitionData?.data, actualCounts.opportunities]);

  // Keep the original dashboard loading useEffect
  useEffect(() => {
    let isMounted = true;
    
        // This useEffect is no longer needed since we're using optimized hooks
    return () => {
      isMounted = false;
    };
  }, []);

  // Get workspace context for section filtering
  const allowedSections = getFilteredSectionsForWorkspace({
    workspaceSlug,
    appId: 'pipeline'
  });

  const sections = [
    // DASHBOARD: Leadership dashboard
    {
      id: "dashboard",
      name: "Dashboard",
      description: "Overview & Analytics",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : "Today",
      visible: false // Hidden for this release
    },
    // New order as requested by user
    {
      id: "speedrun",
      name: "Speedrun",
      description: "Drive revenue",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.speedrun || 0,
      visible: allowedSections.includes('speedrun') && (isDemoMode ? demoModeVisibility.isSpeedrunVisible : (isSpeedrunVisible ?? true))
    },
    {
      id: "news",
      name: "News",
      description: "Stay informed",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.news || 0,
      visible: false // Hidden for now
    },
    {
      id: "leads",
      name: "Leads",
      description: "Cold relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.leads,
      visible: allowedSections.includes('leads') && (isDemoMode ? demoModeVisibility.isLeadsVisible : (isLeadsVisible ?? true))
    },
    {
      id: "prospects",
      name: "Prospects",
      description: "Warm relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : (productionCounts.prospects || 0),
      visible: allowedSections.includes('prospects') && (isDemoMode ? demoModeVisibility.isProspectsVisible : (isProspectsVisible ?? true))
    },
    {
      id: "opportunities",
      name: "Opportunities",
      description: "Real Workstream",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : (() => {
        const opportunities = acquisitionData?.acquireData?.opportunities || [];
        const totalPeople = opportunities.reduce((sum: number, opp: any) => sum + (opp.peopleCount || 0), 0);
        const formattedOpportunities = (productionCounts.opportunities || 0).toLocaleString();
        const formattedPeople = totalPeople > 0 ? totalPeople.toLocaleString() : '';
        return `${formattedOpportunities}${formattedPeople ? ` (${formattedPeople})` : ''}`;
      })(),
      visible: allowedSections.includes('opportunities') && (isDemoMode ? demoModeVisibility.isOpportunitiesVisible : (isOpportunitiesVisible ?? true))
    },
    {
      id: "clients",
      name: "Clients",
      description: "Earned Relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.clients,
      visible: allowedSections.includes('clients') && shouldShowClients
    },
    {
      id: "people",
      name: "People",
      description: "Individual entities",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.people,
      visible: allowedSections.includes('people') && true
    },
    {
      id: "companies",
      name: "Companies",
      description: "Business entities",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.companies,
      visible: allowedSections.includes('companies') && true
    },
    {
      id: "chronicle",
      name: "Chronicle",
      description: "Business Intelligence Reports",
      count: isNotaryEveryday ? (
        chronicleUnreadCount > 0 ? (
          <span className="bg-warning/10 text-warning text-xs px-2 py-0.5 rounded-full">
            New
          </span>
        ) : (
          chronicleCount || 0
        )
      ) : 0,
      visible: allowedSections.includes('chronicle') && shouldShowChronicle
    },
    {
      id: "metrics",
      name: "Metrics",
      description: "Performance metrics",
      count: hasMetrics ? metricsCount : 0,
      visible: allowedSections.includes('metrics') && shouldShowMetrics
    },
    {
      id: "nova",
      name: "Nova",
      description: "Native web browser",
      count: "🌌",
      visible: false // Hidden for everyone
    },
    // SELLERS: Show only for demo workspace
    {
      id: "sellers",
      name: "Sellers",
      description: "Sales Team",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.sellers, // Use production counts like other sections
      visible: isDemoMode // Show only for demo workspace
    },
    // DESKTOP DOWNLOAD: Show only for specific workspaces
  ];

  // Apply custom section ordering for specific users
  const customSectionOrder = getCustomSectionOrder(userId || '', authUser?.email || '', workspaceSlug);
  let orderedSections = sections;
  
  if (customSectionOrder && customSectionOrder.length > 0) {
    // Create a map of section id to section object for quick lookup
    const sectionMap = new Map(sections.map(section => [section.id, section]));
    
    // Reorder sections based on custom order, keeping sections not in the custom order at the end
    const customOrderedSections = customSectionOrder
      .map(sectionId => sectionMap.get(sectionId))
      .filter(Boolean); // Remove undefined entries
    
    // Add remaining sections that weren't in the custom order
    const remainingSections = sections.filter(section => !customSectionOrder.includes(section.id));
    
    orderedSections = [...customOrderedSections, ...remainingSections];
  }

  // 🛡️ VALIDATION: Ensure we have valid workspace and user IDs before proceeding
  // This must come AFTER all hooks are declared to prevent React hooks errors
  // CRITICAL FIX: Allow rendering even if userId is missing initially to prevent blank panel
  // The component will still render sections, they just won't have user-specific data
  if (!safeWorkspaceId) {
    // Debug logging to understand the issue
    console.log('🔍 [DEBUG] Validation check:', {
      safeWorkspaceId,
      safeUserId,
      workspaceId,
      userId,
      acquisitionDataExists: !!acquisitionData,
      acquisitionDataLoading: acquisitionData?.loading?.isLoading,
      authUserActiveWorkspaceId: authUser?.activeWorkspaceId,
      authUserId: authUser?.id
    });
    
    // Show loading state while acquisitionData is loading or auth is loading
    if (!acquisitionData || acquisitionData.data?.loading?.isLoading || authLoading) {
      return (
        <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-background text-foreground border-r border-border flex flex-col h-full">
          <div className="p-4 text-center">
            <div className="text-sm text-muted">Loading workspace...</div>
          </div>
        </div>
      );
    }
    
    console.error('❌ [VALIDATION] Missing workspace ID after loading:', { 
      workspaceId, 
      userId, 
      safeWorkspaceId,
      safeUserId,
      acquisitionDataExists: !!acquisitionData,
      authLoading
    });
    // Don't show loading state if we don't have valid context
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-background text-foreground border-r border-border flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-red-500">Invalid workspace context</div>
          <div className="text-xs text-muted mt-1">Please refresh the page</div>
        </div>
      </div>
    );
  }
  
  // CRITICAL FIX: Log warning if userId is missing but continue rendering
  // This prevents blank panel when userId is temporarily unavailable
  if (!safeUserId) {
    console.warn('⚠️ [LEFT PANEL] User ID not available, rendering with limited functionality:', {
      workspaceId: safeWorkspaceId,
      authUserId: authUser?.id,
      authLoading
    });
  }

  
  // Filter visible sections
  const visibleSections = orderedSections.filter(section => section.visible);
  
  // Split sections: first 7 visible, rest in "More"
  const mainSections = visibleSections.slice(0, 7);
  const moreSections = visibleSections.slice(7);
  
  return (
    <div className="flex-1 space-y-1">
      {/* Render first 7 sections */}
      {mainSections.map((section) => (
        <button
          key={section.id}
          onClick={() => handleSectionClick(section.id)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-hover text-foreground'
                  : 'hover:bg-panel-background text-foreground'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{section.name}</span>
            <span className="text-sm text-muted">
              {typeof section['count'] === 'number' ? section.count.toLocaleString() : 
               typeof section['count'] === 'string' && !isNaN(Number(section.count)) ? Number(section.count).toLocaleString() : 
               section.count}
            </span>
          </div>
          <div className="text-xs text-muted mt-1">
            {section.description}
          </div>
        </button>
      ))}
      
      {/* Render "More" dropdown if there are more than 7 sections */}
      {moreSections.length > 0 && (
        <>
          <button
            onClick={() => setIsMoreExpanded(!isMoreExpanded)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-panel-background text-foreground`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">More</span>
              {isMoreExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </div>
            <div className="text-xs text-muted mt-1">
              Additional sections
            </div>
          </button>
          
          {/* Expanded sections inline - stay expanded when clicking items */}
          {isMoreExpanded && moreSections.map((section) => (
            <button
              key={section.id}
              onClick={(e) => {
                e.stopPropagation();
                handleSectionClick(section.id);
                // Keep expanded - don't close
              }}
              className={`w-full text-left px-3 py-2 pl-8 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-hover text-foreground'
                      : 'hover:bg-panel-background text-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{section.name}</span>
                <span className="text-sm text-muted">
                  {typeof section['count'] === 'number' ? section.count.toLocaleString() : 
                   typeof section['count'] === 'string' && !isNaN(Number(section.count)) ? Number(section.count).toLocaleString() : 
                   section.count}
                </span>
              </div>
              <div className="text-xs text-muted mt-1">
                {section.description}
              </div>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

export function PipelineLeftPanelStandalone({
  activeSection,
  onSectionChange,
  isSpeedrunVisible = true,
  setIsSpeedrunVisible,
  isOpportunitiesVisible = true,
  setIsOpportunitiesVisible,
  isProspectsVisible = true,
  setIsProspectsVisible,
  isLeadsVisible = true,
  setIsLeadsVisible,
  isCustomersVisible = false, // Hidden by default
  setIsCustomersVisible,
  isPartnersVisible = false, // Hidden by default (will be overridden for non-pinpoint workspaces)
  setIsPartnersVisible
}: PipelineLeftPanelStandaloneProps) {
  // Get auth context to ensure we have proper workspace/user before loading
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const currentWorkspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const currentUserId = authUser?.id;
  
  // Get acquisition data for dashboard stats
  const { data: acquisitionData } = useRevenueOS();
  
  // 🚀 PERFORMANCE: Use fast counts hook for instant navigation counts
  const { counts: fastCounts, loading: fastCountsLoading, forceRefresh: forceRefreshCounts } = useFastCounts();
  
  // 🔧 FIX: Use fast section data for opportunities to get real deal values
  const { data: opportunitiesData, count: opportunitiesCount, loading: opportunitiesLoading } = useFastSectionData('opportunities', 10000);
  
  // Feature access control
  const hasStacks = useStacksAccess();

  // 🔄 REMOVED: Automatic refresh to prevent infinite loops
  // The useFastCounts hook handles workspace switching automatically via events

  // Pipeline context for profile functionality (not Monaco)
  const {
    user,
    company,
    workspace
  } = usePipeline();
  
  // Use centralized profile popup context
  const {
    isProfileOpen,
    setIsProfileOpen,
    profileAnchor,
    setProfileAnchor
  } = useProfilePopup();

  // Use profile panel context
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();

  // Dashboard stats state with neutral defaults (will be replaced by real data)
  const [dashboardStats, setDashboardStats] = useState({
    revenue: '$0.0M', // Will be replaced by real data from API
    opportunities: 0, // Will be replaced by real data from API
    winRate: '0%', // Will be replaced by real data from API
    monthlyGrowth: '0%' // Will be replaced by real data from API
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(false);

  // Ensure minimum loading time for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTimeElapsed(true);
    }, 500); // Show loading for at least 500ms

    return () => clearTimeout(timer);
  }, []);

  // 🚀 PERFORMANCE FIX: Memoize loading state to prevent unnecessary reloads
  // Only show loading when data is actually changing, not on every render
  const isDataLoaded = useMemo(() => {
    return acquisitionData && !acquisitionData.isLoading && acquisitionData.acquireData;
  }, [acquisitionData?.isLoading, !!acquisitionData?.acquireData]);
  
  // Check if opportunities data is actually available (not just acquireData exists)
  const hasOpportunitiesData = useMemo(() => {
    return Array.isArray(acquisitionData?.acquireData?.opportunities);
  }, [acquisitionData?.acquireData?.opportunities]);
  
  const shouldShowLoading = useMemo(() => {
    // Show loading if:
    // 1. Minimum time hasn't elapsed, OR
    // 2. Opportunities data is actively loading, OR
    // 3. Opportunities data hasn't loaded yet (but not if it's an empty array - that's valid)
    if (!minLoadingTimeElapsed || opportunitiesLoading) {
      return true;
    }
    // If loading is done but we don't have data yet (not even an empty array), show loading
    if (!opportunitiesLoading && opportunitiesData === undefined) {
      return true;
    }
    return false;
  }, [minLoadingTimeElapsed, opportunitiesLoading, opportunitiesData]);

  // Workspace branding state
  const [workspaceBranding, setWorkspaceBranding] = useState({
    logoUrl: '/favicon.ico',
    primaryColor: '#1f2937',
    secondaryColor: '#3b82f6'
  });

  // State for "More" dropdown - moved to parent to prevent reset on re-renders
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  // Handle section click
  const handleSectionClick = (section: string) => {
    console.log('🔄 Pipeline section clicked:', section);
    
    // Special debug for Nova
    if (section === "nova") {
      console.log('🌌 Nova clicked - calling onSectionChange');
    }
    
    onSectionChange(section);
  };

  // Handle profile click - conditionally show ProfilePanel or ProfileBox based on workspace
  const handleProfileClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      console.log('🔘 Profile button clicked!');
      event.preventDefault();
      event.stopPropagation();
      
      // Check if this is Leonardo user - allow ProfilePanel access on RevenueOS
      const isLeonardo = authUser?.email?.toLowerCase() === 'leonardo@pinpoint-adrata.com' ||
                        authUser?.id === '01K90EQX4S34RS0PFRWY0ATFS2';
      
      // Check if this is Pinpoint workspace (RevenueOS)
      const isPinpointWorkspace = workspace?.name?.toLowerCase() === 'pinpoint' ||
                                 workspace?.name?.toLowerCase() === 'revenueos';
      
      // Allow Leonardo to access ProfilePanel on RevenueOS
      if (isLeonardo && isPinpointWorkspace) {
        console.log('🔘 Opening ProfilePanel for Leonardo on RevenueOS:', workspace?.name);
        const newState = !isProfilePanelVisible;
        console.log('🔄 Toggling profile panel state:', isProfilePanelVisible, '->', newState);
        setIsProfilePanelVisible(newState);
        return;
      }
      
      // Check if this is Dan user - allow ProfilePanel access on Adrata workspace
      const isDan = authUser?.email?.toLowerCase() === 'dan@adrata.com' ||
                   authUser?.id === '01K1VBYZMWTCT09FWEKBDMCXZM';
      
      // Check if this is Adrata workspace
      const isAdrataWorkspace = workspace?.name?.toLowerCase() === 'adrata';
      
      // Allow Dan to access ProfilePanel on Adrata workspace
      if (isDan && isAdrataWorkspace) {
        console.log('🔘 Opening ProfilePanel for Dan on Adrata:', workspace?.name);
        const newState = !isProfilePanelVisible;
        console.log('🔄 Toggling profile panel state:', isProfilePanelVisible, '->', newState);
        setIsProfilePanelVisible(newState);
        return;
      }
      
      // Check if this is Ryan Serrato user - allow ProfilePanel access on Notary Everyday workspace
      const isRyan = authUser?.email?.toLowerCase() === 'ryan@notaryeveryday.com' ||
                   authUser?.id === '01K7DP7QTRKXZGDHJ857RZFEW8';
      
      // Check if this is Notary Everyday workspace
      const isNotaryEverydayWorkspace = workspace?.name?.toLowerCase() === 'notary everyday' ||
                                       workspace?.name?.toLowerCase() === 'notaryeveryday';
      
      // Allow Ryan to access ProfilePanel on Notary Everyday workspace
      if (isRyan && isNotaryEverydayWorkspace) {
        console.log('🔘 Opening ProfilePanel for Ryan on Notary Everyday:', workspace?.name);
        const newState = !isProfilePanelVisible;
        console.log('🔄 Toggling profile panel state:', isProfilePanelVisible, '->', newState);
        setIsProfilePanelVisible(newState);
        return;
      }
      
      // Check if this is Justin user - allow ProfilePanel access
      const isJustin = authUser?.email?.toLowerCase().includes('justin') ||
                       authUser?.name?.toLowerCase().includes('justin');
      
      // Allow Justin to access ProfilePanel
      if (isJustin) {
        console.log('🔘 Opening ProfilePanel for Justin');
        const newState = !isProfilePanelVisible;
        console.log('🔄 Toggling profile panel state:', isProfilePanelVisible, '->', newState);
        setIsProfilePanelVisible(newState);
        return;
      }
      
      // Check user restrictions first - if user has restrictions, use ProfileBox popup (like TOP)
      const { getUserRestrictions } = require('@/platform/services/user-restrictions-service');
      const userRestrictions = authUser?.id && authUser?.email ? 
        getUserRestrictions(authUser.id, authUser.email, workspace?.name || '') : 
        { hasRestrictions: false };

      if (userRestrictions.hasRestrictions) {
        // Use ProfileBox popup for restricted users (like TOP workspace)
        console.log('🔘 Opening ProfileBox popup for restricted user:', workspace?.name);
        if (isProfileOpen) {
          setIsProfileOpen(false);
        } else {
          setProfileAnchor(event.currentTarget);
          setIsProfileOpen(true);
        }
        return;
      }

      // Check if this is Adrata or Notary Everyday workspace (for unrestricted users)
      const isAdrataOrNotaryEveryday = workspace?.name?.toLowerCase() === 'adrata' || 
                                      workspace?.name?.toLowerCase() === 'notary everyday' ||
                                      workspace?.name?.toLowerCase() === 'notaryeveryday';
      
      if (isAdrataOrNotaryEveryday) {
        // Show ProfilePanel for Adrata and Notary Everyday workspaces (unrestricted users)
        console.log('🔘 Opening ProfilePanel for workspace:', workspace?.name);
        const newState = !isProfilePanelVisible;
        console.log('🔄 Toggling profile panel state:', isProfilePanelVisible, '->', newState);
        setIsProfilePanelVisible(newState);
      } else {
        // Toggle ProfileBox popup for other workspaces
        if (isProfileOpen) {
          console.log('🔘 Closing ProfileBox popup for workspace:', workspace?.name);
          setIsProfileOpen(false);
        } else {
          console.log('🔘 Opening ProfileBox popup for workspace:', workspace?.name);
          setProfileAnchor(event.currentTarget);
          setIsProfileOpen(true);
        }
      }
    } catch (error) {
      console.error('❌ Error handling profile click:', error);
      // Fallback: try to open ProfileBox popup
      try {
        setProfileAnchor(event.currentTarget);
        setIsProfileOpen(true);
      } catch (fallbackError) {
        console.error('❌ Fallback profile open also failed:', fallbackError);
      }
    }
  };

  // Load workspace branding data
  useEffect(() => {
    let isMounted = true;
    
    const loadWorkspaceBranding = async () => {
      try {
        if (!authUser || authLoading) return;
        
        // 🆕 CRITICAL FIX: Use provider workspace instead of URL detection
        const workspaceId = authUser?.activeWorkspaceId;
        if (!workspaceId) return;
        
        const response = await fetch(`/api/workspace/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId })
        });
        
        if (response['ok'] && isMounted) {
          const data = await response.json();
          if (data.branding) {
            console.log('🎨 Workspace branding loaded:', {
              workspaceId,
              workspaceName: workspace,
              branding: data.branding
            });
            setWorkspaceBranding(data.branding);
          }
        }
      } catch (error) {
        console.warn('Failed to load workspace branding:', error);
      }
    };
    
    loadWorkspaceBranding();
    
    return () => {
      isMounted = false;
    };
  }, [authUser?.activeWorkspaceId, authLoading]);

  // DISABLED: Dashboard stats now use the same data source as other left panel items
  // No separate API call needed - uses acquisitionData from useRevenueOS hook

  return (
    <div className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header - matching Monaco style */}
        <div className="mx-2 mt-4 mb-2">
          {/* Company Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-hover border border-border overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-foreground">
                {(() => {
                  const companyName = (workspace?.name || workspaceName || "Adrata").trim();
                  // Special handling for specific companies
                  if (companyName === "Notary Everyday") {
                    return "NE";
                  }
                  if (companyName === "Adrata") {
                    return "A";
                  }
                  // Default behavior for other workspaces - take first two letters
                  return companyName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2) || 'AD';
                })()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <h3 className="text-lg font-bold leading-tight" style={{ margin: 0, padding: 0 }}>
                  RevenueOS
                </h3>
              </div>
              <div className="text-xs text-muted font-medium" style={{ marginTop: '-1px' }}>
                Sales Acceleration
              </div>
            </div>
          </div>
        </div>

        {/* Executive Performance Dashboard */}
        <div className="mx-2 mb-4 p-3 bg-hover rounded-lg border border-border">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Revenue</span>
              <span className="text-xs font-semibold text-foreground">
                {shouldShowLoading ? (
                  <div className="w-8 h-3 bg-loading-bg rounded animate-pulse"></div>
                ) : (() => {
                  // Check if we're in demo mode
                  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
                  
                  // 🔧 FIX: Use real opportunities data from v1 API
                  const opportunities = opportunitiesData || [];
                  if (opportunities.length > 0) {
                    const closedWonOpportunities = opportunities.filter((opp: any) => {
                      const stage = opp.opportunityStage?.toLowerCase() || opp.stage?.toLowerCase() || '';
                      return stage.includes('won') || stage.includes('closed-won') || stage === 'closed won';
                    });
                    
                    const totalRevenue = closedWonOpportunities.reduce((sum: number, opp: any) => {
                      // Use opportunityAmount field which is the standardized deal value field
                      const value = Number(opp.opportunityAmount || opp.amount || opp.revenue || opp.dealValue || 0);
                      return sum + value;
                    }, 0);
                    
                    return totalRevenue > 0 ? `$${(totalRevenue / 1000000).toFixed(1)}M` : (isDemoMode ? "$47.2M" : "$0.0M");
                  }
                  return isDemoMode ? "$47.2M" : "$0.0M";
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Workstream</span>
              <span className="text-xs font-semibold text-foreground">
                {shouldShowLoading ? (
                  <div className="w-8 h-3 bg-loading-bg rounded animate-pulse"></div>
                ) : (() => {
                  // Check if we're in demo mode
                  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
                  
                  // 🔧 FIX: Use real opportunities data from v1 API
                  const opportunities = opportunitiesData || [];
                  if (opportunities.length > 0) {
                    const openOpportunities = opportunities.filter((opp: any) => {
                      const stage = opp.opportunityStage?.toLowerCase() || opp.stage?.toLowerCase() || '';
                      const status = opp.status?.toLowerCase() || '';
                      // Filter out closed/won/lost opportunities
                      return !stage.includes('closed') && !status.includes('closed') && 
                             !stage.includes('won') && !stage.includes('lost') &&
                             stage !== 'closed' && status !== 'closed' &&
                             stage !== 'closed-won' && stage !== 'closed-lost';
                    });
                    
                    const totalValue = openOpportunities.reduce((sum: number, opp: any) => {
                      // Use opportunityAmount field which is the standardized deal value field
                      const value = Number(opp.opportunityAmount || opp.amount || opp.revenue || opp.dealValue || 0);
                      return sum + value;
                    }, 0);
                    
                    return totalValue > 0 ? `$${(totalValue / 1000000).toFixed(1)}M` : (isDemoMode ? "$89.4M" : "$0.0M");
                  }
                  return isDemoMode ? "$89.4M" : "$0.0M";
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Coverage</span>
              <span className="text-xs font-semibold text-foreground">
                {shouldShowLoading ? (
                  <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
                ) : (() => {
                  // Check if we're in demo mode
                  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
                  
                  // 🔧 FIX: Use real opportunities data from v1 API
                  const opportunities = opportunitiesData || [];
                  const quarterlyTarget = 1000000; // $1M quarterly target (can be made configurable)
                  
                  if (opportunities.length > 0) {
                    const openOpportunities = opportunities.filter((opp: any) => {
                      const stage = opp.opportunityStage?.toLowerCase() || opp.stage?.toLowerCase() || '';
                      const status = opp.status?.toLowerCase() || '';
                      // Filter out closed/won/lost opportunities
                      return !stage.includes('closed') && !status.includes('closed') && 
                             !stage.includes('won') && !stage.includes('lost') &&
                             stage !== 'closed' && status !== 'closed' &&
                             stage !== 'closed-won' && stage !== 'closed-lost';
                    });
                    
                    const totalValue = openOpportunities.reduce((sum: number, opp: any) => {
                      // Use opportunityAmount field which is the standardized deal value field
                      const value = Number(opp.opportunityAmount || opp.amount || opp.revenue || opp.dealValue || 0);
                      return sum + value;
                    }, 0);
                    
                    const coverage = quarterlyTarget > 0 ? Math.round((totalValue / quarterlyTarget) * 100) : 0;
                    return `${coverage}%`;
                  }
                  return isDemoMode ? "87%" : "0%";
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Middle Section - Workstream Sections */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2">
        <PipelineSections
          activeSection={activeSection}
          handleSectionClick={handleSectionClick}
          isSpeedrunVisible={isSpeedrunVisible}
          isOpportunitiesVisible={isOpportunitiesVisible}
          isProspectsVisible={isProspectsVisible}
          isLeadsVisible={isLeadsVisible}
          isCustomersVisible={isCustomersVisible}
          isPartnersVisible={isPartnersVisible}
          fastCounts={fastCounts}
          fastCountsLoading={fastCountsLoading}
          isMoreExpanded={isMoreExpanded}
          setIsMoreExpanded={setIsMoreExpanded}
        />
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-hover transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-hover border border-border rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">{user?.initial || (authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U')}</span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-foreground">
              {user?.firstName && user?.lastName && user.firstName.trim() && user.lastName.trim()
                ? `${user.firstName} ${user.lastName}` 
                : user?.firstName && user.firstName.trim()
                ? user.firstName
                : user?.name ? (user.name.charAt(0).toUpperCase() + user.name.slice(1)) : authUser?.name || 'User'}
            </div>
            <div className="text-xs text-muted">
              {(workspace?.name || authUser?.workspaces?.find(w => w['id'] === authUser.activeWorkspaceId)?.name || 'Adrata').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
            </div>
          </div>
        </button>
      </div>

      {/* Profile Popup - Removed to prevent duplicate popups */}
      {/* The ProfileBox is now handled by PipelineView component */}
    </div>
  );
}

// Export alias for backward compatibility
export const LeftPanel = PipelineLeftPanelStandalone;