/**
 * 🤖 AI CHAT API ENDPOINT
 * 
 * OpenRouter-powered AI integration with intelligent model routing
 * Provides fast, context-aware responses with automatic failover and cost optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { claudeAIService } from '@/platform/services/ClaudeAIService';
import { openRouterService } from '@/platform/services/OpenRouterService';
import { modelCostTracker } from '@/platform/services/ModelCostTracker';
import { gradualRolloutService } from '@/platform/services/GradualRolloutService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract the message and other parameters
    const { 
      message, 
      appType, 
      workspaceId, 
      userId, 
      conversationHistory, 
      currentRecord, 
      recordType,
      enableVoiceResponse,
      selectedVoiceId,
      useOpenRouter = true // New parameter to control routing
    } = body;

    console.log('🤖 [AI CHAT] Processing request:', {
      message: message?.substring(0, 100) + '...',
      appType,
      workspaceId,
      userId,
      hasCurrentRecord: !!currentRecord,
      recordType,
      useOpenRouter
    });

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Message is required and must be a string'
      }, { status: 400 });
    }

    let response: any;
    let costRecordId: string | null = null;

    // Determine if we should use OpenRouter based on gradual rollout
    const shouldUseOpenRouter = useOpenRouter && 
                               process.env.OPENROUTER_API_KEY && 
                               gradualRolloutService.shouldUseOpenRouter(userId, workspaceId);

    // Route to OpenRouter or fallback to Claude
    if (shouldUseOpenRouter) {
      try {
        console.log('🌐 [AI CHAT] Using OpenRouter with intelligent routing');
        
        // Generate OpenRouter response
        const openRouterResponse = await openRouterService.generateResponse({
          message,
          conversationHistory,
          currentRecord,
          recordType,
          appType,
          workspaceId,
          userId,
          context: {
            currentUrl: request.headers.get('referer'),
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        });

        // Record cost
        costRecordId = modelCostTracker.recordCost({
          model: openRouterResponse.model,
          provider: openRouterResponse.provider,
          inputTokens: Math.floor(openRouterResponse.tokensUsed * 0.7), // Estimate input/output split
          outputTokens: Math.floor(openRouterResponse.tokensUsed * 0.3),
          cost: openRouterResponse.cost,
          category: openRouterResponse.routingInfo.complexity < 30 ? 'simple' : 
                   openRouterResponse.routingInfo.complexity < 70 ? 'standard' : 'complex',
          complexity: openRouterResponse.routingInfo.complexity,
          processingTime: openRouterResponse.processingTime,
          userId,
          workspaceId,
          appType,
          success: true,
          fallbackUsed: openRouterResponse.routingInfo.fallbackUsed
        });

        response = {
          success: true,
          response: openRouterResponse.response,
          todos: [],
          navigation: null,
          voice: null,
          sources: openRouterResponse.sources || [],
          browserResults: openRouterResponse.browserResults || [],
          metadata: {
            model: openRouterResponse.model,
            provider: openRouterResponse.provider,
            confidence: openRouterResponse.confidence,
            processingTime: openRouterResponse.processingTime,
            tokensUsed: openRouterResponse.tokensUsed,
            cost: openRouterResponse.cost,
            hasWebResearch: (openRouterResponse.browserResults?.length || 0) > 0,
            sourcesCount: openRouterResponse.sources?.length || 0,
            routingInfo: openRouterResponse.routingInfo,
            costRecordId
          }
        };

        console.log('✅ [AI CHAT] OpenRouter response generated:', {
          model: openRouterResponse.model,
          provider: openRouterResponse.provider,
          cost: openRouterResponse.cost,
          complexity: openRouterResponse.routingInfo.complexity,
          processingTime: openRouterResponse.processingTime
        });

        // Record request for gradual rollout monitoring
        gradualRolloutService.recordRequest({
          userId,
          workspaceId,
          usedOpenRouter: true,
          success: true,
          responseTime: openRouterResponse.processingTime,
          cost: openRouterResponse.cost
        });

      } catch (openRouterError) {
        console.warn('⚠️ [AI CHAT] OpenRouter failed, falling back to Claude:', openRouterError);
        
        // Record OpenRouter failure
        gradualRolloutService.recordRequest({
          userId,
          workspaceId,
          usedOpenRouter: true,
          success: false,
          responseTime: 0,
          cost: 0,
          error: openRouterError instanceof Error ? openRouterError.message : 'Unknown error'
        });

        // Fallback to Claude
        const claudeResponse = await claudeAIService.generateChatResponse({
          message,
          conversationHistory,
          currentRecord,
          recordType,
          appType,
          workspaceId,
          userId
        });

        response = {
          success: true,
          response: claudeResponse.response,
          todos: [],
          navigation: null,
          voice: null,
          sources: claudeResponse.sources || [],
          browserResults: claudeResponse.browserResults || [],
          metadata: {
            model: claudeResponse.model,
            provider: 'Anthropic',
            confidence: claudeResponse.confidence,
            processingTime: claudeResponse.processingTime,
            tokensUsed: claudeResponse.tokensUsed,
            cost: 0, // Claude costs not tracked in this fallback
            hasWebResearch: (claudeResponse.browserResults?.length || 0) > 0,
            sourcesCount: claudeResponse.sources?.length || 0,
            routingInfo: {
              complexity: 0,
              selectedModel: claudeResponse.model,
              fallbackUsed: true,
              failoverChain: []
            },
            fallbackReason: 'OpenRouter unavailable'
          }
        };
      }
    } else {
      // Direct Claude fallback
      console.log('🤖 [AI CHAT] Using Claude directly (OpenRouter disabled or not selected)');
      
      const claudeResponse = await claudeAIService.generateChatResponse({
        message,
        conversationHistory,
        currentRecord,
        recordType,
        appType,
        workspaceId,
        userId
      });

      // Record Claude request for monitoring
      gradualRolloutService.recordRequest({
        userId,
        workspaceId,
        usedOpenRouter: false,
        success: true,
        responseTime: claudeResponse.processingTime,
        cost: 0 // Claude costs not tracked in this context
      });

      response = {
        success: true,
        response: claudeResponse.response,
        todos: [],
        navigation: null,
        voice: null,
        sources: claudeResponse.sources || [],
        browserResults: claudeResponse.browserResults || [],
        metadata: {
          model: claudeResponse.model,
          provider: 'Anthropic',
          confidence: claudeResponse.confidence,
          processingTime: claudeResponse.processingTime,
          tokensUsed: claudeResponse.tokensUsed,
          cost: 0,
          hasWebResearch: (claudeResponse.browserResults?.length || 0) > 0,
          sourcesCount: claudeResponse.sources?.length || 0,
          routingInfo: {
            complexity: 0,
            selectedModel: claudeResponse.model,
            fallbackUsed: false,
            failoverChain: []
          }
        }
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [AI CHAT] Error:', error);
    
    // Return a helpful error response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      response: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment, or feel free to ask me about your sales strategy, pipeline optimization, or any other sales-related questions."
    }, { status: 500 });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for AI chat requests.'
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for AI chat requests.'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for AI chat requests.'
  }, { status: 405 });
}