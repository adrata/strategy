/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

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
    
    // Validate userId exists
    if (!authUser.id) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 401 });
    }

    const userId = authUser.id;
    const userEmail = authUser.email || undefined; // Safe email access

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Check if this is Ross (special user who sees all DMs)
    const ROSS_USER_ID = '01K1VBYZG41K9QA0D9CF06KNRG';
    const ROSS_EMAIL = 'ross@adrata.com';
    const isRoss = userId === ROSS_USER_ID || userEmail === ROSS_EMAIL;

    // Verify user has access to workspace
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId,
        userId: userId,
        isActive: true
      }
    });

    if (!workspaceUser && !isRoss) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get DMs where user is a participant
    // Ross sees DMs from ALL workspaces, others only see current workspace
    const dmsWhereClause: any = {
      participants: {
        some: {
          userId: userId
        }
      }
    };

    // Only filter by workspace if NOT Ross
    if (!isRoss) {
      dmsWhereClause.workspaceId = workspaceId;
    }

    const dms = await prisma.oasisDirectMessage.findMany({
      where: dmsWhereClause,
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, username: true, email: true }
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

    // Filter DMs based on workspace and user type
    const filteredDMs = dms.filter(dm => {
      const otherParticipants = dm.participants.filter(p => p.userId !== userId);
      
      // Include self-DMs (no other participants)
      if (otherParticipants.length === 0) {
        // For Ross, include self-DMs from any workspace
        // For others, only include self-DMs from current workspace
        return isRoss || dm.workspaceId === workspaceId;
      }
      
      // For Ross, include all DMs with other participants
      if (isRoss) {
        return true;
      }
      
      // For others, only include DMs from current workspace
      return dm.workspaceId === workspaceId;
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
      
      // Fetch the actual workspace name for this DM's workspace
      const dmWorkspace = dm.workspaceId !== workspaceId 
        ? await prisma.workspaces.findUnique({
            where: { id: dm.workspaceId },
            select: { name: true }
          })
        : workspace;
      
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
        workspaceId: dm.workspaceId, // Include workspaceId for message fetching
        participants: otherParticipants.map(p => ({
          id: p.user.id,
          name: p.user.name || p.user.username || p.user.email?.split('@')[0] || '',
          username: p.user.username,
          email: p.user.email,
          workspaceName: (() => {
            // Always show "Adrata" for Adrata users (Dan or Ross), regardless of workspace
            if (p.user.email === 'dan@adrata.com' || p.user.email === 'ross@adrata.com') {
              return 'Adrata';
            }
            // If DM is in current workspace, show current workspace name
            if (dm.workspaceId === workspaceId) {
              return workspace?.name || 'Unknown Workspace';
            }
            // For cross-workspace DMs, show the actual workspace name
            return dmWorkspace?.name || 'Unknown Workspace';
          })()
        })),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderName: lastMessage.sender.name || lastMessage.sender.username || lastMessage.sender.email?.split('@')[0] || '',
          createdAt: lastMessage.createdAt
        } : null,
        unreadCount,
        createdAt: dm.createdAt,
        updatedAt: dm.updatedAt
      };
    }));

    return NextResponse.json({ dms: dmsWithStats });

  } catch (error) {
    // Get request context for better error logging
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');

    console.error('❌ [OASIS DMS] GET error:', error);
    console.error('❌ [OASIS DMS] Request context:', {
      workspaceId,
      userId: authUser?.id,
      userEmail: authUser?.email
    });

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('❌ [OASIS DMS] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch DMs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

    // Handle self-DM (empty participantIds array)
    // For self-DM, only include the current user
    const allParticipantIds = participantIds.length === 0 
      ? [userId] 
      : [userId, ...participantIds];
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
    // For self-DM, check for DM with only the current user
    const existingDmQuery: any = {
      workspaceId,
      participants: {
        every: {
          userId: { in: uniqueParticipantIds }
        }
      }
    };

    if (participantIds.length === 0) {
      // Self-DM: check for DM with only current user
      existingDmQuery.participants = {
        every: {
          userId: userId
        }
      };
    }

    const existingDm = await prisma.oasisDirectMessage.findFirst({
      where: existingDmQuery,
      include: {
        participants: true
      }
    });

    // For self-DM, match if participant count is 1 (just the user)
    // For regular DM, match if participant count matches
    const matches = participantIds.length === 0
      ? existingDm && existingDm.participants.length === 1 && existingDm.participants[0].userId === userId
      : existingDm && existingDm.participants.length === uniqueParticipantIds.length;

    if (matches && existingDm) {
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
