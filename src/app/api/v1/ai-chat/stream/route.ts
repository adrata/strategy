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

export const runtime = 'nodejs'; // Explicit runtime for streaming
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 300 seconds (5 min) for AI streaming responses - Pro plan max

import { NextRequest } from 'next/server';
import { streamText, CoreMessage } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { openrouter, OPENROUTER_MODELS, MODEL_CHAINS } from '@/platform/services/OpenRouterClient';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';
import { AIContextService } from '@/platform/ai/services/AIContextService';
import { promptInjectionGuard } from '@/platform/security/prompt-injection-guard';
import { rateLimiter } from '@/platform/security/rate-limiter';
import { securityMonitor } from '@/platform/security/security-monitor';
import { systemPromptProtector } from '@/platform/security/system-prompt-protector';

// Lazy-initialized Anthropic provider for direct Claude access (faster than OpenRouter)
let _anthropicInstance: ReturnType<typeof createAnthropic> | null = null;
let _anthropicInitFailed = false;

function getAnthropicInstance() {
  // If we've already failed to initialize, don't try again
  if (_anthropicInitFailed) {
    return null;
  }
  
  if (!_anthropicInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('[STREAM] ANTHROPIC_API_KEY not set - will use OpenRouter fallback');
      return null;
    }
    
    try {
      _anthropicInstance = createAnthropic({ apiKey });
      console.log('[STREAM] Anthropic SDK initialized successfully');
    } catch (initError) {
      console.error('[STREAM] Failed to initialize Anthropic SDK:', initError);
      _anthropicInitFailed = true;
      return null;
    }
  }
  return _anthropicInstance;
}

// Claude model for direct Anthropic API
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

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

You are Adrata, an intelligent assistant for sales professionals. Help users understand their contacts, companies, and deals with actionable guidance.

ABSOLUTE RULES (NEVER BREAK):
- NEVER use emojis, emoticons, or special symbols like checkmarks, warning signs, etc.
- NEVER use Unicode symbols like ⚠️, ✅, ❌, 📋, 💡, 🎯, 🔥, etc.
- Keep responses SHORT - 2-3 paragraphs max unless writing emails

CORE PRINCIPLES:
1. BE SUCCINCT - Get to the point immediately. No preamble. No filler.
2. USE DATA - Reference specific details from context.
3. NO JARGON - Plain English. Avoid acronyms.
4. ANSWER FIRST - Lead with the answer, then add context if needed.

WHEN ASKED ABOUT A PERSON:
- Name, Title at Company (one line)
- Key facts: seniority, department, decision role
- Intelligence: pain points, goals, challenges
- Status: last contact, next action

WHEN ASKED ABOUT A COMPANY:
- Company, industry, size (one line)
- What they do, priorities
- Your contacts there, engagement status

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
- "Multi-thread" or "email everyone" or "all stakeholders" -> Generate role-specific emails for ALL people on the deal

=== ENTERPRISE MULTI-THREADING (30MPC + Gong) ===

When asked to "multi-thread", "email everyone on this deal", "write emails for all stakeholders":

MULTI-THREADING DATA (Gong + 30MPC):
- Deals with 3+ stakeholders = 2.5x more likely to close
- Multi-threading = 3x higher close rates
- Different roles need DIFFERENT messages

STAKEHOLDER ROLE-SPECIFIC MESSAGING:
1. CHAMPION (internal advocate): Enable their advocacy, give them ammunition, make them look good
2. ECONOMIC BUYER (C-level/signs check): ROI focus, strategic impact, time/cost savings
3. TECHNICAL BUYER (evaluator): Implementation details, integration proof, architecture
4. END USER (daily user): Workflow benefits, ease of use, time savings
5. BLOCKER (opponent): Address concerns directly, provide peer references

FORMAT FOR MULTI-THREAD RESPONSE:
For each stakeholder, generate a personalized email with:
- Their name and role
- Role-appropriate subject line
- Role-specific body (different messaging for each role)
- Brief reasoning for why this approach works for their role

SENDING ORDER (30MPC recommended):
1. Champion first (they're your advocate)
2. Economic Buyer within 24-48 hours
3. Technical Buyer with implementation details
4. End Users to build grassroots support
5. Address Blockers last with peer references

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
    // 🔧 FIX: Include list view context so AI can search for people by name in the current list
    if (workspaceContext.listViewContext && !workspaceContext.listViewContext.includes('No list view context')) {
      basePrompt += `\n\n=== LIST VIEW CONTEXT ===\n${workspaceContext.listViewContext}`;
      basePrompt += `\n\nIMPORTANT: When the user asks about a specific person by name (e.g., "tell me about Terry Torok"), FIRST search the LIST VIEW CONTEXT above for that person. If found, provide information about them from the list. Only say you cannot find someone if they are NOT in the list above.`;
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
- Lead with the answer, not context
- 2-3 sentences max for simple questions
- Use bullet points for lists, not paragraphs
- Bold key terms with **term** sparingly
- Wrap person names in backticks: \`Name Here\` (makes them clickable)

NEVER (CRITICAL):
- Use emojis or Unicode symbols (no ⚠️ ✅ ❌ 📋 💡 🎯 etc.)
- Start with filler like "Great question!" or "I'd be happy to help"
- Say "I don't have enough context" when data exists
- Write long introductions
- Use unexplained acronyms
- Add bullet point symbols like • or ▪`;

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
  
  // Log request start for debugging
  console.log('[STREAM] === REQUEST START ===', {
    timestamp: new Date().toISOString(),
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY
  });
  
  try {
    // 1. AUTHENTICATION CHECK
    console.log('[STREAM] Step 1: Auth check starting...');
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    console.log('[STREAM] Step 1: Auth check complete', { hasContext: !!context, hasResponse: !!response });

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

    // Parse request body with error handling
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[STREAM] Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid request body',
        code: 'PARSE_ERROR'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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

    // 6. VALIDATE API KEY
    console.log('[STREAM] Step 6: Validating API keys...');
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error('[STREAM] CRITICAL: OPENROUTER_API_KEY is not set!');
      return new Response(JSON.stringify({ 
        error: 'AI service not configured. Please set OPENROUTER_API_KEY environment variable.',
        code: 'API_KEY_MISSING'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log('[STREAM] Step 6: API keys validated');
    
    // 7. SELECT MODEL
    console.log('[STREAM] Step 7: Selecting model...');
    const complexity = analyzeQueryComplexity(sanitizedMessage);
    const modelId = selectedAIModel?.openRouterModelId || MODEL_CHAINS[complexity][0];
    console.log(`[STREAM] Step 7: Model selected: ${modelId} (complexity: ${complexity})`);

    // 8. BUILD CONTEXT BEFORE STREAM (prevents 500 errors)
    // All async work that can fail should happen BEFORE creating the stream
    console.log('[STREAM] Step 8: Building context...');
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
      
      // Context build timeout - balance between speed and reliability
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Context build timeout')), 3000);
      });
      
      workspaceContext = await Promise.race([contextPromise, timeoutPromise]);
      
      // ENHANCE: If we fetched list context from DB, add it to workspace context
      if (fetchedListContext && (!workspaceContext.listViewContext || workspaceContext.listViewContext.includes('No list view context'))) {
        const { buildListContextString } = await import('@/platform/ai/services/SmartContextFetcher');
        workspaceContext.listViewContext = buildListContextString(fetchedListContext);
        console.log('[STREAM] Enhanced context with DB-fetched list data');
      }
    } catch (contextError) {
      console.warn('[STREAM] Context build failed, using minimal context:', contextError);
      workspaceContext = {
        userContext: '',
        applicationContext: '',
        dataContext: '',
        recordContext: '',
        listViewContext: '',
        documentContext: '',
        systemContext: ''
      };
      
      // Still try to add fetched list context even if main context build failed
      if (fetchedListContext) {
        try {
          const { buildListContextString } = await import('@/platform/ai/services/SmartContextFetcher');
          workspaceContext.listViewContext = buildListContextString(fetchedListContext);
        } catch {}
      }
    }

    // 9. BUILD SYSTEM PROMPT BEFORE STREAM
    let systemPrompt: string;
    try {
      systemPrompt = await buildSystemPrompt(
        workspaceContext,
        currentRecord,
        recordType,
        context.userId
      );
    } catch (promptError) {
      console.error('[STREAM] System prompt build failed:', promptError);
      // Use a minimal fallback prompt
      systemPrompt = 'You are Adrata, a helpful sales assistant. Be concise and helpful.';
    }

    // 10. BUILD MESSAGES BEFORE STREAM
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

    // Check if Anthropic is available (preferred - direct connection is faster)
    console.log('[STREAM] Step 11: Initializing AI providers...');
    const anthropic = getAnthropicInstance();
    const hasAnthropicKey = !!anthropic;
    
    console.log('[STREAM] Step 11: Provider status:', { 
      hasAnthropicKey, 
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      willUse: hasAnthropicKey ? 'Claude (Direct)' : 'OpenRouter'
    });

    // 11. CREATE STREAMING RESPONSE - Custom SSE format for frontend compatibility
    console.log('[STREAM] Step 12: Creating stream response...');
    
    const usedModel = hasAnthropicKey ? CLAUDE_MODEL : OPENROUTER_MODELS.GPT4O_MINI;
    const usedProvider = hasAnthropicKey ? 'Anthropic' : 'OpenRouter';
    console.log(`[STREAM] Using: ${usedProvider} (${usedModel})`);
    
    // Create the stream FIRST, then return response immediately
    // This is the key fix - we create a TransformStream and start streaming
    const encoder = new TextEncoder();
    
    // Use TransformStream for better streaming control
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    // Start the AI streaming in the background (don't await)
    (async () => {
      try {
        // Send start event immediately
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: 'start',
          timestamp: Date.now()
        })}\n\n`));
        
        // Call streamText - returns a StreamTextResult
        console.log(`[STREAM] Calling streamText with ${usedProvider} (${usedModel})...`);
        const result = streamText({
          model: hasAnthropicKey && anthropic 
            ? anthropic(CLAUDE_MODEL)
            : openrouter(usedModel),
          system: systemPrompt,
          messages,
          maxTokens: complexity === 'complex' ? 4096 : complexity === 'simple' ? 1024 : 2048,
          temperature: 0.7,
        });
        
        let tokensUsed = 0;
        let fullContent = '';
        
        // Stream tokens as they arrive
        console.log('[STREAM] Starting to iterate textStream...');
        for await (const chunk of result.textStream) {
          if (chunk) {
            tokensUsed++;
            fullContent += chunk;
            await writer.write(encoder.encode(`data: ${JSON.stringify({
              type: 'token',
              content: chunk
            })}\n\n`));
          }
        }
        
        console.log(`[STREAM] textStream iteration complete. Tokens: ${tokensUsed}, Length: ${fullContent.length}`);
        
        // Check if we got any content
        if (fullContent.length === 0) {
          console.error('[STREAM] No content received from AI!');
          throw new Error('No content received from AI provider');
        }
        
        // Get final usage stats
        const usage = await result.usage;
        if (usage) {
          tokensUsed = (usage.promptTokens || 0) + (usage.completionTokens || 0);
        }
        
        console.log(`[STREAM] ${usedProvider} succeeded - ${tokensUsed} tokens, ${Date.now() - requestStartTime}ms`);
        
        // Send done event
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: 'done',
          metadata: { model: usedModel, tokensUsed, provider: usedProvider },
          totalTime: Date.now() - requestStartTime
        })}\n\n`));
        
      } catch (streamError: any) {
        console.error(`[STREAM] Stream error:`, streamError?.message || streamError);
        
        // Send error event
        try {
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: streamError?.message || 'Stream failed',
            recoverable: false
          })}\n\n`));
        } catch (e) {
          // Writer might be closed
        }
      } finally {
        try {
          await writer.close();
        } catch (e) {
          // Writer might already be closed
        }
      }
    })();
    
    // Return the readable stream IMMEDIATELY
    // The background task will write to it
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Provider': usedProvider,
        'X-Model': usedModel,
      }
    });

  } catch (error) {
    console.error('[STREAM] Fatal error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name
    });
    
    // Return detailed error for debugging (in non-production) or generic message
    const isDev = process.env.NODE_ENV !== 'production';
    return new Response(JSON.stringify({ 
      error: isDev ? (error instanceof Error ? error.message : 'Unknown error') : 'Service temporarily unavailable',
      code: 'STREAM_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
