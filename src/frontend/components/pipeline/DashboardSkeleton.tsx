"use client";

import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Main Content Skeleton */}
      <div className="flex-1 p-6 space-y-8">
        {/* Weekly Activity Section Skeleton */}
        <div>
          <div className="h-6 bg-loading-bg rounded w-32 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-background p-6 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-loading-bg rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-loading-bg rounded w-12 animate-pulse"></div>
                </div>
                <div className="h-8 bg-loading-bg rounded w-16 mb-1 animate-pulse"></div>
                <div className="h-3 bg-loading-bg rounded w-24 mb-3 animate-pulse"></div>
                <div className="w-full bg-loading-bg rounded-full h-1.5 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Performance Section Skeleton */}
        <div>
          <div className="h-6 bg-loading-bg rounded w-40 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-background p-6 rounded-lg border border-border">
                <div className="h-4 bg-loading-bg rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-6 bg-loading-bg rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Performance Section Skeleton */}
        <div>
          <div className="h-6 bg-loading-bg rounded w-36 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-background p-6 rounded-lg border border-border">
                <div className="h-4 bg-loading-bg rounded w-28 mb-2 animate-pulse"></div>
                <div className="h-6 bg-loading-bg rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance Section Skeleton */}
        <div>
          <div className="h-6 bg-loading-bg rounded w-32 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-background p-6 rounded-lg border border-border">
                <div className="h-4 bg-loading-bg rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-6 bg-loading-bg rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
