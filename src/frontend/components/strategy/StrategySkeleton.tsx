"use client";

import React from 'react';

export function StrategySkeleton() {
  return (
    <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
      {/* Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Situation Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse shimmer"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse shimmer"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse shimmer w-3/4"></div>
          </div>
        </div>
        
        {/* Complication Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse shimmer"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse shimmer"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse shimmer w-2/3"></div>
          </div>
        </div>
        
        {/* Future State Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse shimmer"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse shimmer"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse shimmer w-4/5"></div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
