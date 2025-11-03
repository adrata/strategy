"use client";

import React, { useState, useEffect } from 'react';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useUnifiedAuth } from '@/platform/auth';

interface MetricCardProps {
  title: string;
  value: string | number | null;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

function MetricCard({ title, value, subtitle, trend, trendValue, color = 'default' }: MetricCardProps) {
  const colorClasses = {
    default: 'border-border bg-background',
    success: 'border-success bg-success/10',
    warning: 'border-border bg-background',
    danger: 'border-error bg-error/10'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} transition-all shadow-sm hover:shadow-md`}>
      <div className="text-base font-semibold text-foreground mb-2">{title}</div>
      <div className="text-3xl font-bold text-foreground mb-2">
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
          {subtitle && (
        <div className="text-sm text-muted mb-2">{subtitle}</div>
          )}
        {trend && trendValue && (
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted">{trendIcons[trend]}</span>
          <span className="text-muted">{trendValue}</span>
          </div>
        )}
    </div>
  );
}

interface ActivityMetrics {
  contactsToday: number;
  contactsYesterday: number;
  callsToday: number;
  emailsToday: number;
  meetingsToday: number;
  
  contactToResponseRate: number;
  responseToMeetingRate: number;
  meetingToOpportunityRate: number;
  opportunityToWinRate: number;
  
  newOpportunitiesToday: number;
  dealsClosedThisWeek: number;
  pipelineValueAddedToday: number;
  
  activityTrend: DailyActivity[];
}

interface DailyActivity {
  date: string;
  contacts: number;
  calls: number;
  emails: number;
  meetings: number;
}

export function MetricsDashboard() {
  const { acquisitionData } = useRevenueOS();
  const { user } = useUnifiedAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Get workspace and user IDs from acquisition data
  const workspaceId = acquisitionData?.workspaceId;
  const userId = user?.id;

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
      setLoading(true);
      setError(null);
        
        const response = await fetch(`/api/metrics/pipeline?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
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
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

    fetchMetrics();
  }, [workspaceId, userId]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto invisible-scrollbar">
        <div className="p-8 bg-background min-h-full">
          <div className="h-8 bg-loading-bg rounded w-64 animate-pulse mb-8"></div>
          
          {/* Bento grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-background p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-muted/20 rounded mb-4 w-1/2"></div>
                <div className="h-8 bg-muted/20 rounded mb-2 w-1/3"></div>
                <div className="h-3 bg-muted/20 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto invisible-scrollbar">
        <div className="p-8 bg-background min-h-full">
          <h1 className="text-2xl font-bold text-foreground mb-8">
            Sales Activity Dashboard
          </h1>
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="h-full overflow-y-auto invisible-scrollbar">
        <div className="p-8 bg-background min-h-full">
          <h1 className="text-2xl font-bold text-foreground mb-8">
            Sales Activity Dashboard
          </h1>
          <div className="text-muted">No metrics data available</div>
        </div>
      </div>
    );
  }

  // Calculate trend for contacts
  const contactsTrend = metrics.raw?.contactsToday > metrics.raw?.contactsYesterday ? 'up' : 
                       metrics.raw?.contactsToday < metrics.raw?.contactsYesterday ? 'down' : 'stable';
  const contactsChange = metrics.raw?.contactsToday - metrics.raw?.contactsYesterday;

  return (
    <div className="h-full overflow-y-auto invisible-scrollbar">
      <div className="p-8 bg-background min-h-full">
        <h1 className="text-2xl font-bold text-foreground mb-8">
          Sales Activity Dashboard
        </h1>
        
        {/* 3x3 Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px]">
          {/* Contacts Today */}
          <MetricCard
            title="Contacts Today"
            value={metrics.contactsToday || 0}
            subtitle="Total outreach"
            trend={contactsTrend}
            trendValue={`vs yesterday: ${contactsChange > 0 ? '+' : ''}${contactsChange}`}
            color={metrics.smartStatus?.totalActions?.color || 'default'}
          />

          {/* Calls Today */}
          <MetricCard
            title="Calls Today"
            value={metrics.callsToday || 0}
            subtitle="Phone activity"
            color={metrics.smartStatus?.phone?.color || 'default'}
          />

          {/* Emails Today */}
          <MetricCard
            title="Emails Today"
            value={metrics.emailsToday || 0}
            subtitle="Email outreach"
            color={metrics.smartStatus?.emails?.color || 'default'}
          />

          {/* Meetings Today + Scheduled */}
          <MetricCard
            title="Meetings Today + Scheduled"
            value={metrics.meetingsToday || 0}
            subtitle="Face-to-face"
            color={metrics.smartStatus?.meetings?.color || 'default'}
          />

          {/* New Clients Today */}
          <MetricCard
            title="New Clients"
            value={metrics.newOpportunitiesToday || 0}
            subtitle="Today"
            color={metrics.smartStatus?.opportunities?.color || 'default'}
          />

          {/* Deals Closed This Week */}
          <MetricCard
            title="Deals Closed"
            value={metrics.dealsClosedThisWeek || 0}
            subtitle="This week"
            color={metrics.smartStatus?.clients?.color || 'default'}
          />

          {/* Win Rate */}
          <MetricCard
            title="Win Rate"
            value={metrics.winRate || '0%'}
            subtitle="Close rate"
            color={metrics.smartStatus?.conversionRate?.color || 'default'}
          />

          {/* Pipeline Value */}
          <MetricCard
            title="Pipeline Value"
            value={metrics.totalPipelineValue || '$0M'}
            subtitle="Total pipeline"
            color={metrics.smartStatus?.pipeline?.color || 'default'}
          />

          {/* Average Response Time - 9th Metric */}
          <MetricCard
            title="Response Time"
            value={metrics.avgResponseTime || '2.5 hrs'}
            subtitle="Average response"
            color={metrics.smartStatus?.responseTime?.color || 'default'}
          />
        </div>

        </div>
    </div>
  );
}