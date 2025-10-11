"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTower } from "./layout";
import { TowerHeader } from "./components/TowerHeader";
import { MetricsGrid } from "./components/MetricsGrid";
import { MonitoringCard as MonitoringCardType, TowerMetrics } from "./types";

export default function TowerPage() {
  // Set browser title
  useEffect(() => {
    document.title = 'Tower • Intelligence';
  }, []);
  const { setSelectedMetric } = useTower();
  const [metrics, setMetrics] = useState<TowerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics data
  const fetchMetrics = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetch('/api/tower/metrics', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      console.error('Failed to fetch Tower metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMetrics(true);
  }, [fetchMetrics]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics(false);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  // Convert metrics to monitoring cards
  const convertToCards = (metrics: TowerMetrics): MonitoringCardType[] => {
    const cards: MonitoringCardType[] = [];

    // System Health Cards
    cards.push({
      id: 'system-status',
      title: 'System Status',
      category: 'system',
      status: metrics.systemHealth.status,
      value: `${Math.floor(metrics.systemHealth.uptime / 3600)}h uptime`,
      subtitle: `${metrics.systemHealth.environment} • v${metrics.systemHealth.version}`,
      lastUpdated: metrics.systemHealth.timestamp,
      details: metrics.systemHealth
    });

    cards.push({
      id: 'api-health',
      title: 'API Health',
      category: 'system',
      status: metrics.apiHealth.status,
      value: `${Math.round(metrics.apiHealth.responseTime)}ms`,
      subtitle: `${metrics.apiHealth.errorRate.toFixed(1)}% error rate`,
      lastUpdated: metrics.lastUpdated,
      details: metrics.apiHealth
    });

    cards.push({
      id: 'database-status',
      title: 'Database Status',
      category: 'system',
      status: metrics.databaseStatus.status,
      value: `${metrics.databaseStatus.connectionPool.active}/${metrics.databaseStatus.connectionPool.total} connections`,
      subtitle: `${Math.round(metrics.databaseStatus.latency)}ms latency`,
      lastUpdated: metrics.lastUpdated,
      details: metrics.databaseStatus
    });

    // Performance Cards
    cards.push({
      id: 'query-performance',
      title: 'Query Performance',
      category: 'performance',
      status: metrics.queryPerformance.status,
      value: `${Math.round(metrics.queryPerformance.averageTime)}ms avg`,
      subtitle: `${metrics.queryPerformance.slowQueries} slow queries`,
      lastUpdated: metrics.lastUpdated,
      details: metrics.queryPerformance
    });

    cards.push({
      id: 'cache-metrics',
      title: 'Cache Metrics',
      category: 'performance',
      status: metrics.cacheMetrics.status,
      value: `${metrics.cacheMetrics.hitRate.toFixed(1)}% hit rate`,
      subtitle: `${metrics.cacheMetrics.keys.toLocaleString()} keys`,
      lastUpdated: metrics.lastUpdated,
      details: metrics.cacheMetrics
    });

    cards.push({
      id: 'response-times',
      title: 'Response Times',
      category: 'performance',
      status: metrics.responseTimes.status,
      value: `${Math.round(metrics.responseTimes.p95)}ms p95`,
      subtitle: `${Math.round(metrics.responseTimes.p50)}ms p50`,
      lastUpdated: metrics.lastUpdated,
      details: metrics.responseTimes
    });

    // Data Quality Cards
    cards.push({
      id: 'error-rate',
      title: 'Error Rate',
      category: 'data',
      status: metrics.errorRate.status,
      value: `${metrics.errorRate.lastHour.toFixed(1)}%`,
      subtitle: `${metrics.errorRate.critical} critical errors`,
      lastUpdated: metrics.lastUpdated,
      details: metrics.errorRate
    });

    cards.push({
      id: 'data-completeness',
      title: 'Data Completeness',
      category: 'data',
      status: metrics.dataCompleteness.status,
      value: `${metrics.dataCompleteness.score.toFixed(1)}%`,
      subtitle: `${metrics.dataCompleteness.incompleteRecords.toLocaleString()} incomplete`,
      lastUpdated: metrics.dataCompleteness.lastUpdated,
      details: metrics.dataCompleteness
    });

    cards.push({
      id: 'background-jobs',
      title: 'Background Jobs',
      category: 'data',
      status: metrics.backgroundJobs.status,
      value: `${metrics.backgroundJobs.pending} pending`,
      subtitle: `${metrics.backgroundJobs.failed} failed`,
      lastUpdated: metrics.lastUpdated,
      details: metrics.backgroundJobs
    });

    // Infrastructure Cards
    cards.push({
      id: 'memory-usage',
      title: 'Memory Usage',
      category: 'infrastructure',
      status: metrics.memoryUsage.status,
      value: `${metrics.memoryUsage.percentage.toFixed(1)}%`,
      subtitle: `${Math.round(metrics.memoryUsage.used / 1024 / 1024)}MB used`,
      lastUpdated: metrics.lastUpdated,
      details: metrics.memoryUsage
    });

    cards.push({
      id: 'request-volume',
      title: 'Request Volume',
      category: 'infrastructure',
      status: metrics.requestVolume.status,
      value: `${metrics.requestVolume.requestsPerMinute}/min`,
      subtitle: `Peak: ${metrics.requestVolume.peakRequests}/min`,
      lastUpdated: metrics.lastUpdated,
      details: metrics.requestVolume
    });

    cards.push({
      id: 'service-dependencies',
      title: 'Service Dependencies',
      category: 'infrastructure',
      status: metrics.serviceDependencies.status,
      value: `${Object.keys(metrics.serviceDependencies.services).length} services`,
      subtitle: Object.values(metrics.serviceDependencies.services).every(s => s.status === 'up') ? 'All healthy' : 'Some issues',
      lastUpdated: metrics.lastUpdated,
      details: metrics.serviceDependencies
    });

    return cards;
  };

  const handleRefresh = () => {
    fetchMetrics(true);
  };

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleCardClick = (cardId: string) => {
    setSelectedMetric(cardId);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        <TowerHeader
          lastUpdated={new Date().toISOString()}
          isRefreshing={true}
          autoRefresh={autoRefresh}
          onRefresh={handleRefresh}
          onToggleAutoRefresh={handleToggleAutoRefresh}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-[var(--muted)]">Loading Tower metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        <TowerHeader
          lastUpdated={new Date().toISOString()}
          isRefreshing={isRefreshing}
          autoRefresh={autoRefresh}
          onRefresh={handleRefresh}
          onToggleAutoRefresh={handleToggleAutoRefresh}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Failed to load metrics</h3>
            <p className="text-[var(--muted)] mb-4">{error}</p>
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

  if (!metrics) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        <TowerHeader
          lastUpdated={new Date().toISOString()}
          isRefreshing={isRefreshing}
          autoRefresh={autoRefresh}
          onRefresh={handleRefresh}
          onToggleAutoRefresh={handleToggleAutoRefresh}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--muted)]">No metrics data available</p>
          </div>
        </div>
      </div>
    );
  }

  const cards = convertToCards(metrics);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      <TowerHeader
        lastUpdated={metrics.lastUpdated}
        isRefreshing={isRefreshing}
        autoRefresh={autoRefresh}
        onRefresh={handleRefresh}
        onToggleAutoRefresh={handleToggleAutoRefresh}
      />
      <MetricsGrid
        cards={cards}
        onCardClick={handleCardClick}
      />
    </div>
  );
}
