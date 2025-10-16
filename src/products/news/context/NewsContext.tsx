"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { 
  NewsArticle, 
  NewsOverview, 
  NewsViewState, 
  NewsContextType, 
  NewsFilters,
  NewsListResponse 
} from '../types';

// Action types
type NewsAction =
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SET_ARTICLES'; payload: NewsArticle[] }
  | { type: 'SET_OVERVIEW'; payload: NewsOverview }
  | { type: 'SET_ACTIVE_TAB'; payload: 'overview' | 'top3' | 'all' }
  | { type: 'SELECT_ARTICLE'; payload: NewsArticle }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'UPDATE_FILTERS'; payload: Partial<NewsFilters> }
  | { type: 'UPDATE_ARTICLE'; payload: { id: string; updates: Partial<NewsArticle> } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_REFRESHING'; payload: boolean };

// Initial state
const initialState: NewsViewState = {
  activeTab: 'overview',
  filters: {
    category: 'all',
    unreadOnly: false,
    sortBy: 'relevance',
    search: ''
  },
  isLoading: false
};

// Reducer
function newsReducer(state: NewsViewState, action: NewsAction): NewsViewState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload.isLoading };
    
    case 'SET_ARTICLES':
      return { ...state, isLoading: false };
    
    case 'SET_OVERVIEW':
      return { ...state, isLoading: false };
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    
    case 'SELECT_ARTICLE':
      return { ...state, selectedArticle: action.payload };
    
    case 'CLEAR_SELECTION':
      return { ...state, selectedArticle: undefined };
    
    case 'UPDATE_FILTERS':
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload }
      };
    
    case 'UPDATE_ARTICLE':
      return { ...state };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: undefined };
    
    case 'SET_REFRESHING':
      return { ...state };
    
    default:
      return state;
  }
}

// Context
const NewsContext = createContext<NewsContextType | undefined>(undefined);

// Provider
export function NewsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUnifiedAuth();
  const [state, dispatch] = useReducer(newsReducer, initialState);
  const [articles, setArticles] = React.useState<NewsArticle[]>([]);
  const [overview, setOverview] = React.useState<NewsOverview | null>(null);
  const [isLoadingArticles, setIsLoadingArticles] = React.useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Fetch articles
  const fetchArticles = useCallback(async (filters: NewsFilters = state.filters) => {
    if (!user?.activeWorkspaceId) return;

    setIsLoadingArticles(true);
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true } });

    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.unreadOnly) params.append('unreadOnly', 'true');
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/v1/news?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data.articles);
        dispatch({ type: 'SET_ARTICLES', payload: data.data.articles });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to fetch articles' });
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch articles' });
    } finally {
      setIsLoadingArticles(false);
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    }
  }, [user?.activeWorkspaceId, state.filters]);

  // Fetch overview
  const fetchOverview = useCallback(async () => {
    if (!user?.activeWorkspaceId) return;

    setIsLoadingOverview(true);

    try {
      const response = await fetch('/api/v1/news/overview');
      const data = await response.json();

      if (data.success) {
        setOverview(data.data);
        dispatch({ type: 'SET_OVERVIEW', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to fetch overview' });
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch overview' });
    } finally {
      setIsLoadingOverview(false);
    }
  }, [user?.activeWorkspaceId]);

  // Refresh news
  const refreshNews = useCallback(async () => {
    if (!user?.activeWorkspaceId) return;

    setIsRefreshing(true);
    dispatch({ type: 'SET_REFRESHING', payload: true });

    try {
      const response = await fetch('/api/v1/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh both articles and overview
        await Promise.all([
          fetchArticles(),
          fetchOverview()
        ]);
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to refresh news' });
      }
    } catch (error) {
      console.error('Error refreshing news:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh news' });
    } finally {
      setIsRefreshing(false);
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [user?.activeWorkspaceId, fetchArticles, fetchOverview]);

  // Mark article as read/unread
  const markAsRead = useCallback(async (articleId: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/v1/news/${articleId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setArticles(prev => prev.map(article => 
          article.id === articleId ? { ...article, isRead } : article
        ));
        
        // Update overview if it exists
        if (overview) {
          setOverview(prev => prev ? {
            ...prev,
            topArticles: prev.topArticles.map(article =>
              article.id === articleId ? { ...article, isRead } : article
            )
          } : null);
        }

        dispatch({ type: 'UPDATE_ARTICLE', payload: { id: articleId, updates: { isRead } } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to update article' });
      }
    } catch (error) {
      console.error('Error updating article:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update article' });
    }
  }, [overview]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (articleId: string, isFavorite: boolean) => {
    try {
      const response = await fetch(`/api/v1/news/${articleId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setArticles(prev => prev.map(article => 
          article.id === articleId ? { ...article, isFavorite } : article
        ));
        
        // Update overview if it exists
        if (overview) {
          setOverview(prev => prev ? {
            ...prev,
            topArticles: prev.topArticles.map(article =>
              article.id === articleId ? { ...article, isFavorite } : article
            )
          } : null);
        }

        dispatch({ type: 'UPDATE_ARTICLE', payload: { id: articleId, updates: { isFavorite } } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to update article' });
      }
    } catch (error) {
      console.error('Error updating article:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update article' });
    }
  }, [overview]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setArticles(prev => prev.map(article => ({ ...article, isRead: true })));
        
        // Update overview if it exists
        if (overview) {
          setOverview(prev => prev ? {
            ...prev,
            topArticles: prev.topArticles.map(article => ({ ...article, isRead: true }))
          } : null);
        }

        // Refresh to get updated stats
        await fetchArticles();
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to mark all as read' });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to mark all as read' });
    }
  }, [overview, fetchArticles]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<NewsFilters>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: newFilters });
    fetchArticles({ ...state.filters, ...newFilters });
  }, [state.filters, fetchArticles]);

  // Set active tab
  const setActiveTab = useCallback((tab: 'overview' | 'top3' | 'all') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  // Select article
  const selectArticle = useCallback((article: NewsArticle) => {
    dispatch({ type: 'SELECT_ARTICLE', payload: article });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  // Load initial data
  useEffect(() => {
    if (user?.activeWorkspaceId) {
      fetchOverview();
      fetchArticles();
    }
  }, [user?.activeWorkspaceId, fetchOverview, fetchArticles]);

  const contextValue: NewsContextType = {
    // State
    articles,
    overview,
    viewState: state,
    
    // Actions
    setActiveTab,
    selectArticle,
    clearSelection,
    updateFilters,
    refreshNews,
    markAsRead,
    toggleFavorite,
    markAllAsRead,
    
    // Loading states
    isLoadingArticles,
    isLoadingOverview,
    isRefreshing
  };

  return (
    <NewsContext.Provider value={contextValue}>
      {children}
    </NewsContext.Provider>
  );
}

// Hook
export function useNews(): NewsContextType {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}
