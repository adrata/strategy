/**
 * Oasis AI Response API
 * 
 * Handles AI responses to messages in Adrata AI DMs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';

// POST /api/v1/oasis/oasis/ai-response - Generate AI response
export async function POST(request: NextRequest) {
  try {
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
      aiResponse = generateAIResponse(messageContent, 'User');
    }

    // Create the AI response message
    const aiMessage = await prisma.oasisMessage.create({
      data: {
        content: aiResponse,
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
