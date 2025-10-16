export interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  author?: string;
  category: 'INDUSTRY' | 'COMPANY' | 'PERSON' | 'GENERAL';
  relevanceScore: number;
  relatedCompany?: {
    id: string;
    name: string;
    industry?: string;
  };
  relatedPerson?: {
    id: string;
    fullName: string;
    jobTitle?: string;
    company?: {
      name: string;
      industry?: string;
    };
  };
  industries: string[];
  tags: string[];
  isRead: boolean;
  isFavorite: boolean;
  createdAt: string;
}

export interface NewsSummary {
  text: string;
  keyInsights: string[];
  generatedAt: string;
  expiresAt: string;
}

export interface NewsStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
  categories: {
    INDUSTRY: number;
    COMPANY: number;
    PERSON: number;
    GENERAL: number;
  };
}

export interface NewsOverview {
  summary: NewsSummary;
  topArticles: NewsArticle[];
  stats: NewsStats;
}

export interface NewsFilters {
  category?: string;
  unreadOnly?: boolean;
  sortBy?: 'relevance' | 'date' | 'unread';
  search?: string;
}

export interface NewsPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface NewsListResponse {
  articles: NewsArticle[];
  pagination: NewsPagination;
  stats: NewsStats;
}

export interface NewsDetailResponse {
  article: NewsArticle;
  relatedArticles: NewsArticle[];
}

export type NewsCategory = 'INDUSTRY' | 'COMPANY' | 'PERSON' | 'GENERAL';

export interface NewsCategoryConfig {
  id: NewsCategory;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const NEWS_CATEGORIES: NewsCategoryConfig[] = [
  {
    id: 'INDUSTRY',
    label: 'Industry',
    description: 'Industry news and trends',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  },
  {
    id: 'COMPANY',
    label: 'Company',
    description: 'Company-specific news',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  {
    id: 'PERSON',
    label: 'Person',
    description: 'Person-specific news',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  {
    id: 'GENERAL',
    label: 'General',
    description: 'General business news',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  }
];

export interface NewsViewState {
  activeTab: 'overview' | 'top3' | 'all';
  selectedArticle?: NewsArticle;
  filters: NewsFilters;
  isLoading: boolean;
  error?: string;
}

export interface NewsContextType {
  // State
  articles: NewsArticle[];
  overview: NewsOverview | null;
  viewState: NewsViewState;
  
  // Actions
  setActiveTab: (tab: 'overview' | 'top3' | 'all') => void;
  selectArticle: (article: NewsArticle) => void;
  clearSelection: () => void;
  updateFilters: (filters: Partial<NewsFilters>) => void;
  refreshNews: () => Promise<void>;
  markAsRead: (articleId: string, isRead: boolean) => Promise<void>;
  toggleFavorite: (articleId: string, isFavorite: boolean) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // Loading states
  isLoadingArticles: boolean;
  isLoadingOverview: boolean;
  isRefreshing: boolean;
}
