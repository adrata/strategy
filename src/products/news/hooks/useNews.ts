"use client";

import { useNews as useNewsContext } from '../context/NewsContext';
import { NewsArticle, NewsFilters } from '../types';

export function useNews() {
  return useNewsContext();
}

export function useNewsArticle(articleId: string) {
  const { articles } = useNews();
  return articles.find(article => article.id === articleId);
}

export function useNewsFilters() {
  const { viewState, updateFilters } = useNews();
  return {
    filters: viewState.filters,
    updateFilters
  };
}

export function useNewsStats() {
  const { overview } = useNews();
  return overview?.stats || {
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0,
    categories: {
      INDUSTRY: 0,
      COMPANY: 0,
      PERSON: 0,
      GENERAL: 0
    }
  };
}

export function useNewsOverview() {
  const { overview, isLoadingOverview } = useNews();
  return {
    overview,
    isLoading: isLoadingOverview
  };
}

export function useNewsActions() {
  const { 
    refreshNews, 
    markAsRead, 
    toggleFavorite, 
    markAllAsRead,
    isRefreshing 
  } = useNews();

  return {
    refreshNews,
    markAsRead,
    toggleFavorite,
    markAllAsRead,
    isRefreshing
  };
}
