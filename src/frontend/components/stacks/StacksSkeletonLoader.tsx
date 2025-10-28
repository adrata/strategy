"use client";

import React from 'react';

export function StacksSkeletonLoader() {
  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header Skeleton */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        
        {/* Search and Filters Skeleton */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {/* Table Header Skeleton */}
          <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-[var(--border)] p-4">
              <div className="grid grid-cols-8 gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Table Rows Skeleton */}
            <div className="divide-y divide-[var(--border)]">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="p-4">
                  <div className="grid grid-cols-8 gap-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
