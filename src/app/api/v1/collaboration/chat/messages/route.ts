import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Required for static export (desktop build)
export const dynamic = 'force-static';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Fetch messages for the chat (could be channel or DM)
    const messages = await prisma.oasisMessage.findMany({
      where: {
        OR: [
          { channelId: chatId },
          { dmId: chatId }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const transformedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      chatId: message.channelId || message.dmId,
      senderId: message.senderId,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        email: message.sender.email
      },
      reactions: message.reactions.map(reaction => ({
        emoji: reaction.emoji,
        userId: reaction.userId
      }))
    }));

    return NextResponse.json({ messages: transformedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, content, workspaceId, userId } = body;

    if (!chatId || !content || !workspaceId || !userId) {
      return NextResponse.json({ error: 'Chat ID, content, workspace ID, and user ID are required' }, { status: 400 });
    }

    // Determine if this is a channel or DM
    const channel = await prisma.oasisChannel.findUnique({
      where: { id: chatId }
    });

    const dm = await prisma.oasisDirectMessage.findUnique({
      where: { id: chatId }
    });

    if (!channel && !dm) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Create message
    const message = await prisma.oasisMessage.create({
      data: {
        content,
        senderId: userId,
        channelId: channel ? chatId : null,
        dmId: dm ? chatId : null
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        chatId: message.channelId || message.dmId,
        senderId: message.senderId,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          email: message.sender.email
        }
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, content, userId } = body;

    if (!messageId || !content || !userId) {
      return NextResponse.json({ error: 'Message ID, content, and user ID are required' }, { status: 400 });
    }

    // Check if user owns the message
    const existingMessage = await prisma.oasisMessage.findUnique({
      where: { id: messageId }
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (existingMessage.senderId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to edit this message' }, { status: 403 });
    }

    // Update message
    const message = await prisma.oasisMessage.update({
      where: { id: messageId },
      data: { content },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        chatId: message.channelId || message.dmId,
        senderId: message.senderId,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          email: message.sender.email
        }
      }
    });
  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, userId } = body;

    if (!messageId || !userId) {
      return NextResponse.json({ error: 'Message ID and user ID are required' }, { status: 400 });
    }

    // Check if user owns the message
    const existingMessage = await prisma.oasisMessage.findUnique({
      where: { id: messageId }
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (existingMessage.senderId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this message' }, { status: 403 });
    }

    // Delete message
    await prisma.oasisMessage.delete({
      where: { id: messageId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
