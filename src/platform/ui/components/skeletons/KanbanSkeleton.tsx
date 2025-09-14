"use client";

import React from 'react';

export function KanbanSkeleton() {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header Skeleton */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-28 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-28 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* Kanban Board Skeleton */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        <div className="flex space-x-6 h-full">
          {/* Stage Columns */}
          {['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'].map((stage, stageIndex) => (
            <div key={stage} className="flex-1 min-w-0">
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-5 bg-gray-200 rounded w-4 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-6 animate-pulse"></div>
              </div>

              {/* Stage Cards */}
              <div className="space-y-3">
                {[...Array(stageIndex === 0 ? 4 : stageIndex === 1 ? 3 : stageIndex === 2 ? 2 : stageIndex === 3 ? 1 : 0)].map((_, cardIndex) => (
                  <div key={cardIndex} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>

                    {/* Card Content */}
                    <div className="space-y-2 mb-3">
                      <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
