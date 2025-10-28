"use client";

import React, { useState, useEffect } from 'react';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useUnifiedAuth } from '@/platform/auth';
import { 
  UserGroupIcon, 
  UserPlusIcon, 
  UserMinusIcon, 
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon,
  UserIcon,
  LightBulbIcon,
  HandRaisedIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface NotaryEverydayMetrics {
  currentPeriod: string;
  metrics: {
    clients: {
      new: number;
      total: number;
      existing: number;
      decayed: number;
    };
    orders: {
      monthlyTotal: number;
      monthlyRevenue: number;
      avgPerClient: number;
      neCut: number;
    };
    funnel: {
      leads: number;
      prospects: number;
      opportunities: number;
      clients: number;
    };
    conversions: {
      leadToProspect: number;
      prospectToOpportunity: number;
      opportunityToClient: number;
      avgDaysToClose: number;
    };
  };
  historical: Array<{
    period: string;
    metrics: any;
  }>;
}

interface MetricCardProps {
  title: string;
  value: string | number | null;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
  status?: 'ahead' | 'behind' | 'on-track';
  icon?: React.ComponentType<{ className?: string }>;
}

function MetricCard({ title, value, subtitle, trend, trendValue, color = 'default', status, icon: Icon }: MetricCardProps) {
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
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="h-4 w-4 text-gray-500" />}
          <div className="text-sm font-medium text-gray-600">{title}</div>
        </div>
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

export function MetricsEnhanced() {
  const { data: acquisitionData } = useRevenueOS();
  const { user } = useUnifiedAuth();
  const [metrics, setMetrics] = useState<NotaryEverydayMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;
  console.log('🔍 [MetricsEnhanced] workspaceId:', workspaceId, 'acquisitionData:', acquisitionData);

  // Check if this is Notary Everyday workspace
  const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || 
                          workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || 
                          workspaceId === 'cmezxb1ez0001pc94yry3ntjk';

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!isNotaryEveryday) {
          console.log('🔍 [MetricsEnhanced] Not Notary Everyday workspace, using default metrics');
          // For non-NE workspaces, use the existing metrics API
          const response = await fetch(`/api/v1/metrics?workspaceId=${workspaceId}&t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch metrics: ${response.status}`);
          }

          const data = await response.json();
          if (data.success) {
            setMetrics(data.data);
          } else {
            throw new Error(data.error || 'Failed to load metrics');
          }
        } else {
          // For Notary Everyday, use the new dedicated API
          console.log('🔍 [MetricsEnhanced] Fetching Notary Everyday metrics');
          const response = await fetch(`/api/v1/metrics/notary-everyday?workspaceId=${workspaceId}&t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (!response.ok) {
            console.error('❌ [METRICS] NE API failed with status:', response.status);
            throw new Error(`Failed to fetch Notary Everyday metrics: ${response.status}`);
          }

          const data = await response.json();
          console.log('✅ [METRICS] NE API returned data:', data);
          setMetrics(data);
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    console.log('🔍 [MetricsEnhanced] useEffect triggered, workspaceId:', workspaceId, 'isNotaryEveryday:', isNotaryEveryday);
    if (workspaceId) {
      console.log('🔍 [MetricsEnhanced] Calling fetchMetrics for workspaceId:', workspaceId);
      fetchMetrics();
    } else {
      console.log('🔍 [MetricsEnhanced] No workspaceId, not calling fetchMetrics');
    }
  }, [workspaceId, isNotaryEveryday]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1400px]">
            {Array.from({ length: 16 }).map((_, i) => (
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

  // Render Notary Everyday metrics if this is NE workspace
  if (isNotaryEveryday && metrics) {
    return (
      <div className="h-full overflow-y-auto invisible-scrollbar">
        <div className="p-6 bg-[var(--background)] min-h-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Notary Everyday Metrics</h1>
            <p className="text-gray-600">Current Period: {metrics.currentPeriod}</p>
          </div>
          
          {/* 4x4 Grid Layout for 16 metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1600px]">
            {/* Client Metrics */}
            <div className="col-span-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Client Metrics</h2>
            </div>
            
            <MetricCard
              title="New Clients"
              value={metrics.metrics.clients.new}
              subtitle={`This ${metrics.currentPeriod}`}
              color={metrics.metrics.clients.new > 5 ? 'success' : metrics.metrics.clients.new > 2 ? 'default' : 'warning'}
              icon={UserPlusIcon}
            />
            
            <MetricCard
              title="Total Clients"
              value={metrics.metrics.clients.total}
              subtitle="All time"
              color={metrics.metrics.clients.total > 20 ? 'success' : metrics.metrics.clients.total > 10 ? 'default' : 'warning'}
              icon={UserGroupIcon}
            />
            
            <MetricCard
              title="Existing Clients"
              value={metrics.metrics.clients.existing}
              subtitle="From previous periods"
              color="default"
              icon={UsersIcon}
            />
            
            <MetricCard
              title="Decayed Clients"
              value={metrics.metrics.clients.decayed}
              subtitle="Lost this period"
              color={metrics.metrics.clients.decayed > 2 ? 'danger' : 'default'}
              icon={UserMinusIcon}
            />

            {/* Order & Revenue Metrics */}
            <div className="col-span-4 mb-4 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Order & Revenue Metrics</h2>
            </div>
            
            <MetricCard
              title="Monthly Total Orders"
              value={metrics.metrics.orders.monthlyTotal}
              subtitle="This month"
              color={metrics.metrics.orders.monthlyTotal > 1000 ? 'success' : metrics.metrics.orders.monthlyTotal > 500 ? 'default' : 'warning'}
              icon={ShoppingCartIcon}
            />
            
            <MetricCard
              title="Monthly Order Revenue"
              value={`$${(metrics.metrics.orders.monthlyRevenue / 1000).toFixed(1)}K`}
              subtitle="This month"
              color={metrics.metrics.orders.monthlyRevenue > 200000 ? 'success' : metrics.metrics.orders.monthlyRevenue > 100000 ? 'default' : 'warning'}
              icon={CurrencyDollarIcon}
            />
            
            <MetricCard
              title="Avg Client Orders"
              value={metrics.metrics.orders.avgPerClient}
              subtitle="Orders per client"
              color={metrics.metrics.orders.avgPerClient > 200 ? 'success' : metrics.metrics.orders.avgPerClient > 100 ? 'default' : 'warning'}
              icon={ChartBarIcon}
            />
            
            <MetricCard
              title="NE Revenue Cut"
              value={`$${(metrics.metrics.orders.neCut / 1000).toFixed(1)}K`}
              subtitle="After costs"
              color={metrics.metrics.orders.neCut > 50000 ? 'success' : metrics.metrics.orders.neCut > 25000 ? 'default' : 'warning'}
              icon={CurrencyDollarIcon}
            />

            {/* Funnel Metrics */}
            <div className="col-span-4 mb-4 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Funnel Metrics</h2>
            </div>
            
            <MetricCard
              title="Total Leads"
              value={metrics.metrics.funnel.leads}
              subtitle="In pipeline"
              color={metrics.metrics.funnel.leads > 200 ? 'success' : metrics.metrics.funnel.leads > 100 ? 'default' : 'warning'}
              icon={LightBulbIcon}
            />
            
            <MetricCard
              title="Total Prospects"
              value={metrics.metrics.funnel.prospects}
              subtitle="Warm relationships"
              color={metrics.metrics.funnel.prospects > 50 ? 'success' : metrics.metrics.funnel.prospects > 25 ? 'default' : 'warning'}
              icon={HandRaisedIcon}
            />
            
            <MetricCard
              title="Total Opportunities"
              value={metrics.metrics.funnel.opportunities}
              subtitle="Real pipeline"
              color={metrics.metrics.funnel.opportunities > 20 ? 'success' : metrics.metrics.funnel.opportunities > 10 ? 'default' : 'warning'}
              icon={UserIcon}
            />
            
            <MetricCard
              title="Total Clients"
              value={metrics.metrics.funnel.clients}
              subtitle="Earned relationships"
              color={metrics.metrics.funnel.clients > 20 ? 'success' : metrics.metrics.funnel.clients > 10 ? 'default' : 'warning'}
              icon={CheckCircleIcon}
            />

            {/* Conversion Metrics */}
            <div className="col-span-4 mb-4 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Conversion Metrics</h2>
            </div>
            
            <MetricCard
              title="Lead → Prospect"
              value={`${metrics.metrics.conversions.leadToProspect}%`}
              subtitle="Conversion rate"
              color={metrics.metrics.conversions.leadToProspect > 20 ? 'success' : metrics.metrics.conversions.leadToProspect > 10 ? 'default' : 'warning'}
              icon={ArrowTrendingUpIcon}
            />
            
            <MetricCard
              title="Prospect → Opportunity"
              value={`${metrics.metrics.conversions.prospectToOpportunity}%`}
              subtitle="Conversion rate"
              color={metrics.metrics.conversions.prospectToOpportunity > 30 ? 'success' : metrics.metrics.conversions.prospectToOpportunity > 15 ? 'default' : 'warning'}
              icon={ArrowRightIcon}
            />
            
            <MetricCard
              title="Opportunity → Client"
              value={`${metrics.metrics.conversions.opportunityToClient}%`}
              subtitle="Conversion rate"
              color={metrics.metrics.conversions.opportunityToClient > 40 ? 'success' : metrics.metrics.conversions.opportunityToClient > 20 ? 'default' : 'warning'}
              icon={ArrowTrendingUpIcon}
            />
            
            <MetricCard
              title="Avg Days to Close"
              value={`${metrics.metrics.conversions.avgDaysToClose} days`}
              subtitle="Lead to client"
              color={metrics.metrics.conversions.avgDaysToClose < 30 ? 'success' : metrics.metrics.conversions.avgDaysToClose < 60 ? 'default' : 'warning'}
              icon={ClockIcon}
            />
          </div>
        </div>
      </div>
    );
  }

  // Fallback to original metrics display for non-NE workspaces
  return (
    <div className="h-full overflow-y-auto invisible-scrollbar">
      <div className="p-6 bg-[var(--background)] min-h-full">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Metrics Not Available</h3>
          <p className="text-gray-600">Metrics will appear here once data is available.</p>
        </div>
      </div>
    </div>
  );
}