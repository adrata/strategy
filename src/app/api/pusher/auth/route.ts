/**
 * Pusher Authentication Endpoint
 * 
 * Handles client authentication for Pusher channels
 * Required for private/presence channels
 * 
 * Channel Types Supported:
 * - Public channels: workspace-*, oasis-channel-*, oasis-dm-*
 * - Private channels: private-*
 * - Presence channels: presence-*
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/platform/services/pusher-real-time-service';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.formData();
    const socketId = body.get('socket_id') as string;
    const channelName = body.get('channel_name') as string;

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Missing required fields: socket_id and channel_name' },
        { status: 400 }
      );
    }

    // Get workspaceId and userId from headers (set by Pusher client)
    const workspaceId = request.headers.get('X-Workspace-ID');
    const userIdFromHeader = request.headers.get('X-User-ID');

    // Also try to get from authenticated user as fallback
    let userId = userIdFromHeader;
    let finalWorkspaceId = workspaceId;

    if (!userId || !finalWorkspaceId) {
      const authUser = await getUnifiedAuthUser(request);
      if (authUser) {
        userId = userId || authUser.id;
        finalWorkspaceId = finalWorkspaceId || (authUser as any).activeWorkspaceId || authUser.workspaceId;
      }
    }

    if (!userId || !finalWorkspaceId) {
      console.warn('⚠️ [PUSHER AUTH] Missing userId or workspaceId', {
        userId,
        workspaceId: finalWorkspaceId,
        channelName
      });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if this is a private or presence channel (requires auth)
    const isPrivateChannel = channelName.startsWith('private-');
    const isPresenceChannel = channelName.startsWith('presence-');
    
    // Handle public channels (workspace-*, oasis-channel-*, oasis-dm-*)
    if (!isPrivateChannel && !isPresenceChannel) {
      // Verify workspace access for workspace channels
      if (channelName.startsWith('workspace-')) {
        const channelWorkspaceId = channelName.replace('workspace-', '');
        if (channelWorkspaceId !== finalWorkspaceId) {
          console.warn(`🔴 [PUSHER AUTH] Unauthorized workspace channel access: ${channelName} for user ${userId}`);
          return NextResponse.json(
            { error: 'Unauthorized channel access' },
            { status: 403 }
          );
        }
        console.log(`✅ [PUSHER AUTH] Authorized workspace channel ${channelName} for user ${userId}`);
        return NextResponse.json({});
      }

      // Verify channel membership for oasis-channel-*
      if (channelName.startsWith('oasis-channel-')) {
        const channelId = channelName.replace('oasis-channel-', '');
        
        // Verify user is a member of this channel
        const channelMember = await prisma.oasisChannelMember.findFirst({
          where: {
            channelId,
            userId,
            channel: {
              workspaceId: finalWorkspaceId
            }
          }
        });

        if (!channelMember) {
          console.warn(`🔴 [PUSHER AUTH] User ${userId} is not a member of channel ${channelId}`);
          return NextResponse.json(
            { error: 'Unauthorized channel access' },
            { status: 403 }
          );
        }

        console.log(`✅ [PUSHER AUTH] Authorized channel ${channelName} for user ${userId}`);
        return NextResponse.json({});
      }

      // Verify DM participant membership for oasis-dm-*
      if (channelName.startsWith('oasis-dm-')) {
        const dmId = channelName.replace('oasis-dm-', '');
        
        // Verify user is a participant in this DM
        const dmParticipant = await prisma.oasisDMParticipant.findFirst({
          where: {
            dmId,
            userId
          },
          include: {
            dm: {
              select: {
                workspaceId: true
              }
            }
          }
        });

        if (!dmParticipant) {
          console.warn(`🔴 [PUSHER AUTH] User ${userId} is not a participant in DM ${dmId}`);
          return NextResponse.json(
            { error: 'Unauthorized channel access' },
            { status: 403 }
          );
        }

        // Note: DMs can be cross-workspace, so we don't strictly enforce workspaceId match
        // But we log it for debugging
        if (dmParticipant.dm.workspaceId !== finalWorkspaceId) {
          console.log(`ℹ️ [PUSHER AUTH] Cross-workspace DM access: DM workspace ${dmParticipant.dm.workspaceId}, user workspace ${finalWorkspaceId}`);
        }

        console.log(`✅ [PUSHER AUTH] Authorized DM channel ${channelName} for user ${userId}`);
        return NextResponse.json({});
      }

      // Unknown public channel type - deny by default for security
      console.warn(`🔴 [PUSHER AUTH] Unknown public channel type: ${channelName}`);
      return NextResponse.json(
        { error: 'Unauthorized channel access' },
        { status: 403 }
      );
    }

    // Handle private/presence channels
    // Extract workspaceId from channel name if possible
    let channelWorkspaceId = finalWorkspaceId;
    
    // Try to extract workspaceId from private channel name
    // Format: private-workspace-{workspaceId} or private-oasis-{type}-{id}
    if (channelName.startsWith('private-workspace-')) {
      channelWorkspaceId = channelName.replace('private-workspace-', '');
    } else if (channelName.startsWith('private-oasis-channel-')) {
      const channelId = channelName.replace('private-oasis-channel-', '');
      const channel = await prisma.oasisChannel.findUnique({
        where: { id: channelId },
        select: { workspaceId: true }
      });
      if (channel) {
        channelWorkspaceId = channel.workspaceId;
      }
    } else if (channelName.startsWith('private-oasis-dm-')) {
      const dmId = channelName.replace('private-oasis-dm-', '');
      const dm = await prisma.oasisDirectMessage.findUnique({
        where: { id: dmId },
        select: { workspaceId: true }
      });
      if (dm) {
        channelWorkspaceId = dm.workspaceId;
      }
    }

    // Verify workspace access for private/presence channels
    if (channelWorkspaceId && channelWorkspaceId !== finalWorkspaceId) {
      // Allow cross-workspace access for DMs
      if (channelName.includes('dm-')) {
        // Verify DM participant membership
        const dmId = channelName.match(/dm-([^-]+)/)?.[1];
        if (dmId) {
          const dmParticipant = await prisma.oasisDMParticipant.findFirst({
            where: {
              dmId,
              userId
            }
          });
          if (!dmParticipant) {
            console.warn(`🔴 [PUSHER AUTH] User ${userId} is not a participant in private DM ${dmId}`);
            return NextResponse.json(
              { error: 'Unauthorized channel access' },
              { status: 403 }
            );
          }
        }
      } else {
        console.warn(`🔴 [PUSHER AUTH] Workspace mismatch for private channel: ${channelName}`);
        return NextResponse.json(
          { error: 'Unauthorized channel access' },
          { status: 403 }
        );
      }
    }

    // Authorize the private/presence channel using Pusher server
    const auth = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: userId,
      user_info: {
        workspaceId: finalWorkspaceId,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`🔐 [PUSHER AUTH] Authenticated user ${userId} for ${isPresenceChannel ? 'presence' : 'private'} channel ${channelName}`);

    return NextResponse.json(auth);
  } catch (error) {
    console.error('🔴 [PUSHER AUTH] Authentication failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Workspace-ID, X-User-ID, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}

