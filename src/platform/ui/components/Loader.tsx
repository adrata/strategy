"use client";

/**
 * 🚀 SINGLE LOADING COMPONENT - 2025 SIMPLIFIED
 * 
 * One beautiful loading component for all use cases
 * Clean, consistent, and performant
 */

import React from 'react';

export interface LoaderProps {
  /** Loading message to display */
  message?: string;
  /** Size of the loader */
  size?: 'sm' | 'md' | 'lg';
  /** Full screen overlay */
  fullScreen?: boolean;
  /** Custom className */
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  message = "Loading...",
  size = 'md',
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerClasses = fullScreen 
    ? `fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center ${className}`
    : `flex flex-col items-center justify-center p-8 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Beautiful spinning loader */}
      <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4`} />
      
      {/* Loading message */}
      <p className={`text-gray-600 ${textSizeClasses[size]} animate-pulse`}>
        {message}
      </p>
    </div>
  );
};

// Skeleton loader for content areas
export interface SkeletonProps {
  /** Number of skeleton lines */
  lines?: number;
  /** Custom className */
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  lines = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{
            width: i === lines - 1 ? '60%' : '100%'
          }}
        />
      ))}
    </div>
  );
};

// Simple panel loader for smaller contexts
export const PanelLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  </div>
);

// Pipeline skeleton (the beautiful one users love) - for full page loading
export const PipelineSkeleton: React.FC<{ message?: string }> = ({ message }) => (
  <div className="h-full flex flex-col bg-white">
    {/* Header */}
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="text-center">
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
    
    {/* Filters */}
    <div className="flex-shrink-0 px-6 pt-2 pb-1">
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-4">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
    
    {/* Table */}
    <div className="flex-1 px-6 pb-6 min-h-0">
      <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
    
  </div>
);

export default Loader;
