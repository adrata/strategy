"use client";

/**
 * Stacks Metrics Component
 * 
 * Displays workstream performance metrics and analytics
 */

import React, { useState, useEffect } from 'react';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useUnifiedAuth } from '@/platform/auth';
import { usePathname } from 'next/navigation';
import { getWorkspaceIdBySlug } from '@/platform/config/workspace-mapping';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: 'default' | 'green' | 'yellow' | 'red';
}

function MetricCard({ title, value, subtitle, trend, color = 'default' }: MetricCardProps) {
  const colorClasses = {
    default: 'bg-white border-gray-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200'
  };

  const textColorClasses = {
    default: 'text-gray-900',
    green: 'text-green-900',
    yellow: 'text-yellow-900',
    red: 'text-red-900'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-xs font-medium text-gray-500 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${textColorClasses[color]} mb-1`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          {trend === 'up' && <span className="text-green-600">↗</span>}
          {trend === 'down' && <span className="text-red-600">↘</span>}
          {trend === 'stable' && <span className="text-gray-400">→</span>}
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function StacksMetrics() {
  const { ui } = useRevenueOS();
  const { user: authUser } = useUnifiedAuth();
  const pathname = usePathname();
  const workspaceSlug = pathname.split('/').filter(Boolean)[0];
  const [metrics, setMetrics] = useState({
    velocity: 0,
    cycleTime: 0,
    throughput: 0,
    leadTime: 0,
    workInProgress: 0,
    completedThisWeek: 0,
    avgTimeToDone: 0,
    shippedThisMonth: 0,
    activeItems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      // Resolve workspace ID with fallback logic (same as StacksBoard and StacksLeftPanel)
      let workspaceId = ui.activeWorkspace?.id;
      
      // Fallback 1: Get from URL workspace slug if UI workspace is missing
      if (!workspaceId && workspaceSlug) {
        const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
        if (urlWorkspaceId) {
          console.log(`🔍 [StacksMetrics] Resolved workspace ID from URL slug "${workspaceSlug}": ${urlWorkspaceId}`);
          workspaceId = urlWorkspaceId;
        }
      }
      
      // Fallback 2: Use user's active workspace ID
      if (!workspaceId && authUser?.activeWorkspaceId) {
        console.log(`🔍 [StacksMetrics] Using user activeWorkspaceId: ${authUser.activeWorkspaceId}`);
        workspaceId = authUser.activeWorkspaceId;
      }
      
      if (!workspaceId) {
        console.warn('⚠️ [StacksMetrics] No workspace ID available after all fallbacks');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/v1/stacks/stories?workspaceId=${workspaceId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const stories = data.stories || [];
          
          // Calculate metrics
          const now = new Date();
          const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          // Velocity: Stories completed this week
          const completedThisWeek = stories.filter((story: any) => {
            const completedDate = story.status === 'done' || story.status === 'shipped' 
              ? new Date(story.updatedAt) 
              : null;
            return completedDate && completedDate >= thisWeek;
          }).length;

          // Throughput: Stories completed this week (same as velocity for now)
          const throughput = completedThisWeek;

          // Work in Progress: Stories in active statuses
          const workInProgress = stories.filter((story: any) => 
            ['up-next', 'in-progress', 'qa1', 'qa2'].includes(story.status)
          ).length;

          // Average Cycle Time: Average time from start to done
          const completedStories = stories.filter((story: any) => 
            story.status === 'done' || story.status === 'shipped'
          );
          let avgCycleTime = 0;
          if (completedStories.length > 0) {
            const totalDays = completedStories.reduce((sum: number, story: any) => {
              if (story.createdAt && story.updatedAt) {
                const created = new Date(story.createdAt);
                const updated = new Date(story.updatedAt);
                const days = (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                return sum + days;
              }
              return sum;
            }, 0);
            avgCycleTime = Math.round(totalDays / completedStories.length);
          }

          // Average Lead Time: Average time from creation to completion
          const avgLeadTime = avgCycleTime; // Same calculation for now

          // Average Time to Done: Average time in "done" status before shipped
          const doneStories = stories.filter((story: any) => story.status === 'done');
          let avgTimeToDone = 0;
          if (doneStories.length > 0) {
            // This would require tracking when items moved to "done" vs "shipped"
            avgTimeToDone = 2; // Placeholder
          }

          // Shipped This Month
          const shippedThisMonth = stories.filter((story: any) => {
            const shippedDate = story.status === 'shipped' 
              ? new Date(story.updatedAt) 
              : null;
            return shippedDate && shippedDate >= thisMonth;
          }).length;

          // Active Items: All non-completed items
          const activeItems = stories.filter((story: any) => 
            story.status !== 'done' && story.status !== 'shipped'
          ).length;

          setMetrics({
            velocity: completedThisWeek,
            cycleTime: avgCycleTime,
            throughput: throughput,
            leadTime: avgLeadTime,
            workInProgress: workInProgress,
            completedThisWeek: completedThisWeek,
            avgTimeToDone: avgTimeToDone,
            shippedThisMonth: shippedThisMonth,
            activeItems: activeItems
          });
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [ui.activeWorkspace?.id, authUser?.activeWorkspaceId, workspaceSlug]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto invisible-scrollbar p-6">
      {/* Header removed - already shown in StacksMiddlePanel */}
      
      {/* 3x3 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
        <MetricCard
          title="Velocity"
          value={metrics.velocity}
          subtitle="Stories completed this week"
          trend="stable"
        />
        
        <MetricCard
          title="Cycle Time"
          value={metrics.cycleTime === 0 ? 'N/A' : `${metrics.cycleTime} days`}
          subtitle="Average time to completion"
          trend="stable"
        />
        
        <MetricCard
          title="Throughput"
          value={metrics.throughput}
          subtitle="Stories completed per week"
          trend="stable"
        />
        
        <MetricCard
          title="Lead Time"
          value={metrics.leadTime === 0 ? 'N/A' : `${metrics.leadTime} days`}
          subtitle="Average time from start to delivery"
          trend="stable"
        />
        
        <MetricCard
          title="Work in Progress"
          value={metrics.workInProgress}
          subtitle="Active items across all stages"
          color="yellow"
        />
        
        <MetricCard
          title="Completed This Week"
          value={metrics.completedThisWeek}
          subtitle="Total stories finished"
          color="green"
        />
        
        <MetricCard
          title="Avg Time to Done"
          value={metrics.avgTimeToDone === 0 ? 'N/A' : `${metrics.avgTimeToDone} days`}
          subtitle="Average time in done before shipped"
        />
        
        <MetricCard
          title="Shipped This Month"
          value={metrics.shippedThisMonth}
          subtitle="Stories shipped to production"
          color="green"
        />
        
        <MetricCard
          title="Active Items"
          value={metrics.activeItems}
          subtitle="Currently in progress"
          color="yellow"
        />
      </div>
    </div>
  );
}
