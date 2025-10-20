"use client";

import React, { useState, useEffect } from 'react';

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

interface EngineeringMetricsData {
  sprintVelocity: {
    current: number;
    average: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
  bugMetrics: {
    open: number;
    closed: number;
    critical: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
  featureCompletion: {
    completed: number;
    inProgress: number;
    planned: number;
    completionRate: number;
  };
  codeQuality: {
    testCoverage: number;
    codeReviewRate: number;
    technicalDebt: number;
    trend: 'up' | 'down' | 'stable';
  };
  deploymentMetrics: {
    deployments: number;
    successRate: number;
    rollbackRate: number;
    avgDeployTime: number;
  };
  teamProductivity: {
    storyPoints: number;
    cycleTime: number;
    leadTime: number;
    throughput: number;
  };
}

export function StacksMetrics() {
  const [metrics, setMetrics] = useState<EngineeringMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Mock data for product/engineering metrics
        const mockData: EngineeringMetricsData = {
          sprintVelocity: {
            current: 42,
            average: 38,
            trend: 'up',
            change: 10.5
          },
          bugMetrics: {
            open: 23,
            closed: 156,
            critical: 3,
            trend: 'down',
            change: -15.2
          },
          featureCompletion: {
            completed: 12,
            inProgress: 8,
            planned: 25,
            completionRate: 48
          },
          codeQuality: {
            testCoverage: 87,
            codeReviewRate: 95,
            technicalDebt: 12,
            trend: 'up'
          },
          deploymentMetrics: {
            deployments: 24,
            successRate: 96,
            rollbackRate: 4,
            avgDeployTime: 8.5
          },
          teamProductivity: {
            storyPoints: 42,
            cycleTime: 5.2,
            leadTime: 8.7,
            throughput: 12
          }
        };
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setMetrics(mockData);
      } catch (err) {
        console.error('Error fetching engineering metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading engineering metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Metrics</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Metrics Available</h3>
          <p className="text-gray-600">Engineering metrics will appear here once data is available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Engineering Metrics</h1>
          <p className="text-gray-600">Product and engineering performance indicators</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sprint Velocity */}
          <MetricCard
            title="Sprint Velocity"
            value={metrics.sprintVelocity.current}
            subtitle={`Avg: ${metrics.sprintVelocity.average} story points`}
            trend={metrics.sprintVelocity.trend}
            trendValue={`${metrics.sprintVelocity.change > 0 ? '+' : ''}${metrics.sprintVelocity.change}%`}
            color={metrics.sprintVelocity.trend === 'up' ? 'success' : metrics.sprintVelocity.trend === 'down' ? 'danger' : 'default'}
            status={metrics.sprintVelocity.current > metrics.sprintVelocity.average ? 'ahead' : 'behind'}
          />

          {/* Bug Metrics */}
          <MetricCard
            title="Open Bugs"
            value={metrics.bugMetrics.open}
            subtitle={`${metrics.bugMetrics.critical} critical`}
            trend={metrics.bugMetrics.trend}
            trendValue={`${metrics.bugMetrics.change > 0 ? '+' : ''}${metrics.bugMetrics.change}%`}
            color={metrics.bugMetrics.trend === 'down' ? 'success' : metrics.bugMetrics.trend === 'up' ? 'danger' : 'default'}
            status={metrics.bugMetrics.open < 20 ? 'ahead' : 'behind'}
          />

          {/* Feature Completion */}
          <MetricCard
            title="Feature Completion"
            value={`${metrics.featureCompletion.completionRate}%`}
            subtitle={`${metrics.featureCompletion.completed}/${metrics.featureCompletion.completed + metrics.featureCompletion.inProgress + metrics.featureCompletion.planned} completed`}
            color={metrics.featureCompletion.completionRate > 50 ? 'success' : metrics.featureCompletion.completionRate > 30 ? 'warning' : 'danger'}
            status={metrics.featureCompletion.completionRate > 50 ? 'ahead' : 'behind'}
          />

          {/* Code Quality */}
          <MetricCard
            title="Test Coverage"
            value={`${metrics.codeQuality.testCoverage}%`}
            subtitle={`${metrics.codeQuality.codeReviewRate}% code review rate`}
            trend={metrics.codeQuality.trend}
            color={metrics.codeQuality.testCoverage > 80 ? 'success' : metrics.codeQuality.testCoverage > 60 ? 'warning' : 'danger'}
            status={metrics.codeQuality.testCoverage > 80 ? 'ahead' : 'behind'}
          />

          {/* Deployment Metrics */}
          <MetricCard
            title="Deployments"
            value={metrics.deploymentMetrics.deployments}
            subtitle={`${metrics.deploymentMetrics.successRate}% success rate`}
            color={metrics.deploymentMetrics.successRate > 95 ? 'success' : metrics.deploymentMetrics.successRate > 90 ? 'warning' : 'danger'}
            status={metrics.deploymentMetrics.successRate > 95 ? 'ahead' : 'behind'}
          />

          {/* Team Productivity */}
          <MetricCard
            title="Story Points"
            value={metrics.teamProductivity.storyPoints}
            subtitle={`${metrics.teamProductivity.cycleTime}d avg cycle time`}
            color="default"
            status="on-track"
          />

          {/* Technical Debt */}
          <MetricCard
            title="Technical Debt"
            value={metrics.codeQuality.technicalDebt}
            subtitle="Story points"
            color={metrics.codeQuality.technicalDebt < 20 ? 'success' : metrics.codeQuality.technicalDebt < 50 ? 'warning' : 'danger'}
            status={metrics.codeQuality.technicalDebt < 20 ? 'ahead' : 'behind'}
          />

          {/* Lead Time */}
          <MetricCard
            title="Lead Time"
            value={`${metrics.teamProductivity.leadTime}d`}
            subtitle="Average time to delivery"
            color={metrics.teamProductivity.leadTime < 10 ? 'success' : metrics.teamProductivity.leadTime < 15 ? 'warning' : 'danger'}
            status={metrics.teamProductivity.leadTime < 10 ? 'ahead' : 'behind'}
          />

          {/* Throughput */}
          <MetricCard
            title="Throughput"
            value={metrics.teamProductivity.throughput}
            subtitle="Items completed per week"
            color="default"
            status="on-track"
          />
        </div>

        {/* Summary Stats */}
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{metrics.bugMetrics.closed}</div>
              <div className="text-sm text-gray-600">Bugs Closed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{metrics.deploymentMetrics.deployments}</div>
              <div className="text-sm text-gray-600">Deployments</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{metrics.featureCompletion.completed}</div>
              <div className="text-sm text-gray-600">Features Shipped</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{metrics.codeQuality.testCoverage}%</div>
              <div className="text-sm text-gray-600">Test Coverage</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
