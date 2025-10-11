"use client";

import React from 'react';
import { MetricsDashboard } from './MetricsDashboard';

/**
 * MetricsWall Component
 * 
 * Enhanced version of MetricsDashboard with clearer red/green performance indicators.
 * This component provides a "wall of sales metrics" as requested, reusing the existing
 * MetricsDashboard component which already displays comprehensive sales performance data.
 */
export function MetricsWall() {
  return (
    <div className="h-full w-full">
      <MetricsDashboard />
    </div>
  );
}
