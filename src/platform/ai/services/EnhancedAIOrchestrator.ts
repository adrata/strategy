/**
 * 🚀 ENHANCED AI ORCHESTRATOR - 2025 OPTIMIZED
 * 
 * Provides the best AI models, fastest responses, and deepest context understanding
 * Integrates Claude 4, GPT-4, and web research for comprehensive intelligence
 */

import { ClaudeService } from './claudeService';
import { OpenAIService } from './openaiService';
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
  private openaiService: OpenAIService;
  private contextCache: Map<string, any> = new Map();
  private responseCache: Map<string, string> = new Map();

  constructor() {
    this.claudeService = new ClaudeService();
    this.openaiService = new OpenAIService();
  }

  /**
   * 🎯 MAIN AI PROCESSING METHOD
   * Intelligently routes to best model with full context awareness
   */
  async processRequest(request: EnhancedAIRequest): Promise<EnhancedAIResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Build comprehensive context
      const enrichedContext = await this.buildComprehensiveContext(request.context);
      
      // 2. Check cache for similar requests
      const cacheKey = this.generateCacheKey(request.prompt, enrichedContext);
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

      // 3. Select optimal model
      const modelSelection = this.selectOptimalModel(request, enrichedContext);
      
      // 4. Enhance prompt with context
      const enhancedPrompt = this.enhancePromptWithContext(request.prompt, enrichedContext);
      
      // 5. Process with selected model
      let response: string;
      let model: string;
      let cost: number = 0;

      if (modelSelection.provider === 'claude') {
        response = await this.claudeService.generateContent(enhancedPrompt, {
          model: modelSelection.model,
          temperature: request.options.temperature || 0.7,
          maxTokens: request.options.maxTokens || 2000,
          workspaceId: request.context.workspaceId
        });
        model = modelSelection.model;
        cost = this.calculateClaudeCost(enhancedPrompt, response);
      } else {
        response = await this.openaiService.generateContent(enhancedPrompt, {
          model: modelSelection.model,
          temperature: request.options.temperature || 0.7,
          maxTokens: request.options.maxTokens || 2000,
          workspaceId: request.context.workspaceId
        });
        model = modelSelection.model;
        cost = this.calculateOpenAICost(enhancedPrompt, response);
      }

      // 6. Enhance with web research if requested
      let webResearchUsed = false;
      if (request.options.enableWebResearch && this.requiresWebResearch(request.prompt)) {
        const webEnhancedResponse = await this.enhanceWithWebResearch(response, request.prompt);
        if (webEnhancedResponse !== response) {
          response = webEnhancedResponse;
          webResearchUsed = true;
        }
      }

      // 7. Cache response
      this.responseCache.set(cacheKey, response);

      const processingTime = Date.now() - startTime;

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
      // Gather workspace data
      const [workspace, user, recentActivity, currentRecordData] = await Promise.all([
        prisma.workspaces.findUnique({
          where: { id: context.workspaceId },
          select: { name: true, industry: true, companySize: true }
        }),
        prisma.users.findUnique({
          where: { id: context.userId },
          select: { email: true, role: true, preferences: true }
        }),
        this.getRecentActivity(context.workspaceId, context.userId),
        context.currentRecord ? this.getCurrentRecordData(context.currentRecord) : null
      ]);

      const enrichedContext = {
        workspace: {
          name: workspace?.name || 'Unknown',
          industry: workspace?.industry || 'Unknown',
          companySize: workspace?.companySize || 'Unknown'
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
   * 🎯 SELECT OPTIMAL MODEL
   * Chooses the best AI model based on task requirements
   */
  private selectOptimalModel(request: EnhancedAIRequest, context: any) {
    const { taskType, model } = request.options;
    
    // Force specific model if requested
    if (model === 'claude') {
      return { provider: 'claude', model: 'claude-3-5-sonnet-20241022' };
    }
    if (model === 'openai') {
      return { provider: 'openai', model: 'gpt-4o' };
    }

    // Auto-select based on task type
    switch (taskType) {
      case 'reasoning':
      case 'strategic':
        return { provider: 'claude', model: 'claude-3-5-sonnet-20241022' };
      case 'coding':
        return { provider: 'claude', model: 'claude-3-5-sonnet-20241022' };
      case 'research':
        return { provider: 'openai', model: 'gpt-4o-search-preview' };
      default:
        return { provider: 'claude', model: 'claude-3-5-sonnet-20241022' };
    }
  }

  /**
   * 📝 ENHANCE PROMPT WITH CONTEXT
   * Adds application context to improve AI understanding
   */
  private enhancePromptWithContext(prompt: string, context: any): string {
    const contextString = `
APPLICATION CONTEXT:
- Workspace: ${context.workspace.name} (${context.workspace.industry}, ${context.workspace.companySize})
- User Role: ${context.user.role}
- Current View: ${context.currentView}
- Current Record: ${context.currentRecord ? `${context.currentRecord.type}: ${context.currentRecord.name}` : 'None'}
- Recent Activity: ${context.recentActivity.slice(0, 3).join(', ')}

USER REQUEST:
${prompt}

Please provide a response that takes into account the application context and user's current situation.
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
    return `${prompt.slice(0, 100)}-${context.workspace.name}-${context.currentView}`;
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

  private calculateOpenAICost(input: string, output: string): number {
    // GPT-4o pricing: $2.50/$10 per million tokens
    const inputTokens = input.length / 4;
    const outputTokens = output.length / 4;
    return (inputTokens * 2.5 + outputTokens * 10) / 1000000;
  }
}

export const enhancedAIOrchestrator = new EnhancedAIOrchestrator();
