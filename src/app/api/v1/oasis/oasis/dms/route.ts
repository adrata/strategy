/**
 * Oasis Direct Messages API
 * 
 * Handles DM conversation creation and listing
 */
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

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
    // Show all DMs where user is a participant (cross-workspace support)
    // This allows users to see conversations regardless of which workspace they're viewing from
    const dmsWhereClause: any = {
      participants: {
        some: {
          userId: userId
        }
      }
    };

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

    // Filter DMs - show all DMs where user is a participant
    // This allows cross-workspace conversations (e.g., Ross in Adrata messaging Ryan in Notary Everyday)
    const filteredDMs = dms.filter(dm => {
      const otherParticipants = dm.participants.filter(p => p.userId !== userId);
      
      // Include self-DMs (no other participants)
      if (otherParticipants.length === 0) {
        // For Ross, include self-DMs from any workspace
        // For others, only include self-DMs from current workspace
        return isRoss || dm.workspaceId === workspaceId;
      }
      
      // Include all DMs with other participants (cross-workspace support)
      // This ensures users can see conversations they're part of regardless of workspace
      return true;
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
      
      // Calculate unread count using read receipts
      // Count messages from other users that don't have read receipts for this user
      let unreadCount = 0;
      
      try {
        const unreadMessages = await prisma.oasisMessage.findMany({
          where: {
            dmId: dm.id,
            senderId: { not: userId } // Only count messages from other users
          },
          select: { id: true }
        });
        
        const messageIds = unreadMessages.map(m => m.id);
        
        if (messageIds.length > 0) {
          const readReceipts = await prisma.oasisReadReceipt.findMany({
            where: {
              messageId: { in: messageIds },
              userId: userId
            },
            select: { messageId: true }
          });
          
          const readMessageIds = readReceipts.map(r => r.messageId);
          unreadCount = messageIds.filter(id => !readMessageIds.includes(id)).length;
        }
      } catch (readReceiptError: any) {
        // If OasisReadReceipt table doesn't exist yet (P2021), just set unreadCount to 0
        if (readReceiptError.code === 'P2021') {
          console.warn('⚠️ [OASIS DMS] OasisReadReceipt table does not exist - unread counts will be 0');
          unreadCount = 0;
        } else {
          // Re-throw other errors
          throw readReceiptError;
        }
      }
      
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

  } catch (error: any) {
    console.error('❌ [OASIS DMS] GET error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2021') {
      return NextResponse.json(
        { 
          error: 'Database migration required',
          code: 'MIGRATION_REQUIRED',
          details: 'OasisDirectMessage table does not exist'
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

  } catch (error: any) {
    console.error('❌ [OASIS DMS] POST error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2021') {
      return NextResponse.json(
        { 
          error: 'Database migration required',
          code: 'MIGRATION_REQUIRED',
          details: 'OasisDirectMessage table does not exist'
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
      { error: 'Failed to create DM' },
      { status: 500 }
    );
  }
}
