"use client";

import React from 'react';
import { useNews } from '../hooks/useNews';
import { NewsOverview } from './NewsOverview';
import { NewsArticleList } from './NewsArticleList';
import { NewsArticleDetail } from './NewsArticleDetail';

export function NewsMiddlePanel() {
  const { 
    viewState, 
    articles, 
    overview, 
    isLoadingArticles,
    selectArticle,
    clearSelection 
  } = useNews();

  const handleArticleClick = (article: any) => {
    selectArticle(article);
  };

  const handleBack = () => {
    clearSelection();
  };

  // Show article detail if one is selected
  if (viewState.selectedArticle) {
    return (
      <NewsArticleDetail 
        article={viewState.selectedArticle} 
        onBack={handleBack}
      />
    );
  }

  // Show different content based on active tab
  switch (viewState.activeTab) {
    case 'overview':
      return (
        <div className="flex-1 overflow-y-auto p-6">
          <NewsOverview onArticleClick={handleArticleClick} />
        </div>
      );

    case 'top3':
      return (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Top 3 Articles</h2>
            <p className="text-muted">Most relevant articles for your workspace</p>
          </div>
          
          {overview?.topArticles ? (
            <NewsArticleList 
              articles={overview.topArticles}
              onArticleClick={handleArticleClick}
              showActions={true}
            />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 text-muted">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Top Articles</h3>
              <p className="text-muted">No top articles available yet</p>
            </div>
          )}
        </div>
      );

    case 'all':
      return (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">All Articles</h2>
            <p className="text-muted">
              {viewState.filters.category !== 'all' && `Filtered by ${viewState.filters.category.toLowerCase()}`}
              {viewState.filters.unreadOnly && ' • Unread only'}
            </p>
          </div>
          
          <NewsArticleList 
            articles={articles}
            onArticleClick={handleArticleClick}
            isLoading={isLoadingArticles}
            showActions={true}
            emptyMessage={
              viewState.filters.category !== 'all' || viewState.filters.unreadOnly
                ? "No articles match your current filters"
                : "No articles found. Try refreshing the news."
            }
          />
        </div>
      );

    default:
      return (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">Invalid Tab</h3>
            <p className="text-muted">Please select a valid news tab</p>
          </div>
        </div>
      );
  }
}
