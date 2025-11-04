/**
 * Oasis External Connection Invitation API
 * 
 * Handles inviting external users for cross-workspace messaging
 */
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/oasis/connections/invite - Invite external user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, externalUserEmail, externalWorkspaceSlug } = body;

    if (!workspaceId || !externalUserEmail || !externalWorkspaceSlug) {
      return NextResponse.json(
        { error: 'Workspace ID, external user email, and external workspace slug required' },
        { status: 400 }
      );
    }

    // Verify user has access to current workspace
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

    // Find external user by email
    const externalUser = await prisma.users.findUnique({
      where: { email: externalUserEmail },
      select: { id: true, name: true, email: true }
    });

    if (!externalUser) {
      return NextResponse.json(
        { error: 'User not found with that email' },
        { status: 404 }
      );
    }

    // Find external workspace
    const externalWorkspace = await prisma.workspaces.findUnique({
      where: { slug: externalWorkspaceSlug },
      select: { id: true, name: true, slug: true }
    });

    if (!externalWorkspace) {
      return NextResponse.json(
        { error: 'External workspace not found' },
        { status: 404 }
      );
    }

    // Check if user is member of external workspace
    const externalWorkspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: externalWorkspace.id,
        userId: externalUser.id,
        isActive: true
      }
    });

    if (!externalWorkspaceUser) {
      return NextResponse.json(
        { error: 'User is not a member of the external workspace' },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existingConnection = await prisma.oasisExternalConnection.findFirst({
      where: {
        userId: session.user.id,
        externalUserId: externalUser.id,
        externalWorkspaceId: externalWorkspace.id
      }
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Connection already exists' },
        { status: 409 }
      );
    }

    // Create connection invitation
    const connection = await prisma.oasisExternalConnection.create({
      data: {
        userId: session.user.id,
        externalUserId: externalUser.id,
        externalWorkspaceId: externalWorkspace.id,
        status: 'pending'
      }
    });

    // TODO: Send notification to external user
    // This could be via email, in-app notification, etc.

    return NextResponse.json({
      connection: {
        id: connection.id,
        externalUserId: externalUser.id,
        externalUserName: externalUser.name,
        externalUserEmail: externalUser.email,
        externalWorkspaceId: externalWorkspace.id,
        externalWorkspaceName: externalWorkspace.name,
        externalWorkspaceSlug: externalWorkspace.slug,
        status: 'pending',
        createdAt: connection.createdAt
      }
    });

  } catch (error) {
    console.error('❌ [OASIS CONNECTION INVITE] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
