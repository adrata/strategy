/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * Oasis External Connections API
 * 
 * Handles external workspace connections for cross-workspace messaging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/oasis/connections - List external connections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
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

    // Get external connections
    const connections = await prisma.oasisExternalConnection.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['accepted', 'pending'] }
      },
      include: {
        externalUser: {
          select: { id: true, name: true, username: true, email: true }
        },
        externalWorkspace: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedConnections = connections.map(conn => ({
      id: conn.id,
      externalUserId: conn.externalUserId,
      externalUserName: conn.externalUser.name,
      externalUserUsername: conn.externalUser.username,
      externalUserEmail: conn.externalUser.email,
      externalWorkspaceId: conn.externalWorkspaceId,
      externalWorkspaceName: conn.externalWorkspace.name,
      externalWorkspaceSlug: conn.externalWorkspace.slug,
      status: conn.status,
      createdAt: conn.createdAt
    }));

    return NextResponse.json({ connections: formattedConnections });

  } catch (error) {
    console.error('❌ [OASIS CONNECTIONS] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
