/**
 * Oasis Channel Members API
 * 
 * Handles adding and removing members from channels
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';

// POST /api/oasis/channels/[id]/members - Add member to channel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channelId = params.id;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get channel and verify access
    const channel = await prisma.oasisChannel.findFirst({
      where: { id: channelId },
      include: {
        workspace: true,
        members: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Check if current user is a member of the channel
    if (channel.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify target user has access to workspace
    const targetUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: channel.workspaceId,
        userId,
        isActive: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not in workspace' }, { status: 403 });
    }

    // Check if user is already a member
    const existingMember = await prisma.oasisChannelMember.findFirst({
      where: {
        channelId,
        userId
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User already in channel' }, { status: 409 });
    }

    // Add member
    await prisma.oasisChannelMember.create({
      data: {
        channelId,
        userId
      }
    });

    // Get user details for broadcast
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { name: true, username: true }
    });

    // Broadcast member added
    await OasisRealtimeService.broadcastMessage(channel.workspaceId, {
      id: `member-added-${Date.now()}`,
      content: `${user?.name || 'Unknown User'} joined the channel`,
      channelId,
      dmId: null,
      senderId: session.user.id,
      parentMessageId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: {
        name: session.user.name || 'Unknown User',
        username: session.user.username
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [OASIS CHANNEL MEMBERS] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}

// DELETE /api/oasis/channels/[id]/members/[userId] - Remove member from channel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channelId = params.id;
    const userId = params.userId;

    // Get channel and verify access
    const channel = await prisma.oasisChannel.findFirst({
      where: { id: channelId },
      include: {
        workspace: true,
        members: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Check if current user is a member of the channel
    if (channel.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if target user is a member
    const targetMember = await prisma.oasisChannelMember.findFirst({
      where: {
        channelId,
        userId
      }
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'User not in channel' }, { status: 404 });
    }

    // Remove member
    await prisma.oasisChannelMember.delete({
      where: {
        id: targetMember.id
      }
    });

    // Get user details for broadcast
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { name: true, username: true }
    });

    // Broadcast member removed
    await OasisRealtimeService.broadcastMessage(channel.workspaceId, {
      id: `member-removed-${Date.now()}`,
      content: `${user?.name || 'Unknown User'} left the channel`,
      channelId,
      dmId: null,
      senderId: session.user.id,
      parentMessageId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: {
        name: session.user.name || 'Unknown User',
        username: session.user.username
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [OASIS CHANNEL MEMBERS] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
