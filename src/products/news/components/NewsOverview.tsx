"use client";

import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { useNews } from '../hooks/useNews';
import { useVoiceControls } from '@/platform/hooks/useVoiceControls';
import { NewsArticleCard } from './NewsArticleCard';

interface NewsOverviewProps {
  onArticleClick?: (article: NewsArticle) => void;
}

export function NewsOverview({ onArticleClick }: NewsOverviewProps) {
  const { overview, isLoadingOverview, refreshNews, isRefreshing } = useNews();
  const { speak, isVoiceActive } = useVoiceControls();
  const [isReadingSummary, setIsReadingSummary] = useState(false);

  const handleReadSummary = async () => {
    if (!overview?.summary || isReadingSummary) return;
    
    setIsReadingSummary(true);
    try {
      await speak(overview.summary.text);
    } catch (error) {
      console.error('Error reading summary:', error);
    } finally {
      setIsReadingSummary(false);
    }
  };

  const handleRefresh = async () => {
    await refreshNews();
  };

  if (isLoadingOverview) {
    return (
      <div className="space-y-6">
        {/* Summary Loading */}
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="h-6 bg-loading-bg rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-loading-bg rounded w-full"></div>
            <div className="h-4 bg-loading-bg rounded w-5/6"></div>
            <div className="h-4 bg-loading-bg rounded w-4/6"></div>
          </div>
        </div>
        
        {/* Top Articles Loading */}
        <div className="space-y-4">
          <div className="h-6 bg-loading-bg rounded w-1/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-background border border-border rounded-lg p-4 animate-pulse">
              <div className="h-5 bg-loading-bg rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-loading-bg rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 text-muted">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No News Available</h3>
        <p className="text-muted mb-4">Unable to load news overview</p>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh News'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">News Summary</h2>
          <div className="flex items-center gap-2">
            {isVoiceActive && (
              <button
                onClick={handleReadSummary}
                disabled={isReadingSummary}
                className="p-2 rounded-lg text-muted hover:text-blue-500 transition-colors disabled:opacity-50"
                title="Read summary aloud"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M6.343 6.343a1 1 0 000 1.414L8.172 9.586a1 1 0 01-1.414 1.414L4.93 8.757a1 1 0 010-1.414z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg text-muted hover:text-blue-500 transition-colors disabled:opacity-50"
              title="Refresh news"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        
        <p className="text-foreground leading-relaxed mb-4">
          {overview.summary.text}
        </p>
        
        {overview.summary.keyInsights.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted mb-2">Key Insights</h3>
            <ul className="space-y-1">
              {overview.summary.keyInsights.map((insight, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted">
          Generated {new Date(overview.summary.generatedAt).toLocaleString()}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{overview.stats.total}</div>
          <div className="text-sm text-muted">Total Articles</div>
        </div>
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{overview.stats.unread}</div>
          <div className="text-sm text-muted">Unread</div>
        </div>
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{overview.stats.today}</div>
          <div className="text-sm text-muted">Today</div>
        </div>
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{overview.stats.thisWeek}</div>
          <div className="text-sm text-muted">This Week</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">By Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{overview.stats.categories.INDUSTRY}</div>
            <div className="text-sm text-muted">Industry</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{overview.stats.categories.COMPANY}</div>
            <div className="text-sm text-muted">Company</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{overview.stats.categories.PERSON}</div>
            <div className="text-sm text-muted">Person</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{overview.stats.categories.GENERAL}</div>
            <div className="text-sm text-muted">General</div>
          </div>
        </div>
      </div>

      {/* Top Articles */}
      {overview.topArticles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Articles</h3>
          <div className="space-y-4">
            {overview.topArticles.map((article) => (
              <NewsArticleCard
                key={article.id}
                article={article}
                onClick={onArticleClick}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
