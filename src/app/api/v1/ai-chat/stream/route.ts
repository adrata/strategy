/**
 * 🌊 AI CHAT STREAMING ENDPOINT
 * 
 * Server-Sent Events (SSE) endpoint for real-time AI response streaming.
 * Provides instant token-by-token responses for dramatically improved perceived performance.
 */

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { openRouterService } from '@/platform/services/OpenRouterService';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';
import { AIContextService } from '@/platform/ai/services/AIContextService';
import { promptInjectionGuard } from '@/platform/security/prompt-injection-guard';
import { rateLimiter } from '@/platform/security/rate-limiter';
import { securityMonitor } from '@/platform/security/security-monitor';

/**
 * POST /api/v1/ai-chat/stream - Streaming AI Chat Endpoint
 * 
 * Returns a Server-Sent Events stream with tokens as they're generated.
 * First token typically arrives in <500ms for dramatically improved UX.
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  
  try {
    // 1. AUTHENTICATION CHECK
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      securityMonitor.logAuthenticationFailure(
        '/api/v1/ai-chat/stream',
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        'Authentication failed'
      );
      return response;
    }

    if (!context) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    
    const { 
      message, 
      appType, 
      conversationHistory, 
      currentRecord: frontendRecord, 
      recordType: frontendRecordType,
      recordIdFromUrl,
      isListView,
      listViewSection,
      listViewContext,
      pageContext,
      selectedAIModel
    } = body;

    // 2. INPUT VALIDATION
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. PROMPT INJECTION CHECK
    const injectionDetection = promptInjectionGuard.detectInjection(message, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      conversationHistory
    });

    if (injectionDetection.isInjection && 
        (injectionDetection.riskLevel === 'critical' || injectionDetection.riskLevel === 'high')) {
      securityMonitor.logInjectionAttempt(
        context.userId,
        context.workspaceId,
        '/api/v1/ai-chat/stream',
        injectionDetection.attackType,
        injectionDetection.riskLevel,
        injectionDetection.confidence,
        injectionDetection.blockedPatterns,
        message,
        injectionDetection.sanitizedInput,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-forwarded-for') || undefined,
        `stream-${Date.now()}`
      );

      return new Response(JSON.stringify({ error: 'Invalid input detected' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sanitizedMessage = injectionDetection.sanitizedInput;

    // 4. RATE LIMITING
    const rateLimitResult = rateLimiter.checkRateLimit(
      context.userId,
      'ai_chat_stream',
      context.workspaceId
    );

    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter 
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
        }
      });
    }

    // 5. SMART RECORD FETCHING (if not provided)
    let currentRecord = frontendRecord;
    let recordType = frontendRecordType;
    
    if (!currentRecord && recordIdFromUrl) {
      try {
        const { getPrismaClient } = await import('@/platform/database/connection-pool');
        const prisma = getPrismaClient();
        
        const personRecord = await prisma.people.findUnique({
          where: { id: recordIdFromUrl },
          include: { company: true, customFields: true }
        });
        
        if (personRecord) {
          currentRecord = {
            ...personRecord,
            name: personRecord.fullName || `${personRecord.firstName || ''} ${personRecord.lastName || ''}`.trim(),
            fullName: personRecord.fullName || `${personRecord.firstName || ''} ${personRecord.lastName || ''}`.trim(),
            company: personRecord.company?.name || personRecord.companyName,
            title: personRecord.jobTitle || personRecord.title
          };
          recordType = personRecord.status?.toLowerCase() || 'person';
        }
      } catch (error) {
        console.warn('⚠️ [STREAM] Failed to fetch record:', error);
      }
    }

    // 6. CREATE STREAMING RESPONSE IMMEDIATELY (context builds in parallel)
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send start event IMMEDIATELY so user sees activity
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'start',
            timestamp: Date.now()
          })}\n\n`));
          
          const preferredModel = selectedAIModel?.openRouterModelId || undefined;
          
          // Build context with timeout (happens in parallel with streaming setup)
          let workspaceContext: any;
          try {
            const contextPromise = AIContextService.buildContext({
              userId: context.userId,
              workspaceId: context.workspaceId,
              appType,
              currentRecord,
              recordType,
              listViewContext,
              conversationHistory: conversationHistory || [],
              documentContext: null
            });
            
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Context build timeout')), 3000); // Reduced to 3s
            });
            
            workspaceContext = await Promise.race([contextPromise, timeoutPromise]);
          } catch (contextError) {
            console.warn('⚠️ [STREAM] Context build failed, using minimal context');
            workspaceContext = {
              userContext: '',
              applicationContext: '',
              dataContext: '',
              recordContext: '',
              listViewContext: '',
              documentContext: '',
              systemContext: ''
            };
          }

          // Stream tokens from OpenRouter
          const generator = openRouterService.generateStreamingResponse({
            message: sanitizedMessage,
            conversationHistory,
            currentRecord,
            recordType,
            listViewContext,
            appType,
            workspaceId: context.workspaceId,
            userId: context.userId,
            context: {
              currentUrl: request.headers.get('referer'),
              userAgent: request.headers.get('user-agent'),
              timestamp: new Date().toISOString()
            },
            pageContext,
            workspaceContext,
            preferredModel
          });

          for await (const event of generator) {
            if (event.type === 'token') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'token',
                content: event.content
              })}\n\n`));
            } else if (event.type === 'done') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'done',
                metadata: event.metadata,
                totalTime: Date.now() - requestStartTime
              })}\n\n`));
            } else if (event.type === 'error') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                error: event.content
              })}\n\n`));
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('❌ [STREAM] Error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });

  } catch (error) {
    console.error('❌ [STREAM] Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

