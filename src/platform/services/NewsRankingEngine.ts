"use client";

/**
 * News Ranking Engine
 * 
 * AI-powered relevance scoring for news articles:
 * - Score based on Speedrun companies/people (highest priority)
 * - Score based on workspace companies (medium priority)
 * - Score based on industry relevance (lower priority)
 * - Use Claude API for semantic analysis
 * - Cache scores in database
 */

import { prisma } from '@/lib/prisma';
import { NewsArticle } from './NewsAggregationService';

export interface RankingContext {
  workspaceId: string;
  speedrunCompanies: string[];
  speedrunPeople: string[];
  workspaceCompanies: string[];
  workspacePeople: string[];
  targetIndustries: string[];
}

export interface RankingResult {
  articleId: string;
  relevanceScore: number;
  reasoning: string;
  priorityFactors: string[];
}

export class NewsRankingEngine {
  private claudeApiKey: string;

  constructor() {
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || '';
  }

  /**
   * Rank articles for a workspace
   */
  async rankArticlesForWorkspace(workspaceId: string): Promise<RankingResult[]> {
    console.log('🎯 [NEWS_RANKING] Starting article ranking for workspace:', workspaceId);

    // Get ranking context
    const context = await this.getRankingContext(workspaceId);
    
    // Get unranked articles
    const articles = await prisma.news_articles.findMany({
      where: {
        workspaceId,
        relevanceScore: 0 // Only rank unranked articles
      },
      take: 50 // Limit to avoid API rate limits
    });

    if (articles.length === 0) {
      console.log('📝 [NEWS_RANKING] No unranked articles found');
      return [];
    }

    console.log(`🎯 [NEWS_RANKING] Ranking ${articles.length} articles`);

    const rankingResults: RankingResult[] = [];

    // Rank articles in batches to avoid API limits
    const batchSize = 5;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const batchResults = await this.rankArticleBatch(batch, context);
      rankingResults.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update database with new scores
    await this.updateArticleScores(rankingResults);

    console.log(`✅ [NEWS_RANKING] Completed ranking for ${rankingResults.length} articles`);
    return rankingResults;
  }

  /**
   * Get ranking context for workspace
   */
  private async getRankingContext(workspaceId: string): Promise<RankingContext> {
    // Get workspace companies and people
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: {
        companies: {
          select: { id: true, name: true }
        },
        people: {
          select: { id: true, fullName: true }
        },
        newsIndustries: true
      }
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // TODO: Get Speedrun companies and people
    // For now, we'll use workspace data as a proxy
    const speedrunCompanies = workspace.companies.slice(0, 10).map(c => c.name);
    const speedrunPeople = workspace.people.slice(0, 20).map(p => p.fullName);

    return {
      workspaceId,
      speedrunCompanies,
      speedrunPeople,
      workspaceCompanies: workspace.companies.map(c => c.name),
      workspacePeople: workspace.people.map(p => p.fullName),
      targetIndustries: workspace.newsIndustries || []
    };
  }

  /**
   * Rank a batch of articles
   */
  private async rankArticleBatch(articles: any[], context: RankingContext): Promise<RankingResult[]> {
    if (!this.claudeApiKey) {
      console.warn('⚠️ [NEWS_RANKING] Claude API key not configured, using basic scoring');
      return this.basicRanking(articles, context);
    }

    try {
      const prompt = this.buildRankingPrompt(articles, context);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.claudeApiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;
      
      if (content) {
        return this.parseRankingResponse(content, articles);
      } else {
        throw new Error('No content in Claude response');
      }
    } catch (error) {
      console.error('❌ [NEWS_RANKING] Claude API failed, falling back to basic ranking:', error);
      return this.basicRanking(articles, context);
    }
  }

  /**
   * Build ranking prompt for Claude
   */
  private buildRankingPrompt(articles: any[], context: RankingContext): string {
    const articlesText = articles.map((article, index) => 
      `${index + 1}. Title: ${article.title}
   Description: ${article.description || 'No description'}
   Category: ${article.category}
   Source: ${article.source}
   Published: ${article.publishedAt.toISOString().split('T')[0]}`
    ).join('\n\n');

    return `You are a business intelligence analyst for a sales team. Rate the relevance of these news articles on a scale of 0-100 for a workspace focused on these priorities:

PRIORITY COMPANIES (Speedrun - highest priority):
${context.speedrunCompanies.join(', ')}

WORKSPACE COMPANIES (medium priority):
${context.workspaceCompanies.slice(0, 20).join(', ')}

TARGET PEOPLE (high priority):
${context.speedrunPeople.join(', ')}

TARGET INDUSTRIES:
${context.targetIndustries.join(', ')}

SCORING CRITERIA:
- 90-100: Direct mention of Speedrun companies/people, major business events
- 80-89: Workspace companies/people, significant industry developments
- 70-79: Target industries, competitive intelligence
- 60-69: Related business news, market trends
- 50-59: General business news with some relevance
- 0-49: Low relevance or unrelated

ARTICLES TO RANK:
${articlesText}

Return ONLY a JSON array with this exact format:
[
  {
    "articleIndex": 1,
    "relevanceScore": 85,
    "reasoning": "Direct mention of Acme Corp (Speedrun company) announcing new funding round",
    "priorityFactors": ["speedrun_company", "funding_news"]
  }
]

Focus on business relevance, buying signals, and competitive intelligence. Be concise but specific in reasoning.`;
  }

  /**
   * Parse Claude's ranking response
   */
  private parseRankingResponse(content: string, articles: any[]): RankingResult[] {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const rankings = JSON.parse(jsonMatch[0]);
      
      return rankings.map((ranking: any) => ({
        articleId: articles[ranking.articleIndex - 1]?.id || '',
        relevanceScore: Math.max(0, Math.min(100, ranking.relevanceScore || 0)),
        reasoning: ranking.reasoning || 'No reasoning provided',
        priorityFactors: ranking.priorityFactors || []
      }));
    } catch (error) {
      console.error('❌ [NEWS_RANKING] Failed to parse Claude response:', error);
      return this.basicRanking(articles, { workspaceId: '', speedrunCompanies: [], speedrunPeople: [], workspaceCompanies: [], workspacePeople: [], targetIndustries: [] });
    }
  }

  /**
   * Basic ranking fallback (no AI)
   */
  private basicRanking(articles: any[], context: RankingContext): RankingResult[] {
    return articles.map(article => {
      let score = 50; // Base score
      const factors: string[] = [];

      const title = (article.title || '').toLowerCase();
      const description = (article.description || '').toLowerCase();
      const text = `${title} ${description}`;

      // Check for Speedrun companies (highest priority)
      for (const company of context.speedrunCompanies) {
        if (text.includes(company.toLowerCase())) {
          score += 30;
          factors.push('speedrun_company');
          break;
        }
      }

      // Check for Speedrun people
      for (const person of context.speedrunPeople) {
        if (text.includes(person.toLowerCase())) {
          score += 25;
          factors.push('speedrun_person');
          break;
        }
      }

      // Check for workspace companies
      for (const company of context.workspaceCompanies) {
        if (text.includes(company.toLowerCase())) {
          score += 20;
          factors.push('workspace_company');
          break;
        }
      }

      // Check for target industries
      for (const industry of context.targetIndustries) {
        if (text.includes(industry.toLowerCase())) {
          score += 15;
          factors.push('target_industry');
          break;
        }
      }

      // Category-based scoring
      switch (article.category) {
        case 'COMPANY':
          score += 10;
          factors.push('company_news');
          break;
        case 'PERSON':
          score += 10;
          factors.push('person_news');
          break;
        case 'INDUSTRY':
          score += 5;
          factors.push('industry_news');
          break;
      }

      // Recency bonus (last 24 hours)
      const publishedAt = new Date(article.publishedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        score += 5;
        factors.push('recent_news');
      }

      return {
        articleId: article.id,
        relevanceScore: Math.max(0, Math.min(100, score)),
        reasoning: `Basic scoring based on ${factors.join(', ')}`,
        priorityFactors: factors
      };
    });
  }

  /**
   * Update article scores in database
   */
  private async updateArticleScores(results: RankingResult[]): Promise<void> {
    for (const result of results) {
      try {
        await prisma.news_articles.update({
          where: { id: result.articleId },
          data: {
            relevanceScore: result.relevanceScore,
            updatedAt: new Date()
          }
        });
      } catch (error) {
        console.error('❌ [NEWS_RANKING] Failed to update article score:', error);
      }
    }
  }

  /**
   * Get top articles for workspace
   */
  async getTopArticles(workspaceId: string, limit: number = 10): Promise<NewsArticle[]> {
    const articles = await prisma.news_articles.findMany({
      where: { workspaceId },
      orderBy: [
        { relevanceScore: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit,
      include: {
        company: {
          select: { id: true, name: true }
        },
        person: {
          select: { id: true, fullName: true, company: { select: { name: true } } }
        }
      }
    });

    return articles as NewsArticle[];
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(workspaceId: string, category: string, limit: number = 20): Promise<NewsArticle[]> {
    const articles = await prisma.news_articles.findMany({
      where: { 
        workspaceId,
        category: category as any
      },
      orderBy: [
        { relevanceScore: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit,
      include: {
        company: {
          select: { id: true, name: true }
        },
        person: {
          select: { id: true, fullName: true, company: { select: { name: true } } }
        }
      }
    });

    return articles as NewsArticle[];
  }
}

// Export singleton instance
export const newsRankingEngine = new NewsRankingEngine();
