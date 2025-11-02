"use client";

import React from "react";

interface DatabaseStatsProps {
  stats: any;
  loading: boolean;
}

export function DatabaseStats({ stats, loading }: DatabaseStatsProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-4 bg-loading-bg rounded animate-pulse"></div>
        <div className="w-12 h-4 bg-loading-bg rounded animate-pulse"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 text-sm text-muted">
      <div className="flex items-center gap-1">
        <span className="text-muted">Tables:</span>
        <span className="font-medium">{stats.totalTables}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-muted">Records:</span>
        <span className="font-medium">{stats.totalRecords.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-muted">Size:</span>
        <span className="font-medium">{stats.storageSize}</span>
      </div>
    </div>
  );
}
