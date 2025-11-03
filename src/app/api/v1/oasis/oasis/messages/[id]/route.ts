/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * Oasis Message API
 * 
 * Handles message editing and deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';

// PUT /api/oasis/messages/[id] - Edit message
export async function PUT(
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
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    // Get message and verify ownership
    const message = await prisma.oasisMessage.findFirst({
      where: {
        id: messageId,
        senderId: session.user.id
      },
      include: {
        channel: { include: { workspace: true } },
        dm: { include: { workspace: true } }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Update message
    const updatedMessage = await prisma.oasisMessage.update({
      where: { id: messageId },
      data: { 
        content,
        updatedAt: new Date()
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    // Get workspace ID for broadcasting
    const workspaceId = message.channel?.workspaceId || message.dm?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 500 });
    }

    // Broadcast message edit
    await OasisRealtimeService.broadcastMessageEdit(workspaceId, updatedMessage);

    return NextResponse.json({
      message: {
        id: updatedMessage.id,
        content: updatedMessage.content,
        channelId: updatedMessage.channelId,
        dmId: updatedMessage.dmId,
        senderId: updatedMessage.senderId,
        senderName: updatedMessage.sender.name,
        senderUsername: updatedMessage.sender.username,
        parentMessageId: updatedMessage.parentMessageId,
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ [OASIS MESSAGE] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    );
  }
}

// DELETE /api/oasis/messages/[id] - Delete message
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

    // Get message and verify ownership
    const message = await prisma.oasisMessage.findFirst({
      where: {
        id: messageId,
        senderId: session.user.id
      },
      include: {
        channel: { include: { workspace: true } },
        dm: { include: { workspace: true } }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Get workspace ID for broadcasting
    const workspaceId = message.channel?.workspaceId || message.dm?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 500 });
    }

    // Delete message (cascade will handle reactions and thread messages)
    await prisma.oasisMessage.delete({
      where: { id: messageId }
    });

    // Broadcast message deletion
    await OasisRealtimeService.broadcastMessageDelete(
      workspaceId,
      messageId,
      message.channelId || undefined,
      message.dmId || undefined
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [OASIS MESSAGE] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
