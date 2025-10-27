"use client";

import React, { useState, useEffect, useRef } from "react";
import { authFetch } from '@/platform/api-fetch';
import { useRouter } from "next/navigation";
import { WorkspaceDataRouter } from "@/platform/services/workspace-data-router";
import { usePipeline } from "@/products/pipeline/context/PipelineContext";
import { useProfilePopup } from "@/platform/ui/components/ProfilePopupContext";
import { ProfileBox } from "@/platform/ui/components/ProfileBox";
import { useUnifiedAuth } from "@/platform/auth";
// CRITICAL FIX: Re-enable PipelineDataStore for proper data loading
import { usePipelineData } from "@/platform/hooks/useAdrataData";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useFastCounts } from "@/platform/hooks/useFastCounts";
import { getWorkspaceBySlug } from "@/platform/config/workspace-mapping";
import { useChronicleCount } from "@/platform/hooks/useChronicleCount";
import { useMetricsCount } from "@/platform/hooks/useMetricsCount";
import { getPlatform } from "@/platform/platform-detection";


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
  fastCountsLoading
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
}) {
  // Get auth context in this component
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  // 🆕 CRITICAL FIX: Use provider workspace instead of URL detection
  const { data: acquisitionData } = useAcquisitionOS();
  
  // 🆕 CRITICAL FIX: Use provider workspace instead of URL detection
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const userId = authUser?.id;
  
  // Get workspace name for Nova visibility check
  const activeWorkspace = authUser?.workspaces?.find(w => w['id'] === workspaceId);
  const workspaceName = activeWorkspace?.name || "";
  
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
  const { count: chronicleCount } = useChronicleCount();
  
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
  const loading = fastCountsLoading || authLoading || false;
  
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

  const sections = [
    // DASHBOARD: Leadership dashboard
    {
      id: "dashboard",
      name: "Dashboard",
      description: "Overview & Analytics",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : "Today",
      visible: false // Hidden for this release
    },
    // New order as requested by user
    {
      id: "speedrun",
      name: "Speedrun",
      description: "Drive revenue",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : productionCounts.speedrun || 0,
      visible: isDemoMode ? demoModeVisibility.isSpeedrunVisible : (isSpeedrunVisible ?? true)
    },
    {
      id: "chronicle",
      name: "Chronicle",
      description: "Business Intelligence Reports",
      count: isNotaryEveryday ? chronicleCount : 0, // Show count for Notary Everyday
      visible: false // Hidden for now
    },
    {
      id: "news",
      name: "News",
      description: "Stay informed",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : productionCounts.news || 0,
      visible: false // Hidden for now
    },
    {
      id: "leads",
      name: "Leads",
      description: "Cold relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : productionCounts.leads,
      visible: isDemoMode ? demoModeVisibility.isLeadsVisible : (isLeadsVisible ?? true)
    },
    {
      id: "prospects",
      name: "Prospects",
      description: "Warm relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : (productionCounts.prospects || 0),
      visible: isDemoMode ? demoModeVisibility.isProspectsVisible : (isProspectsVisible ?? true)
    },
    {
      id: "opportunities",
      name: "Opportunities",
      description: "Real Pipeline",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : (() => {
        const opportunities = acquisitionData?.acquireData?.opportunities || [];
        const totalPeople = opportunities.reduce((sum: number, opp: any) => sum + (opp.peopleCount || 0), 0);
        const formattedOpportunities = (productionCounts.opportunities || 0).toLocaleString();
        const formattedPeople = totalPeople > 0 ? totalPeople.toLocaleString() : '';
        return `${formattedOpportunities}${formattedPeople ? ` (${formattedPeople})` : ''}`;
      })(),
      visible: isDemoMode ? demoModeVisibility.isOpportunitiesVisible : (isOpportunitiesVisible ?? true)
    },
    {
      id: "clients",
      name: "Clients",
      description: "Earned Relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : productionCounts.clients,
      visible: isDemoMode ? demoModeVisibility.isCustomersVisible : (isCustomersVisible ?? true)
    },
    {
      id: "partners",
      name: "Partners",
      description: "Strategic Alliances",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : productionCounts.partners,
      visible: false // Hidden as requested
    },
    {
      id: "people",
      name: "People",
      description: "Individual entities",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : productionCounts.people,
      visible: true
    },
    {
      id: "companies",
      name: "Companies",
      description: "Business entities",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : productionCounts.companies,
      visible: true
    },
    {
      id: "nova",
      name: "Nova",
      description: "Native web browser",
      count: "🌌",
      visible: authUser?.email === "ross@adrata.com" && workspaceName.toLowerCase() === "adrata" && getPlatform() === "desktop"
    },
    {
      id: "metrics",
      name: "Metrics",
      description: "Weekly Sales Performance",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : "9", // 9 different metrics displayed on the page
      visible: false // Hidden for now
    },
    // SELLERS: Show only for demo workspace
    {
      id: "sellers",
      name: "Sellers",
      description: "Sales Team",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : productionCounts.sellers, // Use production counts like other sections
      visible: isDemoMode // Show only for demo workspace
    },
  ];

  // 🛡️ VALIDATION: Ensure we have valid workspace and user IDs before proceeding
  // This must come AFTER all hooks are declared to prevent React hooks errors
  if (!safeWorkspaceId || !safeUserId) {
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
        <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
          <div className="p-4 text-center">
            <div className="text-sm text-[var(--muted)]">Loading workspace...</div>
          </div>
        </div>
      );
    }
    
    console.error('❌ [VALIDATION] Missing workspace or user ID after loading:', { 
      workspaceId, 
      userId, 
      safeWorkspaceId,
      safeUserId,
      acquisitionDataExists: !!acquisitionData,
      authLoading
    });
    // Don't show loading state if we don't have valid context
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-red-500">Invalid workspace context</div>
          <div className="text-xs text-[var(--muted)] mt-1">Please refresh the page</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-1">
      {sections.filter(section => section.visible).map((section) => (
        <button
          key={section.id}
          onClick={() => handleSectionClick(section.id)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-[var(--background)] text-gray-800 border-l-2 border-[var(--accent)]'
                  : 'hover:bg-[var(--panel-background)] text-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{section.name}</span>
            <span className="text-sm text-[var(--muted)]">
              {typeof section['count'] === 'number' ? section.count.toLocaleString() : 
               typeof section['count'] === 'string' && !isNaN(Number(section.count)) ? Number(section.count).toLocaleString() : 
               section.count}
            </span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">
            {section.description}
          </div>
        </button>
      ))}
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
  isPartnersVisible = true,
  setIsPartnersVisible
}: PipelineLeftPanelStandaloneProps) {
  // Get auth context to ensure we have proper workspace/user before loading
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const currentWorkspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const currentUserId = authUser?.id;
  
  // Get acquisition data for dashboard stats
  const { data: acquisitionData } = useAcquisitionOS();
  
  // 🚀 PERFORMANCE: Use fast counts hook for instant navigation counts
  const { counts: fastCounts, loading: fastCountsLoading, forceRefresh: forceRefreshCounts } = useFastCounts();

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

  // Workspace branding state
  const [workspaceBranding, setWorkspaceBranding] = useState({
    logoUrl: '/favicon.ico',
    primaryColor: '#1f2937',
    secondaryColor: '#3b82f6'
  });

  // Handle section click
  const handleSectionClick = (section: string) => {
    console.log('🔄 Pipeline section clicked:', section);
    
    // Special debug for Nova
    if (section === "nova") {
      console.log('🌌 Nova clicked - calling onSectionChange');
    }
    
    onSectionChange(section);
  };

  // Handle profile click
  const handleProfileClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('🔘 Profile button clicked!', { 
      isProfileOpen, 
      profileAnchor,
      user,
      company,
      workspace,
      setIsProfileOpen: typeof setIsProfileOpen,
      setProfileAnchor: typeof setProfileAnchor
    });
    event.preventDefault();
    event.stopPropagation();
    
    const buttonElement = event.currentTarget;
    console.log('🎯 Setting profile anchor:', buttonElement);
    console.log('🎯 Button rect:', buttonElement.getBoundingClientRect());
    setProfileAnchor(buttonElement);
    
    // Using Pipeline context - no refresh needed as user is static
    
    const newState = !isProfileOpen;
    console.log('🔄 Toggling profile open state:', isProfileOpen, '->', newState);
    setIsProfileOpen(newState);
    
    // Additional debugging
    setTimeout(() => {
      console.log('🔍 After state change:', { 
        isProfileOpen: newState, 
        profileAnchor: buttonElement,
        shouldRenderPopup: newState && buttonElement,
        user,
        company,
        workspace
      });
    }, 100);
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
  // No separate API call needed - uses acquisitionData from useAcquisitionOS hook

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header - matching Monaco style */}
        <div className="mx-2 mt-4 mb-2">
          {/* Company Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">
                {(() => {
                  const companyName = (workspace || "Sales Acceleration").trim();
                  // Special handling for TOP Engineering Plus - show "TOP" in icon
                  if (companyName === "TOP Engineering Plus" || companyName === "TOP Engineers Plus") {
                    return "TOP";
                  }
                  // Default behavior for other workspaces
                  return companyName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 3) || 'AD';
                })()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <h3 className="text-lg font-bold leading-tight" style={{ margin: 0, padding: 0 }}>
                  {(() => {
                    const companyName = (workspace || "Sales Acceleration").trim();
                    console.log('🔍 Company name debug:', { companyName, length: companyName.length });
                    
                    // Special handling for TOP Engineering Plus - show truncated name
                    if (companyName === "TOP Engineering Plus" || companyName === "TOP Engineers Plus") {
                      return "Top E...";
                    }
                    
                    return companyName.length > 7 ? `${companyName.slice(0, 7)}...` : companyName;
                  })()}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-800 border border-gray-200">
                  Pro
                </span>
              </div>
              <div className="text-xs text-[var(--muted)] font-medium" style={{ marginTop: '-1px' }}>
                Sales Acceleration
              </div>
            </div>
          </div>
        </div>

        {/* Executive Performance Dashboard */}
        <div className="mx-2 mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Revenue</span>
              <span className="text-xs font-semibold text-black">
                {(acquisitionData?.isLoading || !minLoadingTimeElapsed) ? (
                  <div className="w-8 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                ) : (() => {
                  // Check if we're in demo mode
                  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
                  
                  // Calculate revenue from closed won opportunities
                  const opportunities = acquisitionData?.acquireData?.opportunities || [];
                  if (opportunities.length > 0) {
                    const closedWonOpportunities = opportunities.filter((opp: any) => {
                      const stage = opp.stage?.toLowerCase() || '';
                      return stage.includes('won') || stage.includes('closed won');
                    });
                    
                    const totalRevenue = closedWonOpportunities.reduce((sum: number, opp: any) => {
                      const valueField = opp.value || opp.amount || opp.estimatedValue || opp.dealValue || '0';
                      const value = parseFloat(valueField.toString().replace(/[^0-9.-]+/g, '') || '0');
                      return sum + value;
                    }, 0);
                    
                    return totalRevenue > 0 ? `$${(totalRevenue / 1000000).toFixed(1)}M` : (isDemoMode ? "$47.2M" : "$0.0M");
                  }
                  return isDemoMode ? "$47.2M" : "$0.0M";
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Pipeline</span>
              <span className="text-xs font-semibold text-black">
                {(acquisitionData?.isLoading || !minLoadingTimeElapsed) ? (
                  <div className="w-8 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                ) : (() => {
                  // Check if we're in demo mode
                  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
                  
                  // Calculate total pipeline value from all open opportunities
                  const opportunities = acquisitionData?.acquireData?.opportunities || [];
                  if (opportunities.length > 0) {
                    const openOpportunities = opportunities.filter((opp: any) => {
                      const stage = opp.stage?.toLowerCase() || '';
                      const status = opp.status?.toLowerCase() || '';
                      return !stage.includes('closed') && !status.includes('closed') && 
                             !stage.includes('won') && !stage.includes('lost') &&
                             stage !== 'closed' && status !== 'closed';
                    });
                    
                    const totalValue = openOpportunities.reduce((sum: number, opp: any) => {
                      const valueField = opp.value || opp.amount || opp.estimatedValue || opp.dealValue || '0';
                      const value = parseFloat(valueField.toString().replace(/[^0-9.-]+/g, '') || '0');
                      return sum + value;
                    }, 0);
                    
                    return totalValue > 0 ? `$${(totalValue / 1000000).toFixed(1)}M` : (isDemoMode ? "$89.4M" : "$0.0M");
                  }
                  return isDemoMode ? "$89.4M" : "$0.0M";
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Coverage</span>
              <span className="text-xs font-semibold text-black">
                {(acquisitionData?.isLoading || !minLoadingTimeElapsed) ? (
                  <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                ) : (() => {
                  // Check if we're in demo mode
                  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
                  
                  // Calculate coverage as pipeline / quarterly target
                  const opportunities = acquisitionData?.acquireData?.opportunities || [];
                  const quarterlyTarget = 1000000; // $1M quarterly target (can be made configurable)
                  
                  if (opportunities.length > 0) {
                    const openOpportunities = opportunities.filter((opp: any) => {
                      const stage = opp.stage?.toLowerCase() || '';
                      const status = opp.status?.toLowerCase() || '';
                      return !stage.includes('closed') && !status.includes('closed') && 
                             !stage.includes('won') && !stage.includes('lost') &&
                             stage !== 'closed' && status !== 'closed';
                    });
                    
                    const totalValue = openOpportunities.reduce((sum: number, opp: any) => {
                      const valueField = opp.value || opp.amount || opp.estimatedValue || opp.dealValue || '0';
                      const value = parseFloat(valueField.toString().replace(/[^0-9.-]+/g, '') || '0');
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

      {/* Scrollable Middle Section - Pipeline Sections */}
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
        />
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">{user.initial}</span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">{user.name}</div>
            <div className="text-xs text-[var(--muted)]">{workspace}</div>
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