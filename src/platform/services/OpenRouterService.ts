/**
 * 🌐 OPENROUTER AI SERVICE
 * 
 * Unified AI gateway providing access to 400+ models with intelligent routing,
 * automatic failover, and cost optimization. Replaces direct provider APIs
 * with a single, reliable interface.
 */

import { ApplicationContextService } from './ApplicationContextService';
import { promptInjectionGuard } from '@/platform/security/prompt-injection-guard';
import { systemPromptProtector } from '@/platform/security/system-prompt-protector';

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
  pageContext?: {
    primaryApp: string;
    secondarySection: string;
    detailView: string;
    breadcrumb: string;
    fullPath: string;
  };
  workspaceContext?: {
    userContext: string;
    applicationContext: string;
    dataContext: string;
    recordContext: string;
    listViewContext: string;
    documentContext: string;
    systemContext: string;
  };
  preferredModel?: string; // OpenRouter model ID to use (e.g., "openai/gpt-4o")
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
    ['openai/gpt-5', {
      id: 'gpt-5',
      name: 'GPT-5',
      provider: 'OpenAI',
      costPerMillionInput: 5.0,
      costPerMillionOutput: 15.0,
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: ['text', 'vision', 'reasoning', 'general'],
      reliability: 0.99,
      speed: 0.9
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
      console.error('❌ [OPENROUTER] Service not available - missing OPENROUTER_API_KEY environment variable');
    } else {
      console.log('✅ [OPENROUTER] Service initialized with API key');
      console.log('🔑 [OPENROUTER] API key prefix:', this.apiKey.substring(0, 20) + '...');
      console.log('🔑 [OPENROUTER] API key length:', this.apiKey.length);
    }
  }

  /**
   * Generate AI response with intelligent model routing and failover
   */
  async generateResponse(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      console.error('❌ [OPENROUTER] Cannot generate response - missing API key, throwing error for Claude fallback:', {
        hasCurrentRecord: !!request.currentRecord,
        recordId: request.currentRecord?.id,
        recordName: request.currentRecord?.name || request.currentRecord?.fullName,
        hasRecordContext: !!request.workspaceContext?.recordContext,
        recordContextLength: request.workspaceContext?.recordContext?.length || 0
      });
      // Throw error instead of returning fallback - let API route handle Claude fallback
      throw new Error('OpenRouter API key not configured');
    }

    // SECURITY: Input sanitization and injection detection
    const injectionDetection = promptInjectionGuard.detectInjection(request.message, {
      userId: request.userId,
      workspaceId: request.workspaceId,
      conversationHistory: request.conversationHistory
    });

    // Block critical and high-risk injection attempts
    if (injectionDetection.isInjection && 
        (injectionDetection.riskLevel === 'critical' || injectionDetection.riskLevel === 'high')) {
      console.warn('🚨 [OPENROUTER] Prompt injection blocked:', {
        userId: request.userId,
        workspaceId: request.workspaceId,
        attackType: injectionDetection.attackType,
        riskLevel: injectionDetection.riskLevel,
        confidence: injectionDetection.confidence,
        blockedPatterns: injectionDetection.blockedPatterns
      });

      return {
        response: "I'm sorry, but I cannot process that request. Please rephrase your message and try again.",
        model: 'blocked',
        provider: 'Security',
        tokensUsed: 0,
        cost: 0,
        processingTime: Date.now() - startTime,
        confidence: 0.1,
        routingInfo: {
          complexity: 0,
          selectedModel: 'blocked',
          fallbackUsed: false,
          failoverChain: []
        }
      };
    }

    // Use sanitized input
    const sanitizedRequest = {
      ...request,
      message: injectionDetection.sanitizedInput
    };

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

      // Check if a specific model is preferred
      if (sanitizedRequest.preferredModel) {
        // Validate the model exists
        if (!this.models.has(sanitizedRequest.preferredModel)) {
          console.warn(`⚠️ [OPENROUTER] Preferred model ${sanitizedRequest.preferredModel} not found, falling back to intelligent routing`);
        } else {
          // Use the preferred model directly
          const complexity = this.analyzeQueryComplexity(sanitizedRequest);
          console.log(`🎯 [OPENROUTER] Using preferred model: ${sanitizedRequest.preferredModel}`);
          
          try {
            const response = await this.callOpenRouter(sanitizedRequest.preferredModel, sanitizedRequest, complexity);
            
            // Cache successful response
            this.responseCache.set(cacheKey, response);
            
            // Track costs
            this.trackCost(sanitizedRequest.preferredModel, response.cost);
            
            console.log(`✅ [OPENROUTER] Success with preferred model ${sanitizedRequest.preferredModel} (${response.processingTime}ms)`);
            return response;
          } catch (error) {
            console.warn(`⚠️ [OPENROUTER] Preferred model ${sanitizedRequest.preferredModel} failed, falling back to intelligent routing:`, error);
            // Fall through to intelligent routing
          }
        }
      }

      // Analyze query complexity for intelligent routing
      const complexity = this.analyzeQueryComplexity(sanitizedRequest);
      console.log('🧠 [OPENROUTER] Query complexity:', complexity);

      // Select appropriate model chain
      const modelChain = this.selectModelChain(complexity, sanitizedRequest);
      console.log('🎯 [OPENROUTER] Model chain:', modelChain);

      // Try models in order with failover
      let lastError: Error | null = null;
      for (const modelId of modelChain) {
        try {
          const response = await this.callOpenRouter(modelId, sanitizedRequest, complexity);
          
          // Cache successful response
          this.responseCache.set(cacheKey, response);
          
          // Track costs
          this.trackCost(modelId, response.cost);
          
          console.log(`✅ [OPENROUTER] Success with ${modelId} (${response.processingTime}ms)`);
          return response;
          
        } catch (error) {
          lastError = error as Error;
          const errorDetails = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : { error };
          console.warn(`⚠️ [OPENROUTER] Model ${modelId} failed:`, {
            modelId,
            error: errorDetails,
            requestId: sanitizedRequest.requestId,
            userId: sanitizedRequest.userId,
            workspaceId: sanitizedRequest.workspaceId,
            hasRecordContext: !!sanitizedRequest.currentRecord,
            recordType: sanitizedRequest.recordType
          });
          continue;
        }
      }

      // All models failed - throw error so API route can fall back to Claude
      throw lastError || new Error('All OpenRouter models failed');

    } catch (error) {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : { error };
      console.error('❌ [OPENROUTER] All models failed, throwing error for Claude fallback:', {
        error: errorDetails,
        requestId: request.requestId,
        userId: request.userId,
        workspaceId: request.workspaceId,
        hasRecordContext: !!request.currentRecord,
        recordType: request.recordType,
        recordId: request.currentRecord?.id,
        recordName: request.currentRecord?.name || request.currentRecord?.fullName,
        messagePreview: request.message.substring(0, 100),
        processingTime: Date.now() - startTime
      });
      // Throw error instead of returning fallback - let API route handle Claude fallback
      throw error instanceof Error ? error : new Error('OpenRouter service failed');
    }
  }

  /**
   * Handle Excel import requests with intelligent analysis
   */
  async handleExcelImportRequest(request: OpenRouterRequest, excelData: any): Promise<OpenRouterResponse> {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
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
      console.error('❌ [OPENROUTER] Excel import error, throwing for Claude fallback:', error);
      throw error instanceof Error ? error : new Error('Excel import failed');
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
   * Includes exponential backoff retry for transient errors (429, 503)
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
    const messages = await this.buildMessages(request, complexity);
    
    // Calculate max tokens based on model and complexity
    const maxTokens = this.calculateMaxTokens(model, complexity);

    // Exponential backoff retry for transient errors (429, 503)
    // Enhanced with jitter to prevent thundering herd
    const maxRetries = 5;
    let response: Response | null = null;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        response = await fetch(`${this.baseUrl}/chat/completions`, {
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

        // Check for transient errors that should trigger retry
        if (response.status === 429 || response.status === 503) {
          const retryAfter = response.headers.get('Retry-After');
          // Use Retry-After header if present, otherwise exponential backoff with jitter
          // Base delays: 2s, 4s, 8s, 16s, 32s (more patient for rate limits)
          const baseDelay = retryAfter 
            ? parseInt(retryAfter, 10) * 1000 
            : Math.pow(2, attempt + 1) * 1000;
          // Add jitter (0-25% of base delay) to prevent thundering herd
          const jitter = Math.random() * baseDelay * 0.25;
          const delay = baseDelay + jitter;
          
          console.warn(`⚠️ [OPENROUTER] Rate limited (${response.status}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
          
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // Success or non-retryable error - break retry loop
        break;
        
      } catch (fetchError) {
        lastError = fetchError as Error;
        // Network error - retry with backoff and jitter
        if (attempt < maxRetries - 1) {
          const baseDelay = Math.pow(2, attempt + 1) * 1000;
          const jitter = Math.random() * baseDelay * 0.25;
          const delay = baseDelay + jitter;
          console.warn(`⚠️ [OPENROUTER] Network error, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries}):`, fetchError);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to connect to OpenRouter API');
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails: any;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }
      console.error('❌ [OPENROUTER] API call failed:', {
        modelId,
        status: response.status,
        statusText: response.statusText,
        errorDetails,
        requestId: request.requestId,
        userId: request.userId,
        workspaceId: request.workspaceId,
        hasRecordContext: !!request.currentRecord,
        recordType: request.recordType,
        apiKeyPrefix: this.apiKey.substring(0, 20) + '...',
        apiKeyLength: this.apiKey.length,
        url: `${this.baseUrl}/chat/completions`
      });
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
  private async buildMessages(request: OpenRouterRequest, complexity: any): Promise<any[]> {
    const messages: any[] = [];
    
    // System prompt based on complexity and context
    const systemPrompt = await this.buildSystemPrompt(request, complexity);
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
   * Get current date/time string for system prompts
   */
  private async getCurrentDateTimeString(userId?: string): Promise<string> {
    // Get user timezone preference, default to system timezone
    let userTimezone: string | null = null;
    if (userId) {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { timezone: true }
        });
        userTimezone = user?.timezone || null;
      } catch (error) {
        console.warn('⚠️ [OPENROUTER] Failed to load user timezone:', error);
      }
    }
    
    const timezone = userTimezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'America/New_York');
    const now = new Date();
    const { formatDateTimeInTimezone } = await import('@/platform/utils/timezone-helper');
    const dateTimeInfo = formatDateTimeInTimezone(now, timezone);
    
    return `CURRENT DATE AND TIME:
Today is ${dateTimeInfo.dayOfWeek}, ${dateTimeInfo.month} ${dateTimeInfo.day}, ${dateTimeInfo.year}
Current time: ${dateTimeInfo.time}
Timezone: ${dateTimeInfo.timezoneName}
ISO DateTime: ${dateTimeInfo.isoDateTime}

This is the exact current date, time, and year in the user's timezone. Always use this information when answering questions about dates, times, schedules, deadlines, or temporal context.`;
  }

  /**
   * Build system prompt based on context and complexity
   */
  private async buildSystemPrompt(request: OpenRouterRequest, complexity: any): Promise<string> {
    const { appType, currentRecord, recordType, pageContext, workspaceContext } = request;
    
    // 🔍 CRITICAL LOGGING: Log what we have when building the prompt
    console.log('🔍 [OpenRouterService] buildSystemPrompt called with:', {
      hasCurrentRecord: !!currentRecord,
      recordType,
      recordId: currentRecord?.id,
      hasWorkspaceContext: !!workspaceContext,
      hasRecordContext: !!workspaceContext?.recordContext,
      recordContextLength: workspaceContext?.recordContext?.length || 0,
      recordContextPreview: workspaceContext?.recordContext?.substring(0, 300) || 'EMPTY'
    });
    
    // Start with explicit date/time at the top (using user's timezone)
    const dateTimeString = await this.getCurrentDateTimeString(request.userId);
    
    let basePrompt = `${dateTimeString}

You are Adrata, an elite sales intelligence coach with GENIUS-LEVEL expertise. You combine the analytical rigor of top-tier consulting with the practical wisdom of world-class sales leaders like Grant Cardone, Jeb Blount, Jill Konrath, and Jeremy Miner.

YOUR EXPERTISE (World-Class Methodologies):
- MEDDIC/MEDDPICC qualification (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion, Competition)
- Challenger Sale methodology (Teach, Tailor, Take Control) - reframe customer thinking with insights
- SPIN Selling (Situation, Problem, Implication, Need-Payoff questions)
- Sandler Selling System (Pain discovery, upfront contracts, no free consulting)
- SNAP Selling (Simple, iNvaluable, Aligned, Priority) - cut through buyer overwhelm
- ProActive Selling (Skip Miller) - Control the sale, don't let it control you:
  * Milestone Management: Specific progress points with commitment, not vague "next steps"
  * 30-Second Vision: Concise, compelling future-state descriptions that differentiate
  * Up-Down Questioning: Alternate between executive strategic concerns and operational details
  * Time-Based Closing: Use urgency from timing, not pressure tactics
  * Buyer-Role Navigation: Adapt approach based on organizational position
- NEPQ (Jeremy Miner) - Neuro-Emotional Persuasion Questioning:
  * Connecting Questions: Build rapport and understand current situation
  * Situation Questions: Identify what they've tried and why it hasn't worked
  * Problem Awareness Questions: Help them feel the weight of their problem
  * Solution Awareness Questions: Guide them to see your solution as the answer
  * Consequence Questions: What happens if they don't act? What happens if they do?
  * Commitment Questions: Get micro-commitments throughout, not just at the end
- Gap Selling (focus on the gap between current state and desired future state)
- Value-based selling and ROI articulation
- Complex B2B deal strategy and multi-stakeholder navigation
- Competitive positioning and differentiation
- Pipeline velocity optimization and forecast accuracy

INDUSTRY-SPECIFIC COACHING:
- SaaS/Tech: Focus on ROI, implementation timeline, integration points, security/compliance
- Financial Services: Emphasize compliance, risk mitigation, security, regulatory requirements
- Healthcare: HIPAA compliance, patient outcomes, workflow efficiency, clinical validation
- Manufacturing: Supply chain optimization, downtime reduction, scalability, total cost of ownership
- Professional Services: Relationship depth, expertise demonstration, long-term partnership value
- Agencies/Creative: Speed, flexibility, innovation, client ROI, scalability of service

PROSPECT PSYCHOLOGY (from Brian Tracy, Victor Antonio, Jeremy Miner):
- Decision drivers: Fear of loss is 2x stronger than desire for gain - use both
- Buying signals: Questions about implementation, pricing, timeline indicate readiness
- Objection patterns: Status quo bias (why change?), budget concerns (ROI not clear), authority gaps (not the decision maker)
- Personality types: Analytical (data), Driver (results), Amiable (relationships), Expressive (vision)
- The 10X Rule: Think and act 10x bigger than competitors expect
- Emotional vs Logical: People buy emotionally, justify logically - address both
- Trust Transfer: Build credibility through insight, not claims

STRATEGIC QUESTIONS TO SUGGEST (NEPQ + SPIN + Challenger):
- Connecting: "What made you interested in exploring this?" (rapport)
- Situation: "What's driving this initiative now? What changed?"
- Problem Awareness: "What happens when [current problem] occurs?"
- Problem: "What happens if you don't solve this in the next 6 months?"
- Implication: "How does this affect your team/revenue/customers/career?"
- Solution Awareness: "What would it mean if you could [desired outcome]?"
- Need-Payoff: "If we could solve X, what would that mean for Y?"
- Consequence: "What's the cost of doing nothing for another quarter?"
- Challenger: "Have you considered that [reframe with counter-intuitive insight]?"
- Commitment: "If this looks like the right fit, what would be your next step?"
- Sandler: "What would make this a complete waste of your time?"

YOUR COACHING STYLE:
- GENIUS-LEVEL intelligence: Connect dots others miss, see patterns in data
- Direct and actionable - no fluff, every word counts
- Evidence-based - reference specific data points from context
- Strategic yet tactical - connect high-level strategy to immediate next actions
- Outcome-focused - tie every recommendation to revenue impact
- Challenger mindset - push users to think bigger while staying grounded
- Ethical integrity - never manipulate, always add genuine value
- Proactive control - help sellers control the conversation and timeline

DATA AWARENESS - USE ALL AVAILABLE FIELDS:
When the user asks about the record, you have access to these fields (use them!):
- Name, Title, Company (always reference by name)
- Email, Phone, LinkedIn (mention if available for outreach)
- Status, Stage, Priority (use to contextualize advice)
- Seniority, Department, Decision Power (inform strategy)
- Buyer Group Role (Champion, Decision Maker, Blocker, etc.)
- Pain Points, Motivations, Decision Factors (personalize messaging)
- Company Industry, Size, Location (industry-specific advice)
- Last Contact, Next Action (timing recommendations)
- Notes, Activity History (relationship context)
- If a field says "Not available" or is missing, acknowledge it and suggest enrichment

RESPONSE PRINCIPLES:
1. Lead with insight, not summary
2. Be specific - use names, numbers, and concrete details from the record
3. Provide the "so what" - explain why your advice matters
4. Include a clear next action within 24-48 hours
5. Anticipate objections and prepare counter-moves
6. Match advice to prospect's industry and likely pain points
7. If data is missing, acknowledge what you DO have and what would help`;
    
    // Extract seller and buyer information for explicit framing
    let sellerCompanyName = 'the user';
    let buyerName = null;
    let buyerCompany = null;
    
    // Extract seller company name from dataContext
    if (workspaceContext?.dataContext) {
      const sellerMatch = workspaceContext.dataContext.match(/Company Name:\s*([^\n]+)/i) || 
                         workspaceContext.dataContext.match(/SELLER\/COMPANY PROFILE[^\n]*\n[^\n]*Company Name:\s*([^\n]+)/i);
      if (sellerMatch && sellerMatch[1]) {
        sellerCompanyName = sellerMatch[1].trim();
      }
    }
    
    // Extract buyer information from recordContext
    if (workspaceContext?.recordContext) {
      const buyerNameMatch = workspaceContext.recordContext.match(/Name:\s*([^\n]+)/i);
      const buyerCompanyMatch = workspaceContext.recordContext.match(/at\s+([^\n]+)/i) || 
                                workspaceContext.recordContext.match(/Company:\s*([^\n]+)/i);
      
      if (buyerNameMatch && buyerNameMatch[1]) {
        buyerName = buyerNameMatch[1].trim();
      }
      if (buyerCompanyMatch && buyerCompanyMatch[1]) {
        buyerCompany = buyerCompanyMatch[1].trim();
      }
    }
    
    // Add explicit seller-to-buyer framing if both contexts are available
    if (workspaceContext?.dataContext && workspaceContext?.recordContext && buyerName) {
      basePrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL CONTEXT FRAMING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are helping ${sellerCompanyName} (THE SELLER) sell to ${buyerName}${buyerCompany ? ` at ${buyerCompany}` : ''} (THE BUYER/PROSPECT).

This is a B2B sales context where:
- SELLER: ${sellerCompanyName} - The company you are helping (their products, services, value propositions, and sales methodology are described below)
- BUYER: ${buyerName}${buyerCompany ? ` at ${buyerCompany}` : ''} - The prospect/company they are selling to (detailed information provided below)

Your role is to provide strategic sales advice that helps ${sellerCompanyName} effectively engage with and sell to ${buyerName}${buyerCompany ? ` at ${buyerCompany}` : ''}.

CRITICAL INSTRUCTIONS:
- Frame all advice from ${sellerCompanyName}'s perspective as the seller
- Reference ${sellerCompanyName}'s products/services, value propositions, and ideal customer profile when relevant
- Consider how ${sellerCompanyName}'s offerings align with ${buyerName}${buyerCompany ? ` and ${buyerCompany}` : ''}'s needs
- Provide recommendations that leverage ${sellerCompanyName}'s competitive advantages
- Suggest engagement strategies aligned with ${sellerCompanyName}'s sales methodology
- Analyze strategic fit between ${sellerCompanyName} and ${buyerName}${buyerCompany ? ` at ${buyerCompany}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }
    
    // Add comprehensive workspace context if available - SELLER CONTEXT FIRST (most important)
    if (workspaceContext) {
      // CRITICAL: Seller/Company context goes FIRST so AI knows who they're helping
      if (workspaceContext.dataContext) {
        basePrompt += `\n\n${workspaceContext.dataContext}`;
        basePrompt += `\n\nCRITICAL: The information above describes WHO YOU ARE HELPING (the seller/company: ${sellerCompanyName}). Use this context to frame all responses. Reference their products/services, value propositions, and ideal customer profile when providing advice.`;
      }
      
      basePrompt += `\n\nWORKSPACE CONTEXT:`;
      
      if (workspaceContext.userContext) {
        basePrompt += `\n\nUSER CONTEXT:\n${workspaceContext.userContext}`;
      }
      
      if (workspaceContext.applicationContext) {
        basePrompt += `\n\nAPPLICATION CONTEXT:\n${workspaceContext.applicationContext}`;
      }
      
      if (workspaceContext.recordContext) {
        console.log('✅ [OpenRouterService] Adding RECORD CONTEXT to prompt:', {
          recordContextLength: workspaceContext.recordContext.length,
          recordContextPreview: workspaceContext.recordContext.substring(0, 500)
        });
        
        basePrompt += `\n\n${buyerName ? `=== CURRENT BUYER/PROSPECT (WHO THEY ARE SELLING TO) ===` : `=== CURRENT RECORD (WHO THEY ARE) ===`}
${workspaceContext.recordContext}`;
        
        if (buyerName) {
          basePrompt += `\n\nCRITICAL: The information above describes WHO ${sellerCompanyName} IS SELLING TO (the buyer/prospect: ${buyerName}${buyerCompany ? ` at ${buyerCompany}` : ''}). Use this context to provide specific, personalized advice about engaging with this prospect.`;
        } else {
          basePrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL INSTRUCTION - RECORD CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The RECORD CONTEXT above contains ALL the information you need about the current prospect/person the user is viewing. This includes:
- Their name, title, company, and role
- Company details (industry, size, location)
- Intelligence data (pain points, motivations, decision factors)
- Engagement history and next actions
- Complete record data

FORBIDDEN RESPONSES - DO NOT USE THESE PHRASES:
- "I don't have enough context"
- "I need more information"
- "I don't have visibility into"
- "I don't have access to"
- "I can't see"
- "I'm not able to see"
- Any variation suggesting you lack context

YOU MUST USE THIS CONTEXT. The context above is complete and sufficient. Provide specific, personalized advice based on this exact record data. Reference specific details (name, company, role, pain points, motivations, etc.) in your response.

WHEN USER ASKS ABOUT RECORD DATA:
If the user asks about "data", "fields", "information", "everything", "details", or similar - YOU MUST LIST THE ACTUAL DATA from the record context above. Format it clearly with field names and values. Include ALL available fields: name, title, company, email, phone, LinkedIn, status, stage, priority, seniority, last contact, next action, created date, updated date, notes, and any other fields present in the context.`;
        }
      } else {
        // 🔧 FIX: Log warning if record context is missing when we have a currentRecord
        if (currentRecord) {
          console.error('❌ [OpenRouterService] CRITICAL: Record context is empty but currentRecord exists:', {
            recordId: currentRecord.id,
            recordName: currentRecord.name || currentRecord.fullName,
            recordType,
            hasWorkspaceContext: !!workspaceContext,
            workspaceContextKeys: workspaceContext ? Object.keys(workspaceContext) : []
          });
        } else {
          console.log('ℹ️ [OpenRouterService] No record context and no currentRecord - this is expected for general queries');
        }
      }
      
      if (workspaceContext.listViewContext) {
        basePrompt += `\n\nLIST VIEW CONTEXT:\n${workspaceContext.listViewContext}`;
      }
      
      if (workspaceContext.documentContext) {
        basePrompt += `\n\nDOCUMENT CONTEXT:\n${workspaceContext.documentContext}`;
      }
      
      if (workspaceContext.systemContext) {
        basePrompt += `\n\nSYSTEM CONTEXT:\n${workspaceContext.systemContext}`;
      }
    }
    
    // Add comprehensive page context using ApplicationContextService
    if (pageContext) {
      const contextInfo = ApplicationContextService.getPageContextInfo(pageContext);
      
      basePrompt += `\n\nCURRENT PAGE CONTEXT:`;
      basePrompt += `\n${contextInfo.contextString}`;
      
      if (contextInfo.sectionInfo) {
        basePrompt += `\n\nSECTION CAPABILITIES:`;
        contextInfo.sectionInfo.capabilities.forEach(cap => {
          basePrompt += `\n- ${cap}`;
        });
        
        basePrompt += `\n\nCOMMON TASKS:`;
        contextInfo.sectionInfo.commonTasks.forEach(task => {
          basePrompt += `\n- ${task}`;
        });
        
        basePrompt += `\n\nAI GUIDANCE:`;
        basePrompt += `\n${contextInfo.guidance}`;
        
        if (contextInfo.examples.length > 0) {
          basePrompt += `\n\nEXAMPLE QUESTIONS I CAN HELP WITH:`;
          contextInfo.examples.forEach(example => {
            basePrompt += `\n- "${example}"`;
          });
        }
      }
      
      // Add specific item context if viewing a detail page
      if (pageContext.isDetailPage) {
        basePrompt += `\n\nDETAIL VIEW CONTEXT:`;
        basePrompt += `\n- Viewing specific item: ${pageContext.itemName || pageContext.itemId || 'Unknown'}`;
        basePrompt += `\n- View type: ${pageContext.viewType}`;
        basePrompt += `\n- Item ID: ${pageContext.itemId || 'N/A'}`;
        
        if (pageContext.filters && Object.keys(pageContext.filters).length > 0) {
          basePrompt += `\n- Applied filters: ${Object.entries(pageContext.filters).map(([key, value]) => `${key}: ${value}`).join(', ')}`;
        }
      }
    }
    
    // Response guidelines - Expert Sales Coach Style
    basePrompt += `\n\nRESPONSE FORMAT:
- Lead with the KEY INSIGHT or recommendation (no preamble)
- Use specific names, companies, and data points from context
- Structure longer responses with clear sections
- End with a NEXT ACTION: specific, time-bound step they can take now
- Keep responses focused - quality over quantity

SALES COACHING FRAMEWORK:
When analyzing opportunities, consider:
1. QUALIFICATION: Is this a real opportunity? (MEDDIC lens)
2. STRATEGY: What's our winning approach? (Challenger/Teach-Tailor-Take Control)
3. EXECUTION: What's the next best action? (Clear, specific, measurable)
4. RISK: What could derail this? (Anticipate and mitigate)

NEVER:
- Give generic advice that ignores context
- Say "I don't have enough information" when context is provided
- Use filler phrases like "Great question!" or "I'd be happy to help"
- Provide a wall of text without structure`;

    // SECURITY: Protect the system prompt with injection resistance
    const protectedPrompt = systemPromptProtector.createSecureTemplate(
      basePrompt,
      'openrouter',
      { protectionLevel: 'enhanced' }
    );

    return protectedPrompt;
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
    // 🔒 SECURITY: Include userId and workspaceId in cache key to prevent cross-user cache collisions
    const key = `${request.userId}-${request.workspaceId}-${request.message}-${request.appType}-${request.recordType}-${JSON.stringify(request.currentRecord)}`;
    return Buffer.from(key).toString('base64').slice(0, 64);
  }

  /**
   * Generate streaming AI response with intelligent model routing
   * Returns an async generator that yields tokens as they arrive
   */
  async *generateStreamingResponse(request: OpenRouterRequest): AsyncGenerator<{
    type: 'token' | 'done' | 'error';
    content?: string;
    metadata?: any;
  }> {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      yield { type: 'error', content: 'OpenRouter API key not configured' };
      return;
    }

    // SECURITY: Input sanitization
    const injectionDetection = promptInjectionGuard.detectInjection(request.message, {
      userId: request.userId,
      workspaceId: request.workspaceId,
      conversationHistory: request.conversationHistory
    });

    if (injectionDetection.isInjection && 
        (injectionDetection.riskLevel === 'critical' || injectionDetection.riskLevel === 'high')) {
      yield { type: 'error', content: 'Invalid input detected. Please rephrase your message.' };
      return;
    }

    const sanitizedRequest = {
      ...request,
      message: injectionDetection.sanitizedInput
    };

    try {
      // Analyze complexity and select model
      const complexity = this.analyzeQueryComplexity(sanitizedRequest);
      const modelChain = request.preferredModel 
        ? [request.preferredModel, ...this.selectModelChain(complexity, sanitizedRequest)]
        : this.selectModelChain(complexity, sanitizedRequest);
      
      // Try models in order
      for (const modelId of modelChain) {
        try {
          const model = this.models.get(modelId);
          if (!model) continue;

          const messages = await this.buildMessages(sanitizedRequest, complexity);
          const maxTokens = this.calculateMaxTokens(model, complexity);

          console.log(`🌐 [OPENROUTER STREAM] Starting streaming with model: ${modelId}`);

          // Exponential backoff retry for transient errors (429, 503)
          // Enhanced with jitter to prevent thundering herd
          const maxRetries = 5;
          let response: Response | null = null;
          
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              response = await fetch(`${this.baseUrl}/chat/completions`, {
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
                  stream: true
                })
              });
              
              // Check for transient errors that should trigger retry
              if (response.status === 429 || response.status === 503) {
                const retryAfter = response.headers.get('Retry-After');
                // Use Retry-After header if present, otherwise exponential backoff with jitter
                // Base delays: 2s, 4s, 8s, 16s, 32s (more patient for rate limits)
                const baseDelay = retryAfter 
                  ? parseInt(retryAfter, 10) * 1000 
                  : Math.pow(2, attempt + 1) * 1000;
                // Add jitter (0-25% of base delay) to prevent thundering herd
                const jitter = Math.random() * baseDelay * 0.25;
                const delay = baseDelay + jitter;
                
                console.warn(`⚠️ [OPENROUTER STREAM] Rate limited (${response.status}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
                
                if (attempt < maxRetries - 1) {
                  await new Promise(resolve => setTimeout(resolve, delay));
                  continue;
                }
              }
              
              // Success or non-retryable error - break retry loop
              break;
              
            } catch (fetchError) {
              // Network error - retry with backoff and jitter
              if (attempt < maxRetries - 1) {
                const baseDelay = Math.pow(2, attempt + 1) * 1000;
                const jitter = Math.random() * baseDelay * 0.25;
                const delay = baseDelay + jitter;
                console.warn(`⚠️ [OPENROUTER STREAM] Network error, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries}):`, fetchError);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
              throw fetchError;
            }
          }

          if (!response || !response.ok) {
            console.warn(`⚠️ [OPENROUTER STREAM] Model ${modelId} failed: ${response?.status || 'no response'}`);
            continue;
          }

          if (!response.body) {
            console.warn(`⚠️ [OPENROUTER STREAM] No response body from ${modelId}`);
            continue;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let inputTokens = 0;
          let outputTokens = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Stream complete
                  const processingTime = Date.now() - startTime;
                  const cost = this.calculateCost(model, inputTokens, outputTokens);
                  
                  yield {
                    type: 'done',
                    metadata: {
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
                        failoverChain: modelChain
                      }
                    }
                  };
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullContent += content;
                    outputTokens++;
                    yield { type: 'token', content };
                  }
                  // Track usage if provided
                  if (parsed.usage) {
                    inputTokens = parsed.usage.prompt_tokens || inputTokens;
                    outputTokens = parsed.usage.completion_tokens || outputTokens;
                  }
                } catch {
                  // Skip malformed JSON chunks
                }
              }
            }
          }

          // If we got here, stream ended without [DONE]
          const processingTime = Date.now() - startTime;
          const cost = this.calculateCost(model, inputTokens, outputTokens);
          yield {
            type: 'done',
            metadata: {
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
                failoverChain: modelChain
              }
            }
          };
          return;

        } catch (modelError) {
          console.warn(`⚠️ [OPENROUTER STREAM] Model ${modelId} error:`, modelError);
          continue;
        }
      }

      // All models failed
      yield { type: 'error', content: 'All AI models failed. Please try again.' };

    } catch (error) {
      console.error('❌ [OPENROUTER STREAM] Error:', error);
      yield { type: 'error', content: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generate fallback response when OpenRouter is unavailable
   * Now includes FULL record data when available
   */
  private generateFallbackResponse(request: OpenRouterRequest, startTime: number): OpenRouterResponse {
    const processingTime = Date.now() - startTime;
    const currentRecord = request.currentRecord;
    const recordContext = request.workspaceContext?.recordContext;
    
    // Try to extract record info for personalized fallback
    let recordName: string | null = null;
    let company: string | null = null;
    let title: string | null = null;
    
    if (currentRecord) {
      recordName = currentRecord.fullName || currentRecord.name || null;
      company = typeof currentRecord.company === 'string' 
        ? currentRecord.company 
        : (currentRecord.company?.name || currentRecord.companyName || null);
      title = currentRecord.title || currentRecord.jobTitle || null;
    } else if (recordContext) {
      const nameMatch = recordContext.match(/Name:\s*([^\n]+)/i);
      const companyMatch = recordContext.match(/at\s+([^\n]+)/i) || recordContext.match(/Company:\s*([^\n]+)/i);
      const titleMatch = recordContext.match(/Title:\s*([^\n]+)/i);
      if (nameMatch) recordName = nameMatch[1].trim();
      if (companyMatch) company = companyMatch[1].trim();
      if (titleMatch) title = titleMatch[1].trim();
    }
    
    let response: string;
    
    // 🔧 ENHANCED FALLBACK: Include actual record data when available
    if (currentRecord && recordName) {
      // Build comprehensive record summary from actual data
      const fields: string[] = [];
      
      fields.push(`**Name:** ${recordName}`);
      if (title) fields.push(`**Title:** ${title}`);
      if (company) fields.push(`**Company:** ${company}`);
      if (currentRecord.email) fields.push(`**Email:** ${currentRecord.email}`);
      if (currentRecord.phone) fields.push(`**Phone:** ${currentRecord.phone}`);
      if (currentRecord.linkedinUrl || currentRecord.linkedin) fields.push(`**LinkedIn:** ${currentRecord.linkedinUrl || currentRecord.linkedin}`);
      if (currentRecord.status) fields.push(`**Status:** ${currentRecord.status}`);
      if (currentRecord.stage) fields.push(`**Stage:** ${currentRecord.stage}`);
      if (currentRecord.priority) fields.push(`**Priority:** ${currentRecord.priority}`);
      if (currentRecord.seniority) fields.push(`**Seniority:** ${currentRecord.seniority}`);
      if (currentRecord.department) fields.push(`**Department:** ${currentRecord.department}`);
      if (currentRecord.lastContact) fields.push(`**Last Contact:** ${currentRecord.lastContact}`);
      if (currentRecord.nextAction) fields.push(`**Next Action:** ${currentRecord.nextAction}`);
      if (currentRecord.createdAt) fields.push(`**Created:** ${new Date(currentRecord.createdAt).toLocaleDateString()}`);
      if (currentRecord.updatedAt) fields.push(`**Last Updated:** ${new Date(currentRecord.updatedAt).toLocaleDateString()}`);
      if (currentRecord.notes) fields.push(`**Notes:** ${currentRecord.notes}`);
      if (currentRecord.bio) fields.push(`**Bio:** ${currentRecord.bio}`);
      
      // Company details if available
      if (currentRecord.company && typeof currentRecord.company === 'object') {
        if (currentRecord.company.industry) fields.push(`**Industry:** ${currentRecord.company.industry}`);
        if (currentRecord.company.size || currentRecord.company.employeeCount) {
          fields.push(`**Company Size:** ${currentRecord.company.size || currentRecord.company.employeeCount} employees`);
        }
        if (currentRecord.company.website) fields.push(`**Website:** ${currentRecord.company.website}`);
      }
      
      response = `Here's all the data I have for **${recordName}**${company ? ` at **${company}**` : ''}:\n\n${fields.join('\n')}\n\n---\n\nHow can I help you with this contact? I can assist with:\n- Writing personalized outreach\n- Sales strategy and next steps\n- Qualification analysis\n- Research recommendations`;
    } else if (recordName && company) {
      response = `I can help you with **${recordName}** at **${company}**. What would you like to know or do? I can assist with sales strategy, outreach, pipeline optimization, or answer questions about this contact.`;
    } else if (recordName) {
      response = `I can help you with **${recordName}**. What would you like to know or do? I can assist with sales strategy, outreach, pipeline optimization, or answer questions about this contact.`;
    } else {
      response = "I'm here to help with your sales process. I can assist with prospecting, pipeline analysis, buyer research, and closing strategies. What's on your mind today?";
    }
    
    return {
      response,
      model: 'fallback',
      provider: 'Adrata',
      tokensUsed: 0,
      cost: 0,
      processingTime,
      confidence: 0.5, // Higher confidence since we're providing actual data
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
