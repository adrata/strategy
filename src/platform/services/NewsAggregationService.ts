"use client";

/**
 * News Aggregation Service
 * 
 * Multi-source news aggregation with intelligent ranking:
 * - Primary: Perplexity API (real-time, AI-powered)
 * - Fallback: News API (broad coverage)
 * - Optional: CoreSignal (company/person updates)
 * - Deduplication logic
 * - Industry filtering based on workspace settings
 */

import { prisma } from '@/lib/prisma';

export interface NewsArticle {
  id?: string;
  workspaceId: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  source: string;
  author?: string;
  category: 'INDUSTRY' | 'COMPANY' | 'PERSON' | 'GENERAL';
  relevanceScore: number;
  relatedCompanyId?: string;
  relatedPersonId?: string;
  industries: string[];
  tags: string[];
  isRead?: boolean;
  isFavorite?: boolean;
}

export interface NewsSourceConfig {
  perplexityApiKey?: string;
  newsApiKey?: string;
  coresignalApiKey?: string;
}

export interface WorkspaceNewsConfig {
  workspaceId: string;
  newsEnabled: boolean;
  newsIndustries: string[];
  newsSources: string[];
  targetCompanies: string[];
  targetPeople: string[];
}

export class NewsAggregationService {
  private config: NewsSourceConfig;

  constructor(config: NewsSourceConfig) {
    this.config = config;
  }

  /**
   * Fetch and aggregate news for a workspace
   */
  async aggregateNewsForWorkspace(workspaceConfig: WorkspaceNewsConfig): Promise<NewsArticle[]> {
    if (!workspaceConfig.newsEnabled) {
      return [];
    }

    console.log('📰 [NEWS_AGGREGATION] Starting news aggregation for workspace:', workspaceConfig.workspaceId);

    const allArticles: NewsArticle[] = [];

    // Fetch from Perplexity API (primary source)
    if (this.config.perplexityApiKey && workspaceConfig.newsSources.includes('perplexity')) {
      try {
        const perplexityArticles = await this.fetchFromPerplexity(workspaceConfig);
        allArticles.push(...perplexityArticles);
        console.log(`✅ [NEWS_AGGREGATION] Fetched ${perplexityArticles.length} articles from Perplexity`);
      } catch (error) {
        console.error('❌ [NEWS_AGGREGATION] Perplexity API failed:', error);
      }
    }

    // Fetch from News API (fallback)
    if (this.config.newsApiKey && workspaceConfig.newsSources.includes('newsapi')) {
      try {
        const newsApiArticles = await this.fetchFromNewsAPI(workspaceConfig);
        allArticles.push(...newsApiArticles);
        console.log(`✅ [NEWS_AGGREGATION] Fetched ${newsApiArticles.length} articles from News API`);
      } catch (error) {
        console.error('❌ [NEWS_AGGREGATION] News API failed:', error);
      }
    }

    // Fetch from CoreSignal (optional)
    if (this.config.coresignalApiKey && workspaceConfig.newsSources.includes('coresignal')) {
      try {
        const coresignalArticles = await this.fetchFromCoreSignal(workspaceConfig);
        allArticles.push(...coresignalArticles);
        console.log(`✅ [NEWS_AGGREGATION] Fetched ${coresignalArticles.length} articles from CoreSignal`);
      } catch (error) {
        console.error('❌ [NEWS_AGGREGATION] CoreSignal API failed:', error);
      }
    }

    // Deduplicate articles
    const deduplicatedArticles = this.deduplicateArticles(allArticles);
    console.log(`🔄 [NEWS_AGGREGATION] Deduplicated from ${allArticles.length} to ${deduplicatedArticles.length} articles`);

    // Save to database
    const savedArticles = await this.saveArticlesToDatabase(deduplicatedArticles, workspaceConfig.workspaceId);
    console.log(`💾 [NEWS_AGGREGATION] Saved ${savedArticles.length} articles to database`);

    return savedArticles;
  }

  /**
   * Fetch news from Perplexity API
   */
  private async fetchFromPerplexity(config: WorkspaceNewsConfig): Promise<NewsArticle[]> {
    if (!this.config.perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const articles: NewsArticle[] = [];
    
    // Create industry-specific queries
    const industryQueries = config.newsIndustries.map(industry => 
      `Recent news about ${industry} industry in the last 7 days including funding, leadership changes, product launches, acquisitions, partnerships`
    );

    // Create company-specific queries
    const companyQueries = config.targetCompanies.map(company => 
      `Recent news about ${company} company in the last 7 days including funding, leadership changes, product launches, acquisitions, partnerships`
    );

    // Create person-specific queries
    const personQueries = config.targetPeople.map(person => 
      `Recent news about ${person} in the last 7 days including job changes, awards, or mentions`
    );

    const allQueries = [...industryQueries, ...companyQueries, ...personQueries];

    for (const query of allQueries) {
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'You are a business intelligence analyst. Provide structured news analysis with buying signals, competitive threats, and urgency factors. Return news articles in JSON format with title, description, content, url, publishedAt, source, author, and category fields.'
              },
              {
                role: 'user',
                content: query
              }
            ],
            max_tokens: 2000,
            temperature: 0.2,
            return_citations: true
          }),
        });

        if (!response.ok) {
          throw new Error(`Perplexity API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
          try {
            const parsedNews = JSON.parse(content);
            if (Array.isArray(parsedNews)) {
              const processedArticles = parsedNews.map((article: any) => this.processPerplexityArticle(article, config));
              articles.push(...processedArticles);
            }
          } catch (parseError) {
            console.warn('⚠️ [NEWS_AGGREGATION] Failed to parse Perplexity response as JSON');
          }
        }
      } catch (error) {
        console.error('❌ [NEWS_AGGREGATION] Perplexity query failed:', error);
      }
    }

    return articles;
  }

  /**
   * Fetch news from News API
   */
  private async fetchFromNewsAPI(config: WorkspaceNewsConfig): Promise<NewsArticle[]> {
    if (!this.config.newsApiKey) {
      throw new Error('News API key not configured');
    }

    const articles: NewsArticle[] = [];
    
    // Create search queries for industries and companies
    const searchTerms = [
      ...config.newsIndustries,
      ...config.targetCompanies.slice(0, 5) // Limit to avoid API limits
    ];

    for (const term of searchTerms) {
      try {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(term)}&sortBy=publishedAt&pageSize=10&apiKey=${this.config.newsApiKey}`
        );

        if (!response.ok) {
          throw new Error(`News API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.articles && Array.isArray(data.articles)) {
          const processedArticles = data.articles.map((article: any) => this.processNewsAPIArticle(article, config));
          articles.push(...processedArticles);
        }
      } catch (error) {
        console.error('❌ [NEWS_AGGREGATION] News API query failed:', error);
      }
    }

    return articles;
  }

  /**
   * Fetch news from CoreSignal (placeholder - requires API research)
   */
  private async fetchFromCoreSignal(config: WorkspaceNewsConfig): Promise<NewsArticle[]> {
    // TODO: Implement CoreSignal integration once API is researched
    console.log('📝 [NEWS_AGGREGATION] CoreSignal integration not yet implemented');
    return [];
  }

  /**
   * Process Perplexity API article
   */
  private processPerplexityArticle(article: any, config: WorkspaceNewsConfig): NewsArticle {
    return {
      workspaceId: config.workspaceId,
      title: article.title || 'Untitled',
      description: article.description || '',
      content: article.content || '',
      url: article.url || '',
      imageUrl: article.imageUrl,
      publishedAt: new Date(article.publishedAt || new Date()),
      source: article.source || 'Perplexity',
      author: article.author,
      category: this.determineCategory(article, config),
      relevanceScore: 0, // Will be calculated by ranking engine
      relatedCompanyId: this.findRelatedCompanyId(article, config),
      relatedPersonId: this.findRelatedPersonId(article, config),
      industries: config.newsIndustries,
      tags: this.extractTags(article)
    };
  }

  /**
   * Process News API article
   */
  private processNewsAPIArticle(article: any, config: WorkspaceNewsConfig): NewsArticle {
    return {
      workspaceId: config.workspaceId,
      title: article.title || 'Untitled',
      description: article.description || '',
      content: article.content || '',
      url: article.url || '',
      imageUrl: article.urlToImage,
      publishedAt: new Date(article.publishedAt || new Date()),
      source: article.source?.name || 'News API',
      author: article.author,
      category: this.determineCategory(article, config),
      relevanceScore: 0, // Will be calculated by ranking engine
      relatedCompanyId: this.findRelatedCompanyId(article, config),
      relatedPersonId: this.findRelatedPersonId(article, config),
      industries: config.newsIndustries,
      tags: this.extractTags(article)
    };
  }

  /**
   * Determine article category based on content and config
   */
  private determineCategory(article: any, config: WorkspaceNewsConfig): 'INDUSTRY' | 'COMPANY' | 'PERSON' | 'GENERAL' {
    const title = (article.title || '').toLowerCase();
    const content = (article.content || article.description || '').toLowerCase();

    // Check for person mentions
    for (const person of config.targetPeople) {
      if (title.includes(person.toLowerCase()) || content.includes(person.toLowerCase())) {
        return 'PERSON';
      }
    }

    // Check for company mentions
    for (const company of config.targetCompanies) {
      if (title.includes(company.toLowerCase()) || content.includes(company.toLowerCase())) {
        return 'COMPANY';
      }
    }

    // Check for industry mentions
    for (const industry of config.newsIndustries) {
      if (title.includes(industry.toLowerCase()) || content.includes(industry.toLowerCase())) {
        return 'INDUSTRY';
      }
    }

    return 'GENERAL';
  }

  /**
   * Find related company ID
   */
  private findRelatedCompanyId(article: any, config: WorkspaceNewsConfig): string | undefined {
    // TODO: Implement company matching logic
    return undefined;
  }

  /**
   * Find related person ID
   */
  private findRelatedPersonId(article: any, config: WorkspaceNewsConfig): string | undefined {
    // TODO: Implement person matching logic
    return undefined;
  }

  /**
   * Extract tags from article
   */
  private extractTags(article: any): string[] {
    const tags: string[] = [];
    
    if (article.tags && Array.isArray(article.tags)) {
      tags.push(...article.tags);
    }

    // Extract keywords from title and content
    const text = `${article.title || ''} ${article.content || article.description || ''}`.toLowerCase();
    
    // Common business keywords
    const businessKeywords = ['funding', 'acquisition', 'merger', 'ipo', 'partnership', 'leadership', 'ceo', 'cto', 'cfo'];
    for (const keyword of businessKeywords) {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Deduplicate articles based on URL and title similarity
   */
  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    const deduplicated: NewsArticle[] = [];

    for (const article of articles) {
      const key = `${article.url}_${article.title}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(article);
      }
    }

    return deduplicated;
  }

  /**
   * Save articles to database
   */
  private async saveArticlesToDatabase(articles: NewsArticle[], workspaceId: string): Promise<NewsArticle[]> {
    const savedArticles: NewsArticle[] = [];

    for (const article of articles) {
      try {
        // Check if article already exists
        const existing = await prisma.news_articles.findFirst({
          where: {
            workspaceId,
            url: article.url
          }
        });

        if (existing) {
          // Update existing article
          const updated = await prisma.news_articles.update({
            where: { id: existing.id },
            data: {
              title: article.title,
              description: article.description,
              content: article.content,
              imageUrl: article.imageUrl,
              source: article.source,
              author: article.author,
              category: article.category,
              relatedCompanyId: article.relatedCompanyId,
              relatedPersonId: article.relatedPersonId,
              industries: article.industries,
              tags: article.tags,
              updatedAt: new Date()
            }
          });
          savedArticles.push(updated as NewsArticle);
        } else {
          // Create new article
          const created = await prisma.news_articles.create({
            data: {
              workspaceId: article.workspaceId,
              title: article.title,
              description: article.description,
              content: article.content,
              url: article.url,
              imageUrl: article.imageUrl,
              publishedAt: article.publishedAt,
              source: article.source,
              author: article.author,
              category: article.category,
              relevanceScore: article.relevanceScore,
              relatedCompanyId: article.relatedCompanyId,
              relatedPersonId: article.relatedPersonId,
              industries: article.industries,
              tags: article.tags,
              isRead: false,
              isFavorite: false
            }
          });
          savedArticles.push(created as NewsArticle);
        }
      } catch (error) {
        console.error('❌ [NEWS_AGGREGATION] Failed to save article:', error);
      }
    }

    return savedArticles;
  }

  /**
   * Get workspace news configuration
   */
  async getWorkspaceNewsConfig(workspaceId: string): Promise<WorkspaceNewsConfig> {
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        newsEnabled: true,
        newsIndustries: true,
        newsSources: true,
        companies: {
          select: { id: true, name: true }
        },
        people: {
          select: { id: true, fullName: true }
        }
      }
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return {
      workspaceId: workspace.id,
      newsEnabled: workspace.newsEnabled || false,
      newsIndustries: workspace.newsIndustries || [],
      newsSources: workspace.newsSources || ['perplexity', 'newsapi'],
      targetCompanies: workspace.companies.map(c => c.name),
      targetPeople: workspace.people.map(p => p.fullName)
    };
  }
}

// Export singleton instance
export const newsAggregationService = new NewsAggregationService({
  perplexityApiKey: process.env.PERPLEXITY_API_KEY,
  newsApiKey: process.env.NEWS_API_KEY,
  coresignalApiKey: process.env.CORESIGNAL_API_KEY
});
