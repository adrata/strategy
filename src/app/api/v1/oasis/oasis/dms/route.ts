/**
 * Oasis Direct Messages API
 * 
 * Handles DM conversation creation and listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/oasis/dms - List user's DMs
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

    // Get DMs where user is a participant
    // Strategy: Get all DMs where user is a participant, then filter and deduplicate
    const dms = await prisma.oasisDirectMessage.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: { name: true, username: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get workspace names for pill display
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { name: true }
    });

    // Filter and deduplicate DMs based on business rules
    const filteredDMs = dms.filter(dm => {
      const otherParticipants = dm.participants.filter(p => p.userId !== userId);
      
      // If DM is in current workspace, always include it
      if (dm.workspaceId === workspaceId) {
        return true;
      }
      
      // If DM is with Adrata users (Dan or Ross), include it
      const hasAdrataUser = otherParticipants.some(p => 
        p.user.email === 'dan@adrata.com' || p.user.email === 'ross@adrata.com'
      );
      
      if (hasAdrataUser) {
        return true;
      }
      
      // If current user is in Notary Everyday workspace, include DMs with other NE users
      if (workspaceId === 'cmezxb1ez0001pc94yry3ntjk') {
        // Check if the DM is also in NE workspace
        return dm.workspaceId === 'cmezxb1ez0001pc94yry3ntjk';
      }
      
      return false;
    });

    // Deduplicate DMs by participant combination
    const uniqueDMs = filteredDMs.filter((dm, index, self) => {
      const otherParticipants = dm.participants.filter(p => p.userId !== userId);
      const participantIds = otherParticipants.map(p => p.userId).sort().join(',');
      
      return index === self.findIndex(d => {
        const dOtherParticipants = d.participants.filter(p => p.userId !== userId);
        const dParticipantIds = dOtherParticipants.map(p => p.userId).sort().join(',');
        return dParticipantIds === participantIds;
      });
    });

    // Get unread message counts for each DM
    const dmsWithStats = await Promise.all(uniqueDMs.map(async (dm) => {
      const otherParticipants = dm.participants.filter(p => p.userId !== userId);
      const lastMessage = dm.messages[0];
      
      // Calculate unread count for this DM
      // For now, we'll count all messages from other users as "unread"
      // TODO: Implement proper read receipt tracking in the future
      const unreadCount = await prisma.oasisMessage.count({
        where: {
          dmId: dm.id,
          senderId: { not: userId } // Only count messages from other users
        }
      });
      
      return {
        id: dm.id,
        participants: otherParticipants.map(p => ({
          id: p.user.id,
          name: p.user.name,
          username: p.user.username,
          workspaceName: (() => {
            // If DM is in current workspace, show current workspace name
            if (dm.workspaceId === workspaceId) {
              return workspace?.name || 'Unknown Workspace';
            }
            // If participant is Adrata user (Dan or Ross), show "Adrata"
            if (p.user.email === 'dan@adrata.com' || p.user.email === 'ross@adrata.com') {
              return 'Adrata';
            }
            // For other cross-workspace DMs, show "External"
            return 'External';
          })()
        })),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderName: lastMessage.sender.name,
          createdAt: lastMessage.createdAt
        } : null,
        unreadCount,
        createdAt: dm.createdAt,
        updatedAt: dm.updatedAt
      };
    }));

    return NextResponse.json({ dms: dmsWithStats });

  } catch (error) {
    console.error('❌ [OASIS DMS] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DMs' },
      { status: 500 }
    );
  }
}

// POST /api/oasis/dms - Create new DM conversation
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = authUser.id;

    const body = await request.json();
    const { workspaceId, participantIds } = body;

    if (!workspaceId || !participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json(
        { error: 'Workspace ID and participant IDs required' },
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

    // Add current user to participants
    const allParticipantIds = [userId, ...participantIds];
    const uniqueParticipantIds = [...new Set(allParticipantIds)];

    // Verify all participants are in the workspace
    const participants = await prisma.workspace_users.findMany({
      where: {
        workspaceId,
        userId: { in: uniqueParticipantIds },
        isActive: true
      },
      select: { userId: true }
    });

    if (participants.length !== uniqueParticipantIds.length) {
      return NextResponse.json(
        { error: 'Some participants not in workspace' },
        { status: 400 }
      );
    }

    // Check if DM already exists with these participants
    const existingDm = await prisma.oasisDirectMessage.findFirst({
      where: {
        workspaceId,
        participants: {
          every: {
            userId: { in: uniqueParticipantIds }
          }
        }
      },
      include: {
        participants: true
      }
    });

    if (existingDm && existingDm.participants.length === uniqueParticipantIds.length) {
      return NextResponse.json({
        dm: {
          id: existingDm.id,
          participants: existingDm.participants
            .filter(p => p.userId !== userId)
            .map(p => ({ id: p.userId })),
          createdAt: existingDm.createdAt,
          updatedAt: existingDm.updatedAt
        }
      });
    }

    // Create DM conversation
    const dm = await prisma.oasisDirectMessage.create({
      data: {
        workspaceId
      }
    });

    // Add all participants
    await prisma.oasisDMParticipant.createMany({
      data: uniqueParticipantIds.map(userId => ({
        dmId: dm.id,
        userId
      }))
    });

    // Get participant details
    const participantDetails = await prisma.users.findMany({
      where: { id: { in: uniqueParticipantIds } },
      select: { id: true, name: true, username: true }
    });

    return NextResponse.json({
      dm: {
        id: dm.id,
        participants: participantDetails
          .filter(p => p.id !== userId)
          .map(p => ({
            id: p.id,
            name: p.name,
            username: p.username
          })),
        createdAt: dm.createdAt,
        updatedAt: dm.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ [OASIS DMS] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create DM' },
      { status: 500 }
    );
  }
}
