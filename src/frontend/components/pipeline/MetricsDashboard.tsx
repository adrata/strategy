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
}

function MetricCard({ title, value, subtitle, trend, trendValue, color = 'default' }: MetricCardProps) {
  const colorClasses = {
    default: 'border-[var(--border)] bg-[var(--background)]',
    success: 'border-green-500 bg-green-100',
    warning: 'border-[var(--border)] bg-white',
    danger: 'border-red-500 bg-red-100'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} transition-all shadow-sm hover:shadow-md`}>
      <div className="text-base font-semibold text-[var(--foreground)] mb-2">{title}</div>
      <div className="text-3xl font-bold text-[var(--foreground)] mb-2">
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
        <div className="text-sm text-[var(--muted)] mb-2">{subtitle}</div>
          )}
        {trend && trendValue && (
        <div className="flex items-center gap-1 text-sm">
          <span className="text-[var(--muted)]">{trendIcons[trend]}</span>
          <span className="text-[var(--muted)]">{trendValue}</span>
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
  const { acquisitionData } = useAcquisitionOS();
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
        <div className="p-8 bg-[var(--background)] min-h-full">
          <div className="h-8 bg-[var(--loading-bg)] rounded w-64 animate-pulse mb-8"></div>
          
          {/* Bento grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-[var(--muted)]/20 rounded mb-4 w-1/2"></div>
                <div className="h-8 bg-[var(--muted)]/20 rounded mb-2 w-1/3"></div>
                <div className="h-3 bg-[var(--muted)]/20 rounded w-2/3"></div>
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
        <div className="p-8 bg-[var(--background)] min-h-full">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8">
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
        <div className="p-8 bg-[var(--background)] min-h-full">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8">
            Sales Activity Dashboard
          </h1>
          <div className="text-[var(--muted)]">No metrics data available</div>
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
      <div className="p-8 bg-[var(--background)] min-h-full">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8">
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
            color={metrics.raw?.contactsToday > 30 ? 'success' : metrics.raw?.contactsToday > 15 ? 'warning' : 'danger'}
          />

          {/* Calls Today */}
          <MetricCard
            title="Calls Today"
            value={metrics.callsToday || 0}
            subtitle="Phone activity"
            color={metrics.raw?.callsToday > 10 ? 'success' : metrics.raw?.callsToday > 5 ? 'warning' : 'danger'}
          />

          {/* Emails Today */}
          <MetricCard
            title="Emails Today"
            value={metrics.emailsToday || 0}
            subtitle="Email outreach"
            color={metrics.raw?.emailsToday > 20 ? 'success' : metrics.raw?.emailsToday > 10 ? 'warning' : 'danger'}
          />

          {/* Meetings Today + Scheduled */}
          <MetricCard
            title="Meetings Today + Scheduled"
            value={metrics.meetingsToday || 0}
            subtitle="Face-to-face"
            color={metrics.raw?.meetingsToday > 5 ? 'success' : metrics.raw?.meetingsToday > 2 ? 'warning' : 'danger'}
          />

          {/* New Clients Today */}
          <MetricCard
            title="New Clients"
            value={metrics.newOpportunitiesToday || 0}
            subtitle="Today"
            color={metrics.raw?.newOpportunitiesToday > 3 ? 'success' : metrics.raw?.newOpportunitiesToday > 1 ? 'warning' : 'danger'}
          />

          {/* Deals Closed This Week */}
          <MetricCard
            title="Deals Closed"
            value={metrics.dealsClosedThisWeek || 0}
            subtitle="This week"
            color={metrics.raw?.dealsClosedThisWeek > 2 ? 'success' : metrics.raw?.dealsClosedThisWeek > 0 ? 'warning' : 'danger'}
          />

          {/* Win Rate */}
          <MetricCard
            title="Win Rate"
            value={metrics.winRate || '0%'}
            subtitle="Close rate"
            color={metrics.raw?.winRate > 50 ? 'success' : metrics.raw?.winRate > 30 ? 'warning' : 'danger'}
          />

          {/* Pipeline Value */}
          <MetricCard
            title="Pipeline Value"
            value={metrics.totalPipelineValue || '$0M'}
            subtitle="Total pipeline"
            color={metrics.raw?.totalPipelineValue > 5000000 ? 'success' : metrics.raw?.totalPipelineValue > 2000000 ? 'warning' : 'danger'}
          />

          {/* Average Response Time - 9th Metric */}
          <MetricCard
            title="Response Time"
            value={metrics.avgResponseTime || '2.5 hrs'}
            subtitle="Average response"
            color={metrics.raw?.avgResponseTime < 2 ? 'success' : metrics.raw?.avgResponseTime < 4 ? 'warning' : 'danger'}
          />
        </div>

        </div>
    </div>
  );
}