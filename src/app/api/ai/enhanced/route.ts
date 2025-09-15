/**
 * 🚀 ENHANCED AI API ENDPOINT
 * 
 * Provides the best AI models, fastest responses, and deepest context understanding
 * Integrates Claude 4, GPT-4, and web research for comprehensive intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedAIOrchestrator } from '@/platform/ai/services/EnhancedAIOrchestrator';
import { webResearchService } from '@/platform/ai/services/WebResearchService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, context, options = {} } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build enhanced context from request
    const enhancedContext = {
      userId: context?.userId || 'anonymous',
      workspaceId: context?.workspaceId || 'default',
      currentView: context?.currentView || 'pipeline',
      currentRecord: context?.currentRecord,
      recentActivity: context?.recentActivity || []
    };

    // Enhanced options with defaults
    const enhancedOptions = {
      model: options.model || 'auto',
      taskType: options.taskType || 'standard',
      enableWebResearch: options.enableWebResearch || false,
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    };

    // Process with enhanced AI orchestrator
    const result = await enhancedAIOrchestrator.processRequest({
      prompt,
      context: enhancedContext,
      options: enhancedOptions
    });

    // Add web research if requested and not already included
    if (options.enableWebResearch && !result.webResearchUsed) {
      try {
        const webResearch = await webResearchService.performResearch({
          query: prompt,
          context: {
            company: context?.currentRecord?.company,
            person: context?.currentRecord?.name,
            industry: context?.workspace?.industry,
            timeframe: 'recent'
          }
        });

        if (webResearch.confidence > 0.7) {
          result.response += `\n\n🌐 Web Research:\n${webResearch.content}`;
          result.webResearchUsed = true;
        }
      } catch (error) {
        console.warn('Web research failed:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced AI API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Enhanced AI API - Use POST to send requests',
    capabilities: [
      'Claude 3.5 Sonnet - Best overall performance',
      'Perplexity Research - Real-time web access',
      'Context-aware responses',
      'Web research integration',
      'Intelligent model selection',
      'Response caching',
      'Cost optimization',
      'No emoji responses'
    ],
    models: [
      'claude-3-5-sonnet-20241022',
      'llama-3.1-sonar-large-128k-online'
    ],
    endpoints: {
      'POST /api/ai/enhanced': 'Main AI processing endpoint'
    }
  });
}
