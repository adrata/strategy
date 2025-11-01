/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Oasis Message Reactions API
 * 
 * Handles adding and removing reactions from messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';

// POST /api/oasis/messages/[id]/reactions - Add reaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji required' }, { status: 400 });
    }

    // Get message and verify access
    const message = await prisma.oasisMessage.findFirst({
      where: { id: messageId },
      include: {
        channel: { 
          include: { 
            workspace: true,
            members: {
              where: { userId: session.user.id }
            }
          }
        },
        dm: { 
          include: { 
            workspace: true,
            participants: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify access to channel or DM
    const hasAccess = message.channel?.members.length > 0 || message.dm?.participants.length > 0;
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.oasisReaction.findFirst({
      where: {
        messageId,
        userId: session.user.id,
        emoji
      }
    });

    if (existingReaction) {
      return NextResponse.json({ error: 'Reaction already exists' }, { status: 409 });
    }

    // Create reaction
    const reaction = await prisma.oasisReaction.create({
      data: {
        messageId,
        userId: session.user.id,
        emoji
      },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    // Get workspace ID for broadcasting
    const workspaceId = message.channel?.workspaceId || message.dm?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 500 });
    }

    // Broadcast reaction
    await OasisRealtimeService.broadcastReaction(
      workspaceId,
      reaction,
      message.channelId || undefined,
      message.dmId || undefined
    );

    return NextResponse.json({
      reaction: {
        id: reaction.id,
        emoji: reaction.emoji,
        userId: reaction.userId,
        userName: reaction.user.name,
        createdAt: reaction.createdAt
      }
    });

  } catch (error) {
    console.error('❌ [OASIS REACTIONS] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/oasis/messages/[id]/reactions - Remove reaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;
    const { searchParams } = new URL(request.url);
    const emoji = searchParams.get('emoji');

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji required' }, { status: 400 });
    }

    // Get message and verify access
    const message = await prisma.oasisMessage.findFirst({
      where: { id: messageId },
      include: {
        channel: { 
          include: { 
            workspace: true,
            members: {
              where: { userId: session.user.id }
            }
          }
        },
        dm: { 
          include: { 
            workspace: true,
            participants: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify access to channel or DM
    const hasAccess = message.channel?.members.length > 0 || message.dm?.participants.length > 0;
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find and delete reaction
    const reaction = await prisma.oasisReaction.findFirst({
      where: {
        messageId,
        userId: session.user.id,
        emoji
      }
    });

    if (!reaction) {
      return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
    }

    await prisma.oasisReaction.delete({
      where: { id: reaction.id }
    });

    // Get workspace ID for broadcasting
    const workspaceId = message.channel?.workspaceId || message.dm?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 500 });
    }

    // Broadcast reaction removal
    await OasisRealtimeService.broadcastReactionRemoved(
      workspaceId,
      messageId,
      session.user.id,
      emoji,
      message.channelId || undefined,
      message.dmId || undefined
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [OASIS REACTIONS] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}
