import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Validate that the chat belongs to the authenticated user's workspace
    const channel = await prisma.oasisChannel.findFirst({
      where: { id: chatId, workspaceId: context.workspaceId }
    });

    const dm = await prisma.oasisDirectMessage.findFirst({
      where: { id: chatId, workspaceId: context.workspaceId }
    });

    if (!channel && !dm) {
      return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 404 });
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
    // Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const { chatId, content } = body;

    if (!chatId || !content) {
      return NextResponse.json({ error: 'Chat ID and content are required' }, { status: 400 });
    }

    // Use authenticated user ID and workspace
    const userId = context.userId;
    const workspaceId = context.workspaceId;

    // Determine if this is a channel or DM and validate workspace access
    const channel = await prisma.oasisChannel.findFirst({
      where: { id: chatId, workspaceId: workspaceId }
    });

    const dm = await prisma.oasisDirectMessage.findFirst({
      where: { id: chatId, workspaceId: workspaceId }
    });

    if (!channel && !dm) {
      return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 404 });
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
    // Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const { messageId, content } = body;

    if (!messageId || !content) {
      return NextResponse.json({ error: 'Message ID and content are required' }, { status: 400 });
    }

    const userId = context.userId;
    const workspaceId = context.workspaceId;

    // Check if user owns the message
    const existingMessage = await prisma.oasisMessage.findUnique({
      where: { id: messageId },
      include: {
        channel: { select: { workspaceId: true } },
        dm: { select: { workspaceId: true } }
      }
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify the message belongs to the user's workspace
    const messageWorkspaceId = existingMessage.channel?.workspaceId || existingMessage.dm?.workspaceId;
    if (messageWorkspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify the user owns the message
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
    // Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const userId = context.userId;
    const workspaceId = context.workspaceId;

    // Check if user owns the message
    const existingMessage = await prisma.oasisMessage.findUnique({
      where: { id: messageId },
      include: {
        channel: { select: { workspaceId: true } },
        dm: { select: { workspaceId: true } }
      }
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify the message belongs to the user's workspace
    const messageWorkspaceId = existingMessage.channel?.workspaceId || existingMessage.dm?.workspaceId;
    if (messageWorkspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify the user owns the message
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
