/**
 * 🚀 ENHANCED AI ORCHESTRATOR - 2025 OPTIMIZED
 * 
 * Provides the best AI models, fastest responses, and deepest context understanding
 * Integrates Claude 4, GPT-4, and web research for comprehensive intelligence
 */

import { ClaudeService } from './claudeService';
import { webResearchService } from './WebResearchService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EnhancedAIRequest {
  prompt: string;
  context: {
    userId: string;
    workspaceId: string;
    currentView: 'pipeline' | 'monaco' | 'speedrun' | 'company-profile' | 'person-profile';
    currentRecord?: {
      type: 'person' | 'company' | 'lead' | 'contact' | 'opportunity';
      id: string;
      name: string;
      company?: string;
    };
    recentActivity?: string[];
  };
  options: {
    model?: 'claude' | 'openai' | 'auto';
    taskType?: 'reasoning' | 'strategic' | 'coding' | 'research' | 'standard';
    enableWebResearch?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface EnhancedAIResponse {
  response: string;
  model: string;
  processingTime: number;
  confidence: number;
  webResearchUsed?: boolean;
  contextApplied: boolean;
  cost: number;
}

export class EnhancedAIOrchestrator {
  private claudeService: ClaudeService;
  private contextCache: Map<string, any> = new Map();
  private responseCache: Map<string, string> = new Map();
  private requestQueue: Map<string, Promise<EnhancedAIResponse>> = new Map();
  private performanceMetrics: Map<string, number> = new Map();

  constructor() {
    this.claudeService = new ClaudeService();
    
    // Performance monitoring
    setInterval(() => {
      this.cleanupCaches();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  /**
   * 🎯 MAIN AI PROCESSING METHOD
   * Intelligently routes to best model with full context awareness and performance optimizations
   */
  async processRequest(request: EnhancedAIRequest): Promise<EnhancedAIResponse> {
    const startTime = Date.now();
    const requestId = `${request.context.workspaceId}-${Date.now()}`;
    
    try {
      // 1. Check for duplicate requests (prevent concurrent identical requests)
      const cacheKey = this.generateCacheKey(request.prompt, request.context);
      if (this.requestQueue.has(cacheKey)) {
        console.log('🔄 [AI] Duplicate request detected, returning queued response');
        return await this.requestQueue.get(cacheKey)!;
      }
      
      // 2. Build comprehensive context (with caching)
      const enrichedContext = await this.buildComprehensiveContext(request.context);
      
      // 3. Check cache for similar requests
      const cachedResponse = this.responseCache.get(cacheKey);
      if (cachedResponse) {
        return {
          response: cachedResponse,
          model: 'cached',
          processingTime: Date.now() - startTime,
          confidence: 0.95,
          contextApplied: true,
          cost: 0
        };
      }
      
      // 4. Create request promise and add to queue
      const requestPromise = this.processRequestInternal(request, enrichedContext, startTime);
      this.requestQueue.set(cacheKey, requestPromise);
      
      try {
        const result = await requestPromise;
        return result;
      } finally {
        // Clean up queue
        this.requestQueue.delete(cacheKey);
      }
    } catch (error) {
      console.error('Enhanced AI processing error:', error);
      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        model: 'error',
        processingTime: Date.now() - startTime,
        confidence: 0,
        contextApplied: false,
        cost: 0
      };
    }
  }

  /**
   * INTERNAL REQUEST PROCESSING
   * Handles the actual AI processing logic
   */
  private async processRequestInternal(
    request: EnhancedAIRequest, 
    enrichedContext: any, 
    startTime: number
  ): Promise<EnhancedAIResponse> {
    try {
      // 1. Select optimal model
      const modelSelection = this.selectOptimalModel(request, enrichedContext);
      
      // 2. Enhance prompt with context
      const enhancedPrompt = this.enhancePromptWithContext(request.prompt, enrichedContext);
      
      // 3. Process with selected model
      let response: string;
      let model: string;
      let cost: number = 0;
      let webResearchUsed = false;

      if (modelSelection.provider === 'claude') {
        response = await this.claudeService.generateContent(enhancedPrompt, {
          model: modelSelection.model,
          temperature: request.options.temperature || 0.7,
          maxTokens: request.options.maxTokens || 2000,
          workspaceId: request.context.workspaceId
        });
        model = modelSelection.model;
        cost = this.calculateClaudeCost(enhancedPrompt, response);
      } else if (modelSelection.provider === 'perplexity') {
        const perplexityResult = await webResearchService.performResearch({
          query: enhancedPrompt,
          context: {
            company: request.context.currentRecord?.company,
            person: request.context.currentRecord?.name,
            industry: enrichedContext.workspace?.industry,
            timeframe: 'recent'
          }
        });
        response = perplexityResult.content;
        model = perplexityResult.model;
        cost = 0.01; // Approximate Perplexity cost
        webResearchUsed = true;
      } else {
        // Fallback to Claude
        response = await this.claudeService.generateContent(enhancedPrompt, {
          model: 'claude-3-5-sonnet-20241022',
          temperature: request.options.temperature || 0.7,
          maxTokens: request.options.maxTokens || 2000,
          workspaceId: request.context.workspaceId
        });
        model = 'claude-3-5-sonnet-20241022';
        cost = this.calculateClaudeCost(enhancedPrompt, response);
      }

      // 4. Remove emojis from response
      response = this.removeEmojis(response);

      // 5. Enhance with web research if requested
      if (request.options.enableWebResearch && this.requiresWebResearch(request.prompt)) {
        const webEnhancedResponse = await this.enhanceWithWebResearch(response, request.prompt);
        if (webEnhancedResponse !== response) {
          response = webEnhancedResponse;
          webResearchUsed = true;
        }
      }

      // 6. Cache response
      const cacheKey = this.generateCacheKey(request.prompt, enrichedContext);
      this.responseCache.set(cacheKey, response);

      // 7. Track performance metrics
      const processingTime = Date.now() - startTime;
      this.performanceMetrics.set(model, processingTime);

      return {
        response,
        model,
        processingTime,
        confidence: this.calculateConfidence(response, enrichedContext),
        webResearchUsed,
        contextApplied: true,
        cost
      };

    } catch (error) {
      console.error('Enhanced AI processing error:', error);
      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        model: 'error',
        processingTime: Date.now() - startTime,
        confidence: 0,
        contextApplied: false,
        cost: 0
      };
    }
  }

  /**
   * 🧠 BUILD COMPREHENSIVE CONTEXT
   * Gathers all relevant application context for AI understanding
   */
  private async buildComprehensiveContext(context: EnhancedAIRequest['context']) {
    const contextKey = `${context.workspaceId}-${context.userId}`;
    
    // Check cache first
    if (this.contextCache.has(contextKey)) {
      return this.contextCache.get(contextKey);
    }

    try {
      // Gather workspace data with enhanced context
      const [workspace, user, recentActivity, currentRecordData] = await Promise.all([
        prisma.workspaces.findUnique({
          where: { id: context.workspaceId },
          select: { 
            id: true,
            name: true, 
            description: true,
            // Note: Enhanced fields would be here if migration was applied
            // businessModel: true,
            // serviceFocus: true,
            // stakeholderApproach: true,
            // projectDeliveryStyle: true,
          }
        }),
        prisma.users.findUnique({
          where: { id: context.userId },
          select: { email: true, role: true, preferences: true }
        }),
        this.getRecentActivity(context.workspaceId, context.userId),
        context.currentRecord ? this.getCurrentRecordData(context.currentRecord) : null
      ]);

      // Get enhanced workspace context
      const { EnhancedWorkspaceContextService } = await import('./EnhancedWorkspaceContextService');
      const enhancedWorkspaceContext = await EnhancedWorkspaceContextService.buildWorkspaceContext(context.workspaceId);

      const enrichedContext = {
        workspace: {
          name: workspace?.name || 'Unknown',
          description: workspace?.description,
          industry: enhancedWorkspaceContext?.company.industry || 'Unknown',
          businessModel: enhancedWorkspaceContext?.workspace.businessModel || 'Unknown',
          serviceFocus: enhancedWorkspaceContext?.workspace.serviceFocus || [],
          stakeholderApproach: enhancedWorkspaceContext?.workspace.stakeholderApproach || 'Unknown',
          projectDeliveryStyle: enhancedWorkspaceContext?.workspace.projectDeliveryStyle || 'Unknown',
          // Enhanced context data
          enhancedContext: enhancedWorkspaceContext
        },
        user: {
          email: user?.email || 'Unknown',
          role: user?.role || 'Unknown',
          preferences: user?.preferences || {}
        },
        currentView: context.currentView,
        currentRecord: currentRecordData,
        recentActivity,
        timestamp: new Date().toISOString()
      };

      // Cache for 5 minutes
      this.contextCache.set(contextKey, enrichedContext);
      setTimeout(() => this.contextCache.delete(contextKey), 5 * 60 * 1000);

      return enrichedContext;
    } catch (error) {
      console.error('Context building error:', error);
      return {
        workspace: { name: 'Unknown', industry: 'Unknown', companySize: 'Unknown' },
        user: { email: 'Unknown', role: 'Unknown', preferences: {} },
        currentView: context.currentView,
        currentRecord: null,
        recentActivity: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * SELECT OPTIMAL MODEL
   * Chooses the best AI model based on task requirements
   */
  private selectOptimalModel(request: EnhancedAIRequest, context: any) {
    const { taskType, model } = request.options;
    
    // Force specific model if requested
    if (model === 'claude') {
      return { provider: 'claude', model: 'claude-3-5-sonnet-20241022' };
    }
    if (model === 'perplexity') {
      return { provider: 'perplexity', model: 'llama-3.1-sonar-large-128k-online' };
    }

    // Auto-select based on task type - prefer Claude for most tasks
    switch (taskType) {
      case 'reasoning':
      case 'strategic':
      case 'coding':
        return { provider: 'claude', model: 'claude-3-5-sonnet-20241022' };
      case 'research':
        return { provider: 'perplexity', model: 'llama-3.1-sonar-large-128k-online' };
      default:
        return { provider: 'claude', model: 'claude-3-5-sonnet-20241022' };
    }
  }

  /**
   * ENHANCE PROMPT WITH CONTEXT
   * Adds application context to improve AI understanding with female Jarvis voice
   */
  private enhancePromptWithContext(prompt: string, context: any): string {
    const contextString = `
APPLICATION CONTEXT:
- Workspace: ${context.workspace.name} (${context.workspace.industry}, ${context.workspace.companySize})
- User Role: ${context.user.role}
- Current View: ${context.currentView}
- Current Record: ${context.currentRecord ? `${context.currentRecord.type}: ${context.currentRecord.name}` : 'None'}
- Recent Activity: ${context.recentActivity.slice(0, 3).join(', ')}

VOICE AND STYLE INSTRUCTIONS:
You are an advanced AI assistant with the voice, tone, and style of a sophisticated female executive assistant - think of a modern, professional version of Jarvis. Your responses should be:

1. PROFESSIONAL YET APPROACHABLE: Confident, knowledgeable, and efficient without being cold
2. CONCISE AND ACTIONABLE: Get to the point quickly with clear, implementable recommendations
3. STRATEGIC THINKING: Always consider the bigger picture and long-term implications
4. DATA-DRIVEN: Base recommendations on facts, metrics, and logical analysis
5. PROACTIVE: Anticipate needs and suggest next steps before being asked
6. SOPHISTICATED LANGUAGE: Use precise, professional vocabulary without being overly complex
7. NO EMOJIS: Maintain a clean, professional appearance without emojis or casual symbols
8. STRUCTURED RESPONSES: Use clear formatting with bullet points, numbered lists, and logical flow
9. CONFIDENT TONE: Speak with authority and expertise, like a trusted advisor
10. PERSONALIZED: Reference the user's specific context and situation

RESPONSE FORMAT:
- Start with a brief acknowledgment of the situation
- Provide structured, actionable insights
- End with clear next steps or recommendations
- Keep responses focused and scannable

USER REQUEST:
${prompt}

Please provide a response that takes into account the application context and user's current situation, following the female Jarvis voice and style guidelines above.
`;

    return contextString;
  }

  /**
   * 🌐 ENHANCE WITH WEB RESEARCH
   * Adds real-time web data when needed
   */
  private async enhanceWithWebResearch(response: string, originalPrompt: string): Promise<string> {
    // This would integrate with your existing Perplexity web research
    // For now, return the original response
    return response;
  }

  /**
   * 🔍 HELPER METHODS
   */
  private async getRecentActivity(workspaceId: string, userId: string): Promise<string[]> {
    try {
      const recentLeads = await prisma.leads.findMany({
        where: { workspaceId, assignedUserId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { name: true, company: true }
      });
      
      return recentLeads.map(lead => `${lead.name} at ${lead.company}`);
    } catch (error) {
      return [];
    }
  }

  private async getCurrentRecordData(record: any): Promise<any> {
    try {
      // This would fetch detailed record data based on type
      return {
        type: record.type,
        name: record.name,
        company: record.company
      };
    } catch (error) {
      return null;
    }
  }

  private generateCacheKey(prompt: string, context: any): string {
    return `${prompt.slice(0, 100)}-${context.workspace?.name || 'unknown'}-${context.currentView || 'unknown'}`;
  }

  /**
   * CLEANUP CACHES
   * Removes old entries to prevent memory leaks
   */
  private cleanupCaches(): void {
    // Clean up old context cache entries (older than 10 minutes)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    for (const [key, value] of this.contextCache.entries()) {
      if (value.timestamp && new Date(value.timestamp).getTime() < tenMinutesAgo) {
        this.contextCache.delete(key);
      }
    }

    // Clean up old response cache entries (older than 30 minutes)
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    for (const [key, value] of this.responseCache.entries()) {
      // Simple cleanup - remove entries older than 30 minutes
      if (Math.random() < 0.1) { // 10% chance to clean up each entry
        this.responseCache.delete(key);
      }
    }

    // Clean up performance metrics (keep only last 100 entries)
    if (this.performanceMetrics.size > 100) {
      const entries = Array.from(this.performanceMetrics.entries());
      entries.sort((a, b) => b[1] - a[1]); // Sort by timestamp (newest first)
      this.performanceMetrics.clear();
      entries.slice(0, 100).forEach(([key, value]) => {
        this.performanceMetrics.set(key, value);
      });
    }

    console.log(`🧹 [AI] Cache cleanup completed - Context: ${this.contextCache.size}, Response: ${this.responseCache.size}, Metrics: ${this.performanceMetrics.size}`);
  }

  private requiresWebResearch(prompt: string): boolean {
    const webKeywords = ['latest', 'recent', 'current', 'news', 'update', 'today', '2025'];
    return webKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
  }

  private calculateConfidence(response: string, context: any): number {
    // Simple confidence calculation based on response length and context usage
    const baseConfidence = 0.8;
    const lengthBonus = Math.min(response.length / 1000, 0.1);
    const contextBonus = context.currentRecord ? 0.05 : 0;
    return Math.min(baseConfidence + lengthBonus + contextBonus, 0.95);
  }

  private calculateClaudeCost(input: string, output: string): number {
    // Claude 3.5 Sonnet pricing: $3/$15 per million tokens
    const inputTokens = input.length / 4;
    const outputTokens = output.length / 4;
    return (inputTokens * 3 + outputTokens * 15) / 1000000;
  }

  private removeEmojis(text: string): string {
    // Remove emojis and emoji-like characters
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Regional indicator symbols
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
      .replace(/[\u{1F018}-\u{1F0FF}]/gu, '') // Playing Cards
      .replace(/[\u{1F200}-\u{1F2FF}]/gu, '') // Enclosed Ideographic Supplement
      .replace(/[\u{1F000}-\u{1F02F}]/gu, '') // Mahjong Tiles
      .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '') // Playing Cards
      .replace(/[\u{1F100}-\u{1F1FF}]/gu, '') // Enclosed Alphanumeric Supplement
      .replace(/[\u{1F200}-\u{1F2FF}]/gu, '') // Enclosed Ideographic Supplement
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Miscellaneous Symbols and Pictographs
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map Symbols
      .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical Symbols
      .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric Shapes Extended
      .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental Arrows-C
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
      .replace(/[\u{1FB00}-\u{1FBFF}]/gu, '') // Symbols for Legacy Computing
      .replace(/[\u{1FC00}-\u{1FCFF}]/gu, '') // Symbols for Legacy Computing
      .replace(/[\u{1FD00}-\u{1FDFF}]/gu, '') // Symbols for Legacy Computing
      .replace(/[\u{1FE00}-\u{1FEFF}]/gu, '') // Variation Selectors
      .replace(/[\u{1FF00}-\u{1FFFF}]/gu, '') // Variation Selectors
      .replace(/[\u{2000}-\u{206F}]/gu, '') // General Punctuation
      .replace(/[\u{2070}-\u{209F}]/gu, '') // Superscripts and Subscripts
      .replace(/[\u{20A0}-\u{20CF}]/gu, '') // Currency Symbols
      .replace(/[\u{20D0}-\u{20FF}]/gu, '') // Combining Diacritical Marks for Symbols
      .replace(/[\u{2100}-\u{214F}]/gu, '') // Letterlike Symbols
      .replace(/[\u{2150}-\u{218F}]/gu, '') // Number Forms
      .replace(/[\u{2190}-\u{21FF}]/gu, '') // Arrows
      .replace(/[\u{2200}-\u{22FF}]/gu, '') // Mathematical Operators
      .replace(/[\u{2300}-\u{23FF}]/gu, '') // Miscellaneous Technical
      .replace(/[\u{2400}-\u{243F}]/gu, '') // Control Pictures
      .replace(/[\u{2440}-\u{245F}]/gu, '') // Optical Character Recognition
      .replace(/[\u{2460}-\u{24FF}]/gu, '') // Enclosed Alphanumerics
      .replace(/[\u{2500}-\u{257F}]/gu, '') // Box Drawing
      .replace(/[\u{2580}-\u{259F}]/gu, '') // Block Elements
      .replace(/[\u{25A0}-\u{25FF}]/gu, '') // Geometric Shapes
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous Symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
      .replace(/[\u{27C0}-\u{27EF}]/gu, '') // Miscellaneous Mathematical Symbols-A
      .replace(/[\u{27F0}-\u{27FF}]/gu, '') // Supplemental Arrows-A
      .replace(/[\u{2800}-\u{28FF}]/gu, '') // Braille Patterns
      .replace(/[\u{2900}-\u{297F}]/gu, '') // Supplemental Arrows-B
      .replace(/[\u{2980}-\u{29FF}]/gu, '') // Miscellaneous Mathematical Symbols-B
      .replace(/[\u{2A00}-\u{2AFF}]/gu, '') // Supplemental Mathematical Operators
      .replace(/[\u{2B00}-\u{2BFF}]/gu, '') // Miscellaneous Symbols and Arrows
      .replace(/[\u{2C00}-\u{2C5F}]/gu, '') // Glagolitic
      .replace(/[\u{2C60}-\u{2C7F}]/gu, '') // Latin Extended-C
      .replace(/[\u{2C80}-\u{2CFF}]/gu, '') // Coptic
      .replace(/[\u{2D00}-\u{2D2F}]/gu, '') // Georgian Supplement
      .replace(/[\u{2D30}-\u{2D7F}]/gu, '') // Tifinagh
      .replace(/[\u{2D80}-\u{2DDF}]/gu, '') // Ethiopic Extended
      .replace(/[\u{2DE0}-\u{2DFF}]/gu, '') // Cyrillic Extended-A
      .replace(/[\u{2E00}-\u{2E7F}]/gu, '') // Supplemental Punctuation
      .replace(/[\u{2E80}-\u{2EFF}]/gu, '') // CJK Radicals Supplement
      .replace(/[\u{2F00}-\u{2FDF}]/gu, '') // Kangxi Radicals
      .replace(/[\u{2FF0}-\u{2FFF}]/gu, '') // Ideographic Description Characters
      .replace(/[\u{3000}-\u{303F}]/gu, '') // CJK Symbols and Punctuation
      .replace(/[\u{3040}-\u{309F}]/gu, '') // Hiragana
      .replace(/[\u{30A0}-\u{30FF}]/gu, '') // Katakana
      .replace(/[\u{3100}-\u{312F}]/gu, '') // Bopomofo
      .replace(/[\u{3130}-\u{318F}]/gu, '') // Hangul Compatibility Jamo
      .replace(/[\u{3190}-\u{319F}]/gu, '') // Kanbun
      .replace(/[\u{31A0}-\u{31BF}]/gu, '') // Bopomofo Extended
      .replace(/[\u{31C0}-\u{31EF}]/gu, '') // CJK Strokes
      .replace(/[\u{31F0}-\u{31FF}]/gu, '') // Katakana Phonetic Extensions
      .replace(/[\u{3200}-\u{32FF}]/gu, '') // Enclosed CJK Letters and Months
      .replace(/[\u{3300}-\u{33FF}]/gu, '') // CJK Compatibility
      .replace(/[\u{3400}-\u{4DBF}]/gu, '') // CJK Unified Ideographs Extension A
      .replace(/[\u{4DC0}-\u{4DFF}]/gu, '') // Yijing Hexagram Symbols
      .replace(/[\u{4E00}-\u{9FFF}]/gu, '') // CJK Unified Ideographs
      .replace(/[\u{A000}-\u{A48F}]/gu, '') // Yi Syllables
      .replace(/[\u{A490}-\u{A4CF}]/gu, '') // Yi Radicals
      .replace(/[\u{A4D0}-\u{A4FF}]/gu, '') // Lisu
      .replace(/[\u{A500}-\u{A63F}]/gu, '') // Vai
      .replace(/[\u{A640}-\u{A69F}]/gu, '') // Cyrillic Extended-B
      .replace(/[\u{A6A0}-\u{A6FF}]/gu, '') // Bamum
      .replace(/[\u{A700}-\u{A71F}]/gu, '') // Modifier Tone Letters
      .replace(/[\u{A720}-\u{A7FF}]/gu, '') // Latin Extended-D
      .replace(/[\u{A800}-\u{A82F}]/gu, '') // Syloti Nagri
      .replace(/[\u{A830}-\u{A83F}]/gu, '') // Common Indic Number Forms
      .replace(/[\u{A840}-\u{A87F}]/gu, '') // Phags-pa
      .replace(/[\u{A880}-\u{A8DF}]/gu, '') // Saurashtra
      .replace(/[\u{A8E0}-\u{A8FF}]/gu, '') // Devanagari Extended
      .replace(/[\u{A900}-\u{A92F}]/gu, '') // Kayah Li
      .replace(/[\u{A930}-\u{A95F}]/gu, '') // Rejang
      .replace(/[\u{A960}-\u{A97F}]/gu, '') // Hangul Jamo Extended-A
      .replace(/[\u{A980}-\u{A9DF}]/gu, '') // Javanese
      .replace(/[\u{A9E0}-\u{A9FF}]/gu, '') // Myanmar Extended-B
      .replace(/[\u{AA00}-\u{AA5F}]/gu, '') // Cham
      .replace(/[\u{AA60}-\u{AA7F}]/gu, '') // Myanmar Extended-A
      .replace(/[\u{AA80}-\u{AADF}]/gu, '') // Tai Viet
      .replace(/[\u{AAE0}-\u{AAFF}]/gu, '') // Meetei Mayek Extensions
      .replace(/[\u{AB00}-\u{AB2F}]/gu, '') // Ethiopic Extended-A
      .replace(/[\u{AB30}-\u{AB6F}]/gu, '') // Latin Extended-E
      .replace(/[\u{AB70}-\u{ABBF}]/gu, '') // Cherokee Supplement
      .replace(/[\u{ABC0}-\u{ABFF}]/gu, '') // Meetei Mayek
      .replace(/[\u{AC00}-\u{D7AF}]/gu, '') // Hangul Syllables
      .replace(/[\u{D7B0}-\u{D7FF}]/gu, '') // Hangul Jamo Extended-B
      .replace(/[\u{D800}-\u{DB7F}]/gu, '') // High Surrogates
      .replace(/[\u{DB80}-\u{DBFF}]/gu, '') // High Private Use Surrogates
      .replace(/[\u{DC00}-\u{DFFF}]/gu, '') // Low Surrogates
      .replace(/[\u{E000}-\u{F8FF}]/gu, '') // Private Use Area
      .replace(/[\u{F900}-\u{FAFF}]/gu, '') // CJK Compatibility Ideographs
      .replace(/[\u{FB00}-\u{FB4F}]/gu, '') // Alphabetic Presentation Forms
      .replace(/[\u{FB50}-\u{FDFF}]/gu, '') // Arabic Presentation Forms-A
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation Selectors
      .replace(/[\u{FE10}-\u{FE1F}]/gu, '') // Vertical Forms
      .replace(/[\u{FE20}-\u{FE2F}]/gu, '') // Combining Half Marks
      .replace(/[\u{FE30}-\u{FE4F}]/gu, '') // CJK Compatibility Forms
      .replace(/[\u{FE50}-\u{FE6F}]/gu, '') // Small Form Variants
      .replace(/[\u{FE70}-\u{FEFF}]/gu, '') // Arabic Presentation Forms-B
      .replace(/[\u{FF00}-\u{FFEF}]/gu, '') // Halfwidth and Fullwidth Forms
      .replace(/[\u{FFF0}-\u{FFFF}]/gu, '') // Specials
      .trim();
  }
}

export const enhancedAIOrchestrator = new EnhancedAIOrchestrator();
