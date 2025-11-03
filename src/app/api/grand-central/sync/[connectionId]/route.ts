import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { UnifiedEmailSyncService } from '@/platform/services/UnifiedEmailSyncService';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

// Required for static export with dynamic routes
export async function generateStaticParams() {
  return []; // Empty array for static export - routes won't be pre-rendered
}

export async function POST(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = params;

    // Get connection details
    const connection = await prisma.grand_central_connections.findUnique({
      where: { id: connectionId },
      include: {
        workspace: true
      }
    });

    if (!connection) {
      return Response.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Verify user has access to this workspace
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: connection.workspaceId,
        userId: session.user.id
      }
    });

    if (!workspaceUser) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if connection is active
    if (connection.status !== 'active') {
      return Response.json({ 
        error: 'Connection is not active',
        status: connection.status 
      }, { status: 400 });
    }

    // Check if it's an email provider
    if (!['outlook', 'gmail'].includes(connection.provider)) {
      return Response.json({ 
        error: 'Sync is only available for email providers' 
      }, { status: 400 });
    }

    console.log(`📧 Manual sync requested for ${connection.provider} connection: ${connectionId}`);

    // Trigger email sync
    const result = await UnifiedEmailSyncService.syncWorkspaceEmails(
      connection.workspaceId,
      connection.userId
    );

    // Update connection last sync time
    await prisma.grand_central_connections.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        metadata: {
          ...connection.metadata,
          lastManualSync: new Date().toISOString(),
          syncResult: result
        }
      }
    });

    console.log(`✅ Manual sync completed for ${connection.provider}:`, result);

    return Response.json({
      success: true,
      message: 'Email sync completed successfully',
      result,
      connectionId,
      provider: connection.provider,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manual sync failed:', error);

    return Response.json({
      success: false,
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = params;

    // Get connection details
    const connection = await prisma.grand_central_connections.findUnique({
      where: { id: connectionId },
      include: {
        workspace: true
      }
    });

    if (!connection) {
      return Response.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Verify user has access to this workspace
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: connection.workspaceId,
        userId: session.user.id
      }
    });

    if (!workspaceUser) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get sync history from metadata
    const syncHistory = connection.metadata?.syncHistory || [];
    const lastSync = connection.lastSyncAt;

    return Response.json({
      connectionId,
      provider: connection.provider,
      status: connection.status,
      lastSync,
      syncHistory,
      metadata: connection.metadata
    });

  } catch (error) {
    console.error('❌ Failed to get sync status:', error);

    return Response.json({
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
