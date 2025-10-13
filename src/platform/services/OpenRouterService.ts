/**
 * 🌐 OPENROUTER AI SERVICE
 * 
 * Unified AI gateway providing access to 400+ models with intelligent routing,
 * automatic failover, and cost optimization. Replaces direct provider APIs
 * with a single, reliable interface.
 */

export interface OpenRouterRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  currentRecord?: any;
  recordType?: string;
  appType?: string;
  workspaceId?: string;
  userId?: string;
  context?: any;
}

export interface OpenRouterResponse {
  response: string;
  model: string;
  provider: string;
  tokensUsed: number;
  cost: number;
  processingTime: number;
  confidence: number;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  browserResults?: any[];
  routingInfo: {
    complexity: number;
    selectedModel: string;
    fallbackUsed: boolean;
    failoverChain: string[];
  };
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  costPerMillionInput: number;
  costPerMillionOutput: number;
  maxTokens: number;
  contextWindow: number;
  capabilities: string[];
  reliability: number; // 0-1
  speed: number; // 0-1
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private siteUrl: string;
  private appName: string;
  private responseCache: Map<string, OpenRouterResponse> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes
  private costTracker: Map<string, number> = new Map(); // model -> total cost

  // Model configurations with pricing and capabilities
  private models: Map<string, ModelConfig> = new Map([
    // Simple/Cheap models for basic queries
    ['anthropic/claude-haiku-4.0', {
      id: 'claude-haiku-4.0',
      name: 'Claude Haiku 4.0',
      provider: 'Anthropic',
      costPerMillionInput: 0.25,
      costPerMillionOutput: 1.25,
      maxTokens: 4096,
      contextWindow: 200000,
      capabilities: ['text', 'fast', 'cheap'],
      reliability: 0.95,
      speed: 0.9
    }],
    ['openai/gpt-4o-mini', {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'OpenAI',
      costPerMillionInput: 0.15,
      costPerMillionOutput: 0.60,
      maxTokens: 16384,
      contextWindow: 128000,
      capabilities: ['text', 'fast', 'cheap'],
      reliability: 0.98,
      speed: 0.95
    }],
    
    // Standard models for typical queries
    ['anthropic/claude-sonnet-4.5', {
      id: 'claude-sonnet-4.5',
      name: 'Claude Sonnet 4.5',
      provider: 'Anthropic',
      costPerMillionInput: 3.0,
      costPerMillionOutput: 15.0,
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: ['text', 'reasoning', 'analysis'],
      reliability: 0.97,
      speed: 0.8
    }],
    ['openai/gpt-4o', {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      costPerMillionInput: 2.50,
      costPerMillionOutput: 10.0,
      maxTokens: 4096,
      contextWindow: 128000,
      capabilities: ['text', 'vision', 'reasoning'],
      reliability: 0.99,
      speed: 0.85
    }],
    
    // Complex models for advanced queries
    ['anthropic/claude-opus-4.0', {
      id: 'claude-opus-4.0',
      name: 'Claude Opus 4.0',
      provider: 'Anthropic',
      costPerMillionInput: 15.0,
      costPerMillionOutput: 75.0,
      maxTokens: 4096,
      contextWindow: 200000,
      capabilities: ['text', 'advanced-reasoning', 'strategy'],
      reliability: 0.96,
      speed: 0.7
    }],
    ['openai/gpt-4.5-preview', {
      id: 'gpt-4.5-preview',
      name: 'GPT-4.5 Preview',
      provider: 'OpenAI',
      costPerMillionInput: 75.0,
      costPerMillionOutput: 150.0,
      maxTokens: 4096,
      contextWindow: 128000,
      capabilities: ['text', 'advanced-reasoning', 'strategy'],
      reliability: 0.95,
      speed: 0.6
    }],
    
    // Research models
    ['perplexity/llama-3.1-sonar-large-128k-online', {
      id: 'perplexity-research',
      name: 'Perplexity Research',
      provider: 'Perplexity',
      costPerMillionInput: 5.0,
      costPerMillionOutput: 5.0,
      maxTokens: 4096,
      contextWindow: 128000,
      capabilities: ['text', 'web-search', 'real-time'],
      reliability: 0.92,
      speed: 0.75
    }],
    
    // Fast fallback models
    ['google/gemini-2.0-flash-exp', {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'Google',
      costPerMillionInput: 0.75,
      costPerMillionOutput: 3.0,
      maxTokens: 8192,
      contextWindow: 1000000,
      capabilities: ['text', 'fast', 'multimodal'],
      reliability: 0.94,
      speed: 0.9
    }]
  ]);

  // Failover chains for different complexity levels
  private failoverChains = {
    simple: [
      'openai/gpt-4o-mini',
      'anthropic/claude-haiku-4.0',
      'google/gemini-2.0-flash-exp'
    ],
    standard: [
      'anthropic/claude-sonnet-4.5',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-exp',
      'anthropic/claude-haiku-4.0'
    ],
    complex: [
      'anthropic/claude-opus-4.0',
      'openai/gpt-4.5-preview',
      'anthropic/claude-sonnet-4.5',
      'openai/gpt-4o'
    ],
    research: [
      'perplexity/llama-3.1-sonar-large-128k-online',
      'anthropic/claude-sonnet-4.5',
      'openai/gpt-4o'
    ]
  };

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.siteUrl = process.env.OPENROUTER_SITE_URL || 'https://adrata.com';
    this.appName = process.env.OPENROUTER_APP_NAME || 'Adrata AI Assistant';
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter service not available - missing OPENROUTER_API_KEY');
    }
  }

  /**
   * Generate AI response with intelligent model routing and failover
   */
  async generateResponse(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      return this.generateFallbackResponse(request, startTime);
    }

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(request);
      
      // Check cache first
      const cachedResponse = this.responseCache.get(cacheKey);
      if (cachedResponse && (Date.now() - cachedResponse.processingTime) < this.cacheTimeout) {
        console.log('🚀 [OPENROUTER] Using cached response');
        return {
          ...cachedResponse,
          processingTime: Date.now() - startTime
        };
      }

      // Analyze query complexity
      const complexity = this.analyzeQueryComplexity(request);
      console.log('🧠 [OPENROUTER] Query complexity:', complexity);

      // Select appropriate model chain
      const modelChain = this.selectModelChain(complexity, request);
      console.log('🎯 [OPENROUTER] Model chain:', modelChain);

      // Try models in order with failover
      let lastError: Error | null = null;
      for (const modelId of modelChain) {
        try {
          const response = await this.callOpenRouter(modelId, request, complexity);
          
          // Cache successful response
          this.responseCache.set(cacheKey, response);
          
          // Track costs
          this.trackCost(modelId, response.cost);
          
          console.log(`✅ [OPENROUTER] Success with ${modelId} (${response.processingTime}ms)`);
          return response;
          
        } catch (error) {
          lastError = error as Error;
          console.warn(`⚠️ [OPENROUTER] Model ${modelId} failed:`, error);
          continue;
        }
      }

      // All models failed
      throw lastError || new Error('All models failed');

    } catch (error) {
      console.error('❌ [OPENROUTER] All models failed:', error);
      return this.generateFallbackResponse(request, startTime);
    }
  }

  /**
   * Handle Excel import requests with intelligent analysis
   */
  async handleExcelImportRequest(request: OpenRouterRequest, excelData: any): Promise<OpenRouterResponse> {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      return this.generateFallbackResponse(request, startTime);
    }

    try {
      // Use a complex model for Excel analysis
      const modelId = 'anthropic/claude-sonnet-4.5';
      const systemPrompt = this.buildExcelImportPrompt(request, excelData);
      const userMessage = `I've uploaded an Excel file with lead data. Please analyze it and help me import the contacts with appropriate status and connection points. Here's the data structure:\n\n${JSON.stringify(excelData, null, 2)}`;

      const response = await this.callOpenRouter(modelId, {
        ...request,
        message: userMessage,
        systemPrompt
      }, { score: 80, category: 'complex', factors: ['excel-import'] });

      return response;

    } catch (error) {
      console.error('❌ [OPENROUTER] Excel import error:', error);
      return this.generateFallbackResponse(request, startTime);
    }
  }

  /**
   * Build Excel import specific system prompt
   */
  private buildExcelImportPrompt(request: OpenRouterRequest, excelData: any): string {
    return `You are Adrata's Excel import specialist. Your role is to analyze Excel files containing lead/contact data and provide intelligent import recommendations.

📊 EXCEL IMPORT EXPERTISE:
- Analyze Excel structure and column mapping
- Determine appropriate person status (LEAD, PROSPECT, CUSTOMER)
- Identify connection point opportunities
- Suggest data cleaning and deduplication strategies
- Recommend import settings and next actions

🎯 STATUS INTELLIGENCE:
- LEAD: New contacts without engagement history
- PROSPECT: Contacts with some engagement or warm indicators
- CUSTOMER: Existing customers or revenue-generating contacts

🔗 CONNECTION POINT GENERATION:
- Import activity: Always created with timestamp
- Historical activities: From date/interaction columns
- Next actions: Based on lead quality and data completeness

📋 ANALYSIS FRAMEWORK:
1. Examine column headers and data structure
2. Identify key fields (name, email, company, title, etc.)
3. Assess data quality and completeness
4. Determine import type (people, companies, or mixed)
5. Suggest status assignments based on context
6. Recommend connection point creation
7. Provide import confidence score

💡 RESPONSE FORMAT:
Provide a structured analysis including:
- Import type detection
- Column mapping suggestions
- Status recommendations
- Connection point opportunities
- Data quality assessment
- Import confidence score
- Next action recommendations

Be specific and actionable in your recommendations. Focus on maximizing the value of the imported data for sales activities.`;
  }

  /**
   * Analyze query complexity to determine optimal model
   */
  private analyzeQueryComplexity(request: OpenRouterRequest): {
    score: number;
    category: 'simple' | 'standard' | 'complex' | 'research';
    factors: string[];
  } {
    const { message, conversationHistory, currentRecord, recordType } = request;
    let score = 0;
    const factors: string[] = [];

    // Base score from message length
    const messageLength = message.length;
    if (messageLength < 50) {
      score += 10;
      factors.push('short-message');
    } else if (messageLength < 200) {
      score += 30;
      factors.push('medium-message');
    } else {
      score += 50;
      factors.push('long-message');
    }

    // Context complexity
    if (conversationHistory && conversationHistory.length > 3) {
      score += 20;
      factors.push('conversation-history');
    }

    if (currentRecord) {
      score += 15;
      factors.push('record-context');
    }

    // Query type analysis
    const lowerMessage = message.toLowerCase();
    
    // Simple queries
    if (lowerMessage.includes('what is') || 
        lowerMessage.includes('summarize') ||
        lowerMessage.includes('explain briefly') ||
        lowerMessage.match(/^(yes|no|ok|thanks?|thank you)/)) {
      score += 5;
      factors.push('simple-query');
    }

    // Research queries
    if (lowerMessage.includes('search') ||
        lowerMessage.includes('find') ||
        lowerMessage.includes('look up') ||
        lowerMessage.includes('browse') ||
        lowerMessage.includes('http') ||
        lowerMessage.includes('www.') ||
        lowerMessage.includes('latest') ||
        lowerMessage.includes('current')) {
      score += 40;
      factors.push('research-query');
    }

    // Complex queries
    if (lowerMessage.includes('analyze') ||
        lowerMessage.includes('strategy') ||
        lowerMessage.includes('recommend') ||
        lowerMessage.includes('compare') ||
        lowerMessage.includes('evaluate') ||
        lowerMessage.includes('buyer group') ||
        lowerMessage.includes('executive') ||
        lowerMessage.includes('pipeline')) {
      score += 35;
      factors.push('complex-query');
    }

    // Multi-step reasoning
    if (lowerMessage.includes('step') ||
        lowerMessage.includes('process') ||
        lowerMessage.includes('workflow') ||
        lowerMessage.includes('how to') ||
        lowerMessage.includes('guide')) {
      score += 25;
      factors.push('multi-step');
    }

    // Data analysis
    if (lowerMessage.includes('data') ||
        lowerMessage.includes('enrich') ||
        lowerMessage.includes('contact') ||
        lowerMessage.includes('company') ||
        lowerMessage.includes('lead')) {
      score += 20;
      factors.push('data-analysis');
    }

    // Determine category
    let category: 'simple' | 'standard' | 'complex' | 'research';
    if (factors.includes('research-query')) {
      category = 'research';
    } else if (score >= 70) {
      category = 'complex';
    } else if (score >= 30) {
      category = 'standard';
    } else {
      category = 'simple';
    }

    return { score, category, factors };
  }

  /**
   * Select model chain based on complexity
   */
  private selectModelChain(complexity: any, request: OpenRouterRequest): string[] {
    const { category } = complexity;
    
    // Check if this is a research query
    if (category === 'research') {
      return this.failoverChains.research;
    }

    // Return appropriate chain
    return this.failoverChains[category] || this.failoverChains.standard;
  }

  /**
   * Call OpenRouter API with specific model
   */
  private async callOpenRouter(
    modelId: string, 
    request: OpenRouterRequest, 
    complexity: any
  ): Promise<OpenRouterResponse> {
    const startTime = Date.now();
    const model = this.models.get(modelId);
    
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    // Build messages array
    const messages = this.buildMessages(request, complexity);
    
    // Calculate max tokens based on model and complexity
    const maxTokens = this.calculateMaxTokens(model, complexity);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.siteUrl,
        'X-Title': this.appName
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    // Calculate cost
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const cost = this.calculateCost(model, inputTokens, outputTokens);

    return {
      response: data.choices[0]?.message?.content || 'No response generated',
      model: modelId,
      provider: model.provider,
      tokensUsed: inputTokens + outputTokens,
      cost,
      processingTime,
      confidence: this.calculateConfidence(complexity, model, processingTime),
      routingInfo: {
        complexity: complexity.score,
        selectedModel: modelId,
        fallbackUsed: false,
        failoverChain: this.selectModelChain(complexity, request)
      }
    };
  }

  /**
   * Build messages array for API call
   */
  private buildMessages(request: OpenRouterRequest, complexity: any): any[] {
    const messages: any[] = [];
    
    // System prompt based on complexity and context
    const systemPrompt = this.buildSystemPrompt(request, complexity);
    messages.push({ role: 'system', content: systemPrompt });

    // Add conversation history
    if (request.conversationHistory) {
      request.conversationHistory.slice(-5).forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: request.message });

    return messages;
  }

  /**
   * Build system prompt based on context and complexity
   */
  private buildSystemPrompt(request: OpenRouterRequest, complexity: any): string {
    const { appType, currentRecord, recordType } = request;
    
    let prompt = `You are Adrata's AI assistant, specialized in sales intelligence and pipeline optimization. `;
    
    // Add context-specific instructions
    if (currentRecord) {
      prompt += `\n\nCurrent context: You're working with a ${recordType || 'record'} (${currentRecord.name || currentRecord.fullName || 'unnamed'}). `;
    }
    
    if (appType) {
      prompt += `\n\nYou're in the ${appType} application. `;
    }

    // Add complexity-specific instructions
    if (complexity.category === 'research') {
      prompt += `\n\nThis appears to be a research query. Provide comprehensive, up-to-date information with sources when possible.`;
    } else if (complexity.category === 'complex') {
      prompt += `\n\nThis is a complex query requiring strategic analysis. Provide detailed, actionable insights.`;
    } else if (complexity.category === 'simple') {
      prompt += `\n\nThis is a simple query. Provide a concise, direct answer.`;
    }

    prompt += `\n\nAlways be helpful, accurate, and focused on sales intelligence and business outcomes.`;

    return prompt;
  }

  /**
   * Calculate max tokens based on model and complexity
   */
  private calculateMaxTokens(model: ModelConfig, complexity: any): number {
    const baseTokens = Math.min(model.maxTokens, 4096);
    
    if (complexity.category === 'complex') {
      return Math.min(baseTokens, 8192);
    } else if (complexity.category === 'simple') {
      return Math.min(baseTokens, 2048);
    }
    
    return baseTokens;
  }

  /**
   * Calculate cost for tokens used
   */
  private calculateCost(model: ModelConfig, inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000000) * model.costPerMillionInput;
    const outputCost = (outputTokens / 1000000) * model.costPerMillionOutput;
    const totalCost = inputCost + outputCost;
    
    // Add 5% OpenRouter platform fee
    return totalCost * 1.05;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(complexity: any, model: ModelConfig, processingTime: number): number {
    let confidence = 0.8; // Base confidence
    
    // Adjust based on model reliability
    confidence *= model.reliability;
    
    // Adjust based on processing time (faster = more confident)
    if (processingTime < 1000) confidence += 0.1;
    else if (processingTime > 5000) confidence -= 0.1;
    
    // Adjust based on complexity match
    if (complexity.category === 'simple' && model.capabilities.includes('fast')) confidence += 0.1;
    if (complexity.category === 'complex' && model.capabilities.includes('advanced-reasoning')) confidence += 0.1;
    
    return Math.min(1.0, Math.max(0.1, confidence));
  }

  /**
   * Track costs per model
   */
  private trackCost(modelId: string, cost: number): void {
    const current = this.costTracker.get(modelId) || 0;
    this.costTracker.set(modelId, current + cost);
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: OpenRouterRequest): string {
    const key = `${request.message}-${request.appType}-${request.recordType}-${JSON.stringify(request.currentRecord)}`;
    return Buffer.from(key).toString('base64').slice(0, 32);
  }

  /**
   * Generate fallback response when OpenRouter is unavailable
   */
  private generateFallbackResponse(request: OpenRouterRequest, startTime: number): OpenRouterResponse {
    const processingTime = Date.now() - startTime;
    
    return {
      response: "I'm currently experiencing some technical difficulties with my AI models. Please try again in a moment, or feel free to ask me about your sales strategy, pipeline optimization, or any other sales-related questions.",
      model: 'fallback',
      provider: 'Adrata',
      tokensUsed: 0,
      cost: 0,
      processingTime,
      confidence: 0.3,
      routingInfo: {
        complexity: 0,
        selectedModel: 'fallback',
        fallbackUsed: true,
        failoverChain: []
      }
    };
  }

  /**
   * Get cost analytics
   */
  getCostAnalytics(): { model: string; totalCost: number; requests: number }[] {
    return Array.from(this.costTracker.entries()).map(([model, cost]) => ({
      model,
      totalCost: cost,
      requests: 1 // TODO: Track request count separately
    }));
  }

  /**
   * Get available models
   */
  getAvailableModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.responseCache.clear();
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();
