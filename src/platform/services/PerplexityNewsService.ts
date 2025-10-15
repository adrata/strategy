/**
 * PerplexityNewsService
 * 
 * Real-time news and intelligence service using Perplexity AI
 * Provides live market intelligence for companies and people
 */

export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string;
  content?: string;
}

export interface HiringData {
  role: string;
  department: string;
  location: string;
  description: string;
  date: string;
  source: string;
}

export interface CompanyIntelligence {
  recentNews: NewsArticle[];
  hiringTrends: HiringData[];
  technologyChanges: string[];
  fundingEvents: any[];
  leadershipChanges: string[];
  painPoints: string[];
  strategicInitiatives: string[];
}

export interface PersonIntelligence {
  recentNews: NewsArticle[];
  jobChanges: any[];
  awards: any[];
  mentions: any[];
  professionalUpdates: any[];
}

export class PerplexityNewsService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ [PERPLEXITY_NEWS] Perplexity API key not found');
    }
  }

  /**
   * Get comprehensive company intelligence
   */
  async getCompanyIntelligence(companyName: string): Promise<CompanyIntelligence> {
    if (!this.apiKey) {
      return this.getEmptyIntelligence();
    }

    try {
      console.log(`📰 [PERPLEXITY_NEWS] Fetching intelligence for: ${companyName}`);

      const [recentNews, hiringTrends, technologyChanges, fundingEvents, leadershipChanges, painPoints, strategicInitiatives] = await Promise.all([
        this.getRecentNews(companyName),
        this.getHiringTrends(companyName),
        this.getTechnologyChanges(companyName),
        this.getFundingEvents(companyName),
        this.getLeadershipChanges(companyName),
        this.getPainPoints(companyName),
        this.getStrategicInitiatives(companyName)
      ]);

      return {
        recentNews,
        hiringTrends,
        technologyChanges,
        fundingEvents,
        leadershipChanges,
        painPoints,
        strategicInitiatives
      };

    } catch (error) {
      console.error(`❌ [PERPLEXITY_NEWS] Error fetching company intelligence:`, error);
      return this.getEmptyIntelligence();
    }
  }

  /**
   * Get person-specific intelligence
   */
  async getPersonIntelligence(personName: string, companyName?: string): Promise<PersonIntelligence> {
    if (!this.apiKey) {
      return this.getEmptyPersonIntelligence();
    }

    try {
      console.log(`👤 [PERPLEXITY_NEWS] Fetching intelligence for: ${personName}`);

      const [recentNews, jobChanges, awards, mentions, professionalUpdates] = await Promise.all([
        this.getPersonNews(personName, companyName),
        this.getJobChanges(personName, companyName),
        this.getAwards(personName, companyName),
        this.getMentions(personName, companyName),
        this.getProfessionalUpdates(personName, companyName)
      ]);

      return {
        recentNews,
        jobChanges,
        awards,
        mentions,
        professionalUpdates
      };

    } catch (error) {
      console.error(`❌ [PERPLEXITY_NEWS] Error fetching person intelligence:`, error);
      return this.getEmptyPersonIntelligence();
    }
  }

  /**
   * Get recent news for a company
   */
  private async getRecentNews(companyName: string): Promise<NewsArticle[]> {
    const response = await this.callPerplexityAPI(
      `Find recent news articles about ${companyName} from the last 30 days. Include business news, product launches, partnerships, and industry developments. Return as JSON array with title, description, source, publishedAt, url, and content fields.`
    );

    return this.parseNewsResponse(response);
  }

  /**
   * Get hiring trends for a company
   */
  private async getHiringTrends(companyName: string): Promise<HiringData[]> {
    const response = await this.callPerplexityAPI(
      `Find recent job postings and hiring trends for ${companyName}. Include key roles being hired, department expansion, and growth indicators. Return as JSON array with role, department, location, description, date, and source fields.`
    );

    return this.parseHiringResponse(response);
  }

  /**
   * Get technology changes for a company
   */
  private async getTechnologyChanges(companyName: string): Promise<string[]> {
    const response = await this.callPerplexityAPI(
      `Find recent technology announcements, acquisitions, or changes for ${companyName}. Include new technologies adopted, digital transformation initiatives, and tech stack updates. Return as JSON array of technology changes.`
    );

    return this.parseStringArrayResponse(response);
  }

  /**
   * Get funding events for a company
   */
  private async getFundingEvents(companyName: string): Promise<any[]> {
    const response = await this.callPerplexityAPI(
      `Find recent funding events, acquisitions, or financial news for ${companyName}. Include funding rounds, acquisitions, IPOs, or other financial developments. Return as JSON array with funding details.`
    );

    return this.parseArrayResponse(response);
  }

  /**
   * Get leadership changes for a company
   */
  private async getLeadershipChanges(companyName: string): Promise<string[]> {
    const response = await this.callPerplexityAPI(
      `Find recent leadership changes, executive appointments, or organizational changes for ${companyName}. Include CEO changes, C-level appointments, and strategic hires. Return as JSON array of leadership changes.`
    );

    return this.parseStringArrayResponse(response);
  }

  /**
   * Get pain points for a company
   */
  private async getPainPoints(companyName: string): Promise<string[]> {
    const response = await this.callPerplexityAPI(
      `Identify potential pain points or challenges mentioned for ${companyName} in recent news. Look for mentions of problems, challenges, or areas needing improvement. Return as JSON array of pain points.`
    );

    return this.parseStringArrayResponse(response);
  }

  /**
   * Get strategic initiatives for a company
   */
  private async getStrategicInitiatives(companyName: string): Promise<string[]> {
    const response = await this.callPerplexityAPI(
      `Find recent strategic initiatives, business plans, or company directions for ${companyName}. Include new business strategies, market expansion, or strategic partnerships. Return as JSON array of strategic initiatives.`
    );

    return this.parseStringArrayResponse(response);
  }

  /**
   * Get person-specific news
   */
  private async getPersonNews(personName: string, companyName?: string): Promise<NewsArticle[]> {
    const query = companyName 
      ? `Find recent news about ${personName} at ${companyName}`
      : `Find recent news about ${personName}`;

    const response = await this.callPerplexityAPI(
      `${query}. Include professional achievements, interviews, speaking engagements, or industry mentions. Return as JSON array with title, description, source, publishedAt, url, and content fields.`
    );

    return this.parseNewsResponse(response);
  }

  /**
   * Get job changes for a person
   */
  private async getJobChanges(personName: string, companyName?: string): Promise<any[]> {
    const query = companyName 
      ? `Find recent job changes or career moves for ${personName} at ${companyName}`
      : `Find recent job changes or career moves for ${personName}`;

    const response = await this.callPerplexityAPI(
      `${query}. Include promotions, role changes, or company moves. Return as JSON array with job change details.`
    );

    return this.parseArrayResponse(response);
  }

  /**
   * Get awards for a person
   */
  private async getAwards(personName: string, companyName?: string): Promise<any[]> {
    const query = companyName 
      ? `Find recent awards or recognition for ${personName} at ${companyName}`
      : `Find recent awards or recognition for ${personName}`;

    const response = await this.callPerplexityAPI(
      `${query}. Include industry awards, recognition, or honors. Return as JSON array with award details.`
    );

    return this.parseArrayResponse(response);
  }

  /**
   * Get mentions for a person
   */
  private async getMentions(personName: string, companyName?: string): Promise<any[]> {
    const query = companyName 
      ? `Find recent mentions of ${personName} at ${companyName} in industry publications`
      : `Find recent mentions of ${personName} in industry publications`;

    const response = await this.callPerplexityAPI(
      `${query}. Include quotes, interviews, or industry commentary. Return as JSON array with mention details.`
    );

    return this.parseArrayResponse(response);
  }

  /**
   * Get professional updates for a person
   */
  private async getProfessionalUpdates(personName: string, companyName?: string): Promise<any[]> {
    const query = companyName 
      ? `Find recent professional updates for ${personName} at ${companyName}`
      : `Find recent professional updates for ${personName}`;

    const response = await this.callPerplexityAPI(
      `${query}. Include LinkedIn updates, speaking engagements, or professional activities. Return as JSON array with update details.`
    );

    return this.parseArrayResponse(response);
  }

  /**
   * Call Perplexity API
   */
  private async callPerplexityAPI(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Parse news response
   */
  private parseNewsResponse(response: string): NewsArticle[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('⚠️ [PERPLEXITY_NEWS] Failed to parse news response:', error);
      return [];
    }
  }

  /**
   * Parse hiring response
   */
  private parseHiringResponse(response: string): HiringData[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('⚠️ [PERPLEXITY_NEWS] Failed to parse hiring response:', error);
      return [];
    }
  }

  /**
   * Parse string array response
   */
  private parseStringArrayResponse(response: string): string[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('⚠️ [PERPLEXITY_NEWS] Failed to parse string array response:', error);
      return [];
    }
  }

  /**
   * Parse array response
   */
  private parseArrayResponse(response: string): any[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('⚠️ [PERPLEXITY_NEWS] Failed to parse array response:', error);
      return [];
    }
  }

  /**
   * Get empty intelligence when API is unavailable
   */
  private getEmptyIntelligence(): CompanyIntelligence {
    return {
      recentNews: [],
      hiringTrends: [],
      technologyChanges: [],
      fundingEvents: [],
      leadershipChanges: [],
      painPoints: [],
      strategicInitiatives: []
    };
  }

  /**
   * Get empty person intelligence when API is unavailable
   */
  private getEmptyPersonIntelligence(): PersonIntelligence {
    return {
      recentNews: [],
      jobChanges: [],
      awards: [],
      mentions: [],
      professionalUpdates: []
    };
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; apiKey: boolean } {
    return {
      available: this.isAvailable(),
      apiKey: !!this.apiKey
    };
  }
}
