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
- "Write an email" or content requests -> Follow the EMAIL/LINKEDIN WRITING rules below
- Specific questions -> Answer directly with relevant data

=== EMAIL & LINKEDIN WRITING (RESEARCH-BACKED) ===

When asked to write an email, LinkedIn message, or any outreach:

STRUCTURE (30 Minutes to President's Club):
1. HOOK: Start with their name + specific observation (NOT "I hope this finds you well")
2. PROOF: One sentence showing you helped similar companies achieve specific results
3. PUSH: Soft CTA that's easy to say yes to

RESEARCH-BACKED RULES:
- Under 75 words for cold emails (Lavender: under 100 = 50%+ response)
- One sentence per line (mobile-friendly)
- Single CTA only (371% more clicks - Gong)
- Questions get 50% more replies (Gong)
- DON'T ask for meetings in cold emails (44% lower response - Gong)
- Use interest-based CTAs: "Worth exploring?" "Make sense to connect?"
- Binary choices increase response 25%: "Thursday or Friday?"

WOW FACTOR (makes seller say "I LOVE this!"):
- Reference something SPECIFIC about them (their post, news, funding, hire)
- Name a similar company you helped + specific result with numbers
- Sound like a peer, not a salesperson
- Use contractions (I'm, you're, we've) - sounds human
- End with a question that's easy to answer

NEVER DO IN EMAILS:
- "I hope this email finds you well" (kills response rate)
- "I wanted to reach out to introduce myself"
- "Please let me know at your earliest convenience"
- "I'd like to schedule a call to discuss" (too pushy for cold)
- Multiple CTAs or questions
- More than 2 exclamation points
- Generic templates that could be sent to anyone

EXAMPLE STRUCTURE:
"[Name] - [specific observation about them/company].

[One sentence about how you helped similar company achieve specific result].

[Soft question CTA]?"

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
      listViewContext: frontendListViewContext,
      isListView,
      listViewSection,
      pathname,
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
    let listViewContext = frontendListViewContext;
    let fetchedListContext: any = null;
    
    // 5a. Fetch record from DB if not provided but we have ID
    if (!currentRecord && recordIdFromUrl) {
      try {
        const { getPrismaClient } = await import('@/platform/database/connection-pool');
        const prisma = getPrismaClient();
        
        const personRecord = await prisma.people.findUnique({
          where: { id: recordIdFromUrl },
          include: { company: true }
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
    
    // 5b. 🆕 SMART LIST CONTEXT FETCHING: Fetch list from DB when on list view
    if (isListView && listViewSection && !listViewContext) {
      try {
        const { fetchListContext, buildListContextString } = await import('@/platform/ai/services/SmartContextFetcher');
        fetchedListContext = await fetchListContext(listViewSection, context.workspaceId);
        
        if (fetchedListContext) {
          console.log('✅ [STREAM] Fetched list context from database:', {
            section: listViewSection,
            recordCount: fetchedListContext.records.length,
            totalCount: fetchedListContext.totalCount
          });
        }
      } catch (error) {
        console.warn('[STREAM] Failed to fetch list context:', error);
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
            
            // 🆕 ENHANCE: If we fetched list context from DB, add it to workspace context
            if (fetchedListContext && (!workspaceContext.listViewContext || workspaceContext.listViewContext.includes('No list view context'))) {
              const { buildListContextString } = await import('@/platform/ai/services/SmartContextFetcher');
              workspaceContext.listViewContext = buildListContextString(fetchedListContext);
              console.log('✅ [STREAM] Enhanced context with DB-fetched list data');
            }
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
            
            // 🆕 Still try to add fetched list context even if main context build failed
            if (fetchedListContext) {
              try {
                const { buildListContextString } = await import('@/platform/ai/services/SmartContextFetcher');
                workspaceContext.listViewContext = buildListContextString(fetchedListContext);
              } catch {}
            }
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
          
          // Send intelligent fallback based on request type
          let fallbackContent = '';
          const lowerMessage = message.toLowerCase();
          const isEmailRequest = lowerMessage.includes('email') || lowerMessage.includes('draft') || lowerMessage.includes('write');
          const isLinkedInRequest = lowerMessage.includes('linkedin') || lowerMessage.includes('message');
          
          if (currentRecord) {
            const recordName = currentRecord.fullName || currentRecord.name || 'this contact';
            const firstName = currentRecord.firstName || recordName.split(' ')[0];
            const company = typeof currentRecord.company === 'string' 
              ? currentRecord.company 
              : (currentRecord.company?.name || currentRecord.companyName || '');
            const title = currentRecord.title || currentRecord.jobTitle || '';
            
            // SMART FALLBACK: Generate research-backed email if requested
            if (isEmailRequest && firstName && company) {
              fallbackContent = `Here's a cold email draft for ${recordName}:\n\n---\n\n**Subject:** Quick question for ${firstName}\n\n${firstName} - noticed ${company} is growing fast.\n\nCompanies at your stage typically hit bottlenecks we specialize in solving. We helped similar ${title ? title + 's' : 'teams'} cut their timeline significantly.\n\nWorth a quick call to see if this applies to ${company}?\n\n[Your Name]\n\n---\n\n*This follows research-backed best practices: <75 words, name + observation hook, single soft CTA, ends with a question.*`;
            } else if (isLinkedInRequest && firstName && company) {
              fallbackContent = `Here's a LinkedIn message for ${recordName}:\n\n---\n\n${firstName} - saw you're ${title ? `a ${title} at` : 'with'} ${company}. Companies scaling like yours often hit challenges we've helped solve.\n\nOpen to connecting?\n\n---\n\n*Short, personal, and easy to say yes to.*`;
            } else {
              // Default: show data
              const fields: string[] = [];
              if (recordName) fields.push(`**Name:** ${recordName}`);
              if (title) fields.push(`**Title:** ${title}`);
              if (company) fields.push(`**Company:** ${company}`);
              if (currentRecord.email) fields.push(`**Email:** ${currentRecord.email}`);
              if (currentRecord.phone) fields.push(`**Phone:** ${currentRecord.phone}`);
              if (currentRecord.status) fields.push(`**Status:** ${currentRecord.status}`);
              
              fallbackContent = `Here's the data I have for **${recordName}**${company ? ` at **${company}**` : ''}:\n\n${fields.join('\n')}\n\nHow can I help you with this contact? I can:\n- Write a cold email or LinkedIn message\n- Suggest next steps\n- Research their company`;
            }
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
