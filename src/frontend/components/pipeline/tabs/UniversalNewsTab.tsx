import React, { useState, useEffect } from 'react';

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
  const [warning, setWarning] = useState<string | null>(null);

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
      setWarning(null);

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
        
        // Show warning if using fallback data
        if (data.warning) {
          setWarning(data.warning);
        }
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
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] text-center">
            <div className="text-[var(--muted)]">No record data available</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-2 text-[var(--muted)]">Loading company news...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] text-center">
            <div className="text-red-600">Error loading news: {error}</div>
            <button 
              onClick={fetchCompanyNews}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show warning if using fallback data
  if (warning) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-2">⚠️</div>
              <div className="text-yellow-800">
                <strong>Notice:</strong> {warning}
              </div>
            </div>
          </div>
        </div>
        {renderNewsContent()}
      </div>
    );
  }

  return renderNewsContent();

  function renderNewsContent() {
    return (
      <div className="space-y-8">
        {/* Data Source Indicator */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Company News</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[var(--muted)]">Data Source:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              dataSource === 'database_companyUpdates' 
                ? 'bg-green-100 text-green-800' 
                : dataSource === 'perplexity_api'
                ? 'bg-blue-100 text-blue-800'
                : dataSource === 'external_api' 
                ? 'bg-green-100 text-green-800' 
                : dataSource === 'fallback_generated'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {dataSource === 'database_companyUpdates' ? 'Database' : 
               dataSource === 'perplexity_api' ? 'Perplexity' :
               dataSource === 'external_api' ? 'Real News' : 
               dataSource === 'fallback_generated' ? 'Generated' : 
               'Unknown'}
            </span>
          </div>
        </div>

        {newsArticles.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] text-center">
              <div className="text-[var(--muted)]">
                <div className="text-lg font-medium mb-2">No Recent News</div>
                <div className="text-sm">No company updates available for {companyName}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {newsArticles.map((article, index) => (
              <div key={index} className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-lg font-semibold text-[var(--foreground)] line-clamp-2">
                    {article.title}
                  </h4>
                  <span className="text-xs text-[var(--muted)] ml-2 flex-shrink-0">
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
                
                <div className="flex items-center mb-3">
                  <span className="text-sm text-[var(--muted)] bg-[var(--hover)] px-2 py-1 rounded">
                    {article.source}
                  </span>
                </div>
                
                <p className="text-[var(--muted)] mb-3 line-clamp-3">
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

}
