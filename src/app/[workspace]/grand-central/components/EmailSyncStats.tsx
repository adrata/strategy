"use client";

import React, { useState, useEffect } from 'react';
import { 
  EnvelopeIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface EmailSyncStatsProps {
  workspaceId: string;
  connectionId?: string;
}

interface EmailStats {
  total: number;
  linked: number;
  withActions: number;
  linkRate: number;
  actionRate: number;
  recentSyncs: number;
  lastSyncTime?: string;
  syncErrors: number;
}

export function EmailSyncStats({ workspaceId, connectionId }: EmailSyncStatsProps) {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Don't render if no workspaceId
  if (!workspaceId) {
    return null;
  }

  useEffect(() => {
    // Don't fetch if workspaceId is empty
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (connectionId) params.append('connectionId', connectionId);
        if (workspaceId) params.append('workspaceId', workspaceId);
        
        const response = await fetch(`/api/grand-central/stats?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch email statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching email stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [workspaceId, connectionId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-[var(--loading-bg)] rounded animate-pulse"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[var(--loading-bg)] rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">Error loading statistics</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 bg-[var(--panel-background)] rounded-lg text-center">
        <EnvelopeIcon className="w-8 h-8 text-[var(--muted)] mx-auto mb-2" />
        <p className="text-[var(--muted)]">No email statistics available</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Emails',
      value: stats.total.toLocaleString(),
      icon: EnvelopeIcon,
      color: 'blue',
      description: 'Emails synced'
    },
    {
      title: 'Linked to People',
      value: stats.linked.toLocaleString(),
      icon: UserGroupIcon,
      color: 'green',
      description: `${stats.linkRate}% link rate`
    },
    {
      title: 'With Actions',
      value: stats.withActions.toLocaleString(),
      icon: ChartBarIcon,
      color: 'purple',
      description: `${stats.actionRate}% action rate`
    },
    {
      title: 'Recent Syncs',
      value: stats.recentSyncs.toLocaleString(),
      icon: ClockIcon,
      color: 'orange',
      description: 'Last 24 hours'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Email Statistics</h3>
        {stats.lastSyncTime && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <CheckCircleIcon className="w-4 h-4" />
            Last sync: {new Date(stats.lastSyncTime).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`p-4 rounded-lg border ${getColorClasses(stat.color)}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/50 rounded-lg">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm font-medium">{stat.title}</div>
                  <div className="text-xs opacity-75">{stat.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync Health */}
      <div className="p-4 bg-[var(--panel-background)] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-[var(--foreground)]">Sync Health</h4>
          {stats.syncErrors > 0 ? (
            <div className="flex items-center gap-1 text-red-600">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{stats.syncErrors} errors</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Healthy</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Link Rate</span>
            <span className="font-medium">{stats.linkRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.linkRate}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Action Rate</span>
            <span className="font-medium">{stats.actionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.actionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
          <ChartBarIcon className="w-4 h-4" />
          View Details
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--hover)] transition-colors">
          <ClockIcon className="w-4 h-4" />
          Sync History
        </button>
      </div>
    </div>
  );
}
