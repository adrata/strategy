"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/platform/api-fetch';
import { useUnifiedAuth } from '@/platform/auth';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
// Removed PipelineHeader import - using StandardHeader in PipelineContent instead

interface MetricsData {
  // Pipeline Health
  totalPipelineValue: string;
  openDeals: number;
  winRate: string;
  avgDealSize: string;
  salesVelocity: string | null;
  
  // Conversion Metrics
  leadConversionRate: string;
  prospectConversionRate: string;
  opportunityConversionRate: string;
  
  // Activity Metrics
  avgResponseTime: string | null;
  touchPointsPerDeal: number;
  activitiesThisWeek: number;
  
  // Performance Trends
  monthlyGrowth: string;
  quarterlyGrowth: string | null;
  pipelineCoverage: string;
  
  // Data Quality
  dataCompleteness: string;
  enrichmentScore: string;
  
  lastUpdated: string;
  trends?: {
    winRate: { direction: 'up' | 'down' | 'stable'; value: string };
    pipelineValue: { direction: 'up' | 'down' | 'stable'; value: string };
    conversion: { direction: 'up' | 'down' | 'stable'; value: string };
    responseTime: { direction: 'up' | 'down' | 'stable'; value: string };
    dataQuality: { direction: 'up' | 'down' | 'stable'; value: string };
  };
  raw?: {
    totalPipelineValue: number;
    openDeals: number;
    totalOpportunities: number;
    winRate: number;
    avgDealSize: number;
    salesVelocity: number | null;
    leadConversionRate: number;
    prospectConversionRate: number;
    opportunityConversionRate: number;
    avgResponseTime: number | null;
    touchPointsPerDeal: number;
    activitiesThisWeek: number;
    monthlyGrowth: number;
    quarterlyGrowth: number | null;
    pipelineCoverage: number;
    dataCompleteness: number;
    enrichmentScore: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

function MetricCard({ title, value, subtitle, trend, trendValue, color = 'default' }: MetricCardProps) {
  const colorClasses = {
    default: 'border-[var(--border)] bg-[var(--background)]',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    danger: 'border-red-200 bg-red-50'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-[var(--muted)]'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} transition-all hover:shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-1">{title}</h3>
          <div className="text-2xl font-bold text-[var(--foreground)] mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--muted)]">{subtitle}</p>
          )}
        </div>
        {trend && trendValue && (
          <div className={`flex items-center text-sm font-medium ${trendColors[trend]}`}>
            <span className="mr-1">{trendIcons[trend]}</span>
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 pb-2 border-b border-[var(--border)]">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

export function MetricsDashboard() {
  const { user, isLoading: authLoading } = useUnifiedAuth();
  // 🆕 CRITICAL FIX: Use useAcquisitionOS for consistent workspace
  const { data: acquisitionData } = useAcquisitionOS();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          const secret = process.env.NEXTAUTH_SECRET || "dev-secret-key-change-in-production";
          const decoded = jwt.verify(session.accessToken, secret) as any;
          if (decoded?.workspaceId) {
            console.log(`🔍 [METRICS] Got workspace ID from JWT: ${decoded.workspaceId}`);
            return decoded.workspaceId;
          }
        } catch (error) {
          console.warn('⚠️ [METRICS] Failed to decode JWT token:', error);
        }
      }
      
      // 2. Fallback to acquisitionData
      if (acquisitionData?.auth?.authUser?.activeWorkspaceId) {
        console.log(`🔍 [METRICS] Got workspace ID from acquisitionData: ${acquisitionData.auth.authUser.activeWorkspaceId}`);
        return acquisitionData.auth.authUser.activeWorkspaceId;
      }
      
      // 3. Fallback to user activeWorkspaceId
      if (user?.activeWorkspaceId) {
        console.log(`🔍 [METRICS] Got workspace ID from user: ${user.activeWorkspaceId}`);
        return user.activeWorkspaceId;
      }
      
      // 4. Last resort: first workspace
      if (user?.workspaces?.[0]?.id) {
        console.log(`🔍 [METRICS] Got workspace ID from first workspace: ${user.workspaces[0].id}`);
        return user.workspaces[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [METRICS] Error getting workspace ID:', error);
      return acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId || null;
    }
  }, [acquisitionData, user]);

  // 🆕 CRITICAL FIX: Update workspace ID when it changes
  useEffect(() => {
    const updateWorkspaceId = async () => {
      const newWorkspaceId = await getCurrentWorkspaceId();
      if (newWorkspaceId && newWorkspaceId !== currentWorkspaceId) {
        console.log(`🔄 [METRICS] Workspace ID changed: ${currentWorkspaceId} -> ${newWorkspaceId}`);
        setCurrentWorkspaceId(newWorkspaceId);
        setCurrentUserId(user?.id || null);
      }
    };
    
    updateWorkspaceId();
  }, [acquisitionData, user, getCurrentWorkspaceId, currentWorkspaceId]);

  const workspaceId = currentWorkspaceId;
  
  console.log('🔍 [METRICS DEBUG] Using real-time workspace:', {
    acquisitionDataExists: !!acquisitionData,
    providerWorkspaceId: workspaceId,
    userActiveWorkspaceId: user?.activeWorkspaceId,
    currentWorkspaceId
  });
  const userId = user?.id;

  const loadMetrics = async () => {
    try {
      if (!workspaceId || !userId) {
        console.warn('No workspace or user ID available for metrics');
        setError('No workspace available');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      console.log('📊 Loading metrics via dedicated metrics API...', { workspaceId, userId });
      console.log('📊 [METRICS DEBUG] API URL:', `/api/metrics/pipeline (workspaceId and userId from JWT token)`);
      
      // Use dedicated metrics API endpoint (workspaceId and userId now come from JWT token)
      const data = await authFetch(`/api/metrics/pipeline`);
      
      if (!data.success) {
        console.error('❌ Metrics API error:', data.error);
        throw new Error(`Failed to load metrics: ${data.error || 'Unknown error'}`);
      }
      
      if (data.success && data.data) {
        // Use metrics API data directly
        const metricsData = data.data;
        
        // Use metrics data directly - no fallbacks, only real data
        const transformedMetrics = {
          // Pipeline Health
          totalPipelineValue: metricsData.totalPipelineValue,
          openDeals: metricsData.openDeals,
          winRate: metricsData.winRate,
          avgDealSize: metricsData.avgDealSize,
          salesVelocity: metricsData.salesVelocity ? `${metricsData.salesVelocity} months` : null,
          
          // Conversion Metrics
          leadConversionRate: metricsData.leadConversionRate,
          prospectConversionRate: metricsData.prospectConversionRate,
          opportunityConversionRate: metricsData.opportunityConversionRate,
          
          // Activity Metrics
          avgResponseTime: metricsData.avgResponseTime ? `${metricsData.avgResponseTime} hours` : null,
          touchPointsPerDeal: metricsData.touchPointsPerDeal,
          activitiesThisWeek: metricsData.activitiesThisWeek,
          
          // Performance Trends
          monthlyGrowth: metricsData.monthlyGrowth,
          quarterlyGrowth: metricsData.quarterlyGrowth ? `${metricsData.quarterlyGrowth}%` : null,
          pipelineCoverage: metricsData.pipelineCoverage,
          
          // Data Quality
          dataCompleteness: metricsData.dataCompleteness,
          enrichmentScore: metricsData.enrichmentScore,
          
          lastUpdated: metricsData.lastUpdated,
          trends: metricsData.trends,
          raw: metricsData.raw
        };
        
        setMetrics(transformedMetrics);
        console.log('✅ Metrics loaded from dedicated metrics API successfully');
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error loading metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadMetrics();
    } else if (!authLoading && !user) {
      setError('Please sign in to view metrics');
      setLoading(false);
    }
  }, [workspaceId, userId, authLoading, user]);

  const handleRefresh = () => {
    loadMetrics();
  };

  const handleClearCache = () => {
    // Clear any cached data
    // Cache clearing is now handled by the unified cache system
    loadMetrics();
  };

  // Create metrics for header compatibility
  const headerMetrics = metrics ? {
    totalPipelineValue: parseFloat(metrics.totalPipelineValue) || 0,
    openDeals: metrics.openDeals,
    winRate: parseFloat(metrics.winRate) || 0,
    avgDealSize: parseFloat(metrics.avgDealSize) || 0,
    salesVelocity: metrics.salesVelocity ? parseFloat(metrics.salesVelocity) : null,
    leadConversionRate: parseFloat(metrics.leadConversionRate) || 0,
    prospectConversionRate: parseFloat(metrics.prospectConversionRate) || 0,
    opportunityConversionRate: parseFloat(metrics.opportunityConversionRate) || 0,
    avgResponseTime: metrics.avgResponseTime ? parseFloat(metrics.avgResponseTime) : null,
    touchPointsPerDeal: metrics.touchPointsPerDeal,
    activitiesThisWeek: metrics.activitiesThisWeek,
    monthlyGrowth: parseFloat(metrics.monthlyGrowth) || 0,
    quarterlyGrowth: metrics.quarterlyGrowth ? parseFloat(metrics.quarterlyGrowth) : null,
    pipelineCoverage: parseFloat(metrics.pipelineCoverage) || 0,
    dataCompleteness: parseFloat(metrics.dataCompleteness) || 0,
    enrichmentScore: parseFloat(metrics.enrichmentScore) || 0,
    totalLeads: 0, // Default values since not available in MetricsData
    totalProspects: 0,
    totalOpportunities: 0,
    totalContacts: 0,
    totalAccounts: 0,
    totalCustomers: 0,
    lastUpdated: new Date(metrics.lastUpdated)
  } : null;

  // Show loading state while waiting for workspace
  if (!currentWorkspaceId) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        <div className="flex-1 p-6">
          <div className="text-center text-[var(--muted)]">
            Loading workspace...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Metrics</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--muted)]">
          <p>No metrics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto invisible-scrollbar">
        <div className="p-6 bg-white min-h-full">

          {/* Pipeline Health */}
          <MetricsSection title="Pipeline Health">
            <MetricCard
              title="Total Pipeline Value"
              value={metrics.totalPipelineValue}
              subtitle="Open opportunities"
              trend={metrics.trends?.pipelineValue?.direction || 'stable'}
              trendValue={metrics.trends?.pipelineValue?.value || 'No change'}
              color={metrics.trends?.pipelineValue?.direction === 'up' ? 'success' : metrics.trends?.pipelineValue?.direction === 'down' ? 'danger' : 'default'}
            />
            <MetricCard
              title="Open Deals"
              value={metrics.openDeals}
              subtitle="Active opportunities"
              trend={metrics['raw'] && metrics.raw.openDeals > (metrics.raw.totalOpportunities * 0.6) ? 'up' : metrics['raw'] && metrics.raw.openDeals > (metrics.raw.totalOpportunities * 0.3) ? 'stable' : 'down'}
              trendValue={metrics['raw'] && metrics.raw.openDeals > (metrics.raw.totalOpportunities * 0.6) ? 'Healthy pipeline' : metrics['raw'] && metrics.raw.openDeals > (metrics.raw.totalOpportunities * 0.3) ? 'Moderate' : 'Needs attention'}
              color={metrics['raw'] && metrics.raw.openDeals > (metrics.raw.totalOpportunities * 0.6) ? 'success' : metrics['raw'] && metrics.raw.openDeals > (metrics.raw.totalOpportunities * 0.3) ? 'default' : 'danger'}
            />
            <MetricCard
              title="Win Rate"
              value={metrics.winRate}
              subtitle="Closed won / total closed"
              trend={metrics.trends?.winRate?.direction || 'stable'}
              trendValue={metrics.trends?.winRate?.value || 'No change'}
              color={metrics.trends?.winRate?.direction === 'up' ? 'success' : metrics.trends?.winRate?.direction === 'down' ? 'danger' : 'default'}
            />
            <MetricCard
              title="Average Deal Size"
              value={metrics.avgDealSize}
              subtitle="Per closed deal"
              trend={metrics['raw'] && metrics.raw.avgDealSize > 500000 ? 'up' : metrics['raw'] && metrics.raw.avgDealSize > 200000 ? 'stable' : 'down'}
              trendValue={metrics['raw'] && metrics.raw.avgDealSize > 500000 ? 'High value deals' : metrics['raw'] && metrics.raw.avgDealSize > 200000 ? 'Average size' : 'Below target'}
              color={metrics['raw'] && metrics.raw.avgDealSize > 500000 ? 'success' : metrics['raw'] && metrics.raw.avgDealSize > 200000 ? 'default' : 'danger'}
            />
          </MetricsSection>

          {/* Sales Performance */}
          <MetricsSection title="Sales Performance">
            <MetricCard
              title="Sales Velocity"
              value={metrics.salesVelocity || 'No Data'}
              subtitle="Average sales cycle"
              trend={metrics['raw'] && metrics['raw']['salesVelocity'] && metrics.raw.salesVelocity < 3 ? 'up' : metrics['raw'] && metrics['raw']['salesVelocity'] && metrics.raw.salesVelocity < 6 ? 'stable' : 'down'}
              trendValue={metrics['raw'] && metrics['raw']['salesVelocity'] && metrics.raw.salesVelocity < 3 ? 'Fast cycle' : metrics['raw'] && metrics['raw']['salesVelocity'] && metrics.raw.salesVelocity < 6 ? 'Standard cycle' : metrics['raw'] && metrics.raw.salesVelocity ? 'Needs optimization' : 'No data'}
              color={metrics['raw'] && metrics['raw']['salesVelocity'] && metrics.raw.salesVelocity < 3 ? 'success' : metrics['raw'] && metrics['raw']['salesVelocity'] && metrics.raw.salesVelocity < 6 ? 'default' : 'danger'}
            />
            <MetricCard
              title="Pipeline Coverage"
              value={metrics.pipelineCoverage}
              subtitle="Pipeline to target ratio"
              trend={metrics['raw'] && metrics.raw.pipelineCoverage >= 3 ? 'up' : metrics['raw'] && metrics.raw.pipelineCoverage >= 2 ? 'stable' : 'down'}
              trendValue={metrics['raw'] && metrics.raw.pipelineCoverage >= 3 ? 'Strong coverage' : metrics['raw'] && metrics.raw.pipelineCoverage >= 2 ? 'Adequate' : 'Needs building'}
              color={metrics['raw'] && metrics.raw.pipelineCoverage >= 3 ? 'success' : metrics['raw'] && metrics.raw.pipelineCoverage >= 2 ? 'default' : 'danger'}
            />
            <MetricCard
              title="Monthly Growth"
              value={metrics.monthlyGrowth}
              subtitle="Revenue growth"
              trend={metrics['raw'] && metrics.raw.monthlyGrowth > 0 ? 'up' : metrics['raw'] && metrics.raw.monthlyGrowth < 0 ? 'down' : 'stable'}
              trendValue={metrics['raw'] && metrics.raw.monthlyGrowth > 10 ? 'Strong growth' : metrics['raw'] && metrics.raw.monthlyGrowth > 0 ? 'Growing' : metrics['raw'] && metrics.raw.monthlyGrowth < -5 ? 'Declining' : 'Flat'}
              color={metrics['raw'] && metrics.raw.monthlyGrowth > 0 ? 'success' : metrics['raw'] && metrics.raw.monthlyGrowth < 0 ? 'danger' : 'default'}
            />
            <MetricCard
              title="Quarterly Growth"
              value={metrics.quarterlyGrowth || 'No Data'}
              subtitle="Quarter over quarter"
              trend={metrics['raw'] && metrics['raw']['quarterlyGrowth'] && metrics.raw.quarterlyGrowth > 0 ? 'up' : metrics['raw'] && metrics['raw']['quarterlyGrowth'] && metrics.raw.quarterlyGrowth < 0 ? 'down' : 'stable'}
              trendValue={metrics['raw'] && metrics['raw']['quarterlyGrowth'] && metrics.raw.quarterlyGrowth > 15 ? 'Excellent quarter' : metrics['raw'] && metrics['raw']['quarterlyGrowth'] && metrics.raw.quarterlyGrowth > 0 ? 'Positive trend' : metrics['raw'] && metrics['raw']['quarterlyGrowth'] && metrics.raw.quarterlyGrowth < -10 ? 'Needs attention' : metrics['raw'] && metrics.raw.quarterlyGrowth ? 'Stable' : 'No data'}
              color={metrics['raw'] && metrics['raw']['quarterlyGrowth'] && metrics.raw.quarterlyGrowth > 0 ? 'success' : metrics['raw'] && metrics['raw']['quarterlyGrowth'] && metrics.raw.quarterlyGrowth < 0 ? 'danger' : 'default'}
            />
          </MetricsSection>

          {/* Conversion Metrics */}
          <MetricsSection title="Conversion Rates">
            <MetricCard
              title="Lead Conversion"
              value={metrics.leadConversionRate}
              subtitle="Leads to opportunities"
              trend={metrics.trends?.conversion?.direction || 'stable'}
              trendValue={metrics.trends?.conversion?.value || 'No change'}
              color={metrics.trends?.conversion?.direction === 'up' ? 'success' : metrics.trends?.conversion?.direction === 'down' ? 'danger' : 'default'}
            />
            <MetricCard
              title="Prospect Conversion"
              value={metrics.prospectConversionRate}
              subtitle="Prospects to opportunities"
              trend={metrics['raw'] && metrics.raw.prospectConversionRate > 25 ? 'up' : metrics['raw'] && metrics.raw.prospectConversionRate > 15 ? 'stable' : 'down'}
              trendValue={metrics['raw'] && metrics.raw.prospectConversionRate > 25 ? 'High conversion' : metrics['raw'] && metrics.raw.prospectConversionRate > 15 ? 'Good rate' : 'Needs improvement'}
              color={metrics['raw'] && metrics.raw.prospectConversionRate > 25 ? 'success' : metrics['raw'] && metrics.raw.prospectConversionRate > 15 ? 'default' : 'danger'}
            />
            <MetricCard
              title="Opportunity Conversion"
              value={metrics.opportunityConversionRate}
              subtitle="Opportunities to wins"
              trend={metrics.trends?.winRate?.direction || 'stable'}
              trendValue={metrics.trends?.winRate?.value || 'No change'}
              color={metrics.trends?.winRate?.direction === 'up' ? 'success' : metrics.trends?.winRate?.direction === 'down' ? 'danger' : 'default'}
            />
            <MetricCard
              title="Activities This Week"
              value={metrics.activitiesThisWeek}
              subtitle="Total pipeline activities"
              trend={metrics['raw'] && metrics.raw.activitiesThisWeek > 50 ? 'up' : metrics['raw'] && metrics.raw.activitiesThisWeek > 20 ? 'stable' : 'down'}
              trendValue={metrics['raw'] && metrics.raw.activitiesThisWeek > 50 ? 'High activity' : metrics['raw'] && metrics.raw.activitiesThisWeek > 20 ? 'Moderate' : 'Low activity'}
              color={metrics['raw'] && metrics.raw.activitiesThisWeek > 50 ? 'success' : metrics['raw'] && metrics.raw.activitiesThisWeek > 20 ? 'default' : 'danger'}
            />
          </MetricsSection>

          {/* Operational Metrics */}
          <MetricsSection title="Operational Efficiency">
            <MetricCard
              title="Response Time"
              value={metrics.avgResponseTime || 'No Data'}
              subtitle="Average lead response"
              trend={metrics.trends?.responseTime?.direction || 'stable'}
              trendValue={metrics.trends?.responseTime?.value || (metrics.avgResponseTime ? 'No change' : 'No data')}
              color={metrics.trends?.responseTime?.direction === 'down' ? 'success' : metrics.trends?.responseTime?.direction === 'up' ? 'danger' : 'default'}
            />
            <MetricCard
              title="Touch Points per Deal"
              value={metrics.touchPointsPerDeal}
              subtitle="Average interactions"
              trend={metrics['raw'] && metrics.raw.touchPointsPerDeal > 8 ? 'up' : metrics['raw'] && metrics.raw.touchPointsPerDeal > 4 ? 'stable' : 'down'}
              trendValue={metrics['raw'] && metrics.raw.touchPointsPerDeal > 8 ? 'High engagement' : metrics['raw'] && metrics.raw.touchPointsPerDeal > 4 ? 'Good' : 'Low engagement'}
              color={metrics['raw'] && metrics.raw.touchPointsPerDeal > 8 ? 'success' : metrics['raw'] && metrics.raw.touchPointsPerDeal > 4 ? 'default' : 'danger'}
            />
            <MetricCard
              title="Data Completeness"
              value={metrics.dataCompleteness}
              subtitle="Profile completeness"
              trend={metrics.trends?.dataQuality?.direction || 'stable'}
              trendValue={metrics.trends?.dataQuality?.value || 'No change'}
              color={metrics.trends?.dataQuality?.direction === 'up' ? 'success' : metrics.trends?.dataQuality?.direction === 'down' ? 'danger' : 'default'}
            />
            <MetricCard
              title="Enrichment Score"
              value={metrics.enrichmentScore}
              subtitle="Data quality score"
              trend={metrics.trends?.dataQuality?.direction || 'stable'}
              trendValue={metrics.trends?.dataQuality?.value || 'No change'}
              color={metrics.trends?.dataQuality?.direction === 'up' ? 'success' : metrics.trends?.dataQuality?.direction === 'down' ? 'danger' : 'default'}
            />
          </MetricsSection>
        </div>
    </div>
  );
}