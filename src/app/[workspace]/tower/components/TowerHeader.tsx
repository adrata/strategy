/**
 * TowerHeader Component
 * 
 * Header component for Tower monitoring dashboard with refresh controls and status
 */

"use client";

import React from 'react';

interface TowerHeaderProps {
  lastUpdated: string;
  isRefreshing: boolean;
  autoRefresh: boolean;
  onRefresh: () => void;
  onToggleAutoRefresh: () => void;
}

export function TowerHeader({ 
  lastUpdated, 
  isRefreshing, 
  autoRefresh, 
  onRefresh, 
  onToggleAutoRefresh 
}: TowerHeaderProps) {
  const formatLastUpdated = (timestamp: string) => {
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now.getTime() - updated.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m ago`;
    } else {
      return updated.toLocaleTimeString();
    }
  };

  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-white">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">T</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Tower</h1>
              <p className="text-xs text-gray-600">System Monitoring & Analytics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Last updated timestamp */}
            <div className="text-sm text-gray-500">
              Last updated: {formatLastUpdated(lastUpdated)}
            </div>
            
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={onToggleAutoRefresh}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                Auto-refresh
              </label>
            </div>
            
            {/* Refresh button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2
                ${isRefreshing 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }
              `}
            >
              {isRefreshing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
