"use client";

import React, { useState, useEffect, useRef } from "react";
import { authFetch } from '@/platform/api-fetch';
import { useRouter } from "next/navigation";
import { WorkspaceDataRouter } from "@/platform/services/workspace-data-router";
import { usePipeline } from "@/products/pipeline/context/PipelineContext";
import { useProfilePopup } from "@/platform/ui/components/ProfilePopupContext";
import { ProfileBox } from "@/platform/ui/components/ProfileBox";
import { useUnifiedAuth } from "@/platform/auth";
import { usePipelineData } from "@/platform/hooks/useAdrataData";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useFastCounts } from "@/platform/hooks/useFastCounts";

function isFederalHoliday(date: Date): boolean {
  const FEDERAL_HOLIDAYS_2025 = [
    '2025-01-01',
    '2025-01-20',
    '2025-02-17',
    '2025-05-26',
    '2025-07-04',
    '2025-09-01',
    '2025-10-13',
    '2025-11-11',
    '2025-11-27',
    '2025-12-25',
  ];
  const dateString = date.toISOString().split('T')[0];
  return FEDERAL_HOLIDAYS_2025.includes(dateString);
}

function getColorFilter(hexColor: string): string {
  const colorFilters: Record<string, string> = {
    '#AE3033': 'hue-rotate(350deg) saturate(2.5) brightness(0.7) contrast(1.5)',
    '#0A1F49': 'hue-rotate(220deg) saturate(2) brightness(0.4)',
    '#1f2937': 'hue-rotate(220deg) saturate(0.3) brightness(0.3)',
    '#3b82f6': 'hue-rotate(220deg) saturate(1.2) brightness(0.8)',
  };
  
  const filter = colorFilters[hexColor] || `hue-rotate(0deg) saturate(1) brightness(0.5)`;
  console.log('🎨 Color filter applied:', { hexColor, filter });
  return filter;
}


interface LeftPanelProps {
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
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const userId = authUser?.id;
  
  console.log('🔍 [LEFT PANEL] Using provider workspace:', {
    acquisitionDataExists: !!acquisitionData,
    providerWorkspaceId: workspaceId,
    userActiveWorkspaceId: authUser?.activeWorkspaceId,
    userId: userId
  });
  
  const safeWorkspaceId = (workspaceId && workspaceId !== 'default') ? workspaceId : undefined;
  const safeUserId = (userId && userId !== 'default') ? userId : undefined;
  
  const actualCounts = acquisitionData?.acquireData?.counts || {};
  
  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                    (workspaceId && workspaceId.includes('demo')) ||
                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
  console.log('🔍 [LEFT PANEL] Demo mode check:', { 
    isDemoMode, 
    workspaceId,
    pathname: typeof window !== "undefined" ? window.location.pathname : 'server' 
  });
  
  const demoModeVisibility = {
    isSpeedrunVisible: true,
    isOpportunitiesVisible: false,
    isProspectsVisible: false,
    isLeadsVisible: false,
    isCustomersVisible: false,
    isPartnersVisible: false
  };
  
  const [fallbackCounts, setFallbackCounts] = useState<any>({});
  const [fallbackLoading, setFallbackLoading] = useState(false);
  
  const finalCounts = fastCounts && Object.keys(fastCounts).length > 0 ? fastCounts : 
                     (actualCounts && Object.keys(actualCounts).length > 0 ? actualCounts : fallbackCounts);
  
  console.log('🔍 [LEFT PANEL DEBUG] Counts sources:', {
    fastCounts,
    actualCounts,
    fallbackCounts,
    finalCounts,
    fastCountsLoading,
    authLoading
  });
  
  // Only show loading if we don't have any data AND we're actually loading
  const loading = (fastCountsLoading || authLoading) && !acquisitionData?.acquireData;
  
  const leadsData = {
    data: acquisitionData?.acquireData?.leads || [],
    loading: loading && (acquisitionData?.acquireData?.leads || []).length === 0,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.leads || []).length === 0,
    count: finalCounts.leads || 0
  };
  
  const prospectsData = {
    data: acquisitionData?.acquireData?.prospects || [],
    loading: loading && (acquisitionData?.acquireData?.prospects || []).length === 0,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.prospects || []).length === 0,
    count: finalCounts.prospects || 0
  };
  
  const opportunitiesData = {
    data: acquisitionData?.acquireData?.opportunities || [],
    loading: loading && (acquisitionData?.acquireData?.opportunities || []).length === 0,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.opportunities || []).length === 0,
    count: finalCounts.opportunities || 0
  };
  
  const companiesData = {
    data: acquisitionData?.acquireData?.companies || [],
    loading: loading && (acquisitionData?.acquireData?.companies || []).length === 0,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.companies || []).length === 0,
    count: finalCounts.companies || 0
  };
  
  const peopleData = {
    data: acquisitionData?.acquireData?.people || [],
    loading: loading && (acquisitionData?.acquireData?.people || []).length === 0,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.people || []).length === 0,
    count: finalCounts.people || 0
  };
  
  const clientsData = {
    data: acquisitionData?.acquireData?.clients || [],
    loading: loading && (acquisitionData?.acquireData?.clients || []).length === 0,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.clients || []).length === 0,
    count: finalCounts.clients || 0
  };
  
  const partnersData = {
    data: acquisitionData?.acquireData?.partners || [],
    loading: loading && (acquisitionData?.acquireData?.partners || []).length === 0,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.partners || []).length === 0,
    count: finalCounts.partners || 0
  };
  
  const sellersData = {
    data: acquisitionData?.acquireData?.sellers || [],
    loading: loading && (acquisitionData?.acquireData?.sellers || []).length === 0,
    error: null,
    isEmpty: (acquisitionData?.acquireData?.sellers || []).length === 0,
    count: finalCounts.sellers || 0
  };
  
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
  
  const [currentSection, setCurrentSection] = useState<string>('leads');
  
  useEffect(() => {
    const updateSection = () => {
      const pathname = window.location.pathname;
      const sectionMatch = pathname.match(/\/[^\/]+\/([^\/]+)/);
      const section = sectionMatch?.[1] || 'leads';
      setCurrentSection(section);
    };
    
    const handlePipelineSectionChange = (event: CustomEvent) => {
      const { section: newSection } = event.detail;
      setCurrentSection(newSection);
      console.log(`🔄 [LEFT PANEL] Section changed to: ${newSection}`);
    };
    
    updateSection();
    
    window.addEventListener('popstate', updateSection);
    window.addEventListener('pipeline-section-change', handlePipelineSectionChange as EventListener);
    
    return () => {
      window.removeEventListener('popstate', updateSection);
      window.removeEventListener('pipeline-section-change', handlePipelineSectionChange as EventListener);
    };
  }, []);
  
  const [stableCounts, setStableCounts] = useState({
    speedrun: 0,
    opportunities: 0,
    leads: 0,
    prospects: 0,
    clients: 0,
    partners: 0,
    companies: 0,
    people: 0,
    sellers: 0
  });
  
  useEffect(() => {
    const openOpportunities = (opportunitiesData.data || []).filter((opp: any) => {
      const stage = opp.stage?.toLowerCase() || '';
      const status = opp.status?.toLowerCase() || '';
      
      return !stage.includes('closed') && 
             !status.includes('closed') && 
             !stage.includes('won') && 
             !stage.includes('lost') &&
             stage !== 'closed' &&
             status !== 'closed';
    });
    
    const speedrunItems = acquisitionData?.acquireData?.speedrunItems || [];
    console.log('🔍 [SPEEDRUN DEBUG] Speedrun data:', {
      hasAcquisitionData: !!acquisitionData,
      hasAcquireData: !!acquisitionData?.acquireData,
      speedrunItemsLength: speedrunItems.length,
      speedrunItems: speedrunItems.slice(0, 3),
      allDataKeys: acquisitionData?.acquireData ? Object.keys(acquisitionData.acquireData) : []
    });
    
    const hookCounts = {
      speedrun: fastCounts?.speedrun || 0,
      opportunities: openOpportunities.length,
      leads: leadsData.count,
      prospects: prospectsData.count,
      clients: clientsData.count,
      partners: partnersData.count,
      companies: companiesData.count,
      people: finalCounts.people || 0,
      sellers: fastCounts?.sellers || sellersData.count
    };
    
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
  acquisitionData?.acquireData?.speedrunItems
]);
  
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
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('⏰ [DASHBOARD] Loading timeout reached, forcing stats to load');
      setStatsLoading(false);
      
      if ((opportunitiesData.data?.length || 0) > 0 && dashboardStats['opportunities'] === 0) {
        console.log('🚨 [DASHBOARD] TIMEOUT FALLBACK: Showing actual data stats');
        setDashboardStats({
          revenue: '$0.0M',
          opportunities: opportunitiesData.data?.length || 0,
          winRate: '0%',
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
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [opportunitiesData.data?.length, dashboardStats.opportunities]);

  useEffect(() => {
    console.log('🔍 [DASHBOARD] useEffect triggered:', {
      loading,
      acquisitionDataExists: !!acquisitionData?.data,
      opportunitiesDataLength: opportunitiesData.data?.length || 0,
      opportunitiesData: opportunitiesData.data,
      acquisitionData: acquisitionData,
      actualCounts: actualCounts
    });
    
    if ((opportunitiesData.data?.length || 0) > 0) {
      console.log('🚨 [DASHBOARD] IMMEDIATE: Found opportunities data!', opportunitiesData.data);
    } else {
      console.log('🚨 [DASHBOARD] IMMEDIATE: No opportunities data found, using counts:', actualCounts);
    }
    
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
    
    console.log('🔍 [DASHBOARD] Processing opportunities data:', {
      dataLength: opportunitiesData.data?.length || 0,
      loading: loading,
      acquisitionDataExists: !!acquisitionData?.data,
      acquisitionDataKeys: acquisitionData?.data ? Object.keys(acquisitionData.data) : [],
      acquireDataKeys: acquisitionData?.acquireData ? Object.keys(acquisitionData.acquireData) : [],
      data: opportunitiesData.data
    });
    
    const openOpportunities = (opportunitiesData.data || []).filter((opp: any) => {
      const stage = opp.stage?.toLowerCase() || '';
      const status = opp.status?.toLowerCase() || '';
      
      console.log('🔍 [DASHBOARD] Filtering opportunity:', {
        name: opp.name,
        stage,
        status,
        amount: opp.amount
      });
      
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
      sampleOpportunity: (opportunitiesData.data || [])[0]
    });
    
    const totalValue = openOpportunities.reduce((sum: number, opp: any) => {
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
    
    const opportunitiesToUse = openOpportunities.length > 0 ? openOpportunities : opportunitiesData.data;
    const dealsToShow = opportunitiesToUse.length > 0 ? opportunitiesToUse.length : actualCounts.opportunities;
    
    console.log('🔍 [DASHBOARD] Using opportunities:', {
      openOpportunities: openOpportunities.length,
      allOpportunities: opportunitiesData.data?.length || 0,
      usingAll: openOpportunities['length'] === 0,
      usingCounts: dealsToShow === actualCounts.opportunities
    });
    
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
    
    const newStats = {
      revenue: totalValue > 0 ? `$${(totalValue / 1000000).toFixed(1)}M` : '$0.0M',
      opportunities: dealsToShow,
      winRate: totalClosed > 0 ? `${winRate}%` : '0%',
      monthlyGrowth: '0%'
    };
    
    setDashboardStats(prevStats => {
      const hasChanged = JSON.stringify(prevStats) !== JSON.stringify(newStats);
      
      if (hasChanged) {
        console.log('🎯 [DASHBOARD] Setting new stats:', newStats);
        return newStats;
      }
      
      return prevStats;
    });
    
    console.log('🎯 [DASHBOARD] Setting statsLoading to false');
    if (dealsToShow === 0 && (opportunitiesData.data?.length || 0) > 0) {
      console.log('🚨 [DASHBOARD] EMERGENCY FALLBACK: Using all opportunities');
      setDashboardStats({
        revenue: '$1.0M',
        opportunities: opportunitiesData.data?.length || 0,
        winRate: '50%',
        monthlyGrowth: '0%'
      });
    }
    
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

  useEffect(() => {
    let isMounted = true;
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Check if user has any companies or people data
  const hasCompaniesOrPeople = (companiesData.count > 0 || peopleData.count > 0);
  
  console.log('🔍 [PIPELINE VISIBILITY] Checking data availability:', {
    companiesCount: companiesData.count,
    peopleCount: peopleData.count,
    hasCompaniesOrPeople,
    isDemoMode,
    companiesData: companiesData.data?.length || 0,
    peopleData: peopleData.data?.length || 0
  });
  
  const sections = [
    {
      id: "dashboard",
      name: "Dashboard",
      description: "Overview & Analytics",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : "Today",
      visible: false
    },
    {
      id: "speedrun",
      name: "Speedrun",
      description: "Drive revenue",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : (() => {
        const today = new Date();
        const isWeekend = today.getDay() === 0 || today.getDay() === 6;
        const isHolidayToday = isFederalHoliday(today);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const isHolidayTomorrow = isFederalHoliday(tomorrow);
        
        if (isHolidayToday || isHolidayTomorrow) {
          return "Holiday";
        }
        if (isWeekend) {
          return "Weekend";
        }
        return productionCounts.speedrun || 0;
      })(),
      visible: isDemoMode ? demoModeVisibility.isSpeedrunVisible : (hasCompaniesOrPeople && (isSpeedrunVisible ?? true))
    },
    {
      id: "leads",
      name: "Leads",
      description: "Cold relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : productionCounts.leads,
      visible: isDemoMode ? demoModeVisibility.isLeadsVisible : (hasCompaniesOrPeople && (isLeadsVisible ?? true))
    },
    {
      id: "prospects",
      name: "Prospects",
      description: "Warm relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : (productionCounts.prospects || 0),
      visible: isDemoMode ? demoModeVisibility.isProspectsVisible : (hasCompaniesOrPeople && (isProspectsVisible ?? true))
    },
    {
      id: "opportunities",
      name: "Opportunities",
      description: "Real Pipeline",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : (() => {
        const opportunities = acquisitionData?.acquireData?.opportunities || [];
        const totalPeople = opportunities.reduce((sum: number, opp: any) => sum + (opp.peopleCount || 0), 0);
        return `${productionCounts.opportunities}${totalPeople > 0 ? ` (${totalPeople})` : ''}`;
      })(),
      visible: isDemoMode ? demoModeVisibility.isOpportunitiesVisible : (hasCompaniesOrPeople && (isOpportunitiesVisible ?? true))
    },
    {
      id: "clients",
      name: "Clients",
      description: "Earned Relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : productionCounts.clients,
      visible: isDemoMode ? demoModeVisibility.isCustomersVisible : (isCustomersVisible ?? true)
    },
    {
      id: "partners",
      name: "Partners",
      description: "Strategic Alliances",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : productionCounts.partners,
      visible: false
    },
    {
      id: "people",
      name: "People",
      description: "Individual entities",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : productionCounts.people,
      visible: true
    },
    {
      id: "companies",
      name: "Companies",
      description: "Business entities",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : productionCounts.companies,
      visible: true
    },
    {
      id: "sellers",
      name: "Sellers",
      description: "Sales Team",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : productionCounts.sellers,
      visible: isDemoMode
    },
    {
      id: "metrics",
      name: "Metrics",
      description: "Key performance indicators",
      count: loading ? (
        <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
      ) : "16",
      visible: false
    },
  ];

  if (!safeWorkspaceId || !safeUserId) {
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
    
    if (!acquisitionData || acquisitionData.data?.loading?.isLoading || authLoading) {
      return (
        <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500">Loading workspace...</div>
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
    return (
      <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-red-500">Invalid workspace context</div>
          <div className="text-xs text-gray-500 mt-1">Please refresh the page</div>
        </div>
      </div>
    );
  }

  const visibleSections = sections.filter(section => section.visible);
  const pipelineSections = ['speedrun', 'leads', 'prospects', 'opportunities'];
  const hasVisiblePipelineSections = visibleSections.some(section => pipelineSections.includes(section.id));

  return (
    <div className="flex-1 space-y-1">
      {visibleSections.map((section) => (
        <button
          key={section.id}
          onClick={() => handleSectionClick(section.id)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            activeSection === section.id
              ? 'bg-gray-100 text-gray-900'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{section.name}</span>
            <span className="text-sm text-[var(--muted)]">{typeof section['count'] === 'number' ? section.count.toLocaleString() : section.count}</span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">
            {section.description}
          </div>
        </button>
      ))}
      
      {/* Show helpful message when no pipeline sections are visible */}
      {!isDemoMode && !hasVisiblePipelineSections && !loading && (
        <div className="px-3 py-4 text-center">
          <div className="text-xs text-gray-500 mb-2">
            Add companies or people to unlock pipeline features
          </div>
          <div className="text-xs text-gray-400">
            Leads, Prospects, Opportunities, and Speedrun will appear here
          </div>
        </div>
      )}
    </div>
  );
}

export function LeftPanel({
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
  isCustomersVisible = false,
  setIsCustomersVisible,
  isPartnersVisible = true,
  setIsPartnersVisible
}: LeftPanelProps) {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const currentWorkspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const currentUserId = authUser?.id;
  
  const { data: acquisitionData } = useAcquisitionOS();
  
  const { counts: fastCounts, loading: fastCountsLoading, forceRefresh: forceRefreshCounts } = useFastCounts();

  const {
    user,
    company,
    workspace
  } = usePipeline();
  
  const {
    isProfileOpen,
    setIsProfileOpen,
    profileAnchor,
    setProfileAnchor
  } = useProfilePopup();

  const [dashboardStats, setDashboardStats] = useState({
    revenue: '$0.0M',
    opportunities: 0,
    winRate: '0%',
    monthlyGrowth: '0%'
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [workspaceBranding, setWorkspaceBranding] = useState({
    logoUrl: '/favicon.ico',
    primaryColor: '#1f2937',
    secondaryColor: '#3b82f6'
  });

  const handleSectionClick = (section: string) => {
    console.log('🔄 Pipeline section clicked:', section);
    
    // Get current data counts to check what's available
    const companiesCount = acquisitionData?.acquireData?.companies?.length || 0;
    const peopleCount = acquisitionData?.acquireData?.people?.length || 0;
    const hasCompaniesOrPeople = companiesCount > 0 || peopleCount > 0;
    
    // Pipeline sections that require companies or people data
    const pipelineSections = ['speedrun', 'leads', 'prospects', 'opportunities'];
    const isPipelineSection = pipelineSections.includes(section);
    
    // If user tries to access pipeline sections without companies/people data, redirect to companies
    if (isPipelineSection && !hasCompaniesOrPeople) {
      console.log(`🔄 [LEFT PANEL] Redirecting from ${section} to companies (no data available)`);
      onSectionChange('companies');
      return;
    }
    
    // ⚡ INSTANT NAVIGATION: Call onSectionChange immediately for instant feedback
    onSectionChange(section);
    
    // 🚀 PRE-CACHE: Pre-cache data for the target section if not already available
    if (typeof window !== 'undefined') {
      const targetData = acquisitionData?.acquireData?.[section] || [];
      if (targetData.length > 0) {
        // Cache the data for instant access
        sessionStorage.setItem(`cached-section-${section}`, JSON.stringify({
          data: targetData,
          timestamp: Date.now(),
          count: targetData.length
        }));
        console.log(`⚡ [LEFT PANEL] Pre-cached ${targetData.length} items for ${section}`);
      }
    }
  };

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
    
    const newState = !isProfileOpen;
    console.log('🔄 Toggling profile open state:', isProfileOpen, '->', newState);
    setIsProfileOpen(newState);
    
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

  useEffect(() => {
    let isMounted = true;
    
    const loadWorkspaceBranding = async () => {
      try {
        if (!authUser || authLoading) return;
        
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

  return (
    <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        <div className="mx-2 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">
                {(() => {
                  const companyName = (workspace || "Sales Acceleration").trim();
                  if (companyName === "TOP Engineering Plus" || companyName === "TOP Engineers Plus") {
                    return "TOP";
                  }
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
                    
                    if (companyName === "TOP Engineering Plus" || companyName === "TOP Engineers Plus") {
                      return "TOP Engi...";
                    }
                    
                    return companyName.length > 7 ? `${companyName.slice(0, 7)}...` : companyName;
                  })()}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Pro
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium" style={{ marginTop: '-1px' }}>
                Sales Acceleration
              </div>
            </div>
          </div>
        </div>

        <div className="mx-2 mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Revenue</span>
              <span className="text-xs font-semibold text-black">
                {(acquisitionData?.isLoading) ? (
                  <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                ) : (() => {
                  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
                  
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
              <span className="text-xs font-medium text-gray-600">Pipeline</span>
              <span className="text-xs font-semibold text-black">
                {(acquisitionData?.isLoading) ? (
                  <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                ) : (() => {
                  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
                  
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
              <span className="text-xs font-medium text-gray-600">Coverage</span>
              <span className="text-xs font-semibold text-black">
                {(acquisitionData?.isLoading) ? (
                  <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
                ) : (() => {
                  const isDemoMode = (typeof window !== "undefined" && window.location.pathname.startsWith('/demo/')) ||
                                    (typeof window !== "undefined" && window.location.pathname.includes('/demo'));
                  
                  const opportunities = acquisitionData?.acquireData?.opportunities || [];
                  const quarterlyTarget = 1000000;
                  
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

      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">{user.initial}</span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">{user.name}</div>
            <div className="text-xs text-gray-400">{workspace}</div>
          </div>
        </button>
      </div>
    </div>
  );
}