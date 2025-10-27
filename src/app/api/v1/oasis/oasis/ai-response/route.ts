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
    const { messageContent, dmId, workspaceId } = body;

    if (!messageContent || !dmId || !workspaceId) {
      return NextResponse.json(
        { error: 'Message content, DM ID, and workspace ID required' },
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

    // Verify this is a DM with Adrata AI
    const dm = await prisma.oasisDirectMessage.findFirst({
      where: {
        id: dmId,
        workspaceId,
        participants: {
          some: {
            userId: adrataAI.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    if (!dm) {
      return NextResponse.json(
        { error: 'DM with Adrata AI not found' },
        { status: 404 }
      );
    }

    // Get the other participant (not Adrata AI)
    const otherParticipant = dm.participants.find(p => p.userId !== adrataAI.id);
    if (!otherParticipant) {
      return NextResponse.json(
        { error: 'Other participant not found' },
        { status: 404 }
      );
    }

    // Generate AI response based on message content
    let aiResponse = generateAIResponse(messageContent, otherParticipant.user.name);

    // Create the AI response message
    const aiMessage = await prisma.oasisMessage.create({
      data: {
        content: aiResponse,
        dmId: dmId,
        senderId: adrataAI.id,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Broadcast the AI response
    await OasisRealtimeService.broadcastMessageSent(workspaceId, aiMessage, undefined, dmId);

    return NextResponse.json(aiMessage, { status: 201 });

  } catch (error) {
    console.error('❌ [OASIS AI RESPONSE] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
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
    return `Adrata is your all-in-one sales platform! It includes RevenueOS for pipeline management, Atrium for documentation, and Oasis for team communication. Is there something specific you'd like to know about?`;
  }
  
  // Questions about features
  if (lowerContent.includes('feature') || lowerContent.includes('how to') || lowerContent.includes('how do')) {
    return `I'd be happy to help you learn about Adrata's features! You can ask me about RevenueOS, Atrium, Oasis, or any other part of the platform. What would you like to explore?`;
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
