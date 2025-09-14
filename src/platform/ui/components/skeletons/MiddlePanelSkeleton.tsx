"use client";

import React from 'react';

export function MiddlePanelSkeleton() {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Middle Panel Header Skeleton */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Metrics Row Skeleton */}
        <div className="flex gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-5 bg-gray-200 rounded w-12 mx-auto mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Panel Content Skeleton */}
      <div className="flex-1 p-6 space-y-4">
        {/* Tabs Skeleton */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          ))}
        </div>

        {/* Content Cards Skeleton */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
