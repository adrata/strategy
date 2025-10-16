"use client";

import React from 'react';
import { NewsArticle } from '../types';
import { NewsArticleCard } from './NewsArticleCard';

interface NewsArticleListProps {
  articles: NewsArticle[];
  onArticleClick?: (article: NewsArticle) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
}

export function NewsArticleList({ 
  articles, 
  onArticleClick, 
  isLoading = false,
  emptyMessage = "No articles found",
  showActions = true 
}: NewsArticleListProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-6 bg-[var(--loading-bg)] rounded w-3/4 mb-2"></div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 bg-[var(--loading-bg)] rounded w-16"></div>
                  <div className="h-4 bg-[var(--loading-bg)] rounded w-24"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-[var(--loading-bg)] rounded"></div>
                <div className="h-8 w-8 bg-[var(--loading-bg)] rounded"></div>
              </div>
            </div>
            <div className="h-4 bg-[var(--loading-bg)] rounded w-full mb-2"></div>
            <div className="h-4 bg-[var(--loading-bg)] rounded w-2/3 mb-4"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-4 bg-[var(--loading-bg)] rounded w-16"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-20"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-12"></div>
              </div>
              <div className="h-4 bg-[var(--loading-bg)] rounded w-8"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 text-[var(--muted)]">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Articles Found</h3>
        <p className="text-[var(--muted)] mb-4">{emptyMessage}</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Refresh News
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {articles.map((article) => (
        <NewsArticleCard
          key={article.id}
          article={article}
          onClick={onArticleClick}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
