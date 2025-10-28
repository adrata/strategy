/**
 * Oasis AI Response API
 * 
 * Handles AI responses to messages in Adrata AI DMs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { promptInjectionGuard } from '@/platform/security/prompt-injection-guard';
import { aiResponseValidator } from '@/platform/security/ai-response-validator';
import { rateLimiter } from '@/platform/security/rate-limiter';

// POST /api/v1/oasis/oasis/ai-response - Generate AI response
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION CHECK - Critical security requirement
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    const body = await request.json();
    const { messageContent, channelId, dmId, workspaceId, isInitial } = body;

    if (!workspaceId || (!channelId && !dmId)) {
      return NextResponse.json(
        { error: 'Workspace ID and channel or DM ID required' },
        { status: 400 }
      );
    }

    // For initial greetings, messageContent is optional
    if (!isInitial && !messageContent) {
      return NextResponse.json(
        { error: 'Message content required for non-initial responses' },
        { status: 400 }
      );
    }

    // 2. INPUT VALIDATION AND SANITIZATION - Critical security requirement
    if (messageContent) {
      const injectionDetection = promptInjectionGuard.detectInjection(messageContent, {
        userId: authUser.id,
        workspaceId: authUser.workspaceId || workspaceId
      });

      // Block critical and high-risk injection attempts
      if (injectionDetection.isInjection && 
          (injectionDetection.riskLevel === 'critical' || injectionDetection.riskLevel === 'high')) {
        console.warn('🚨 [OASIS AI] Prompt injection blocked:', {
          userId: authUser.id,
          workspaceId: authUser.workspaceId || workspaceId,
          attackType: injectionDetection.attackType,
          riskLevel: injectionDetection.riskLevel,
          confidence: injectionDetection.confidence,
          blockedPatterns: injectionDetection.blockedPatterns
        });

        return NextResponse.json({
          error: 'Invalid input detected. Please rephrase your message.',
          code: 'INJECTION_BLOCKED',
          riskLevel: injectionDetection.riskLevel
        }, { status: 400 });
      }
    }

    // 3. RATE LIMITING - Prevent abuse and DoS attacks
    const rateLimitResult = rateLimiter.checkRateLimit(
      authUser.id,
      'ai_response',
      authUser.workspaceId || workspaceId
    );

    if (!rateLimitResult.allowed) {
      console.warn('🚨 [OASIS AI] Rate limit exceeded:', {
        userId: authUser.id,
        workspaceId: authUser.workspaceId || workspaceId,
        totalHits: rateLimitResult.totalHits,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter
      });

      return NextResponse.json({
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

    // Get Adrata AI user
    const adrataAI = await prisma.users.findFirst({
      where: { email: 'ai@adrata.com' }
    });

    if (!adrataAI) {
      return NextResponse.json(
        { error: 'Adrata AI user not found' },
        { status: 500 }
      );
    }

    // Generate AI response based on message content or initial greeting
    let aiResponse;
    if (isInitial) {
      aiResponse = generateInitialGreeting(channelId ? 'channel' : 'dm');
    } else {
      // Use sanitized input for AI response generation
      const sanitizedMessage = messageContent ? 
        promptInjectionGuard.detectInjection(messageContent, {
          userId: authUser.id,
          workspaceId: authUser.workspaceId || workspaceId
        }).sanitizedInput : messageContent;
      
      aiResponse = generateAIResponse(sanitizedMessage, 'User');
    }

    // 3. RESPONSE VALIDATION - Critical security requirement
    const responseValidation = aiResponseValidator.validateResponse(aiResponse, {
      userId: authUser.id,
      workspaceId: authUser.workspaceId || workspaceId
    });

    // Block critical and high-risk responses
    if (!responseValidation.isValid && 
        (responseValidation.riskLevel === 'critical' || responseValidation.riskLevel === 'high')) {
      console.warn('🚨 [OASIS AI] Response validation failed:', {
        userId: authUser.id,
        workspaceId: authUser.workspaceId || workspaceId,
        riskLevel: responseValidation.riskLevel,
        issues: responseValidation.issues,
        confidence: responseValidation.confidence
      });

      return NextResponse.json({
        error: 'Response validation failed. Please try again.',
        code: 'RESPONSE_VALIDATION_FAILED',
        riskLevel: responseValidation.riskLevel
      }, { status: 400 });
    }

    // Use sanitized response
    const sanitizedResponse = responseValidation.sanitizedResponse;

    // Create the AI response message
    const aiMessage = await prisma.oasisMessage.create({
      data: {
        content: sanitizedResponse,
        channelId: channelId || undefined,
        dmId: dmId || undefined,
        senderId: adrataAI.id,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Broadcast the AI response
    await OasisRealtimeService.broadcastMessageSent(workspaceId, aiMessage, channelId, dmId);

    // Record successful request for rate limiting
    rateLimiter.recordRequest(
      authUser.id,
      'ai_response',
      authUser.workspaceId || workspaceId,
      true
    );

    return NextResponse.json(aiMessage, { status: 201 });

  } catch (error) {
    console.error('❌ [OASIS AI RESPONSE] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}

// Generate initial greeting based on conversation type
function generateInitialGreeting(conversationType: 'channel' | 'dm'): string {
  if (conversationType === 'channel') {
    return "Hi! I'm Adrata. What would you like to work on today?";
  } else {
    return "Hi! I'm Adrata. What would you like to work on today?";
  }
}

// Simple AI response generator (replace with actual AI service later)
function generateAIResponse(messageContent: string, userName: string): string {
  const lowerContent = messageContent.toLowerCase();
  
  // Greeting responses
  if (lowerContent.includes('hello') || lowerContent.includes('hi') || lowerContent.includes('hey')) {
    return `Hello ${userName}! How can I help you today?`;
  }
  
  // Help requests
  if (lowerContent.includes('help') || lowerContent.includes('support')) {
    return `I'm here to help! I can assist with questions about Adrata, provide information about your workspace, or just chat. What would you like to know?`;
  }
  
  // Questions about Adrata
  if (lowerContent.includes('adrata') || lowerContent.includes('platform')) {
    return `Adrata is your all-in-one sales platform! It includes AcquisitionOS for pipeline management, Atrium for documentation, and Oasis for team communication. Is there something specific you'd like to know about?`;
  }
  
  // Questions about features
  if (lowerContent.includes('feature') || lowerContent.includes('how to') || lowerContent.includes('how do')) {
    return `I'd be happy to help you learn about Adrata's features! You can ask me about AcquisitionOS, Atrium, Oasis, or any other part of the platform. What would you like to explore?`;
  }
  
  // Thank you responses
  if (lowerContent.includes('thank') || lowerContent.includes('thanks')) {
    return `You're welcome! I'm always here to help. Feel free to ask me anything anytime.`;
  }
  
  // Default responses
  const responses = [
    `That's interesting, ${userName}! Tell me more about what you're working on.`,
    `I understand. How can I help you with that?`,
    `Thanks for sharing that with me. Is there anything specific you'd like assistance with?`,
    `I'm here to help! What would you like to know more about?`,
    `That sounds great! Let me know if you need any help or have questions.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
