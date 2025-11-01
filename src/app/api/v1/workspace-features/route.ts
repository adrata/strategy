import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Check if user has access to the workspace
    const userWorkspace = await prisma.user_roles.findFirst({
      where: {
        userId: session.user.id,
        workspaceId,
        isActive: true
      }
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 });
    }

    // Get workspace features
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { 
        id: true,
        name: true,
        enabledFeatures: true 
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      enabledFeatures: workspace.enabledFeatures
    });

  } catch (error) {
    console.error('Error fetching workspace features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, enabledFeatures } = body;

    if (!workspaceId || !Array.isArray(enabledFeatures)) {
      return NextResponse.json(
        { error: 'Workspace ID and enabledFeatures array are required' },
        { status: 400 }
      );
    }

    // Check if user is admin or workspace admin
    const userRole = await prisma.user_roles.findFirst({
      where: {
        userId: session.user.id,
        workspaceId,
        isActive: true
      },
      include: {
        role: true
      }
    });

    if (!userRole) {
      return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 });
    }

    // Check if user has admin permissions
    const isAdmin = userRole.role.name === 'SUPER_ADMIN' || 
                   userRole.role.name === 'WORKSPACE_ADMIN' ||
                   session.user.email === 'ross@adrata.com' ||
                   session.user.email === 'todd@adrata.com' ||
                   session.user.email === 'dan@adrata.com';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Validate feature names
    const validFeatures = ['OASIS', 'STACKS', 'WORKSHOP', 'REVENUEOS', 'METRICS', 'CHRONICLE'];
    const invalidFeatures = enabledFeatures.filter(f => !validFeatures.includes(f));
    
    if (invalidFeatures.length > 0) {
      return NextResponse.json(
        { error: `Invalid features: ${invalidFeatures.join(', ')}` },
        { status: 400 }
      );
    }

    // Update workspace features
    const updatedWorkspace = await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { enabledFeatures },
      select: {
        id: true,
        name: true,
        enabledFeatures: true
      }
    });

    return NextResponse.json({
      success: true,
      workspace: updatedWorkspace
    });

  } catch (error) {
    console.error('Error updating workspace features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
