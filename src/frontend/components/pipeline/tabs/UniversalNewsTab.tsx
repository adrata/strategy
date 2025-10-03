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

      const response = await fetch(`/api/news/company/${encodeURIComponent(companyName)}`);
      const data = await response.json();

      if (data.success && data.articles) {
        setNewsArticles(data.articles);
      } else {
        setError('Failed to fetch news data');
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
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-500">No record data available</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-2 text-gray-600">Loading company news...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
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

  if (newsArticles.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-500">
              <div className="text-lg font-medium mb-2">No Recent News</div>
              <div className="text-sm">No company updates available for {companyName}</div>
            </div>
          </div>
        </div>
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

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Company News</h3>
        <div className="space-y-4">
          {newsArticles.map((article: NewsArticle, index: number) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {companyName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {companyName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(article.publishedAt)} • {article.source}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  #{index + 1}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {article.title}
                </h4>
                <p className="text-gray-800 leading-relaxed mb-3">
                  {article.description}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {article.content}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <span className="text-blue-500">📰</span>
                    <span>News Article</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="text-green-500">📅</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </span>
                </div>
                <div className="text-xs">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Read More →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {newsArticles.length > 10 && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-sm text-gray-500">
              Showing {newsArticles.length} recent news articles
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
