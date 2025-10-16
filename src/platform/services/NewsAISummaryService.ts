"use client";

/**
 * News AI Summary Service
 * 
 * Claude-powered summarization for news articles:
 * - Generate 90-second overview of all recent news
 * - Extract key insights
 * - Format in Adrata voice/tone
 * - Optimize for voice reading
 */

import { prisma } from '@/lib/prisma';
import { NewsArticle } from './NewsAggregationService';

export interface NewsSummary {
  id: string;
  workspaceId: string;
  summary: string;
  keyInsights: string[];
  topArticles: string[];
  generatedAt: Date;
  expiresAt: Date;
}

export interface SummaryContext {
  workspaceId: string;
  workspaceName: string;
  targetIndustries: string[];
  focusAreas: string[];
}

export class NewsAISummaryService {
  private claudeApiKey: string;

  constructor() {
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || '';
  }

  /**
   * Generate news summary for workspace
   */
  async generateNewsSummary(workspaceId: string): Promise<NewsSummary> {
    console.log('📝 [NEWS_SUMMARY] Generating news summary for workspace:', workspaceId);

    // Get summary context
    const context = await this.getSummaryContext(workspaceId);
    
    // Get recent articles (last 7 days, top 20 by relevance)
    const articles = await prisma.news_articles.findMany({
      where: {
        workspaceId,
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: [
        { relevanceScore: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: 20,
      include: {
        company: {
          select: { id: true, name: true }
        },
        person: {
          select: { id: true, fullName: true, company: { select: { name: true } } }
        }
      }
    });

    if (articles.length === 0) {
      return this.createEmptySummary(workspaceId);
    }

    console.log(`📝 [NEWS_SUMMARY] Summarizing ${articles.length} articles`);

    // Generate AI summary
    const summary = await this.generateAISummary(articles, context);
    
    // Save summary to database
    const savedSummary = await this.saveSummary(workspaceId, summary, articles);

    console.log('✅ [NEWS_SUMMARY] News summary generated successfully');
    return savedSummary;
  }

  /**
   * Get summary context for workspace
   */
  private async getSummaryContext(workspaceId: string): Promise<SummaryContext> {
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: {
        name: true,
        newsIndustries: true,
        industry: true,
        businessModel: true
      }
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return {
      workspaceId,
      workspaceName: workspace.name,
      targetIndustries: workspace.newsIndustries || [],
      focusAreas: [
        workspace.industry || 'Business',
        workspace.businessModel || 'B2B Sales'
      ]
    };
  }

  /**
   * Generate AI summary using Claude
   */
  private async generateAISummary(articles: any[], context: SummaryContext): Promise<{
    summary: string;
    keyInsights: string[];
    topArticles: string[];
  }> {
    if (!this.claudeApiKey) {
      console.warn('⚠️ [NEWS_SUMMARY] Claude API key not configured, using basic summary');
      return this.generateBasicSummary(articles, context);
    }

    try {
      const prompt = this.buildSummaryPrompt(articles, context);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.claudeApiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1500,
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
        return this.parseSummaryResponse(content, articles);
      } else {
        throw new Error('No content in Claude response');
      }
    } catch (error) {
      console.error('❌ [NEWS_SUMMARY] Claude API failed, falling back to basic summary:', error);
      return this.generateBasicSummary(articles, context);
    }
  }

  /**
   * Build summary prompt for Claude
   */
  private buildSummaryPrompt(articles: any[], context: SummaryContext): string {
    const articlesText = articles.map((article, index) => 
      `${index + 1}. ${article.title} (${article.category}) - ${article.source} - ${article.publishedAt.toISOString().split('T')[0]}`
    ).join('\n');

    return `You are Adrata's AI assistant, providing business intelligence for ${context.workspaceName}. 

Create a concise 90-second news summary that sounds natural when read aloud. Focus on actionable insights and business opportunities.

WORKSPACE CONTEXT:
- Company: ${context.workspaceName}
- Target Industries: ${context.targetIndustries.join(', ')}
- Focus Areas: ${context.focusAreas.join(', ')}

RECENT NEWS ARTICLES:
${articlesText}

REQUIREMENTS:
1. Write in Adrata's professional, actionable tone
2. Optimize for voice reading (90 seconds when spoken)
3. Focus on business implications and opportunities
4. Highlight buying signals and competitive intelligence
5. Use clear, conversational language
6. Include specific company/industry names when relevant

Return ONLY a JSON object with this exact format:
{
  "summary": "Your 90-second summary here, written for voice reading...",
  "keyInsights": [
    "Key insight 1",
    "Key insight 2", 
    "Key insight 3"
  ],
  "topArticles": [
    "Article title 1",
    "Article title 2",
    "Article title 3"
  ]
}

Make it sound like a professional business briefing that would be valuable for a sales team.`;
  }

  /**
   * Parse Claude's summary response
   */
  private parseSummaryResponse(content: string, articles: any[]): {
    summary: string;
    keyInsights: string[];
    topArticles: string[];
  } {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        summary: parsed.summary || 'No summary generated',
        keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
        topArticles: Array.isArray(parsed.topArticles) ? parsed.topArticles : []
      };
    } catch (error) {
      console.error('❌ [NEWS_SUMMARY] Failed to parse Claude response:', error);
      return this.generateBasicSummary(articles, { workspaceId: '', workspaceName: '', targetIndustries: [], focusAreas: [] });
    }
  }

  /**
   * Generate basic summary fallback (no AI)
   */
  private generateBasicSummary(articles: any[], context: SummaryContext): {
    summary: string;
    keyInsights: string[];
    topArticles: string[];
  } {
    const topArticles = articles.slice(0, 3).map(a => a.title);
    
    const categoryCounts = articles.reduce((acc, article) => {
      acc[article.category] = (acc[article.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const insights = [];
    if (categoryCounts.COMPANY > 0) insights.push(`${categoryCounts.COMPANY} company-related articles`);
    if (categoryCounts.PERSON > 0) insights.push(`${categoryCounts.PERSON} person-related articles`);
    if (categoryCounts.INDUSTRY > 0) insights.push(`${categoryCounts.INDUSTRY} industry-related articles`);

    const summary = `Here's your ${context.workspaceName} news briefing. We've tracked ${articles.length} relevant articles this week. ${insights.join(', ')}. The top stories include ${topArticles.slice(0, 2).join(' and ')}. These developments could present new opportunities for your sales team.`;

    return {
      summary,
      keyInsights: insights,
      topArticles
    };
  }

  /**
   * Create empty summary when no articles
   */
  private createEmptySummary(workspaceId: string): NewsSummary {
    return {
      id: `empty-${workspaceId}-${Date.now()}`,
      workspaceId,
      summary: "No recent news articles found. We'll continue monitoring for relevant updates in your target industries and companies.",
      keyInsights: [],
      topArticles: [],
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
    };
  }

  /**
   * Save summary to database
   */
  private async saveSummary(workspaceId: string, summary: any, articles: any[]): Promise<NewsSummary> {
    const summaryData = {
      id: `summary-${workspaceId}-${Date.now()}`,
      workspaceId,
      summary: summary.summary,
      keyInsights: summary.keyInsights,
      topArticles: summary.topArticles,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
    };

    // For now, we'll return the summary without persisting to database
    // TODO: Create news_summaries table if needed for caching
    return summaryData;
  }

  /**
   * Get cached summary for workspace
   */
  async getCachedSummary(workspaceId: string): Promise<NewsSummary | null> {
    // TODO: Implement caching logic with news_summaries table
    return null;
  }

  /**
   * Check if summary needs refresh
   */
  async shouldRefreshSummary(workspaceId: string): Promise<boolean> {
    const cached = await this.getCachedSummary(workspaceId);
    if (!cached) return true;
    
    return new Date() > cached.expiresAt;
  }

  /**
   * Format summary for voice reading
   */
  formatForVoice(summary: NewsSummary): string {
    let voiceText = summary.summary;
    
    // Add key insights if available
    if (summary.keyInsights.length > 0) {
      voiceText += ` Key insights: ${summary.keyInsights.join('. ')}.`;
    }
    
    // Add top articles if available
    if (summary.topArticles.length > 0) {
      voiceText += ` Top stories: ${summary.topArticles.join(', ')}.`;
    }
    
    return voiceText;
  }
}

// Export singleton instance
export const newsAISummaryService = new NewsAISummaryService();
