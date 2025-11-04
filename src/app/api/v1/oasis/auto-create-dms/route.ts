/**
 * Oasis Auto-Create DMs API
 * 
 * Creates DM conversations between Ross and all workspace users
 */
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/v1/oasis/auto-create-dms - Create DMs for Ross with all workspace users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Only allow Ross to create auto-DMs
    const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';
    if (session.user.id !== ROSS_USER_ID) {
      return NextResponse.json({ error: 'Only Ross can create auto-DMs' }, { status: 403 });
    }

    // Verify user has access to workspace
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        isActive: true
      }
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all other active users in the workspace (excluding Ross)
    const otherUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId,
        isActive: true,
        userId: { not: ROSS_USER_ID }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const createdDMs = [];

    // Create DM with each user
    for (const workspaceUser of otherUsers) {
      const otherUserId = workspaceUser.user.id;
      
      // Check if DM already exists between Ross and this user
      const existingDM = await prisma.oasisDirectMessage.findFirst({
        where: {
          workspaceId,
          participants: {
            every: {
              userId: { in: [ROSS_USER_ID, otherUserId] }
            }
          }
        },
        include: {
          participants: true
        }
      });

      // Skip if DM already exists
      if (existingDM && existingDM.participants.length === 2) {
        continue;
      }

      // Create new DM
      const dm = await prisma.oasisDirectMessage.create({
        data: {
          workspaceId
        }
      });

      // Add both participants
      await prisma.oasisDMParticipant.createMany({
        data: [
          { dmId: dm.id, userId: ROSS_USER_ID },
          { dmId: dm.id, userId: otherUserId }
        ]
      });

      createdDMs.push({
        id: dm.id,
        participant: {
          id: otherUserId,
          name: workspaceUser.user.name,
          email: workspaceUser.user.email
        }
      });

    }

    return NextResponse.json({
      message: `Created ${createdDMs.length} DMs`,
      dms: createdDMs
    });

  } catch (error: any) {
    console.error('❌ [OASIS AUTO-CREATE DMS] POST error:', error);
    
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
      { error: 'Failed to create auto-DMs' },
      { status: 500 }
    );
  }
}
