/**
 * Oasis External Connections API
 * 
 * Handles external workspace connections for cross-workspace messaging
 */
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

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

  } catch (error: any) {
    console.error('❌ [OASIS CONNECTIONS] GET error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2021') {
      return NextResponse.json(
        { 
          error: 'Database migration required',
          code: 'MIGRATION_REQUIRED',
          details: 'OasisExternalConnection table does not exist'
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
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
