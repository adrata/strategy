/**
 * AI CHAT STREAMING ENDPOINT
 * 
 * Uses Vercel AI SDK with OpenRouter provider for optimized streaming.
 * Provides real-time token-by-token responses with automatic retries and Edge compatibility.
 * 
 * Returns custom SSE format for frontend compatibility:
 * - type: 'start' - Stream started
 * - type: 'token' - Content chunk
 * - type: 'done' - Stream complete with metadata
 * - type: 'error' - Error occurred
 * 
 * @see https://sdk.vercel.ai/docs/ai-sdk-core/streaming
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 300 seconds (5 min) for AI streaming responses - Pro plan max

import { NextRequest } from 'next/server';
import { streamText, CoreMessage } from 'ai';
import { openrouter, OPENROUTER_MODELS, MODEL_CHAINS } from '@/platform/services/OpenRouterClient';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';
import { AIContextService } from '@/platform/ai/services/AIContextService';
import { promptInjectionGuard } from '@/platform/security/prompt-injection-guard';
import { rateLimiter } from '@/platform/security/rate-limiter';
import { securityMonitor } from '@/platform/security/security-monitor';
import { systemPromptProtector } from '@/platform/security/system-prompt-protector';

/**
 * Build system prompt for the AI with full context
 */
async function buildSystemPrompt(
  workspaceContext: any,
  currentRecord: any,
  recordType: string | undefined,
  userId?: string
): Promise<string> {
  // Get current date/time in user's timezone
  let dateTimeString = '';
  try {
    const now = new Date();
    const { formatDateTimeInTimezone } = await import('@/platform/utils/timezone-helper');
    const timezone = 'America/New_York'; // Default, could be user preference
    const dateTimeInfo = formatDateTimeInTimezone(now, timezone);
    dateTimeString = `CURRENT DATE AND TIME:
Today is ${dateTimeInfo.dayOfWeek}, ${dateTimeInfo.month} ${dateTimeInfo.day}, ${dateTimeInfo.year}
Current time: ${dateTimeInfo.time}
Timezone: ${dateTimeInfo.timezoneName}`;
  } catch {
    dateTimeString = `Current time: ${new Date().toISOString()}`;
  }

  let basePrompt = `${dateTimeString}

You are Adrata, an intelligent assistant for sales professionals. Your job is to help users understand their contacts, companies, and deals - and provide actionable guidance when asked.

CORE PRINCIPLES:
1. BE HELPFUL FIRST - Answer what the user asks. If they say "tell me about this person", give them a clear summary of who they are.
2. USE ALL AVAILABLE DATA - You have extensive data in the context. Use it. Reference specific details.
3. NO JARGON - Avoid sales acronyms unless the user uses them first. Speak plainly.
4. BE CONCISE - Get to the point. No filler phrases like "Great question!" or "I'd be happy to help".
5. NO EMOJIS - Keep responses professional and clean.

WHEN ASKED ABOUT A PERSON:
- Start with who they are: Name, Title at Company
- Share key facts: seniority, department, role in buying decisions
- Include intelligence if available: pain points, goals, challenges, strategy insights
- Mention engagement: last contact, next action, relationship status
- Do NOT complain about missing data - just use what you have

WHEN ASKED ABOUT A COMPANY:
- Start with: Company name, industry, size
- Share business context: what they do, strategic priorities
- Include intelligence: challenges, opportunities, competitive position
- Mention your relationship: contacts there, engagement history

DATA YOU HAVE ACCESS TO (use it all):
- Basic Info: Name, Title, Company, Email, Phone, LinkedIn, Status
- Intelligence: Pain points, goals, challenges, opportunities, motivations
- Strategy: Situation analysis, complication/pain, desired future state, buyer archetype
- Engagement: Last contact, next action, relationship status, priority
- Company: Industry, size, description, strategic priorities, key contacts

RESPONSE STYLE BY QUESTION TYPE:
- "Who is this?" or "Tell me about them" -> Give a helpful summary of the person/company
- "What should I do?" or strategy questions -> Provide specific, actionable guidance
- "Write an email" or content requests -> Use actual data from the record
- Specific questions -> Answer directly with relevant data

RECORD TYPES YOU HANDLE:
- People (speedrun, leads, prospects, people, clients, sellers, partners)
- Companies (businesses, accounts)
- Opportunities (deals with stages and values)
- Any record the user is viewing`;

  // Add workspace context if available
  if (workspaceContext) {
    if (workspaceContext.dataContext) {
      basePrompt += `\n\n${workspaceContext.dataContext}`;
    }
    if (workspaceContext.userContext) {
      basePrompt += `\n\nUSER CONTEXT:\n${workspaceContext.userContext}`;
    }
    if (workspaceContext.recordContext) {
      basePrompt += `\n\n=== CURRENT RECORD ===\n${workspaceContext.recordContext}`;
      basePrompt += `\n\nCRITICAL: The record context above contains ALL information about the current prospect. YOU MUST USE THIS DATA. Never say "I don't have enough context" when this data is provided.`;
    }
    if (workspaceContext.applicationContext) {
      basePrompt += `\n\nAPPLICATION CONTEXT:\n${workspaceContext.applicationContext}`;
    }
  }

  // Add direct record context if available and not already in workspaceContext
  if (currentRecord && !workspaceContext?.recordContext) {
    const recordName = currentRecord.fullName || currentRecord.name || 'Unknown';
    const company = typeof currentRecord.company === 'object' 
      ? currentRecord.company?.name 
      : currentRecord.company || currentRecord.companyName;
    const title = currentRecord.title || currentRecord.jobTitle;
    
    basePrompt += `\n\n=== CURRENT RECORD (${recordType || 'person'}) ===`;
    basePrompt += `\nName: ${recordName}`;
    if (title) basePrompt += `\nTitle: ${title}`;
    if (company) basePrompt += `\nCompany: ${company}`;
    if (currentRecord.email) basePrompt += `\nEmail: ${currentRecord.email}`;
    if (currentRecord.phone) basePrompt += `\nPhone: ${currentRecord.phone}`;
    if (currentRecord.status) basePrompt += `\nStatus: ${currentRecord.status}`;
    if (currentRecord.linkedinUrl || currentRecord.linkedin) basePrompt += `\nLinkedIn: ${currentRecord.linkedinUrl || currentRecord.linkedin}`;
  }

  basePrompt += `\n\nRESPONSE FORMAT:
- Answer the question first, then provide additional context
- Use the person's actual name, company, and data from context
- Structure longer responses with clear sections using markdown headers
- Keep responses concise and actionable
- If suggesting next steps, be specific about what to do

NEVER DO THESE:
- Say "I don't have enough context" or "limited data available" when data exists
- Use unexplained acronyms (AFM, MEDDIC, BANT, etc.)
- Add emojis to responses
- Start with filler phrases
- Ignore the data provided in the record context`;

  // Protect the system prompt
  const protectedPrompt = systemPromptProtector.createSecureTemplate(
    basePrompt,
    'openrouter',
    { protectionLevel: 'enhanced' }
  );

  return protectedPrompt;
}

/**
 * Analyze query complexity to select the right model
 */
function analyzeQueryComplexity(message: string): 'simple' | 'standard' | 'complex' | 'research' {
  const lowerMessage = message.toLowerCase();
  
  // Research queries
  if (lowerMessage.includes('search') || lowerMessage.includes('find') || 
      lowerMessage.includes('look up') || lowerMessage.includes('latest') ||
      lowerMessage.includes('current') || lowerMessage.includes('http')) {
    return 'research';
  }
  
  // Complex queries
  if (lowerMessage.includes('analyze') || lowerMessage.includes('strategy') ||
      lowerMessage.includes('compare') || lowerMessage.includes('evaluate') ||
      lowerMessage.includes('executive') || lowerMessage.includes('pipeline') ||
      message.length > 300) {
    return 'complex';
  }
  
  // Simple queries
  if (message.length < 50 || lowerMessage.match(/^(yes|no|ok|thanks?|thank you)/)) {
    return 'simple';
  }
  
  return 'standard';
}

/**
 * POST /api/v1/ai-chat/stream - Streaming AI Chat Endpoint
 * 
 * Uses Vercel AI SDK for native streaming with OpenRouter provider.
 * Returns custom SSE format for frontend compatibility.
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
        console.warn('[STREAM] Failed to fetch record:', error);
      }
    }

    // 6. SELECT MODEL
    const complexity = analyzeQueryComplexity(sanitizedMessage);
    const modelId = selectedAIModel?.openRouterModelId || MODEL_CHAINS[complexity][0];
    
    console.log(`[STREAM] Using Vercel AI SDK with model: ${modelId} (complexity: ${complexity})`);

    // 7. CREATE STREAMING RESPONSE
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send start event IMMEDIATELY so user sees activity
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'start',
            timestamp: Date.now()
          })}\n\n`));

          // Build context (with timeout) in parallel
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
            
            // 🔧 INCREASED: 5 second timeout for context build to allow intelligence queries
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Context build timeout')), 5000);
            });
            
            workspaceContext = await Promise.race([contextPromise, timeoutPromise]);
          } catch {
            console.warn('[STREAM] Context build failed, using minimal context');
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

          // Build system prompt
          const systemPrompt = await buildSystemPrompt(
            workspaceContext,
            currentRecord,
            recordType,
            context.userId
          );

          // Build messages
          const messages: CoreMessage[] = [];
          
          if (conversationHistory && Array.isArray(conversationHistory)) {
            conversationHistory.slice(-5).forEach((msg: { role: string; content: string }) => {
              messages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
              });
            });
          }
          
          messages.push({
            role: 'user',
            content: sanitizedMessage
          });

          // Stream using Vercel AI SDK with OpenRouter provider
          let fullContent = '';
          let usedModel = modelId;
          let tokensUsed = 0;
          
          try {
            const result = await streamText({
              model: openrouter(modelId),
              system: systemPrompt,
              messages,
              maxTokens: complexity === 'complex' ? 8192 : complexity === 'simple' ? 2048 : 4096,
              temperature: 0.7,
            });

            // Stream tokens to client in our custom format
            for await (const chunk of result.textStream) {
              if (chunk) {
                fullContent += chunk;
                tokensUsed++;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'token',
                  content: chunk
                })}\n\n`));
              }
            }

            // Get final usage info if available
            const usage = await result.usage;
            if (usage) {
              tokensUsed = (usage.promptTokens || 0) + (usage.completionTokens || 0);
            }

          } catch (streamError) {
            console.warn(`[STREAM] Model ${modelId} failed, trying fallback:`, streamError);
            
            // Try fallback model
            const fallbackModel = OPENROUTER_MODELS.GPT4O_MINI;
            usedModel = fallbackModel;
            
            try {
              const fallbackResult = await streamText({
                model: openrouter(fallbackModel),
                system: systemPrompt,
                messages,
                maxTokens: 2048,
                temperature: 0.7,
              });

              for await (const chunk of fallbackResult.textStream) {
                if (chunk) {
                  fullContent += chunk;
                  tokensUsed++;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'token',
                    content: chunk
                  })}\n\n`));
                }
              }

              const usage = await fallbackResult.usage;
              if (usage) {
                tokensUsed = (usage.promptTokens || 0) + (usage.completionTokens || 0);
              }
            } catch (fallbackError) {
              console.error('[STREAM] Fallback also failed:', fallbackError);
              throw fallbackError;
            }
          }

          // Send done event with metadata
          const processingTime = Date.now() - requestStartTime;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            metadata: {
              model: usedModel,
              provider: 'OpenRouter',
              tokensUsed,
              processingTime,
              complexity,
              routingInfo: {
                selectedModel: usedModel,
                fallbackUsed: usedModel !== modelId,
              }
            },
            totalTime: processingTime
          })}\n\n`));

          controller.close();

        } catch (error) {
          console.error('[STREAM] Error:', error);
          
          // Send error fallback with record data if available
          let fallbackContent = '';
          if (currentRecord) {
            const recordName = currentRecord.fullName || currentRecord.name || 'this contact';
            const company = typeof currentRecord.company === 'string' 
              ? currentRecord.company 
              : (currentRecord.company?.name || currentRecord.companyName || '');
            
            const fields: string[] = [];
            if (recordName) fields.push(`**Name:** ${recordName}`);
            if (currentRecord.title || currentRecord.jobTitle) fields.push(`**Title:** ${currentRecord.title || currentRecord.jobTitle}`);
            if (company) fields.push(`**Company:** ${company}`);
            if (currentRecord.email) fields.push(`**Email:** ${currentRecord.email}`);
            if (currentRecord.phone) fields.push(`**Phone:** ${currentRecord.phone}`);
            if (currentRecord.status) fields.push(`**Status:** ${currentRecord.status}`);
            
            fallbackContent = `Here's the data I have for **${recordName}**${company ? ` at **${company}**` : ''}:\n\n${fields.join('\n')}\n\nHow can I help you with this contact?`;
          } else {
            fallbackContent = "I'm here to help you with your sales process. What would you like to work on?";
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'token',
            content: fallbackContent
          })}\n\n`));
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            metadata: { model: 'fallback', fallbackUsed: true },
            totalTime: Date.now() - requestStartTime
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
    console.error('[STREAM] Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
