/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Oasis Channels API
 * 
 * Handles channel creation and listing for workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';

// GET /api/oasis/channels - List workspace channels
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
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Verify user has access to workspace
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId,
        userId: userId,
        isActive: true
      }
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get channels with member count and unread count
    const channels = await prisma.oasisChannel.findMany({
      where: { workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          }
        },
        messages: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const channelsWithStats = channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      createdAt: channel.createdAt,
      memberCount: channel.members.length,
      recentMessageCount: channel.messages.length,
      isMember: channel.members.some(member => member.userId === userId)
    }));

    // Custom sort order: general, sell, build, random, wins
    const customOrder = ['general', 'sell', 'build', 'random', 'wins'];
    const sortedChannels = channelsWithStats.sort((a, b) => {
      const aIndex = customOrder.indexOf(a.name);
      const bIndex = customOrder.indexOf(b.name);
      return aIndex - bIndex;
    });

    return NextResponse.json({ channels: sortedChannels });

  } catch (error) {
    console.error('❌ [OASIS CHANNELS] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

// POST /api/oasis/channels - Create new channel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, name, description } = body;

    if (!workspaceId || !name) {
      return NextResponse.json(
        { error: 'Workspace ID and channel name required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId,
        userId: userId,
        isActive: true
      }
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if channel name already exists in workspace
    const existingChannel = await prisma.oasisChannel.findFirst({
      where: {
        workspaceId,
        name: name.toLowerCase()
      }
    });

    if (existingChannel) {
      return NextResponse.json(
        { error: 'Channel name already exists' },
        { status: 409 }
      );
    }

    // Create channel
    const channel = await prisma.oasisChannel.create({
      data: {
        workspaceId,
        name: name.toLowerCase(),
        description: description || null
      }
    });

    // Add creator as member
    await prisma.oasisChannelMember.create({
      data: {
        channelId: channel.id,
        userId: session.user.id
      }
    });

    // Broadcast channel creation
    await OasisRealtimeService.broadcastMessage(workspaceId, {
      id: `channel-created-${channel.id}`,
      content: `Channel #${channel.name} was created`,
      channelId: channel.id,
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

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        createdAt: channel.createdAt,
        memberCount: 1,
        recentMessageCount: 0,
        isMember: true
      }
    });

  } catch (error) {
    console.error('❌ [OASIS CHANNELS] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}
