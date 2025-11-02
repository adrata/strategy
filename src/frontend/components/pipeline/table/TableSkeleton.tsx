/**
 * Table skeleton loading component for pipeline tables.
 * Provides a beautiful loading state that matches the table structure.
 */

import React from 'react';

interface TableSkeletonProps {
  section: string;
  visibleColumns?: string[];
  rowCount?: number;
}

export function TableSkeleton({ 
  section, 
  visibleColumns, 
  rowCount = 8 
}: TableSkeletonProps) {
  // Default headers if visibleColumns not provided - use proper spacing
  const defaultHeaders = ['Rank', 'Company', 'Person', 'State', 'Title', 'Last Action', 'Next Action'];
  const headers = visibleColumns || defaultHeaders;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header Skeleton */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-loading-bg rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-loading-bg rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-8 bg-loading-bg rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-loading-bg rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Filters Skeleton */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="h-8 bg-loading-bg rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-loading-bg rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-loading-bg rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-loading-bg rounded w-24 animate-pulse"></div>
        </div>
      </div>
      
      {/* Table Skeleton - Full Width */}
      <div className="flex-1 p-6">
        <div className="bg-background rounded-lg border border-border">
          {/* Table Header Skeleton */}
          <div className="flex-shrink-0 border-b border-border">
            <div className="px-6 py-3">
              <div className="flex items-center justify-between w-full">
                {headers.map((header, index) => (
                  <div key={header} className="flex items-center">
                    <div className="h-4 bg-loading-bg rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table Body Skeleton */}
          <div className="flex-1 overflow-hidden">
            <div className="px-6 py-4 space-y-3">
              {Array.from({ length: rowCount }).map((_, i) => (
                <div key={i} className="flex items-center justify-between w-full py-3 border-b border-gray-100 last:border-b-0">
                  {/* Rank */}
                  <div className="h-4 bg-loading-bg rounded w-8 animate-pulse"></div>
                  
                  {/* Company */}
                  <div className="h-4 bg-loading-bg rounded w-32 animate-pulse"></div>
                  
                  {/* Person */}
                  <div className="h-4 bg-loading-bg rounded w-28 animate-pulse"></div>
                  
                  {/* State */}
                  <div className="h-4 bg-loading-bg rounded w-20 animate-pulse"></div>
                  
                  {/* Title */}
                  <div className="h-4 bg-loading-bg rounded w-24 animate-pulse"></div>
                  
                  {/* Last Action */}
                  <div className="h-6 bg-loading-bg rounded w-20 animate-pulse"></div>
                  
                  {/* Next Action */}
                  <div className="h-6 bg-loading-bg rounded w-24 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex-shrink-0 border-t border-border px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-loading-bg rounded w-32 animate-pulse"></div>
              <div className="flex items-center space-x-2">
                <div className="h-8 bg-loading-bg rounded w-8 animate-pulse"></div>
                <div className="h-8 bg-loading-bg rounded w-8 animate-pulse"></div>
                <div className="h-8 bg-loading-bg rounded w-8 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
