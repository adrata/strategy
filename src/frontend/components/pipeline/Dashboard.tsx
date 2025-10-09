/**
 * Dashboard Component
 * 
 * Displays weekly activity metrics and performance data for the pipeline.
 * Follows 2025 best practices for React components and data loading patterns.
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUnifiedAuth } from '@/platform/auth';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { PipelineHeader } from './PipelineHeader';
import { DashboardSkeleton } from './DashboardSkeleton';

// -------- Types & interfaces --------
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



// -------- Constants --------
const dashboardCache = new Map<string, { data: WeeklyActivityData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// -------- Main component --------
export function Dashboard() {
  const { user, isLoading: authLoading } = useUnifiedAuth();
  const router = useRouter();
  // 🆕 CRITICAL FIX: Use useAcquisitionOS for consistent data source
  const { data: acquisitionOSData } = useAcquisitionOS();
  const acquisitionData = acquisitionOSData.acquireData;
  const acquisitionLoading = acquisitionOSData.loading;
  const [activityData, setActivityData] = useState<WeeklyActivityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🚀 DEBUG: Track component renders
  // console.log('🔄 [DASHBOARD] Component rendered:', {
  //   timestamp: Date.now(),
  //   hasUser: !!user,
  //   hasAcquisitionData: !!acquisitionData,
  //   acquisitionDataStructure: acquisitionData ? Object.keys(acquisitionData) : 'null',
  //   acquisitionDataCounts: acquisitionData?.counts || 'no counts',
  //   acquisitionLoading: acquisitionLoading?.isLoading,
  //   isLoading,
  //   hasActivityData: !!activityData
  // });
  
  // 🚨 CRITICAL DEBUG: Force visible log
  // console.log('🚨 [DASHBOARD CRITICAL] Component is rendering!', {
  //   user: user?.email || 'no user',
  //   hasAcquisitionData: !!acquisitionData,
  //   acquisitionDataKeys: acquisitionData ? Object.keys(acquisitionData) : 'NO DATA',
  //   hasCounts: !!(acquisitionData?.counts),
  //   countsData: acquisitionData?.counts || 'NO COUNTS',
  //   loading: acquisitionLoading?.isLoading,
  //   hasActivityData: !!activityData
  // });

  // Use workspace from provider
  const workspaceId = user?.activeWorkspaceId;
  const userId = user?.id;
  
  // console.log('🔍 [DASHBOARD DEBUG] Using provider workspace:', {
  //   providerWorkspaceId: workspaceId,
  //   userActiveWorkspaceId: user?.activeWorkspaceId,
  //   userId: userId
  // });

  // Use data from provider instead of making duplicate API calls
  const loadActivityData = useCallback(async () => {
    try {
      if (!workspaceId || !userId) {
        console.warn('No workspace or user ID available for Dashboard');
        setError('No workspace available');
        return;
      }

      // Prevent multiple simultaneous calls
      if (isLoading) {
        // console.log('⏳ [DASHBOARD] Already loading, skipping duplicate call');
        return;
      }

      // Check client-side cache first
      const cacheKey = `dashboard:${workspaceId}:${userId}`;
      const cached = dashboardCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // console.log('⚡ [DASHBOARD CACHE HIT] Using cached dashboard data');
        setActivityData(cached.data);
        setIsLoading(false);
        return;
      }

      // Use cached data from provider instead of making new API call
      if (acquisitionData && acquisitionData.counts) {
        // console.log('⚡ [DASHBOARD] Using cached data from provider - NO API CALL NEEDED');
        
        // Transform acquisition data to dashboard format
        const dashboardData: WeeklyActivityData = {
          // This Week Performance
          callsMade: 0,
          emailsSent: 0,
          meetingsScheduled: 0,
          opportunitiesAdvanced: 0,
          newLeadsGenerated: acquisitionData.counts.leads || 0,
          
          // Weekly Targets & Progress
          weeklyCallTarget: 20,
          weeklyEmailTarget: 50,
          weeklyMeetingTarget: 5,
          weeklyOpportunityTarget: 3,
          
          // Weekly Trends
          callsVsLastWeek: 0,
          emailsVsLastWeek: 0,
          meetingsVsLastWeek: 0,
          opportunitiesVsLastWeek: 0,
          
          // Pipeline Health This Week
          newOpportunities: acquisitionData.counts.opportunities || 0,
          closedWonOpportunities: 0,
          pipelineValueAdded: 0,
          avgOpportunitySizeThisWeek: 0,
          
          // Real Pipeline Metrics
          totalPipelineValue: 0,
          totalOpportunitiesCount: acquisitionData.counts.opportunities || 0,
          totalLeadsCount: acquisitionData.counts.leads || 0,
          openOpportunitiesCount: acquisitionData.counts.opportunities || 0,
          
          // Conversion Metrics
          leadToOpportunityRate: 0,
          weeklyRevenue: 0,
          avgSalesCycleLength: null,
          
          // Team Performance
          topPerformer: 'Team',
          teamCallsTotal: 0,
          teamEmailsTotal: 0,
          teamMeetingsTotal: 0,
          
          lastUpdated: new Date().toISOString()
        };
        
        setActivityData(dashboardData);
        
        // 🚀 PERFORMANCE: Cache the transformed data
        dashboardCache.set(cacheKey, {
          data: dashboardData,
          timestamp: Date.now()
        });
        
        setIsLoading(false);
        return;
      }

      // 🚀 PERFORMANCE: Skip API call if we're still loading from provider
      if (!acquisitionData) {
        console.log('⏳ [DASHBOARD] Waiting for provider data, skipping API call');
        setIsLoading(false);
        return;
      }

      // 🚀 PERFORMANCE: NEVER make API calls when we have provider data
      console.log('⚡ [DASHBOARD] Provider data available, skipping API call completely');
      setIsLoading(false);
      return;
    } catch (error) {
      console.error('❌ Error loading Dashboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, userId, acquisitionData]);

  // 🚀 PERFORMANCE: Immediately transform acquisition data when available
  useEffect(() => {
    console.log('🔄 [DASHBOARD] Data transformation useEffect triggered:', {
      hasAcquisitionData: !!acquisitionData,
      hasCounts: !!(acquisitionData?.counts),
      hasActivityData: !!activityData,
      acquisitionDataKeys: acquisitionData ? Object.keys(acquisitionData) : 'null',
      countsData: acquisitionData?.counts || 'no counts',
      willTransform: !!(acquisitionData && acquisitionData.counts && !activityData)
    });
    
    if (acquisitionData && acquisitionData.counts && !activityData) {
      console.log('⚡ [DASHBOARD] Immediately transforming acquisition data to dashboard format');
      
      // Transform acquisition data to dashboard format using REAL calculated metrics
      const metrics = acquisitionData.metrics || {};
      
      const dashboardData: WeeklyActivityData = {
        // This Week Performance - REAL DATA from actions table
        callsMade: metrics.weeklyCalls || 0,
        emailsSent: metrics.weeklyEmails || 0,
        meetingsScheduled: metrics.weeklyMeetings || 0,
        opportunitiesAdvanced: 0, // Would need more complex calculation
        newLeadsGenerated: acquisitionData.counts.leads || 0,
        
        // Weekly Targets & Progress - REALISTIC TARGETS
        weeklyCallTarget: 20,
        weeklyEmailTarget: 50,
        weeklyMeetingTarget: 5,
        weeklyOpportunityTarget: 3,
        
        // Weekly Trends - PLACEHOLDER (would need historical data)
        callsVsLastWeek: 0,
        emailsVsLastWeek: 0,
        meetingsVsLastWeek: 0,
        opportunitiesVsLastWeek: 0,
        
        // Pipeline Health This Week - REAL DATA
        newOpportunities: acquisitionData.counts.opportunities || 0,
        closedWonOpportunities: metrics.monthlyDealsClosed || 0,
        pipelineValueAdded: 0, // Would need more complex calculation
        avgOpportunitySizeThisWeek: metrics.avgDealSize || 0,
        
        // Real Pipeline Metrics - CALCULATED FROM DATABASE
        totalPipelineValue: metrics.totalPipelineValue || 0,
        avgDealSize: metrics.avgDealSize || 0,
        salesCycleLength: metrics.ytdSalesCycle || 0,
        conversionRate: metrics.conversionRate || 0,
        
        // Team Performance - PLACEHOLDER (would need team data)
        teamCallsThisWeek: 0,
        teamEmailsThisWeek: 0,
        teamMeetingsThisWeek: 0,
        topPerformer: 'N/A',
        
        // Revenue Metrics - REAL DATA from opportunities
        weeklyRevenue: 0, // Would need weekly revenue calculation
        monthlyRevenue: metrics.monthlyPipelineValue || 0,
        ytdRevenue: metrics.ytdRevenue || 0,
        
        // Lead Generation - REAL DATA
        newLeadsThisWeek: acquisitionData.counts.leads || 0,
        leadConversionRate: metrics.conversionRate || 0,
        qualifiedLeads: acquisitionData.counts.prospects || 0,
        
        // Activity Summary - REAL DATA
        totalActivities: (metrics.weeklyCalls || 0) + (metrics.weeklyEmails || 0) + (metrics.weeklyMeetings || 0),
        activitiesThisWeek: (metrics.weeklyCalls || 0) + (metrics.weeklyEmails || 0) + (metrics.weeklyMeetings || 0),
        lastUpdated: new Date().toISOString()
      };
      
            setActivityData(dashboardData);
            
            // Cache the transformed data
            if (workspaceId && userId) {
              const cacheKey = `dashboard:${workspaceId}:${userId}`;
              dashboardCache.set(cacheKey, {
                data: dashboardData,
                timestamp: Date.now()
              });
            }
            
            console.log('✅ [DASHBOARD] Data transformed and set immediately!', {
              dashboardData: dashboardData,
              newLeadsGenerated: dashboardData.newLeadsGenerated,
              newOpportunities: dashboardData.newOpportunities
            });
    }
  }, [acquisitionData, activityData, workspaceId, userId]);

  // Track workspace changes to force data refresh
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 [DASHBOARD] useEffect triggered:', {
      authLoading,
      hasUser: !!user,
      workspaceId,
      userId,
      lastWorkspaceId,
      lastUserId,
      hasAcquisitionData: !!acquisitionData,
      hasActivityData: !!activityData
    });

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
        console.log('🔄 [DASHBOARD] Loading data - no data or stale data');
        loadActivityData();
      } else {
        // We have fresh data
        console.log('🔄 [DASHBOARD] We have fresh data, skipping load');
      }
    } else if (!authLoading && !user) {
      setError('Please sign in to view dashboard');
    }
  }, [workspaceId, userId, authLoading, user, lastWorkspaceId, lastUserId, acquisitionData]);

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

  // 🚀 PERFORMANCE: Show loading state only when truly loading
  if (authLoading || (acquisitionLoading?.isLoading)) {
    console.log('🔄 [DASHBOARD] Showing skeleton - auth or data loading');
    return <DashboardSkeleton />;
  }

  // 🚀 PERFORMANCE: Show loading state if we have user but no data at all
  if (user && !activityData && !acquisitionData) {
    console.log('🔄 [DASHBOARD] Showing skeleton - no data available');
    return <DashboardSkeleton />;
  }

  // 🚀 PERFORMANCE: If we have acquisition data but no activity data yet, show a simple loading message
  if (user && !activityData && acquisitionData) {
    console.log('🔄 [DASHBOARD] Has acquisition data, waiting for transformation...');
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing dashboard data...</p>
        </div>
      </div>
    );
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

  // 🚀 PERFORMANCE: Only show default data if we have user but no activity data yet
  // This prevents showing blank/zero data during initial load
  const shouldShowDefaultData = user && !activityData && !isLoading;
  
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

  // 🚀 PERFORMANCE: Only use default data if we should show it, otherwise use activity data
  const dashboardData = shouldShowDefaultData ? defaultData : (activityData || defaultData);

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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActivityMetric
                title="LinkedIn"
                value={dashboardData.linkedinsSent || 0}
                target={dashboardData.weeklyLinkedinTarget || 20}
                trend={dashboardData.linkedinsVsLastWeek || 0}
                onClick={handleLinkedinsClick}
              />
              <ActivityMetric
                title="Calls"
                value={dashboardData.callsMade}
                target={dashboardData.weeklyCallTarget}
                trend={dashboardData.callsVsLastWeek}
                onClick={handleCallsClick}
              />
              <ActivityMetric
                title="Emails"
                value={dashboardData.emailsSent}
                target={dashboardData.weeklyEmailTarget}
                trend={dashboardData.emailsVsLastWeek}
                onClick={handleEmailsClick}
              />
              <ActivityMetric
                title="Meetings"
                value={dashboardData.meetingsScheduled}
                target={dashboardData.weeklyMeetingTarget}
                trend={dashboardData.meetingsVsLastWeek}
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
                <div className="text-3xl font-bold text-gray-900">{dashboardData.newOpportunities || 0}</div>
                <div className="text-xs text-gray-500 mt-1">This month</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleTotalPipelineClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Pipeline Value</h3>
                <div className="text-3xl font-bold text-gray-900">
                  ${((dashboardData.monthlyRevenue || 0) / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-500 mt-1">This month</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleLeadConversionClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Conversion Rate</h3>
                <div className="text-3xl font-bold text-gray-900">{Math.round(dashboardData.conversionRate || 0)}%</div>
                <div className="text-xs text-gray-500 mt-1">This month</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleOpportunitiesClosedClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Deals Closed</h3>
                <div className="text-3xl font-bold text-gray-900">{dashboardData.closedWonOpportunities || 0}</div>
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
                  ${((dashboardData.ytdRevenue || 0) / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleAvgDealSizeClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Deal Size</h3>
                <div className="text-3xl font-bold text-gray-900">
                  ${((dashboardData.avgDealSize || 0) / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handlePipelineValueAddedClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Win Rate</h3>
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round(dashboardData.conversionRate || 0)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Year to date</div>
              </div>
              <div 
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all"
                onClick={handleSalesCycleClick}
              >
                <h3 className="text-sm font-medium text-gray-600 mb-2">Sales Cycle</h3>
                <div className="text-3xl font-bold text-gray-900">{dashboardData.salesCycleLength || 0} days</div>
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
