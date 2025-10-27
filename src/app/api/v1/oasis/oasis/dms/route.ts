/**
 * Oasis Direct Messages API
 * 
 * Handles DM conversation creation and listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/oasis/dms - List user's DMs
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

    // Get DMs where user is a participant
    const dms = await prisma.oasisDirectMessage.findMany({
      where: {
        workspaceId,
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

    const dmsWithStats = dms.map(dm => {
      const otherParticipants = dm.participants.filter(p => p.userId !== userId);
      const lastMessage = dm.messages[0];
      
      return {
        id: dm.id,
        participants: otherParticipants.map(p => ({
          id: p.user.id,
          name: p.user.name,
          username: p.user.username
        })),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderName: lastMessage.sender.name,
          createdAt: lastMessage.createdAt
        } : null,
        createdAt: dm.createdAt,
        updatedAt: dm.updatedAt
      };
    });

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
