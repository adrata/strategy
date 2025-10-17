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
    ? `fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center ${className}`
    : `flex flex-col items-center justify-center p-8 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Beautiful spinning loader */}
      <div className={`${sizeClasses[size]} border-2 border-[var(--border)] border-t-blue-500 rounded-full animate-spin mb-4`} />
      
      {/* Loading message */}
      <p className={`text-[var(--muted)] ${textSizeClasses[size]} animate-pulse`}>
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
          className="h-4 bg-[var(--loading-bg)] rounded animate-pulse"
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
      <div className="h-8 w-8 bg-[var(--loading-bg)] rounded animate-pulse mx-auto mb-2"></div>
      {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
    </div>
  </div>
);

// Pipeline skeleton (the beautiful one users love) - for full page loading
export const PipelineSkeleton: React.FC<{ message?: string }> = ({ message }) => (
  <div className="h-full flex flex-col bg-[var(--background)]">
    {/* Header */}
    <div className="bg-[var(--background)] border-b border-[var(--border)] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <div className="h-8 w-32 bg-[var(--loading-bg)] rounded animate-pulse mb-2"></div>
            <div className="h-4 w-24 bg-[var(--loading-bg)] rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="h-6 w-16 bg-[var(--loading-bg)] rounded animate-pulse mb-1"></div>
              <div className="h-3 w-12 bg-[var(--loading-bg)] rounded animate-pulse"></div>
            </div>
            <div className="text-center">
              <div className="h-6 w-12 bg-[var(--loading-bg)] rounded animate-pulse mb-1"></div>
              <div className="h-3 w-8 bg-[var(--loading-bg)] rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="h-10 w-24 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      </div>
    </div>
    
    {/* Filters */}
    <div className="flex-shrink-0 px-6 pt-2 pb-1">
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-4">
          <div className="h-10 w-64 bg-[var(--loading-bg)] rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-[var(--loading-bg)] rounded animate-pulse"></div>
        </div>
        <div className="h-8 w-32 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      </div>
    </div>
    
    {/* Table */}
    <div className="flex-1 px-6 pb-6 min-h-0">
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] h-full flex flex-col">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-[var(--loading-bg)] rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-4 bg-[var(--loading-bg)] rounded animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
    
  </div>
);

// Company detail page skeleton - for full page loading
export const CompanyDetailSkeleton: React.FC<{ message?: string }> = ({ message }) => (
  <div className="h-full flex flex-col bg-[var(--background)]">
    {/* Header */}
    <div className="bg-[var(--background)] border-b border-[var(--border)] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-[var(--loading-bg)] rounded-full animate-pulse"></div>
          <div>
            <div className="h-8 w-48 bg-[var(--loading-bg)] rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-[var(--loading-bg)] rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-10 w-24 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      </div>
    </div>
    
    {/* Tabs */}
    <div className="flex-shrink-0 px-6 pt-2 pb-1">
      <div className="flex items-center gap-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-20 bg-[var(--loading-bg)] rounded animate-pulse"></div>
        ))}
      </div>
    </div>
    
    {/* Content */}
    <div className="flex-1 px-6 py-6 min-h-0">
      <div className="space-y-8">
        {/* Summary Section */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-[var(--loading-bg)] rounded animate-pulse"></div>
          <Skeleton lines={5} className="py-2" />
        </div>
        
        {/* Information Section */}
        <div className="space-y-4">
          <div className="h-6 w-40 bg-[var(--loading-bg)] rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <Skeleton lines={6} className="py-2" />
            </div>
            {/* Right Column */}
            <div className="space-y-4">
              <Skeleton lines={5} className="py-2" />
            </div>
          </div>
        </div>
        
        {/* Additional Section */}
        <div className="space-y-4">
          <div className="h-6 w-36 bg-[var(--loading-bg)] rounded animate-pulse"></div>
          <Skeleton lines={4} className="py-2" />
        </div>
      </div>
    </div>
  </div>
);

export default Loader;
