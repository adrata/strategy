"use client";

import React, { useState, useEffect } from 'react';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { useUnifiedAuth } from '@/platform/auth';

interface MetricCardProps {
  title: string;
  value: string | number | null;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
  status?: 'ahead' | 'behind' | 'on-track';
}

function MetricCard({ title, value, subtitle, trend, trendValue, color = 'default', status }: MetricCardProps) {
  const colorClasses = {
    default: 'border border-gray-200 bg-white',
    success: 'border border-green-200 bg-green-50',
    warning: 'border border-yellow-200 bg-yellow-50',
    danger: 'border border-red-200 bg-red-50'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  };

  const statusConfig = {
    ahead: { text: 'Above Target', color: 'text-green-600 bg-green-100' },
    behind: { text: 'Behind', color: 'text-red-600 bg-red-100' },
    'on-track': { text: 'On Track', color: 'text-gray-600 bg-gray-100' }
  };

  return (
    <div className={`p-6 rounded-xl ${colorClasses[color]} shadow-sm relative`}>
      {/* Status Badge - Top Right */}
      {status && (
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status].color}`}>
          {statusConfig[status].text}
        </div>
      )}
      
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {(() => {
            // Show dash for null, undefined, zero, or "No Data" values
            if (value === null || value === undefined || value === 0 || value === "0" || 
                value === "No Data" || value === "$0K" || value === "$0.0M" || value === "0%" ||
                value === "null" || value === "undefined") {
              return "-";
            }
            return typeof value === 'number' ? value.toLocaleString() : value;
          })()}
        </div>
      </div>
      
      {subtitle && (
        <div className="text-xs text-gray-500 mb-2">{subtitle}</div>
      )}
      
      {trend && trendValue && (
        <div className="flex items-center gap-1 text-xs">
          <span className={trendColors[trend]}>{trendIcons[trend]}</span>
          <span className={trendColors[trend]}>{trendValue}</span>
        </div>
      )}
    </div>
  );
}

interface MetricsData {
  thisWeekPeopleActions: number;
  lastWeekPeopleActions: number;
  actionTypes: {
    call: number;
    email: number;
    meeting: number;
    proposal: number;
    other: number;
  };
  conversionMetrics: {
    leads: number;
    prospects: number;
    opportunities: number;
    clients: number;
    prospectsToOpportunitiesRate: number;
    opportunitiesToClientsRate: number;
  };
  trends: {
    thisWeekPeopleActions: { direction: 'up' | 'down' | 'stable'; change: number; comparison: number };
    lastWeekPeopleActions: { direction: 'up' | 'down' | 'stable'; change: number; comparison: number };
    calls: { direction: 'up' | 'down' | 'stable'; change: number; comparison: number };
    emails: { direction: 'up' | 'down' | 'stable'; change: number; comparison: number };
    meetings: { direction: 'up' | 'down' | 'stable'; change: number; comparison: number };
    prospects: { direction: 'up' | 'down' | 'stable'; change: number; comparison: number };
    opportunities: { direction: 'up' | 'down' | 'stable'; change: number; comparison: number };
    clients: { direction: 'up' | 'down' | 'stable'; change: number; comparison: number };
    conversionRate: { direction: 'up' | 'down' | 'stable'; change: number; comparison: number };
  };
  chartData: Array<{
    date: string;
    actions: number;
    prospects: number;
    opportunities: number;
    clients: number;
    revenue: number;
  }>;
}

export function MetricsEnhanced() {
  const { data: acquisitionData } = useAcquisitionOS();
  const { user } = useUnifiedAuth();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;
  console.log('🔍 [MetricsEnhanced] workspaceId:', workspaceId, 'acquisitionData:', acquisitionData);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/v1/metrics?workspaceId=${workspaceId}&t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('❌ [METRICS] API failed with status:', response.status);
          throw new Error(`Failed to fetch metrics: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('✅ [METRICS] API returned real data:', data.data);
          setMetrics(data.data);
        } else {
          console.log('❌ [METRICS] API returned error:', data.error);
          throw new Error(data.error || 'Failed to load metrics');
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
        
        console.error('❌ [METRICS] Error fetching metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    console.log('🔍 [MetricsEnhanced] useEffect triggered, workspaceId:', workspaceId);
    if (workspaceId) {
      console.log('🔍 [MetricsEnhanced] Calling fetchMetrics for workspaceId:', workspaceId);
      fetchMetrics();
    } else {
      console.log('🔍 [MetricsEnhanced] No workspaceId, not calling fetchMetrics');
    }
  }, [workspaceId]);

  // Show error state
  if (error) {
    return (
      <div className="h-full overflow-y-auto invisible-scrollbar">
        <div className="p-6 bg-[var(--background)] min-h-full">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg font-medium mb-2">Failed to load metrics</div>
              <div className="text-gray-600 text-sm mb-4">{error}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render until metrics are loaded
  if (loading || !metrics) {
    return (
      <div className="h-full overflow-y-auto invisible-scrollbar">
        <div className="p-6 bg-[var(--background)] min-h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto invisible-scrollbar">
      <div className="p-6 bg-[var(--background)] min-h-full">
        {/* 3x3 Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px]">
          {/* Actions Last Week */}
          <MetricCard
            title="Actions Last Week"
            value={metrics?.lastWeekPeopleActions || 0}
            subtitle={`Previous week (+${(metrics?.lastWeekPeopleActions || 0) - (metrics?.trends?.lastWeekPeopleActions?.comparison || 0)} from week before)`}
            color={(metrics?.lastWeekPeopleActions || 0) >= 75 ? 'success' : (metrics?.lastWeekPeopleActions || 0) < 40 ? 'danger' : 'default'}
            status={(metrics?.lastWeekPeopleActions || 0) >= 75 ? 'ahead' : (metrics?.lastWeekPeopleActions || 0) < 40 ? 'behind' : 'on-track'}
            trend={metrics?.trends?.lastWeekPeopleActions?.direction}
            trendValue={`${metrics?.trends?.lastWeekPeopleActions?.change || 0}%`}
          />

          {/* Actions This Week */}
          <MetricCard
            title="Actions This Week"
            value={metrics?.thisWeekPeopleActions || 0}
            subtitle={`Weekly outreach (+${(metrics?.thisWeekPeopleActions || 0) - (metrics?.trends?.thisWeekPeopleActions?.comparison || 0)} from last week)`}
            color={(metrics?.thisWeekPeopleActions || 0) >= 75 ? 'success' : (metrics?.thisWeekPeopleActions || 0) < 40 ? 'danger' : 'default'}
            status={(metrics?.thisWeekPeopleActions || 0) >= 75 ? 'ahead' : (metrics?.thisWeekPeopleActions || 0) < 40 ? 'behind' : 'on-track'}
            trend={metrics?.trends?.thisWeekPeopleActions?.direction}
            trendValue={`${metrics?.trends?.thisWeekPeopleActions?.change || 0}%`}
          />

          {/* Calls This Week */}
          <MetricCard
            title="Calls This Week"
            value={metrics?.actionTypes?.call || 0}
            subtitle={`Weekly phone activity (+${(metrics?.actionTypes?.call || 0) - (metrics?.trends?.calls?.comparison || 0)} from last week)`}
            color={(metrics?.actionTypes?.call || 0) > 100 ? 'success' : (metrics?.actionTypes?.call || 0) > 50 ? 'default' : 'danger'}
            status={(metrics?.actionTypes?.call || 0) > 100 ? 'ahead' : (metrics?.actionTypes?.call || 0) > 50 ? 'on-track' : 'behind'}
            trend={metrics?.trends?.calls?.direction}
            trendValue={`${metrics?.trends?.calls?.change || 0}%`}
          />

          {/* Emails This Week */}
          <MetricCard
            title="Emails This Week"
            value={metrics?.actionTypes?.email || 0}
            subtitle={`Weekly email outreach (+${(metrics?.actionTypes?.email || 0) - (metrics?.trends?.emails?.comparison || 0)} from last week)`}
            color={(metrics?.actionTypes?.email || 0) > 100 ? 'success' : (metrics?.actionTypes?.email || 0) > 50 ? 'default' : 'danger'}
            status={(metrics?.actionTypes?.email || 0) > 100 ? 'ahead' : (metrics?.actionTypes?.email || 0) > 50 ? 'on-track' : 'behind'}
            trend={metrics?.trends?.emails?.direction}
            trendValue={`${metrics?.trends?.emails?.change || 0}%`}
          />

          {/* Meetings This Week */}
          <MetricCard
            title="Meetings This Week"
            value={metrics?.actionTypes?.meeting || 0}
            subtitle={`Weekly face-to-face (+${(metrics?.actionTypes?.meeting || 0) - (metrics?.trends?.meetings?.comparison || 0)} from last week)`}
            color={(metrics?.actionTypes?.meeting || 0) > 25 ? 'success' : (metrics?.actionTypes?.meeting || 0) > 10 ? 'default' : 'danger'}
            status={(metrics?.actionTypes?.meeting || 0) > 25 ? 'ahead' : (metrics?.actionTypes?.meeting || 0) > 10 ? 'on-track' : 'behind'}
            trend={metrics?.trends?.meetings?.direction}
            trendValue={`${metrics?.trends?.meetings?.change || 0}%`}
          />

          {/* New Prospects */}
          <MetricCard
            title="New Prospects"
            value={metrics?.conversionMetrics?.prospects || 0}
            subtitle={`New this week (+${(metrics?.conversionMetrics?.prospects || 0) - (metrics?.trends?.prospects?.comparison || 0)} from last week)`}
            color={(metrics?.conversionMetrics?.prospects || 0) > 20 ? 'success' : (metrics?.conversionMetrics?.prospects || 0) > 10 ? 'default' : 'danger'}
            status={(metrics?.conversionMetrics?.prospects || 0) > 20 ? 'ahead' : (metrics?.conversionMetrics?.prospects || 0) > 10 ? 'on-track' : 'behind'}
            trend={metrics?.trends?.prospects?.direction}
            trendValue={`${metrics?.trends?.prospects?.change || 0}%`}
          />

          {/* New Opportunities */}
          <MetricCard
            title="New Opportunities"
            value={metrics?.conversionMetrics?.opportunities || 0}
            subtitle={`New this week (+${(metrics?.conversionMetrics?.opportunities || 0) - (metrics?.trends?.opportunities?.comparison || 0)} from last week)`}
            color={(metrics?.conversionMetrics?.opportunities || 0) > 3 ? 'success' : (metrics?.conversionMetrics?.opportunities || 0) > 1 ? 'default' : 'danger'}
            status={(metrics?.conversionMetrics?.opportunities || 0) > 3 ? 'ahead' : (metrics?.conversionMetrics?.opportunities || 0) > 1 ? 'on-track' : 'behind'}
            trend={metrics?.trends?.opportunities?.direction}
            trendValue={`${metrics?.trends?.opportunities?.change || 0}%`}
          />

          {/* New Clients */}
          <MetricCard
            title="New Clients"
            value={metrics?.conversionMetrics?.clients || 0}
            subtitle={`New this week (+${(metrics?.conversionMetrics?.clients || 0) - (metrics?.trends?.clients?.comparison || 0)} from last week)`}
            color={(metrics?.conversionMetrics?.clients || 0) > 5 ? 'success' : (metrics?.conversionMetrics?.clients || 0) > 2 ? 'default' : 'danger'}
            status={(metrics?.conversionMetrics?.clients || 0) > 5 ? 'ahead' : (metrics?.conversionMetrics?.clients || 0) > 2 ? 'on-track' : 'behind'}
            trend={metrics?.trends?.clients?.direction}
            trendValue={`${metrics?.trends?.clients?.change || 0}%`}
          />

          {/* Conversion Rate */}
          <MetricCard
            title="Lead to Prospect"
            value={`${metrics?.conversionMetrics?.prospectsToOpportunitiesRate || 0}%`}
            subtitle={`Rolling conversion rate (+${((metrics?.conversionMetrics?.prospectsToOpportunitiesRate || 0) - (metrics?.trends?.conversionRate?.comparison || 0)).toFixed(1)}% from last period)`}
            color={(metrics?.conversionMetrics?.prospectsToOpportunitiesRate || 0) > 30 ? 'success' : (metrics?.conversionMetrics?.prospectsToOpportunitiesRate || 0) > 20 ? 'default' : 'danger'}
            status={(metrics?.conversionMetrics?.prospectsToOpportunitiesRate || 0) > 30 ? 'ahead' : (metrics?.conversionMetrics?.prospectsToOpportunitiesRate || 0) > 20 ? 'on-track' : 'behind'}
            trend={metrics?.trends?.conversionRate?.direction}
            trendValue={`${metrics?.trends?.conversionRate?.change || 0}%`}
          />
        </div>
      </div>
    </div>
  );
}