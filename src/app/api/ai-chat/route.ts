/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

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
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { AIContextService } from '@/platform/ai/services/AIContextService';
import { promptInjectionGuard } from '@/platform/security/prompt-injection-guard';
import { aiResponseValidator } from '@/platform/security/ai-response-validator';
import { rateLimiter } from '@/platform/security/rate-limiter';
import { securityMonitor } from '@/platform/security/security-monitor';
import { shouldUseRoleFinderTool, parseRoleFindQuery, executeRoleFinderTool } from '@/platform/ai/tools/role-finder-tool';

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION CHECK - Critical security requirement
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser) {
      // Log authentication failure
      securityMonitor.logAuthenticationFailure(
        '/api/ai-chat',
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        'No valid authentication token'
      );
      
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

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
      listViewContext,
      enableVoiceResponse,
      selectedVoiceId,
      useOpenRouter = true, // New parameter to control routing
      pageContext, // New parameter for page context
      selectedAIModel // Selected AI model from frontend
    } = body;

    console.log('🤖 [AI CHAT] Processing request:', {
      message: message?.substring(0, 100) + '...',
      appType,
      workspaceId,
      userId,
      hasCurrentRecord: !!currentRecord,
      recordType,
      hasListViewContext: !!listViewContext,
      listViewRecordCount: listViewContext?.visibleRecords?.length || 0,
      useOpenRouter
    });

    // 2. INPUT VALIDATION AND SANITIZATION - Critical security requirement
    if (!message || typeof message !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Message is required and must be a string'
      }, { status: 400 });
    }

    // Check for prompt injection attacks
    const injectionDetection = promptInjectionGuard.detectInjection(message, {
      userId: authUser.id,
      workspaceId: authUser.workspaceId || workspaceId,
      conversationHistory
    });

    // Block critical and high-risk injection attempts
    if (injectionDetection.isInjection && 
        (injectionDetection.riskLevel === 'critical' || injectionDetection.riskLevel === 'high')) {
      // Log injection attempt
      securityMonitor.logInjectionAttempt(
        authUser.id,
        authUser.workspaceId || workspaceId,
        '/api/ai-chat',
        injectionDetection.attackType,
        injectionDetection.riskLevel,
        injectionDetection.confidence,
        injectionDetection.blockedPatterns,
        message,
        injectionDetection.sanitizedInput,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        `ai-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      );

      console.warn('🚨 [AI CHAT] Prompt injection blocked:', {
        userId: authUser.id,
        workspaceId: authUser.workspaceId || workspaceId,
        attackType: injectionDetection.attackType,
        riskLevel: injectionDetection.riskLevel,
        confidence: injectionDetection.confidence,
        blockedPatterns: injectionDetection.blockedPatterns
      });

      return NextResponse.json({
        success: false,
        error: 'Invalid input detected. Please rephrase your message.',
        code: 'INJECTION_BLOCKED',
        riskLevel: injectionDetection.riskLevel
      }, { status: 400 });
    }

    // Use sanitized input for processing
    const sanitizedMessage = injectionDetection.sanitizedInput;

    // 2.5. CHECK FOR ROLE FINDER TOOL - Intercept "find CFO at Nike" type queries
    if (shouldUseRoleFinderTool(sanitizedMessage)) {
      const roleFinderInput = parseRoleFindQuery(sanitizedMessage);
      if (roleFinderInput) {
        console.log('🔧 [AI CHAT] Using Role Finder Tool:', roleFinderInput);
        
        try {
          const toolResult = await executeRoleFinderTool(
            roleFinderInput,
            authUser.workspaceId || workspaceId
          );

          return NextResponse.json({
            success: true,
            response: toolResult.message,
            toolUsed: 'role_finder',
            toolResult: {
              person: toolResult.person,
              company: toolResult.company,
              confidence: toolResult.confidence
            },
            metadata: {
              model: 'role-finder-tool',
              provider: 'Adrata Intelligence',
              timestamp: new Date().toISOString()
            }
          });
        } catch (error: any) {
          console.error('❌ [AI CHAT] Role Finder Tool error:', error);
          // Fall through to normal AI processing if tool fails
        }
      }
    }

    // 3. RATE LIMITING - Prevent abuse and DoS attacks
    const rateLimitResult = rateLimiter.checkRateLimit(
      authUser.id,
      'ai_chat',
      authUser.workspaceId || workspaceId
    );

    if (!rateLimitResult.allowed) {
      // Log rate limit exceeded
      securityMonitor.logRateLimitExceeded(
        authUser.id,
        authUser.workspaceId || workspaceId,
        '/api/ai-chat',
        rateLimitResult.limit,
        rateLimitResult.totalHits,
        rateLimitResult.retryAfter || 60,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      );

      console.warn('🚨 [AI CHAT] Rate limit exceeded:', {
        userId: authUser.id,
        workspaceId: authUser.workspaceId || workspaceId,
        totalHits: rateLimitResult.totalHits,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter
      });

      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      });
    }

    let response: any;
    let costRecordId: string | null = null;

    // Build comprehensive workspace context
    console.log('🧠 [AI CHAT] Building comprehensive workspace context...');
    const workspaceContext = await AIContextService.buildContext({
      userId: authUser.id,
      workspaceId: authUser.workspaceId || workspaceId,
      appType,
      currentRecord,
      recordType,
      listViewContext,
      conversationHistory: conversationHistory || [],
      documentContext: null // Could be enhanced later
    });

    console.log('🧠 [AI CHAT] Workspace context built:', {
      hasUserContext: !!workspaceContext.userContext,
      hasApplicationContext: !!workspaceContext.applicationContext,
      hasDataContext: !!workspaceContext.dataContext,
      hasRecordContext: !!workspaceContext.recordContext,
      hasSystemContext: !!workspaceContext.systemContext
    });

    // Determine if we should use OpenRouter based on gradual rollout
    const shouldUseOpenRouter = useOpenRouter && 
                               process.env.OPENROUTER_API_KEY && 
                               gradualRolloutService.shouldUseOpenRouter(userId, workspaceId);

    // Route to OpenRouter or fallback to Claude
    if (shouldUseOpenRouter) {
      try {
        // Determine preferred model from selectedAIModel
        const preferredModel = selectedAIModel?.openRouterModelId || undefined;
        
        if (preferredModel) {
          console.log('🌐 [AI CHAT] Using OpenRouter with preferred model:', preferredModel);
        } else {
          console.log('🌐 [AI CHAT] Using OpenRouter with intelligent routing');
        }
        
        // Generate OpenRouter response with sanitized input and workspace context
        const openRouterResponse = await openRouterService.generateResponse({
          message: sanitizedMessage,
          conversationHistory,
          currentRecord,
          recordType,
          listViewContext,
          appType,
          workspaceId: authUser.workspaceId || workspaceId,
          userId: authUser.id,
          context: {
            currentUrl: request.headers.get('referer'),
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          },
          pageContext,
          workspaceContext, // Pass the comprehensive workspace context
          preferredModel // Pass the preferred model if specified
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

        // Fallback to Claude with sanitized input and workspace context
        const claudeResponse = await claudeAIService.generateChatResponse({
          message: sanitizedMessage,
          conversationHistory,
          currentRecord,
          recordType,
          listViewContext,
          appType,
          workspaceId: authUser.workspaceId || workspaceId,
          userId: authUser.id,
          pageContext,
          workspaceContext // Pass the comprehensive workspace context
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
        message: sanitizedMessage,
        conversationHistory,
        currentRecord,
        recordType,
        listViewContext,
        appType,
        workspaceId: authUser.workspaceId || workspaceId,
        userId: authUser.id,
        pageContext
      });

      // Record Claude request for monitoring
      gradualRolloutService.recordRequest({
        userId: authUser.id,
        workspaceId: authUser.workspaceId || workspaceId,
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

    // 3. RESPONSE VALIDATION - Critical security requirement
    const responseValidation = aiResponseValidator.validateResponse(response.response, {
      userId: authUser.id,
      workspaceId: authUser.workspaceId || workspaceId,
      conversationHistory
    });

    // Block critical and high-risk responses
    if (!responseValidation.isValid && 
        (responseValidation.riskLevel === 'critical' || responseValidation.riskLevel === 'high')) {
      // Log response validation failure
      securityMonitor.logResponseValidationFailure(
        authUser.id,
        authUser.workspaceId || workspaceId,
        '/api/ai-chat',
        responseValidation.riskLevel,
        responseValidation.issues,
        response.response,
        responseValidation.sanitizedResponse,
        responseValidation.metadata.validationTime
      );

      console.warn('🚨 [AI CHAT] Response validation failed:', {
        userId: authUser.id,
        workspaceId: authUser.workspaceId || workspaceId,
        riskLevel: responseValidation.riskLevel,
        issues: responseValidation.issues,
        confidence: responseValidation.confidence
      });

      return NextResponse.json({
        success: false,
        error: 'Response validation failed. Please try again.',
        code: 'RESPONSE_VALIDATION_FAILED',
        riskLevel: responseValidation.riskLevel
      }, { status: 400 });
    }

    // Use sanitized response
    const finalResponse = {
      ...response,
      response: responseValidation.sanitizedResponse
    };

    // Record successful request for rate limiting
    rateLimiter.recordRequest(
      authUser.id,
      'ai_chat',
      authUser.workspaceId || workspaceId,
      true
    );

    return NextResponse.json(finalResponse);

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