import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/platform/ui/components/Loader';

interface UniversalNewsTabProps {
  record: any;
  recordType: string;
}

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string;
  content: string;
}

export function UniversalNewsTab({ record, recordType }: UniversalNewsTabProps) {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('unknown');

  const companyName = record?.name || 'Company';

  useEffect(() => {
    if (companyName && companyName !== 'Company') {
      fetchCompanyNews();
    } else {
      setLoading(false);
    }
  }, [companyName]);

  const fetchCompanyNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, check if we have companyUpdates from CoreSignal database
      const companyUpdates = record?.companyUpdates || [];
      
      if (companyUpdates.length > 0) {
        console.log('📰 [NEWS TAB] Using companyUpdates from database:', companyUpdates.length, 'updates');
        
        // Transform companyUpdates to news article format
        const articles = companyUpdates.map((update: any, index: number) => ({
          title: update.title || update.description?.substring(0, 100) || `Company Update ${index + 1}`,
          description: update.description || update.content || 'Company update from CoreSignal data',
          source: update.source || 'Company Updates',
          publishedAt: update.date || update.publishedAt || new Date().toISOString(),
          url: update.url || '#',
          content: update.description || update.content || ''
        }));

        setNewsArticles(articles);
        setDataSource('database_companyUpdates');
        setLoading(false);
        return;
      }

      // If no companyUpdates, try Perplexity API
      console.log('📰 [NEWS TAB] No companyUpdates found, trying Perplexity API');
      const response = await fetch(`/api/news/company/${encodeURIComponent(companyName)}`);
      const data = await response.json();

      if (data.success && data.articles) {
        setNewsArticles(data.articles);
        setDataSource(data.dataSource || 'perplexity_api');
      } else {
        setError(data.error || 'Failed to fetch news data');
      }
    } catch (err) {
      console.error('Error fetching company news:', err);
      setError('Failed to load company news');
    } finally {
      setLoading(false);
    }
  };

  if (!record) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="bg-background p-4 rounded-lg border border-border text-center">
            <div className="text-muted">No record data available</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-loading-bg rounded animate-pulse"></div>
          <div className="h-6 w-20 bg-loading-bg rounded animate-pulse"></div>
        </div>

        {/* News article skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-background p-4 rounded-lg border border-border">
              {/* Title skeleton */}
              <div className="flex items-start justify-between mb-2">
                <div className="h-6 w-3/4 bg-loading-bg rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-loading-bg rounded animate-pulse ml-2 flex-shrink-0"></div>
              </div>
              
              {/* Source skeleton */}
              <div className="flex items-center mb-3">
                <div className="h-4 w-20 bg-loading-bg rounded animate-pulse"></div>
              </div>
              
              {/* Description skeleton */}
              <div className="space-y-2 mb-3">
                <div className="h-4 w-full bg-loading-bg rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-loading-bg rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-loading-bg rounded animate-pulse"></div>
              </div>
              
              {/* Link skeleton */}
              <div className="h-4 w-32 bg-loading-bg rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="bg-background p-4 rounded-lg border border-border text-center">
            <div className="text-red-600">Error loading news: {error}</div>
            <button 
              onClick={fetchCompanyNews}
              className="mt-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }


  // Format date helper function
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return renderNewsContent();

  function renderNewsContent() {
    return (
      <div className="space-y-8">
        {/* Data Source Indicator */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Company News</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted">Data Source:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              dataSource === 'database_companyUpdates' 
                ? 'bg-green-100 text-green-800' 
                : dataSource === 'perplexity_api'
                ? 'bg-blue-100 text-blue-800'
                : dataSource === 'external_api' 
                ? 'bg-green-100 text-green-800' 
                : dataSource === 'no_news_available'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {dataSource === 'database_companyUpdates' ? 'Database' : 
               dataSource === 'perplexity_api' ? 'Perplexity' :
               dataSource === 'external_api' ? 'Real News' : 
               dataSource === 'no_news_available' ? 'No News' : 
               'Unknown'}
            </span>
          </div>
        </div>

        {newsArticles.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-background p-4 rounded-lg border border-border text-center">
              <div className="text-muted">
                <div className="text-lg font-medium mb-2">No Company News Available</div>
                <div className="text-sm">No company news available at this time for {companyName}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {newsArticles.map((article, index) => (
              <div key={index} className="bg-background p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-lg font-semibold text-foreground line-clamp-2">
                    {article.title}
                  </h4>
                  <span className="text-xs text-muted ml-2 flex-shrink-0">
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
                
                <div className="flex items-center mb-3">
                  <span className="text-sm text-muted bg-hover px-2 py-1 rounded">
                    {article.source}
                  </span>
                </div>
                
                <p className="text-muted mb-3 line-clamp-3">
                  {article.description}
                </p>
                
                {article.url && (
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Read Full Article →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
