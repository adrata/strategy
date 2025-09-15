/**
 * 🌐 ENHANCED WEB RESEARCH SERVICE - 2025
 * 
 * Provides real-time web research capabilities using multiple sources
 * Integrates Perplexity, Google Search, and other web APIs for comprehensive data
 */

export interface WebResearchRequest {
  query: string;
  context?: {
    company?: string;
    person?: string;
    industry?: string;
    timeframe?: 'recent' | 'current' | 'historical';
  };
  options?: {
    maxResults?: number;
    includeImages?: boolean;
    includeRelated?: boolean;
    language?: string;
  };
}

export interface WebResearchResult {
  content: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    date?: string;
  }>;
  confidence: number;
  processingTime: number;
  model: string;
}

export class WebResearchService {
  private perplexityApiKey: string | null = null;
  private googleApiKey: string | null = null;
  private serpApiKey: string | null = null;

  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || null;
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || null;
    this.serpApiKey = process.env.SERP_API_KEY || null;
  }

  /**
   * 🔍 MAIN WEB RESEARCH METHOD
   * Performs comprehensive web research using multiple sources
   */
  async performResearch(request: WebResearchRequest): Promise<WebResearchResult> {
    const startTime = Date.now();

    try {
      // Try multiple research methods in parallel for best results
      const [perplexityResult, googleResult] = await Promise.allSettled([
        this.perplexityResearch(request),
        this.googleResearch(request)
      ]);

      // Combine results for comprehensive research
      const combinedResult = this.combineResearchResults(
        perplexityResult.status === 'fulfilled' ? perplexityResult.value : null,
        googleResult.status === 'fulfilled' ? googleResult.value : null,
        request
      );

      return {
        ...combinedResult,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Web research error:', error);
      return {
        content: 'Unable to perform web research at this time.',
        sources: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        model: 'error'
      };
    }
  }

  /**
   * 🤖 PERPLEXITY AI RESEARCH
   * Uses latest Perplexity models with web access
   */
  private async perplexityResearch(request: WebResearchRequest): Promise<WebResearchResult> {
    if (!this.perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const enhancedQuery = this.enhanceQuery(request.query, request.context);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.perplexityApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online', // Latest model with web access
        messages: [{ role: 'user', content: enhancedQuery }],
        temperature: 0.1,
        max_tokens: 2000,
        // Enable web search for real-time data
        search_domain_filter: ["perplexity.ai"],
        return_images: request.options?.includeImages || false,
        return_related_questions: request.options?.includeRelated || false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract sources from citations
    const sources = this.extractPerplexitySources(data);

    return {
      content,
      sources,
      confidence: 0.9,
      processingTime: 0, // Will be set by caller
      model: 'perplexity-llama-3.1-sonar'
    };
  }

  /**
   * 🔍 GOOGLE SEARCH RESEARCH
   * Uses Google Custom Search API for comprehensive results
   */
  private async googleResearch(request: WebResearchRequest): Promise<WebResearchResult> {
    if (!this.googleApiKey) {
      throw new Error('Google Search API key not configured');
    }

    const searchQuery = this.buildGoogleQuery(request);
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${this.googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}&num=${request.options?.maxResults || 10}`
    );

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data = await response.json();
    const sources = data.items?.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      date: item.pagemap?.metatags?.[0]?.['article:published_time']
    })) || [];

    // Use AI to synthesize the search results
    const synthesizedContent = await this.synthesizeSearchResults(sources, request.query);

    return {
      content: synthesizedContent,
      sources,
      confidence: 0.85,
      processingTime: 0, // Will be set by caller
      model: 'google-search-synthesis'
    };
  }

  /**
   * 🔗 COMBINE RESEARCH RESULTS
   * Merges results from multiple sources for comprehensive research
   */
  private combineResearchResults(
    perplexityResult: WebResearchResult | null,
    googleResult: WebResearchResult | null,
    request: WebResearchRequest
  ): WebResearchResult {
    let content = '';
    let sources: any[] = [];
    let confidence = 0;
    let model = 'combined';

    if (perplexityResult && googleResult) {
      // Combine both results
      content = `${perplexityResult.content}\n\nAdditional Research:\n${googleResult.content}`;
      sources = [...perplexityResult.sources, ...googleResult.sources];
      confidence = Math.max(perplexityResult.confidence, googleResult.confidence);
      model = 'perplexity-google-combined';
    } else if (perplexityResult) {
      content = perplexityResult.content;
      sources = perplexityResult.sources;
      confidence = perplexityResult.confidence;
      model = perplexityResult.model;
    } else if (googleResult) {
      content = googleResult.content;
      sources = googleResult.sources;
      confidence = googleResult.confidence;
      model = googleResult.model;
    } else {
      content = 'No web research results available.';
      sources = [];
      confidence = 0;
      model = 'none';
    }

    // Remove duplicate sources
    const uniqueSources = sources.filter((source, index, self) => 
      index === self.findIndex(s => s.url === source.url)
    );

    return {
      content,
      sources: uniqueSources,
      confidence,
      processingTime: 0, // Will be set by caller
      model
    };
  }

  /**
   * 🛠️ HELPER METHODS
   */
  private enhanceQuery(query: string, context?: WebResearchRequest['context']): string {
    let enhancedQuery = query;

    if (context?.company) {
      enhancedQuery += ` related to ${context.company}`;
    }
    if (context?.person) {
      enhancedQuery += ` about ${context.person}`;
    }
    if (context?.industry) {
      enhancedQuery += ` in the ${context.industry} industry`;
    }
    if (context?.timeframe === 'recent') {
      enhancedQuery += ' recent news and updates';
    }

    return enhancedQuery;
  }

  private buildGoogleQuery(request: WebResearchRequest): string {
    let query = request.query;

    if (request.context?.timeframe === 'recent') {
      query += ' site:linkedin.com OR site:crunchbase.com OR site:techcrunch.com';
    }

    return query;
  }

  private extractPerplexitySources(data: any): Array<{ title: string; url: string; snippet: string }> {
    // Extract sources from Perplexity response
    // This would parse the citations from the response
    return [];
  }

  private async synthesizeSearchResults(sources: any[], query: string): Promise<string> {
    // Use AI to synthesize search results into coherent content
    // This would call your AI service to process the search results
    return sources.map(source => `${source.title}: ${source.snippet}`).join('\n\n');
  }

  /**
   * 🎯 SPECIALIZED RESEARCH METHODS
   */
  async researchCompany(companyName: string): Promise<WebResearchResult> {
    return this.performResearch({
      query: `Latest news, financial performance, strategic initiatives, and market position of ${companyName}`,
      context: {
        company: companyName,
        timeframe: 'recent'
      }
    });
  }

  async researchPerson(personName: string, company?: string): Promise<WebResearchResult> {
    return this.performResearch({
      query: `Professional background, recent achievements, and current role of ${personName}`,
      context: {
        person: personName,
        company,
        timeframe: 'recent'
      }
    });
  }

  async researchIndustry(industry: string): Promise<WebResearchResult> {
    return this.performResearch({
      query: `Latest trends, market dynamics, and key developments in ${industry}`,
      context: {
        industry,
        timeframe: 'recent'
      }
    });
  }
}

export const webResearchService = new WebResearchService();
