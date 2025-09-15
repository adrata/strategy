"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { PipelineHeader } from './PipelineHeader';
import { DashboardSkeleton } from './DashboardSkeleton';

interface WeeklyActivityData {
  // This Week Performance
  callsMade: number;
  emailsSent: number;
  meetingsScheduled: number;
  opportunitiesAdvanced: number;
  newLeadsGenerated: number;
  linkedinsSent?: number;
  
  // Weekly Targets & Progress
  weeklyCallTarget: number;
  weeklyEmailTarget: number;
  weeklyMeetingTarget: number;
  weeklyOpportunityTarget: number;
  weeklyLinkedinTarget?: number;
  
  // Weekly Trends
  callsVsLastWeek: number;
  emailsVsLastWeek: number;
  meetingsVsLastWeek: number;
  opportunitiesVsLastWeek: number;
  linkedinsVsLastWeek?: number;
  
  // Pipeline Health This Week
  newOpportunities: number;
  closedWonOpportunities: number;
  pipelineValueAdded: number;
  avgOpportunitySizeThisWeek: number;
  
  // Monthly Metrics
  monthlyNewOpportunities?: number;
  monthlyPipelineValue?: number;
  monthlyConversionRate?: number;
  monthlyDealsClosed?: number;
  
  // YTD Metrics
  ytdRevenue?: number;
  ytdAvgDealSize?: number;
  ytdWinRate?: number;
  ytdSalesCycle?: number;
  ytdPipelineValue?: number;
  ytdNewDeals?: number;
  ytdConversionRate?: number;
  ytdActivityVolume?: number;
  ytdActivityConversion?: number;
  
  // Team Performance
  topPerformer: string;
  teamCallsTotal: number;
  teamEmailsTotal: number;
  teamMeetingsTotal: number;
  
  // Real Pipeline Metrics
  totalPipelineValue: number;
  totalOpportunitiesCount: number;
  totalLeadsCount: number;
  openOpportunitiesCount: number;
  
  // Conversion Metrics
  leadToOpportunityRate: number;
  weeklyRevenue: number;
  avgSalesCycleLength: number | null;
  
  lastUpdated: string;
}

interface ActivityMetricProps {
  title: string;
  value: number;
  target?: number;
  trend?: number;
  subtitle?: string;
  color?: 'success' | 'warning' | 'danger' | 'primary';
  icon?: string;
  onClick?: () => void;
}

function ActivityMetric({ 
  title, 
  value, 
  target, 
  trend, 
  subtitle, 
  color = 'primary',
  onClick
}: ActivityMetricProps) {
  const progress = target ? Math.min((value / target) * 100, 100) : 0;
  
  // Determine performance status for progress bar color only (minimal design)
  const getProgressBarColor = () => {
    if (!target) return 'bg-gray-400';
    
    // Smart progress indication based on day of week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysIntoWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0, Sunday = 6
    const expectedProgress = (daysIntoWeek / 5) * 100; // Expected progress by day (5-day work week)
    
    // More lenient thresholds early in the week
    if (daysIntoWeek <= 1) {
      // Monday/Tuesday - very lenient
      if (progress >= 20) return 'bg-green-500';      // On track
      if (progress >= 10) return 'bg-yellow-500';     // Behind but recoverable  
      return 'bg-gray-400';                           // Too early to judge
    } else if (daysIntoWeek <= 3) {
      // Wednesday/Thursday - moderate
      if (progress >= 60) return 'bg-green-500';      // On track
      if (progress >= 30) return 'bg-yellow-500';     // Behind but recoverable  
      return 'bg-red-500';                            // Needs attention
    } else {
      // Friday+ - strict
      if (progress >= 80) return 'bg-green-500';      // On track
      if (progress >= 50) return 'bg-yellow-500';     // Behind but recoverable  
      return 'bg-red-500';                            // Needs attention
    }
  };
  
  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getTrendIcon = () => {
    if (!trend) return '→';
    if (trend > 0) return '↗';
    if (trend < 0) return '↘';
    return '→';
  };

  return (
    <div 
      className={`bg-white p-6 rounded-lg border border-gray-200 transition-all hover:shadow-sm ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {trend !== undefined && (
          <div className={`flex items-center text-sm font-medium ${getTrendColor()}`}>
            <span className="mr-1">{getTrendIcon()}</span>
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {(value ?? 0).toLocaleString()}
      </div>
      
      {target && (
        <>
          <div className="text-sm text-gray-500 mb-3">
            of {(target ?? 0).toLocaleString()} target
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {/* Smart performance indicator based on day of week */}
          <div className="mt-2 text-xs text-gray-500">
            {(() => {
              const now = new Date();
              const dayOfWeek = now.getDay();
              const daysIntoWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              
              if (daysIntoWeek <= 1) {
                // Monday/Tuesday - very lenient
                if (progress >= 20) return <span>On Track</span>;
                if (progress >= 10) return <span>Getting Started</span>;
                return <span>Early Week</span>;
              } else if (daysIntoWeek <= 3) {
                // Wednesday/Thursday - moderate
                if (progress >= 60) return <span>On Track</span>;
                if (progress >= 30) return <span>Behind Schedule</span>;
                return <span>Needs Attention</span>;
              } else {
                // Friday+ - strict
                if (progress >= 80) return <span>On Track</span>;
                if (progress >= 50) return <span>Behind Schedule</span>;
                return <span>Needs Attention</span>;
              }
            })()}
          </div>
        </>
      )}
    </div>
  );
}



export function Dashboard() {
  const { user, isLoading: authLoading } = useUnifiedAuth();
  const router = useRouter();
  // 🆕 CRITICAL FIX: Use useAcquisitionOS for consistent data source
  const { data: acquisitionData } = useAcquisitionOS();
  const [activityData, setActivityData] = useState<WeeklyActivityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🆕 CRITICAL FIX: Use workspace from provider instead of URL detection
  const workspaceId = user?.activeWorkspaceId;
  const userId = user?.id;
  
  console.log('🔍 [DASHBOARD DEBUG] Using provider workspace:', {
    providerWorkspaceId: workspaceId,
    userActiveWorkspaceId: user?.activeWorkspaceId,
    userId: userId
  });

  const loadActivityData = async () => {
    try {
      if (!workspaceId || !userId) {
        console.warn('No workspace or user ID available for Dashboard');
        setError('No workspace available');
        return;
      }

      setIsLoading(true);
      setError(null);
      console.log('📊 Loading Dashboard...', { workspaceId, userId });
      
      const response = await fetch(`/api/pipeline/dashboard?workspaceId=${workspaceId}&userId=${userId}&_t=${Date.now()}&_cache=${Math.random()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Dashboard API error:', response.status, errorText);
        throw new Error(`Failed to load dashboard: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Debug: Log the actual response structure
      console.log('🔍 [DASHBOARD DEBUG] API Response:', {
        hasSuccess: 'success' in data,
        successValue: data.success,
        hasData: 'data' in data,
        dataType: typeof data.data,
        dataKeys: data.data ? Object.keys(data.data) : 'no data',
        fullResponse: data
      });
      
      // More detailed validation - handle both direct data and wrapped responses
      const isValidResponse = data && typeof data === 'object';
      const hasWrappedResponse = data && 'success' in data && 'data' in data;
      const hasDirectData = data && !hasWrappedResponse && typeof data === 'object';
      
      console.log('🔍 [DASHBOARD DEBUG] Response validation:', {
        isValidResponse,
        hasWrappedResponse,
        hasDirectData,
        dataExists: !!data,
        dataType: typeof data,
        successExists: 'success' in data,
        successValue: data?.success,
        successType: typeof data?.success,
        dataExists: 'data' in data,
        dataValue: !!data?.data,
        dataType: typeof data?.data,
        dataKeys: data?.data ? Object.keys(data.data) : (data ? Object.keys(data) : 'no data')
      });
      
      if (isValidResponse) {
        let dashboardData;
        
        if (hasWrappedResponse && data['success'] === true && data.data) {
          // Handle wrapped response format: { success: true, data: {...} }
          dashboardData = data.data;
        } else if (hasDirectData) {
          // Handle direct data format: {...}
          dashboardData = data;
        } else {
          throw new Error(data?.error || 'Invalid response format');
        }
        
        // Add timestamp to track data freshness
        const dataWithTimestamp = {
          ...dashboardData,
          lastUpdated: Date.now()
        };
        setActivityData(dataWithTimestamp);
        console.log('✅ Dashboard loaded successfully');
      } else {
        console.error('❌ [DASHBOARD DEBUG] Response validation failed:', {
          success: data?.success,
          hasData: !!data?.data,
          error: data?.error,
          fullData: data
        });
        throw new Error(data?.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error loading Dashboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Track workspace changes to force data refresh
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && workspaceId && userId) {
      // Check if workspace or user has changed - force refresh if so
      const workspaceChanged = workspaceId !== lastWorkspaceId;
      const userChanged = userId !== lastUserId;
      
      if (workspaceChanged || userChanged) {
        console.log('🔄 [DASHBOARD] Workspace or user changed, forcing data refresh:', {
          workspaceChanged,
          userChanged,
          oldWorkspace: lastWorkspaceId,
          newWorkspace: workspaceId,
          oldUser: lastUserId,
          newUser: userId
        });
        
        // Clear old data and force refresh
        setActivityData(null);
        setLastWorkspaceId(workspaceId);
        setLastUserId(userId);
        loadActivityData();
      } else if (!activityData || Date.now() - (activityData as any).lastUpdated > 300000) {
        // Load data if we don't have it or if it's stale
        loadActivityData();
      } else {
        // We have fresh data
      }
    } else if (!authLoading && !user) {
      setError('Please sign in to view dashboard');
    }
  }, [workspaceId, userId, authLoading, user, lastWorkspaceId, lastUserId]);

  const handleRefresh = () => {
    loadActivityData();
  };

  const handleClearCache = () => {
    // Clear any cached data and force refresh
    setActivityData(null);
    setLastWorkspaceId(null);
    setLastUserId(null);
    loadActivityData();
  };

  // Navigation functions for detail pages
  const handleLinkedinsClick = () => {
    router.push('./dashboard/linkedins');
  };

  const handleCallsClick = () => {
    router.push('./dashboard/calls');
  };

  const handleEmailsClick = () => {
    router.push('./dashboard/emails');
  };

  const handleMeetingsClick = () => {
    router.push('./dashboard/meetings');
  };

  const handleOpportunitiesClick = () => {
    router.push('./dashboard/opportunities');
  };

  const handleNewOpportunitiesClick = () => {
    router.push('./dashboard/new-opportunities');
  };

  const handleTotalPipelineClick = () => {
    router.push('./dashboard/total-pipeline');
  };

  const handleLeadConversionClick = () => {
    router.push('./dashboard/lead-conversion');
  };

  const handleOpportunitiesClosedClick = () => {
    router.push('./dashboard/opportunities-closed');
  };

  const handleWeeklyRevenueClick = () => {
    router.push('./dashboard/weekly-revenue');
  };

  const handleAvgDealSizeClick = () => {
    router.push('./dashboard/avg-deal-size');
  };

  const handlePipelineValueAddedClick = () => {
    router.push('./dashboard/pipeline-value-added');
  };

  const handleSalesCycleClick = () => {
    router.push('./dashboard/sales-cycle');
  };

  const handleTopPerformerClick = () => {
    router.push('./dashboard/top-performer');
  };

  const handleTeamCallsClick = () => {
    router.push('./dashboard/team-calls');
  };

  const handleTeamMeetingsClick = () => {
    router.push('./dashboard/team-meetings');
  };

  const handleNewLeadsClick = () => {
    router.push('./dashboard/new-leads');
  };

        // Dashboard doesn't need header metrics - pass null
      const headerMetrics = null;

  // Show skeleton loading state for content only (header always visible)
  if (isLoading && !activityData) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-white">
        <PipelineHeader
          section="dashboard"
          metrics={headerMetrics}
          onSectionChange={() => {}}
          onRefresh={handleRefresh}
          onClearCache={handleClearCache}
          loading={isLoading}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Remove loading state - show content immediately
  // Provide default values if no data yet
  const defaultData: WeeklyActivityData = {
    callsMade: 0,
    emailsSent: 0,
    meetingsScheduled: 0,
    opportunitiesAdvanced: 0,
    newLeadsGenerated: 0,
    linkedinsSent: 0,
    weeklyCallTarget: 50,
    weeklyEmailTarget: 100,
    weeklyMeetingTarget: 10,
    weeklyOpportunityTarget: 5,
    weeklyLinkedinTarget: 20,
    callsVsLastWeek: 0,
    emailsVsLastWeek: 0,
    meetingsVsLastWeek: 0,
    opportunitiesVsLastWeek: 0,
    linkedinsVsLastWeek: 0,
    newOpportunities: 0,
    closedWonOpportunities: 0,
    pipelineValueAdded: 0,
    avgOpportunitySizeThisWeek: 0,
    topPerformer: 'Loading...',
    teamCallsTotal: 0,
    teamEmailsTotal: 0,
    teamMeetingsTotal: 0,
    totalPipelineValue: 0,
    totalOpportunitiesCount: 0,
    totalLeadsCount: 0,
    openOpportunitiesCount: 0,
    leadToOpportunityRate: 0,
    weeklyRevenue: 0,
    avgSalesCycleLength: null,
    lastUpdated: new Date().toISOString()
  };

  const data = activityData || defaultData;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header matching other pipeline pages */}
      <PipelineHeader
        section="dashboard"
        metrics={headerMetrics}
        onSectionChange={() => {}}
        onRefresh={handleRefresh}
        onClearCache={handleClearCache}
        loading={isLoading}
      />

      {/* Leadership Dashboard Content */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        {isLoading && !activityData ? (
          <DashboardSkeleton />
        ) : (
          <div className="p-6 bg-white min-h-full">
            


            {/* Row 1: Weekly Activity Metrics */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActivityMetric
                title="LinkedIn"
                value={data.linkedinsSent || 0}
                target={data.weeklyLinkedinTarget || 20}
                trend={data.linkedinsVsLastWeek || 0}
                onClick={handleLinkedinsClick}
              />
              <ActivityMetric
                title="Calls"
                value={data.callsMade}
                target={data.weeklyCallTarget}
                trend={data.callsVsLastWeek}
                onClick={handleCallsClick}
              />
              <ActivityMetric
                title="Emails"
                value={data.emailsSent}
                target={data.weeklyEmailTarget}
                trend={data.emailsVsLastWeek}
                onClick={handleEmailsClick}
              />
              <ActivityMetric
                title="Meetings"
                value={data.meetingsScheduled}
                target={data.weeklyMeetingTarget}
                trend={data.meetingsVsLastWeek}
                onClick={handleMeetingsClick}
              />
            </div>
          </div>

          {/* Row 2: Monthly Performance */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleNewOpportunitiesClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">New Opportunities</h3>
                <div className="text-3xl font-bold text-gray-900">{data.monthlyNewOpportunities || 0}</div>
                <div className="text-xs text-gray-500 mt-1">This month</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleTotalPipelineClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Pipeline Value</h3>
                <div className="text-3xl font-bold text-gray-900">
                  ${(data.monthlyPipelineValue || 0 / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-500 mt-1">This month</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleLeadConversionClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Conversion Rate</h3>
                <div className="text-3xl font-bold text-gray-900">{data.monthlyConversionRate || 0}%</div>
                <div className="text-xs text-gray-500 mt-1">This month</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleOpportunitiesClosedClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Deals Closed</h3>
                <div className="text-3xl font-bold text-gray-900">{data.monthlyDealsClosed || 0}</div>
                <div className="text-xs text-gray-500 mt-1">This month</div>
              </div>
            </div>
          </div>

          {/* Row 3: YTD Revenue Performance */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">YTD Revenue Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleWeeklyRevenueClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">YTD Revenue</h3>
                <div className="text-3xl font-bold text-gray-900">
                  ${(data.ytdRevenue || 0 / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleAvgDealSizeClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Deal Size</h3>
                <div className="text-3xl font-bold text-gray-900">
                  ${(data.ytdAvgDealSize || 0 / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handlePipelineValueAddedClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Win Rate</h3>
                <div className="text-3xl font-bold text-gray-900">
                  {data.ytdWinRate || 0}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleSalesCycleClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Sales Cycle</h3>
                <div className="text-3xl font-bold text-gray-900">{data.ytdSalesCycle || 0} days</div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
            </div>
          </div>

          {/* Row 4: Weekly Performance */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleTotalPipelineClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">YTD Pipeline Value</h3>
                <div className="text-3xl font-bold text-gray-900">
                  ${(data.ytdPipelineValue || 0 / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleNewOpportunitiesClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">YTD New Deals</h3>
                <div className="text-3xl font-bold text-gray-900">{(data.ytdNewDeals || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleLeadConversionClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">YTD Conversion Rate</h3>
                <div className="text-3xl font-bold text-gray-900">{data.ytdConversionRate || 0}%</div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleTeamCallsClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">YTD Activity Conversion</h3>
                <div className="text-3xl font-bold text-gray-900">{data.ytdActivityConversion || 0}%</div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
