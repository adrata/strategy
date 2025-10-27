/**
 * Oasis Messages API
 * 
 * Handles message sending and fetching
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';

// GET /api/oasis/messages - Get messages for channel or DM
export async function GET(request: NextRequest) {
  try {
    // TODO: Fix authentication - temporarily bypassing for development
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // For now, use a hardcoded user ID for development
    const userId = '01K7469230N74BVGK2PABPNNZ9'; // Ross Sylvester's ID

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const dmId = searchParams.get('dmId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!channelId && !dmId) {
      return NextResponse.json(
        { error: 'Channel ID or DM ID required' },
        { status: 400 }
      );
    }

    // Verify access to channel or DM
    if (channelId) {
      const channel = await prisma.oasisChannel.findFirst({
        where: {
          id: channelId,
          members: {
            some: { userId: userId }
          }
        }
      });

      if (!channel) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (dmId) {
      const dm = await prisma.oasisDirectMessage.findFirst({
        where: {
          id: dmId,
          participants: {
            some: { userId: userId }
          }
        }
      });

      if (!dm) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get messages
    const messages = await prisma.oasisMessage.findMany({
      where: {
        ...(channelId ? { channelId } : {}),
        ...(dmId ? { dmId } : {}),
        parentMessageId: null // Only top-level messages, not thread replies
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true }
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          }
        },
        threadMessages: {
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, username: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      channelId: message.channelId,
      dmId: message.dmId,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderUsername: message.sender.username,
      parentMessageId: message.parentMessageId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      reactions: message.reactions.map(reaction => ({
        id: reaction.id,
        emoji: reaction.emoji,
        userId: reaction.userId,
        userName: reaction.user.name,
        createdAt: reaction.createdAt
      })),
      threadCount: message.threadMessages.length,
      threadMessages: message.threadMessages.map(threadMessage => ({
        id: threadMessage.id,
        content: threadMessage.content,
        senderId: threadMessage.senderId,
        senderName: threadMessage.sender.name,
        senderUsername: threadMessage.sender.username,
        createdAt: threadMessage.createdAt
      }))
    }));

    return NextResponse.json({ 
      messages: formattedMessages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit
    });

  } catch (error) {
    console.error('❌ [OASIS MESSAGES] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/oasis/messages - Send message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, dmId, content, parentMessageId } = body;

    if (!content || (!channelId && !dmId)) {
      return NextResponse.json(
        { error: 'Content and channel ID or DM ID required' },
        { status: 400 }
      );
    }

    // Verify access to channel or DM
    let workspaceId: string;

    if (channelId) {
      const channel = await prisma.oasisChannel.findFirst({
        where: {
          id: channelId,
          members: {
            some: { userId: userId }
          }
        },
        include: { workspace: true }
      });

      if (!channel) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      workspaceId = channel.workspaceId;
    } else {
      const dm = await prisma.oasisDirectMessage.findFirst({
        where: {
          id: dmId,
          participants: {
            some: { userId: userId }
          }
        },
        include: { workspace: true }
      });

      if (!dm) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      workspaceId = dm.workspaceId;
    }

    // Create message
    const message = await prisma.oasisMessage.create({
      data: {
        content,
        channelId: channelId || null,
        dmId: dmId || null,
        senderId: userId,
        parentMessageId: parentMessageId || null
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    // Update DM updatedAt if it's a DM
    if (dmId) {
      await prisma.oasisDirectMessage.update({
        where: { id: dmId },
        data: { updatedAt: new Date() }
      });
    }

    // Broadcast message
    await OasisRealtimeService.broadcastMessage(workspaceId, message);

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        channelId: message.channelId,
        dmId: message.dmId,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderUsername: message.sender.username,
        parentMessageId: message.parentMessageId,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        reactions: [],
        threadCount: 0,
        threadMessages: []
      }
    });

  } catch (error) {
    console.error('❌ [OASIS MESSAGES] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
