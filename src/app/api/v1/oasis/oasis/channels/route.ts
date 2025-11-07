/**
 * Oasis Channels API
 * 
 * Handles channel creation and listing for workspaces
 */
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';
import { getUnifiedAuthUser } from '@/platform/api-auth';

// GET /api/oasis/channels - List workspace channels
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = authUser.id;

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
            },
            parentMessageId: null, // Only count top-level messages (not thread replies)
            senderId: { not: userId } // Only count messages from other users (exclude current user's messages)
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
      isPrivate: channel.isPrivate,
      createdAt: channel.createdAt,
      memberCount: channel.members.length,
      recentMessageCount: channel.messages.length,
      isMember: channel.members.some(member => member.userId === userId)
    }));

    // Custom sort order: general, sell, build, creative, wins
    const customOrder = ['general', 'sell', 'build', 'creative', 'wins'];
    const sortedChannels = channelsWithStats.sort((a, b) => {
      const aIndex = customOrder.indexOf(a.name);
      const bIndex = customOrder.indexOf(b.name);
      // If both are in custom order, sort by order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is in custom order, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // Otherwise alphabetical
      return (a.name || '').localeCompare(b.name || '');
    });

    // Auto-create default channels if none exist
    if (sortedChannels.length === 0) {
      const DEFAULT_CHANNELS = [
        { name: 'general', description: 'General discussion and announcements' },
        { name: 'sell', description: 'Sales strategies and customer conversations' },
        { name: 'build', description: 'Product development and engineering discussions' },
        { name: 'imagine', description: 'Creative ideas, inspiration, and innovative discussions' },
        { name: 'wins', description: 'Celebrate victories and success stories' }
      ];

      // Create all default channels
      for (const channelData of DEFAULT_CHANNELS) {
        const createdChannel = await prisma.oasisChannel.create({
          data: {
            workspaceId,
            name: channelData.name,
            description: channelData.description,
            isPrivate: false // Default channels are public
          }
        });

        // Add current user as member
        await prisma.oasisChannelMember.create({
          data: {
            channelId: createdChannel.id,
            userId: userId
          }
        });
      }

      // Re-fetch channels after creation
      const newChannels = await prisma.oasisChannel.findMany({
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
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            },
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      const newChannelsWithStats = newChannels.map(channel => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        isPrivate: channel.isPrivate,
        createdAt: channel.createdAt,
        memberCount: channel.members.length,
        recentMessageCount: channel.messages.length,
        isMember: channel.members.some(member => member.userId === userId)
      }));

      const newSortedChannels = newChannelsWithStats.sort((a, b) => {
        const aIndex = customOrder.indexOf(a.name);
        const bIndex = customOrder.indexOf(b.name);
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      return NextResponse.json({ channels: newSortedChannels });
    }

    return NextResponse.json({ channels: sortedChannels });

  } catch (error: any) {
    console.error('❌ [OASIS CHANNELS] GET error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2021') {
      return NextResponse.json(
        { 
          error: 'Database migration required',
          code: 'MIGRATION_REQUIRED',
          details: 'OasisChannel table does not exist'
        },
        { status: 503 }
      );
    } else if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Unique constraint violation',
          code: 'DUPLICATE_ENTRY',
          details: error.message
        },
        { status: 409 }
      );
    } else if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: 'Foreign key constraint violation',
          code: 'INVALID_REFERENCE',
          details: error.message
        },
        { status: 400 }
      );
    } else if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          error: 'Record not found',
          code: 'NOT_FOUND',
          details: error.message
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

// POST /api/oasis/channels - Create new channel
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;

    const body = await request.json();
    const { workspaceId, name, description, isPrivate } = body;

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
        description: description || null,
        isPrivate: isPrivate === true
      }
    });

    // Add creator as member
    await prisma.oasisChannelMember.create({
      data: {
        channelId: channel.id,
        userId: userId
      }
    });

    // Broadcast channel creation
    await OasisRealtimeService.broadcastMessage(workspaceId, {
      id: `channel-created-${channel.id}`,
      content: `Channel #${channel.name} was created`,
      channelId: channel.id,
      dmId: null,
      senderId: userId,
      parentMessageId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: {
        name: authUser.name || 'Unknown User',
        username: authUser.username
      }
    });

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        isPrivate: channel.isPrivate,
        createdAt: channel.createdAt,
        memberCount: 1,
        recentMessageCount: 0,
        isMember: true
      }
    });

  } catch (error: any) {
    console.error('❌ [OASIS CHANNELS] POST error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2021') {
      return NextResponse.json(
        { 
          error: 'Database migration required',
          code: 'MIGRATION_REQUIRED',
          details: 'OasisChannel table does not exist'
        },
        { status: 503 }
      );
    } else if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Unique constraint violation',
          code: 'DUPLICATE_ENTRY',
          details: error.message
        },
        { status: 409 }
      );
    } else if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: 'Foreign key constraint violation',
          code: 'INVALID_REFERENCE',
          details: error.message
        },
        { status: 400 }
      );
    } else if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          error: 'Record not found',
          code: 'NOT_FOUND',
          details: error.message
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}
