/**
 * Oasis Workspace Users API
 * 
 * Fetches all active users in a workspace for DM creation
 */
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/v1/oasis/workspace-users - Get all workspace users
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

    // Get all active users in the workspace
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      }
    });

    // Get workspace name
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { name: true }
    });

    const users = workspaceUsers.map(wu => ({
      id: wu.user.id,
      name: wu.user.name,
      email: wu.user.email,
      username: wu.user.username,
      workspaceName: workspace?.name || 'Unknown Workspace'
    }));

    return NextResponse.json({ users });

  } catch (error) {
    console.error('❌ [OASIS WORKSPACE USERS] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace users' },
      { status: 500 }
    );
  }
}
