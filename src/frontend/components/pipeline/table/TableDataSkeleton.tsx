import React from 'react';

interface TableDataSkeletonProps {
  rowCount?: number;
  visibleColumns?: string[];
}

/**
 * 🚀 TABLE DATA SKELETON - Only shows skeleton for table rows
 * Keeps header and filters visible while showing skeleton for data
 */
export function TableDataSkeleton({ 
  rowCount = 8,
  visibleColumns
}: TableDataSkeletonProps) {
  // Default headers if visibleColumns not provided
  const defaultHeaders = ['Rank', 'Company', 'Person', 'State', 'Title', 'Last Action', 'Next Action'];
  const headers = visibleColumns || defaultHeaders;

  return (
    <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Table Header - Keep Real Header Visible */}
      <div className="flex-shrink-0 border-b border-[var(--border)]">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between w-full">
            {headers.map((header, index) => (
              <div key={header} className="flex items-center">
                <div className="h-4 text-sm font-medium text-gray-700">{header}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Body Skeleton - Only skeleton for data rows */}
      <div className="flex-1 overflow-hidden">
        <div className="px-6 py-4 space-y-3">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="flex items-center justify-between w-full py-3 border-b border-gray-100 last:border-b-0">
              {/* Rank */}
              <div className="h-4 bg-[var(--loading-bg)] rounded w-8 animate-pulse"></div>
              
              {/* Company */}
              <div className="h-4 bg-[var(--loading-bg)] rounded w-32 animate-pulse"></div>
              
              {/* Person */}
              <div className="h-4 bg-[var(--loading-bg)] rounded w-28 animate-pulse"></div>
              
              {/* State */}
              <div className="h-4 bg-[var(--loading-bg)] rounded w-20 animate-pulse"></div>
              
              {/* Title */}
              <div className="h-4 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
              
              {/* Last Action */}
              <div className="h-6 bg-[var(--loading-bg)] rounded w-20 animate-pulse"></div>
              
              {/* Next Action */}
              <div className="h-6 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-[var(--loading-bg)] rounded w-32 animate-pulse"></div>
          <div className="flex items-center space-x-2">
            <div className="h-8 bg-[var(--loading-bg)] rounded w-8 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-8 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-8 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-8 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
