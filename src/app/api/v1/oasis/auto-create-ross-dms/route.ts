/**
 * Auto-Create Ross DMs API
 * 
 * Automatically creates DMs with Ross for all users in a workspace
 * This ensures Ross is connected to everyone as requested
 */
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/lib/prisma';

// POST /api/v1/oasis/auto-create-ross-dms - Auto-create DMs with Ross
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = authUser.id;

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Get Ross's user ID
    const rossUser = await prisma.users.findFirst({
      where: { email: 'ross@adrata.com' },
      select: { id: true }
    });

    if (!rossUser) {
      return NextResponse.json({ error: 'Ross user not found' }, { status: 404 });
    }

    // Get all active users in the workspace (excluding Ross)
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId,
        isActive: true,
        userId: { not: rossUser.id } // Exclude Ross himself
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });


    const createdDMs = [];

    // Create DMs with Ross for each user
    for (const workspaceUser of workspaceUsers) {
      try {
        // Check if DM already exists with these exact participants
        const existingDM = await prisma.oasisDirectMessage.findFirst({
          where: {
            workspaceId,
            participants: {
              every: {
                userId: { in: [rossUser.id, workspaceUser.userId] }
              }
            }
          },
          include: {
            participants: true
          }
        });

        // Also check if DM exists in any workspace with these participants
        const existingDMAnywhere = await prisma.oasisDirectMessage.findFirst({
          where: {
            participants: {
              every: {
                userId: { in: [rossUser.id, workspaceUser.userId] }
              }
            }
          },
          include: {
            participants: true
          }
        });

        if ((existingDM && existingDM.participants.length === 2) || 
            (existingDMAnywhere && existingDMAnywhere.participants.length === 2)) {
          continue;
        }

        // Create new DM
        const dm = await prisma.oasisDirectMessage.create({
          data: {
            workspaceId
          }
        });

        // Add both Ross and the user as participants
        await prisma.oasisDMParticipant.createMany({
          data: [
            { dmId: dm.id, userId: rossUser.id },
            { dmId: dm.id, userId: workspaceUser.userId }
          ]
        });

        createdDMs.push({
          dmId: dm.id,
          participantName: workspaceUser.user.name,
          participantEmail: workspaceUser.user.email
        });

      } catch (error) {
        console.error(`Failed to create DM with ${workspaceUser.user.name}:`, error);
        // Continue with other users even if one fails
      }
    }

    return NextResponse.json({ 
      message: `Created ${createdDMs.length} DMs with Ross`,
      createdDMs 
    });

  } catch (error: any) {
    console.error('❌ [AUTO-CREATE ROSS DMS] Error:', error);
    
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
      { error: 'Failed to auto-create Ross DMs' },
      { status: 500 }
    );
  }
}
