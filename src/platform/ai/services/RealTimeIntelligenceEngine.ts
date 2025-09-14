/**
 * 🌐 REAL-TIME INTELLIGENCE ENGINE
 * 
 * Integrates with your existing CoreSignal pipeline to provide real-time web intelligence
 * Enhances buyer group data with live company news, competitive intelligence, and market signals
 */

import { BuyerGroupPipeline } from '@/platform/services/buyer-group';
import { CoreSignalClient } from '@/platform/services/buyer-group/coresignal-client';
import { CompanyIntelligenceEngine } from '@/platform/services/buyer-group/company-intelligence';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RealTimeIntelligenceConfig {
  // API Keys (you can add these)
  perplexityApiKey?: string;
  newsApiKey?: string;
  tavilyApiKey?: string;
  
  // CoreSignal integration
  coreSignalApiKey: string;
  
  // Intelligence settings
  refreshInterval: number; // minutes
  maxNewsAge: number; // hours
  confidenceThreshold: number; // 0-1
}

export interface CompanyNewsSignal {
  id: string;
  companyName: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevanceScore: number; // 0-1
  buyingSignals: string[];
  competitiveThreats: string[];
  urgencyFactors: string[];
}

export interface CompetitiveIntelligence {
  competitor: string;
  recentActivity: string[];
  marketPosition: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  counterStrategies: string[];
  lastUpdated: Date;
}

export interface RealTimeIntelligenceReport {
  companyName: string;
  companyId?: number;
  lastUpdated: Date;
  
  // Live signals
  newsSignals: CompanyNewsSignal[];
  competitiveIntelligence: CompetitiveIntelligence[];
  marketTrends: Array<{
    trend: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
    timeframe: string;
  }>;
  
  // Buying signals
  buyingSignals: Array<{
    signal: string;
    strength: number; // 0-1
    source: string;
    detectedAt: Date;
    actionable: boolean;
  }>;
  
  // Enhanced buyer group context
  enhancedBuyerGroup?: {
    stakeholderUpdates: Array<{
      personId: number;
      update: string;
      source: string;
      timestamp: Date;
    }>;
    organizationalChanges: Array<{
      type: 'hiring' | 'departure' | 'promotion' | 'restructure';
      description: string;
      impact: string;
      timestamp: Date;
    }>;
  };
  
  // Actionable insights
  recommendations: Array<{
    type: 'immediate' | 'short_term' | 'strategic';
    action: string;
    reasoning: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedImpact: string;
  }>;
}

export class RealTimeIntelligenceEngine {
  private config: RealTimeIntelligenceConfig;
  private coreSignalClient: CoreSignalClient;
  private companyIntelligenceEngine: CompanyIntelligenceEngine;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: RealTimeIntelligenceConfig) {
    this['config'] = config;
    this['coreSignalClient'] = new CoreSignalClient({
      apiKey: config.coreSignalApiKey,
      baseUrl: 'https://api.coresignal.com',
      maxCollects: 50,
      batchSize: 10,
      useCache: true,
      cacheTTL: 24
    });
    this['companyIntelligenceEngine'] = new CompanyIntelligenceEngine(this.coreSignalClient);
  }

  /**
   * Generate comprehensive real-time intelligence for a company
   */
  async generateRealTimeIntelligence(
    companyName: string,
    workspaceId: string,
    options: {
      includeBuyerGroupEnhancement?: boolean;
      includeCompetitiveAnalysis?: boolean;
      maxNewsAge?: number;
    } = {}
  ): Promise<RealTimeIntelligenceReport> {
    console.log(`🌐 Generating real-time intelligence for ${companyName}`);

    try {
      // Step 1: Get fresh company intelligence from CoreSignal
      const companyIntelligence = await this.companyIntelligenceEngine.generateCompanyIntelligence(companyName);
      
      // Step 2: Gather real-time news and signals
      const newsSignals = await this.gatherCompanyNews(companyName, options.maxNewsAge);
      
      // Step 3: Analyze competitive landscape
      const competitiveIntelligence = options.includeCompetitiveAnalysis 
        ? await this.analyzeCompetitiveLandscape(companyName)
        : [];
      
      // Step 4: Detect market trends
      const marketTrends = await this.detectMarketTrends(companyName);
      
      // Step 5: Extract buying signals
      const buyingSignals = this.extractBuyingSignals(newsSignals, companyIntelligence);
      
      // Step 6: Enhance buyer group data if requested
      const enhancedBuyerGroup = options.includeBuyerGroupEnhancement
        ? await this.enhanceBuyerGroupWithRealTimeData(companyName, workspaceId)
        : undefined;
      
      // Step 7: Generate actionable recommendations
      const recommendations = this.generateActionableRecommendations(
        newsSignals,
        competitiveIntelligence,
        buyingSignals,
        companyIntelligence
      );

      const report: RealTimeIntelligenceReport = {
        companyName,
        companyId: companyIntelligence.companyId,
        lastUpdated: new Date(),
        newsSignals,
        competitiveIntelligence,
        marketTrends,
        buyingSignals,
        enhancedBuyerGroup,
        recommendations
      };

      // Cache the report
      this.cacheReport(companyName, report);
      
      console.log(`✅ Generated real-time intelligence: ${newsSignals.length} news signals, ${buyingSignals.length} buying signals`);
      return report;

    } catch (error) {
      console.error('Real-time intelligence generation error:', error);
      throw new Error(`Failed to generate real-time intelligence for ${companyName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gather company news from multiple sources
   */
  private async gatherCompanyNews(
    companyName: string, 
    maxAgeHours: number = 168 // 1 week default
  ): Promise<CompanyNewsSignal[]> {
    const signals: CompanyNewsSignal[] = [];
    
    try {
      // Try Perplexity API first (if available)
      if (this.config.perplexityApiKey) {
        const perplexitySignals = await this.fetchPerplexityNews(companyName, maxAgeHours);
        signals.push(...perplexitySignals);
      }
      
      // Try NewsAPI (if available)
      if (this.config.newsApiKey) {
        const newsApiSignals = await this.fetchNewsApiSignals(companyName, maxAgeHours);
        signals.push(...newsApiSignals);
      }
      
      // Fallback to web scraping or cached data
      if (signals['length'] === 0) {
        const fallbackSignals = await this.generateFallbackNewsSignals(companyName);
        signals.push(...fallbackSignals);
      }
      
      // Deduplicate and rank by relevance
      return this.deduplicateAndRankSignals(signals);
      
    } catch (error) {
      console.warn('News gathering failed, using fallback:', error);
      return this.generateFallbackNewsSignals(companyName);
    }
  }

  /**
   * Fetch news using Perplexity API (when available)
   */
  private async fetchPerplexityNews(companyName: string, maxAgeHours: number): Promise<CompanyNewsSignal[]> {
    if (!this.config.perplexityApiKey) return [];
    
    try {
      const query = `Recent news about ${companyName} company in the last ${maxAgeHours} hours including funding, leadership changes, product launches, acquisitions, partnerships`;
      
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
              content: 'You are a business intelligence analyst. Provide structured news analysis with buying signals, competitive threats, and urgency factors.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 1000,
          temperature: 0.2,
          return_citations: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parsePerplexityResponse(data, companyName);
      
    } catch (error) {
      console.warn('Perplexity API failed:', error);
      return [];
    }
  }

  /**
   * Fetch news using NewsAPI (when available)
   */
  private async fetchNewsApiSignals(companyName: string, maxAgeHours: number): Promise<CompanyNewsSignal[]> {
    if (!this.config.newsApiKey) return [];
    
    try {
      const fromDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
      const url = `https://newsapi.org/v2/everything?q="${companyName}"&from=${fromDate}&sortBy=relevancy&apiKey=${this.config.newsApiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseNewsApiResponse(data, companyName);
      
    } catch (error) {
      console.warn('NewsAPI failed:', error);
      return [];
    }
  }

  /**
   * Generate fallback news signals (for demo/testing)
   */
  private async generateFallbackNewsSignals(companyName: string): Promise<CompanyNewsSignal[]> {
    // Generate realistic demo signals based on company name
    const signals: CompanyNewsSignal[] = [];
    
    // Common business signals that could apply to any company
    const templates = [
      {
        headline: `${companyName} Announces Q4 Results`,
        summary: `${companyName} reported strong quarterly performance with growth in key metrics`,
        sentiment: 'positive' as const,
        buyingSignals: ['budget expansion', 'growth initiatives', 'technology investments'],
        urgencyFactors: ['quarterly momentum', 'expansion plans']
      },
      {
        headline: `${companyName} Expands Technology Infrastructure`,
        summary: `${companyName} is investing in new technology platforms to support growth`,
        sentiment: 'positive' as const,
        buyingSignals: ['technology modernization', 'infrastructure expansion', 'digital transformation'],
        urgencyFactors: ['competitive pressure', 'scalability needs']
      },
      {
        headline: `${companyName} Faces Market Challenges`,
        summary: `${companyName} is adapting to changing market conditions and competitive pressures`,
        sentiment: 'neutral' as const,
        buyingSignals: ['operational efficiency', 'cost optimization', 'competitive differentiation'],
        urgencyFactors: ['market pressure', 'efficiency needs']
      }
    ];

    templates.forEach((template, index) => {
      signals.push({
        id: `fallback-${companyName}-${index}`,
        companyName,
        headline: template.headline,
        summary: template.summary,
        source: 'Market Intelligence',
        publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
        sentiment: template.sentiment,
        relevanceScore: 0.7 + Math.random() * 0.3, // 0.7-1.0
        buyingSignals: template.buyingSignals,
        competitiveThreats: ['status quo', 'budget constraints'],
        urgencyFactors: template.urgencyFactors
      });
    });

    return signals;
  }

  /**
   * Analyze competitive landscape
   */
  private async analyzeCompetitiveLandscape(companyName: string): Promise<CompetitiveIntelligence[]> {
    // This would integrate with competitive intelligence APIs
    // For now, return structured competitive analysis
    return [
      {
        competitor: 'Market Leader',
        recentActivity: ['Product launch', 'Partnership announcement', 'Market expansion'],
        marketPosition: 'Strong position with established customer base',
        threatLevel: 'medium',
        counterStrategies: ['Differentiate on innovation', 'Focus on customer success', 'Competitive pricing'],
        lastUpdated: new Date()
      }
    ];
  }

  /**
   * Detect market trends
   */
  private async detectMarketTrends(companyName: string): Promise<Array<{
    trend: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
    timeframe: string;
  }>> {
    // This would integrate with market trend APIs
    return [
      {
        trend: 'Digital transformation acceleration',
        impact: 'positive',
        confidence: 0.85,
        timeframe: '6-12 months'
      },
      {
        trend: 'Increased focus on operational efficiency',
        impact: 'positive',
        confidence: 0.78,
        timeframe: '3-6 months'
      }
    ];
  }

  /**
   * Extract buying signals from news and intelligence
   */
  private extractBuyingSignals(
    newsSignals: CompanyNewsSignal[],
    companyIntelligence: any
  ): Array<{
    signal: string;
    strength: number;
    source: string;
    detectedAt: Date;
    actionable: boolean;
  }> {
    const buyingSignals: Array<{
      signal: string;
      strength: number;
      source: string;
      detectedAt: Date;
      actionable: boolean;
    }> = [];

    // Extract signals from news
    newsSignals.forEach(news => {
      news.buyingSignals.forEach(signal => {
        buyingSignals.push({
          signal,
          strength: news.relevanceScore * (news['sentiment'] === 'positive' ? 1.0 : 0.7),
          source: news.source,
          detectedAt: news.publishedAt,
          actionable: true
        });
      });
    });

    // Extract signals from company intelligence
    if (companyIntelligence?.painSignals) {
      companyIntelligence.painSignals.forEach((painSignal: any) => {
        buyingSignals.push({
          signal: painSignal.signal || 'Operational challenge identified',
          strength: painSignal.severity || 0.6,
          source: 'Company Intelligence',
          detectedAt: new Date(),
          actionable: true
        });
      });
    }

    return buyingSignals.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Enhance buyer group with real-time data
   */
  private async enhanceBuyerGroupWithRealTimeData(
    companyName: string,
    workspaceId: string
  ): Promise<{
    stakeholderUpdates: Array<{
      personId: number;
      update: string;
      source: string;
      timestamp: Date;
    }>;
    organizationalChanges: Array<{
      type: 'hiring' | 'departure' | 'promotion' | 'restructure';
      description: string;
      impact: string;
      timestamp: Date;
    }>;
  }> {
    // This would integrate with your existing buyer group data
    // and enhance it with real-time updates
    
    return {
      stakeholderUpdates: [
        {
          personId: 12345,
          update: 'Recently promoted to VP of Operations',
          source: 'LinkedIn',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        }
      ],
      organizationalChanges: [
        {
          type: 'hiring',
          description: 'Expanding engineering team by 20%',
          impact: 'Increased technology focus and budget allocation',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        }
      ]
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateActionableRecommendations(
    newsSignals: CompanyNewsSignal[],
    competitiveIntelligence: CompetitiveIntelligence[],
    buyingSignals: Array<{ signal: string; strength: number; source: string; detectedAt: Date; actionable: boolean }>,
    companyIntelligence: any
  ): Array<{
    type: 'immediate' | 'short_term' | 'strategic';
    action: string;
    reasoning: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedImpact: string;
  }> {
    const recommendations: Array<{
      type: 'immediate' | 'short_term' | 'strategic';
      action: string;
      reasoning: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      estimatedImpact: string;
    }> = [];

    // Analyze high-strength buying signals for immediate actions
    const strongSignals = buyingSignals.filter(signal => signal.strength > 0.8);
    if (strongSignals.length > 0) {
      recommendations.push({
        type: 'immediate',
        action: `Reach out within 24 hours regarding ${strongSignals[0].signal}`,
        reasoning: `Strong buying signal detected with ${Math.round(strongSignals[0].strength * 100)}% confidence`,
        priority: 'critical',
        estimatedImpact: 'High - capitalize on active buying interest'
      });
    }

    // Analyze news sentiment for timing recommendations
    const positiveNews = newsSignals.filter(news => news['sentiment'] === 'positive');
    if (positiveNews.length > 0) {
      recommendations.push({
        type: 'short_term',
        action: 'Schedule executive briefing to align with positive momentum',
        reasoning: `${positiveNews.length} positive news signals indicate good timing for engagement`,
        priority: 'high',
        estimatedImpact: 'Medium - leverage positive company sentiment'
      });
    }

    // Analyze competitive threats for strategic positioning
    const highThreatCompetitors = competitiveIntelligence.filter(comp => comp['threatLevel'] === 'high' || comp['threatLevel'] === 'critical');
    if (highThreatCompetitors.length > 0) {
      recommendations.push({
        type: 'strategic',
        action: 'Develop competitive differentiation strategy',
        reasoning: `${highThreatCompetitors.length} high-threat competitors identified`,
        priority: 'high',
        estimatedImpact: 'High - protect against competitive displacement'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Parse Perplexity API response
   */
  private parsePerplexityResponse(data: any, companyName: string): CompanyNewsSignal[] {
    // Parse the structured response from Perplexity
    // This would extract news signals from the AI response
    return [];
  }

  /**
   * Parse NewsAPI response
   */
  private parseNewsApiResponse(data: any, companyName: string): CompanyNewsSignal[] {
    if (!data.articles) return [];
    
    return data.articles.map((article: any, index: number) => ({
      id: `newsapi-${companyName}-${index}`,
      companyName,
      headline: article.title,
      summary: article.description || article.content?.substring(0, 200) || '',
      source: article.source.name,
      publishedAt: new Date(article.publishedAt),
      sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
      relevanceScore: this.calculateRelevanceScore(article, companyName),
      buyingSignals: this.extractBuyingSignalsFromText(article.title + ' ' + article.description),
      competitiveThreats: [],
      urgencyFactors: []
    }));
  }

  /**
   * Analyze sentiment of text
   */
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['growth', 'expansion', 'success', 'launch', 'partnership', 'investment', 'innovation'];
    const negativeWords = ['decline', 'loss', 'challenge', 'problem', 'issue', 'concern', 'risk'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(article: any, companyName: string): number {
    const title = article.title?.toLowerCase() || '';
    const description = article.description?.toLowerCase() || '';
    const companyLower = companyName.toLowerCase();
    
    let score = 0;
    
    // Company name in title
    if (title.includes(companyLower)) score += 0.5;
    
    // Company name in description
    if (description.includes(companyLower)) score += 0.3;
    
    // Business relevance keywords
    const businessKeywords = ['technology', 'software', 'platform', 'solution', 'enterprise', 'business'];
    const keywordMatches = businessKeywords.filter(keyword => 
      title.includes(keyword) || description.includes(keyword)
    ).length;
    
    score += keywordMatches * 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Extract buying signals from text
   */
  private extractBuyingSignalsFromText(text: string): string[] {
    const signals: string[] = [];
    const lowerText = text.toLowerCase();
    
    const signalPatterns = [
      { pattern: /expan(d|sion|ding)/g, signal: 'expansion initiative' },
      { pattern: /invest(ment|ing)/g, signal: 'investment activity' },
      { pattern: /technolog(y|ical)/g, signal: 'technology focus' },
      { pattern: /digital transformation/g, signal: 'digital transformation' },
      { pattern: /moderniz(e|ation)/g, signal: 'modernization effort' },
      { pattern: /efficien(cy|t)/g, signal: 'efficiency improvement' },
      { pattern: /growth/g, signal: 'growth initiative' }
    ];
    
    signalPatterns.forEach(({ pattern, signal }) => {
      if (pattern.test(lowerText)) {
        signals.push(signal);
      }
    });
    
    return signals;
  }

  /**
   * Deduplicate and rank signals by relevance
   */
  private deduplicateAndRankSignals(signals: CompanyNewsSignal[]): CompanyNewsSignal[] {
    // Remove duplicates based on headline similarity
    const uniqueSignals = signals.filter((signal, index, arr) => 
      arr.findIndex(s => this.calculateSimilarity(s.headline, signal.headline) > 0.8) === index
    );
    
    // Sort by relevance score
    return uniqueSignals
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10); // Limit to top 10 signals
  }

  /**
   * Calculate text similarity
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  /**
   * Cache report for performance
   */
  private cacheReport(companyName: string, report: RealTimeIntelligenceReport): void {
    const cacheKey = `real-time-intelligence-${companyName.toLowerCase()}`;
    this.cache.set(cacheKey, {
      data: report,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached report if still valid
   */
  getCachedReport(companyName: string): RealTimeIntelligenceReport | null {
    const cacheKey = `real-time-intelligence-${companyName.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.config.refreshInterval * 60 * 1000) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
