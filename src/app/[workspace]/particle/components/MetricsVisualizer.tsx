"use client";

import React, { useState, useEffect } from "react";
import { ParticleMetric } from "../types/experiment";

interface MetricsVisualizerProps {
  metrics: ParticleMetric[];
  variantId?: string;
  metricType?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

export function MetricsVisualizer({ 
  metrics, 
  variantId, 
  metricType, 
  timeRange = '24h' 
}: MetricsVisualizerProps) {
  const [filteredMetrics, setFilteredMetrics] = useState<ParticleMetric[]>([]);
  const [selectedMetricType, setSelectedMetricType] = useState<string>(metricType || 'conversion_rate');

  useEffect(() => {
    let filtered = metrics;

    // Filter by variant if specified
    if (variantId) {
      filtered = filtered.filter(m => m.variantId === variantId);
    }

    // Filter by metric type
    if (selectedMetricType) {
      filtered = filtered.filter(m => m.metricType === selectedMetricType);
    }

    // Filter by time range
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange];

    const cutoffTime = new Date(now.getTime() - timeRangeMs);
    filtered = filtered.filter(m => m.timestamp >= cutoffTime);

    // Sort by timestamp
    filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    setFilteredMetrics(filtered);
  }, [metrics, variantId, selectedMetricType, timeRange]);

  const getMetricTypeOptions = () => {
    const types = [...new Set(metrics.map(m => m.metricType))];
    return types.map(type => ({
      value: type,
      label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));
  };

  const getChartData = () => {
    return filteredMetrics.map(metric => ({
      x: metric.timestamp,
      y: metric.value,
      label: metric.name,
    }));
  };

  const getStats = () => {
    if (filteredMetrics.length === 0) return null;

    const values = filteredMetrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { mean, median, min, max, count: values.length };
  };

  const stats = getStats();
  const chartData = getChartData();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={selectedMetricType}
            onChange={(e) => setSelectedMetricType(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getMetricTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => {/* Handle time range change */}}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        
        <div className="text-sm text-muted">
          {filteredMetrics.length} data points
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[var(--card)] p-4 rounded-lg border border-border">
            <div className="text-sm text-muted">Mean</div>
            <div className="text-lg font-semibold text-foreground">
              {stats.mean.toFixed(2)}
            </div>
          </div>
          <div className="bg-[var(--card)] p-4 rounded-lg border border-border">
            <div className="text-sm text-muted">Median</div>
            <div className="text-lg font-semibold text-foreground">
              {stats.median.toFixed(2)}
            </div>
          </div>
          <div className="bg-[var(--card)] p-4 rounded-lg border border-border">
            <div className="text-sm text-muted">Min</div>
            <div className="text-lg font-semibold text-foreground">
              {stats.min.toFixed(2)}
            </div>
          </div>
          <div className="bg-[var(--card)] p-4 rounded-lg border border-border">
            <div className="text-sm text-muted">Max</div>
            <div className="text-lg font-semibold text-foreground">
              {stats.max.toFixed(2)}
            </div>
          </div>
          <div className="bg-[var(--card)] p-4 rounded-lg border border-border">
            <div className="text-sm text-muted">Count</div>
            <div className="text-lg font-semibold text-foreground">
              {stats.count}
            </div>
          </div>
        </div>
      )}

      {/* Simple Line Chart */}
      <div className="bg-[var(--card)] p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {selectedMetricType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Over Time
        </h3>
        
        {chartData.length > 0 ? (
          <div className="h-64">
            <SimpleLineChart data={chartData} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted">
            No data available for the selected time range
          </div>
        )}
      </div>

      {/* Distribution Chart */}
      {chartData.length > 0 && (
        <div className="bg-[var(--card)] p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Distribution
          </h3>
          <div className="h-48">
            <SimpleHistogram data={chartData.map(d => d.y)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Line Chart Component
function SimpleLineChart({ data }: { data: Array<{ x: Date; y: number; label: string }> }) {
  if (data.length === 0) return null;

  const width = 600;
  const height = 200;
  const padding = 40;

  const xMin = Math.min(...data.map(d => d.x.getTime()));
  const xMax = Math.max(...data.map(d => d.x.getTime()));
  const yMin = Math.min(...data.map(d => d.y));
  const yMax = Math.max(...data.map(d => d.y));

  const xScale = (time: number) => 
    padding + ((time - xMin) / (xMax - xMin)) * (width - 2 * padding);
  
  const yScale = (value: number) => 
    height - padding - ((value - yMin) / (yMax - yMin)) * (height - 2 * padding);

  const points = data.map(d => 
    `${xScale(d.x.getTime())},${yScale(d.y)}`
  ).join(' ');

  return (
    <svg width={width} height={height} className="w-full h-full">
      {/* Grid lines */}
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      {/* Line */}
      <polyline
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        points={points}
      />
      
      {/* Data points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xScale(d.x.getTime())}
          cy={yScale(d.y)}
          r="3"
          fill="var(--primary)"
          className="hover:r-4 transition-all cursor-pointer"
        />
      ))}
      
      {/* Axes */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="var(--foreground)"
        strokeWidth="1"
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="var(--foreground)"
        strokeWidth="1"
      />
    </svg>
  );
}

// Simple Histogram Component
function SimpleHistogram({ data }: { data: number[] }) {
  if (data.length === 0) return null;

  const width = 600;
  const height = 150;
  const padding = 40;
  const bins = 10;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;

  // Create bins
  const histogram = Array(bins).fill(0);
  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[binIndex]++;
  });

  const maxCount = Math.max(...histogram);

  return (
    <svg width={width} height={height} className="w-full h-full">
      {/* Grid lines */}
      <defs>
        <pattern id="histogram-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#histogram-grid)" />
      
      {/* Bars */}
      {histogram.map((count, i) => {
        const barWidth = (width - 2 * padding) / bins;
        const barHeight = (count / maxCount) * (height - 2 * padding);
        const x = padding + i * barWidth;
        const y = height - padding - barHeight;
        
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth - 1}
            height={barHeight}
            fill="var(--primary)"
            opacity="0.7"
            className="hover:opacity-100 transition-opacity"
          />
        );
      })}
      
      {/* Axes */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="var(--foreground)"
        strokeWidth="1"
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="var(--foreground)"
        strokeWidth="1"
      />
    </svg>
  );
}
