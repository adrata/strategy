/**
 * UniversalNewsTab Data Integrity Tests
 * 
 * Tests to verify News tab uses companyUpdates from database first,
 * then falls back to Perplexity API, with no generated fake data
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UniversalNewsTab } from '@/frontend/components/pipeline/tabs/UniversalNewsTab';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock the CompanyDetailSkeleton
jest.mock('@/platform/ui/components/Loader', () => ({
  CompanyDetailSkeleton: ({ message }: { message: string }) => (
    <div data-testid="news-skeleton">{message}</div>
  )
}));

describe('UniversalNewsTab Data Integrity', () => {
  const mockRecord = {
    id: 'test-company-id',
    name: 'Test Company'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Database First Strategy Tests', () => {
    it('should use companyUpdates from database when available', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: [
          {
            title: 'Company Raises Series A',
            description: 'Test Company announced $10M Series A funding round',
            source: 'TechCrunch',
            date: '2024-01-15T10:00:00Z',
            url: 'https://techcrunch.com/test-company-funding',
            content: 'Full article content about the funding round'
          },
          {
            title: 'New Product Launch',
            description: 'Test Company launches new AI platform',
            source: 'Company Blog',
            date: '2024-01-10T14:00:00Z',
            url: 'https://testcompany.com/blog/new-product',
            content: 'Details about the new AI platform launch'
          }
        ]
      };

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        // Should display database news articles
        expect(screen.getByText('Company Raises Series A')).toBeInTheDocument();
        expect(screen.getByText('New Product Launch')).toBeInTheDocument();
        expect(screen.getByText('Test Company announced $10M Series A funding round')).toBeInTheDocument();
      });

      // Should show database as data source
      expect(screen.getByText('Database')).toBeInTheDocument();
      
      // Should not call external API when database has data
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should transform companyUpdates to news article format correctly', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: [
          {
            title: 'Test News Title',
            description: 'Test news description content',
            source: 'Test Source',
            date: '2024-01-15T10:00:00Z',
            url: 'https://example.com/news',
            content: 'Full news content'
          }
        ]
      };

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test News Title')).toBeInTheDocument();
        expect(screen.getByText('Test news description content')).toBeInTheDocument();
        expect(screen.getByText('Test Source')).toBeInTheDocument();
      });
    });

    it('should handle companyUpdates with missing fields gracefully', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: [
          {
            description: 'News without title',
            date: '2024-01-15T10:00:00Z'
          }
        ]
      };

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        // Should generate title from description or use fallback
        expect(screen.getByText(/Company Update/)).toBeInTheDocument();
        expect(screen.getByText('News without title')).toBeInTheDocument();
      });
    });
  });

  describe('Perplexity API Fallback Tests', () => {
    it('should call Perplexity API when no companyUpdates available', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: []
      };

      const mockPerplexityResponse = {
        success: true,
        articles: [
          {
            title: 'Perplexity News Article',
            description: 'News from Perplexity API',
            source: 'Perplexity Source',
            publishedAt: '2024-01-15T10:00:00Z',
            url: 'https://example.com/perplexity-news',
            content: 'Perplexity news content'
          }
        ],
        dataSource: 'perplexity_api'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPerplexityResponse
      });

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Perplexity News Article')).toBeInTheDocument();
        expect(screen.getByText('News from Perplexity API')).toBeInTheDocument();
      });

      // Should show Perplexity as data source
      expect(screen.getByText('Perplexity')).toBeInTheDocument();
      
      // Should have called the news API
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/news/company/Test%20Company')
      );
    });

    it('should handle Perplexity API errors gracefully', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: []
      };

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        // Should show error state
        expect(screen.getByText(/Failed to load company news/)).toBeInTheDocument();
      });
    });
  });

  describe('No Generated Fake Data Tests', () => {
    it('should not display any generated fake news articles', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: []
      };

      // Mock API to return no articles
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          articles: [],
          dataSource: 'perplexity_api'
        })
      });

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        // Should show no articles message, not fake articles
        expect(screen.getByText(/No news articles found/)).toBeInTheDocument();
      });

      // Should not contain any fake article titles
      expect(screen.queryByText(/TechCorp Raises/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Series B/)).not.toBeInTheDocument();
      expect(screen.queryByText(/AI Platform/)).not.toBeInTheDocument();
    });

    it('should not generate fake sources or dates', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: []
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          articles: [],
          dataSource: 'perplexity_api'
        })
      });

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        // Should not show fake sources
        expect(screen.queryByText('TechCrunch')).not.toBeInTheDocument();
        expect(screen.queryByText('Business Wire')).not.toBeInTheDocument();
        expect(screen.queryByText('PR Newswire')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Source Indicators Tests', () => {
    it('should show correct data source indicator for database', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: [
          {
            title: 'Database News',
            description: 'News from database',
            date: '2024-01-15T10:00:00Z'
          }
        ]
      };

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        // Should show database indicator
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Data Source:')).toBeInTheDocument();
      });
    });

    it('should show correct data source indicator for Perplexity', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: []
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          articles: [
            {
              title: 'Perplexity News',
              description: 'News from Perplexity',
              publishedAt: '2024-01-15T10:00:00Z',
              url: 'https://example.com/news'
            }
          ],
          dataSource: 'perplexity_api'
        })
      });

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        // Should show Perplexity indicator
        expect(screen.getByText('Perplexity')).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States Tests', () => {
    it('should show loading state initially', () => {
      const record = {
        ...mockRecord,
        companyUpdates: []
      };

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      // Should show loading state
      expect(screen.getByText(/Loading company news/)).toBeInTheDocument();
    });

    it('should handle API errors with proper error message', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: []
      };

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load company news/)).toBeInTheDocument();
      });
    });

    it('should handle empty record gracefully', () => {
      render(
        <UniversalNewsTab 
          record={null} 
          recordType="companies" 
        />
      );

      // Should show skeleton for null record
      expect(screen.getByTestId('news-skeleton')).toBeInTheDocument();
    });
  });

  describe('Article Display Tests', () => {
    it('should display article metadata correctly', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: [
          {
            title: 'Test Article',
            description: 'Test description',
            source: 'Test Source',
            date: '2024-01-15T10:00:00Z',
            url: 'https://example.com/article',
            content: 'Test content'
          }
        ]
      };

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Article')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
        expect(screen.getByText('Test Source')).toBeInTheDocument();
        
        // Should format date correctly
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      });
    });

    it('should handle articles with missing metadata gracefully', async () => {
      const record = {
        ...mockRecord,
        companyUpdates: [
          {
            title: 'Minimal Article'
          }
        ]
      };

      render(
        <UniversalNewsTab 
          record={record} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Minimal Article')).toBeInTheDocument();
        // Should show fallback values for missing fields
        expect(screen.getByText('Company Updates')).toBeInTheDocument();
      });
    });
  });
});
