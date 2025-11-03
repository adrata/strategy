"use client";

import React, { useState, useEffect } from "react";
import { ChartBarIcon, ClockIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

interface UsageData {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  requestsLastMonth: number;
  averageResponseTime: number;
  errorRate: number;
}

export function ApiUsagePanel() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch usage data
    // This would come from an actual API endpoint in the future
    setTimeout(() => {
      setUsageData({
        totalRequests: 12450,
        requestsToday: 342,
        requestsThisMonth: 8920,
        requestsLastMonth: 7680,
        averageResponseTime: 245,
        errorRate: 0.02
      });
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto invisible-scrollbar bg-background flex items-center justify-center">
        <div className="text-muted">Loading usage statistics...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto invisible-scrollbar bg-background">
      <div className="max-w-5xl mx-auto pt-8 p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usage Statistics</h1>
          <p className="text-muted mt-1">Monitor your API usage and performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 border border-border rounded-lg bg-panel-background">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">Total Requests</span>
              <ChartBarIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {usageData?.totalRequests.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-muted mt-1">All time</div>
          </div>

          <div className="p-6 border border-border rounded-lg bg-panel-background">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">Today</span>
              <ClockIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {usageData?.requestsToday.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-muted mt-1">Requests today</div>
          </div>

          <div className="p-6 border border-border rounded-lg bg-panel-background">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">This Month</span>
              <ArrowTrendingUpIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {usageData?.requestsThisMonth.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-muted mt-1">
              {usageData && usageData.requestsLastMonth > 0
                ? `↑ ${Math.round(((usageData.requestsThisMonth - usageData.requestsLastMonth) / usageData.requestsLastMonth) * 100)}% from last month`
                : 'No previous data'}
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Rate Limits</h2>
          <div className="p-6 border border-border rounded-lg bg-panel-background">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Current Limits</h3>
                <ul className="space-y-2 text-sm text-muted">
                  <li>• <strong className="text-foreground">10,000 requests per hour</strong> per API key</li>
                  <li>• <strong className="text-foreground">100 requests per minute</strong> per API key</li>
                  <li>• Burst limit: <strong className="text-foreground">50 requests per 10 seconds</strong></li>
                </ul>
              </div>
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-foreground mb-2">Rate Limit Headers</h3>
                <p className="text-sm text-muted mb-2">
                  Every API response includes rate limit information in the headers:
                </p>
                <div className="bg-black rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-white font-mono">
                    <code>{`X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9658
X-RateLimit-Reset: 1635724800`}</code>
                  </pre>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-foreground mb-2">Exceeding Rate Limits</h3>
                <p className="text-sm text-muted mb-2">
                  When you exceed rate limits, you'll receive a <code className="bg-gray-100 px-1 rounded">429 Too Many Requests</code> response.
                  Implement exponential backoff and retry logic to handle this gracefully.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {usageData && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 border border-border rounded-lg bg-panel-background">
                <h3 className="font-semibold text-foreground mb-2">Average Response Time</h3>
                <div className="text-3xl font-bold text-foreground">
                  {usageData.averageResponseTime}ms
                </div>
                <p className="text-sm text-muted mt-1">Mean response time across all requests</p>
              </div>
              <div className="p-6 border border-border rounded-lg bg-panel-background">
                <h3 className="font-semibold text-foreground mb-2">Error Rate</h3>
                <div className="text-3xl font-bold text-foreground">
                  {(usageData.errorRate * 100).toFixed(2)}%
                </div>
                <p className="text-sm text-muted mt-1">Percentage of requests that failed</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

