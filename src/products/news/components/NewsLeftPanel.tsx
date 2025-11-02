"use client";

import React from 'react';
import { useNews } from '../hooks/useNews';
import { NEWS_CATEGORIES } from '../types';

interface NewsLeftPanelProps {
  onTabChange?: (tab: 'overview' | 'top3' | 'all') => void;
}

export function NewsLeftPanel({ onTabChange }: NewsLeftPanelProps) {
  const { 
    viewState, 
    setActiveTab, 
    updateFilters, 
    markAllAsRead,
    isRefreshing,
    refreshNews 
  } = useNews();

  const handleTabClick = (tab: 'overview' | 'top3' | 'all') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleCategoryFilter = (category: string) => {
    updateFilters({ category });
  };

  const handleSortChange = (sortBy: 'relevance' | 'date' | 'unread') => {
    updateFilters({ sortBy });
  };

  const handleUnreadToggle = () => {
    updateFilters({ unreadOnly: !viewState.filters.unreadOnly });
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = async () => {
    await refreshNews();
  };

  return (
    <div className="w-64 bg-background border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-2">News</h2>
        <p className="text-sm text-muted">Stay informed</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="space-y-1">
          <button
            onClick={() => handleTabClick('overview')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              viewState.activeTab === 'overview'
                ? 'bg-hover text-foreground'
                : 'text-muted hover:bg-panel-background'
            }`}
          >
            <div className="font-medium text-sm">Overview</div>
            <div className="text-xs">90-second summary</div>
          </button>
          
          <button
            onClick={() => handleTabClick('top3')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              viewState.activeTab === 'top3'
                ? 'bg-hover text-foreground'
                : 'text-muted hover:bg-panel-background'
            }`}
          >
            <div className="font-medium text-sm">Top 3 Articles</div>
            <div className="text-xs">Most relevant</div>
          </button>
          
          <button
            onClick={() => handleTabClick('all')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              viewState.activeTab === 'all'
                ? 'bg-hover text-foreground'
                : 'text-muted hover:bg-panel-background'
            }`}
          >
            <div className="font-medium text-sm">All Articles</div>
            <div className="text-xs">Complete list</div>
          </button>
        </div>
      </div>

      {/* Filters - Only show for 'all' tab */}
      {viewState.activeTab === 'all' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Category Filter */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Category</h3>
            <div className="space-y-1">
              <button
                onClick={() => handleCategoryFilter('all')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  viewState.filters.category === 'all'
                    ? 'bg-hover text-foreground'
                    : 'text-muted hover:bg-panel-background'
                }`}
              >
                All Categories
              </button>
              {NEWS_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryFilter(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                    viewState.filters.category === category.id
                      ? 'bg-hover text-foreground'
                      : 'text-muted hover:bg-panel-background'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${category.bgColor}`}></span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Sort By</h3>
            <div className="space-y-1">
              {[
                { value: 'relevance', label: 'Relevance' },
                { value: 'date', label: 'Date' },
                { value: 'unread', label: 'Unread First' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value as any)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    viewState.filters.sortBy === option.value
                      ? 'bg-hover text-foreground'
                      : 'text-muted hover:bg-panel-background'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Quick Filters</h3>
            <div className="space-y-1">
              <button
                onClick={handleUnreadToggle}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                  viewState.filters.unreadOnly
                    ? 'bg-hover text-foreground'
                    : 'text-muted hover:bg-panel-background'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Unread Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex-shrink-0 p-4 border-t border-border space-y-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh News'}
        </button>
        
        <button
          onClick={handleMarkAllRead}
          className="w-full px-3 py-2 bg-hover text-foreground rounded-lg hover:bg-panel-background transition-colors text-sm font-medium"
        >
          Mark All Read
        </button>
      </div>
    </div>
  );
}
