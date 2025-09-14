"use client";

import React from 'react';

export function FullPanelSkeleton() {
  return (
    <div className="h-screen flex bg-white">
      {/* Left Panel Skeleton */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Left Panel Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        
        {/* Left Panel Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Metrics Section */}
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation Sections */}
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Left Panel Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Panel Skeleton */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Middle Panel Header */}
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
          
          {/* Metrics Row */}
          <div className="flex gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-5 bg-gray-200 rounded w-12 mx-auto mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Panel Content */}
        <div className="flex-1 p-6 space-y-4">
          {/* Content Header */}
          <div className="mb-6">
            <div className="h-6 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>

          {/* Content Cards */}
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

      {/* Right Panel Skeleton */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Right Panel Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        
        {/* Right Panel Content */}
        <div className="flex-1 p-4 space-y-4">
          <div className="text-center py-8">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
          </div>
          
          {/* Quick Actions */}
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* Right Panel Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
