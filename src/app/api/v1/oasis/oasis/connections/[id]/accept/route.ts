/**
 * Oasis External Connection Acceptance API
 * 
 * Handles accepting external connection invitations
 */
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/oasis/connections/[id]/accept - Accept connection invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionId = params.id;

    // Get connection and verify it's for the current user
    const connection = await prisma.oasisExternalConnection.findFirst({
      where: {
        id: connectionId,
        externalUserId: session.user.id,
        status: 'pending'
      },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        externalUser: {
          select: { id: true, name: true, username: true }
        },
        externalWorkspace: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection invitation not found or already processed' },
        { status: 404 }
      );
    }

    // Update connection status to accepted
    const updatedConnection = await prisma.oasisExternalConnection.update({
      where: { id: connectionId },
      data: { 
        status: 'accepted',
        updatedAt: new Date()
      }
    });

    // Create reverse connection for the original user
    await prisma.oasisExternalConnection.create({
      data: {
        userId: session.user.id,
        externalUserId: connection.user.id,
        externalWorkspaceId: connection.user.activeWorkspaceId || '',
        status: 'accepted'
      }
    });

    return NextResponse.json({
      connection: {
        id: updatedConnection.id,
        externalUserId: connection.user.id,
        externalUserName: connection.user.name,
        externalUserUsername: connection.user.username,
        externalWorkspaceId: connection.user.activeWorkspaceId,
        externalWorkspaceName: 'Current Workspace', // This would need to be looked up
        externalWorkspaceSlug: 'current-workspace', // This would need to be looked up
        status: 'accepted',
        createdAt: updatedConnection.createdAt,
        updatedAt: updatedConnection.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ [OASIS CONNECTION ACCEPT] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to accept connection' },
      { status: 500 }
    );
  }
}
