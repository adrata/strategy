import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const workspaceId = searchParams.get('workspaceId');

    // Get user's active workspace if not provided
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId) {
      const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { activeWorkspaceId: true }
      });
      targetWorkspaceId = user?.activeWorkspaceId;
    }

    if (!targetWorkspaceId) {
      return Response.json({ error: 'No workspace found' }, { status: 400 });
    }

    // Verify user has access to this workspace
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: targetWorkspaceId,
        userId: session.user.id
      }
    });

    if (!workspaceUser) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build where clause for email queries
    const emailWhere: any = {
      workspaceId: targetWorkspaceId
    };

    // If specific connection is requested, filter by provider
    if (connectionId) {
      const connection = await prisma.grand_central_connections.findUnique({
        where: { id: connectionId },
        select: { provider: true }
      });

      if (connection) {
        emailWhere.provider = connection.provider;
      }
    }

    // Get email statistics
    const [
      totalEmails,
      linkedEmails,
      emailsWithActions,
      recentSyncs,
      lastSyncTime,
      syncErrors
    ] = await Promise.all([
      // Total emails
      prisma.email_messages.count({
        where: emailWhere
      }),

      // Linked emails (to people or companies)
      prisma.email_messages.count({
        where: {
          ...emailWhere,
          OR: [
            { personId: { not: null } },
            { companyId: { not: null } }
          ]
        }
      }),

      // Emails with actions
      prisma.email_messages.count({
        where: {
          ...emailWhere,
          actions: {
            some: {}
          }
        }
      }),

      // Recent syncs (last 24 hours)
      prisma.email_messages.count({
        where: {
          ...emailWhere,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Last sync time
      prisma.email_messages.findFirst({
        where: emailWhere,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),

      // Sync errors (connections with error status)
      prisma.grand_central_connections.count({
        where: {
          workspaceId: targetWorkspaceId,
          provider: { in: ['outlook', 'gmail'] },
          status: 'error'
        }
      })
    ]);

    // Calculate rates
    const linkRate = totalEmails > 0 ? Math.round((linkedEmails / totalEmails) * 100) : 0;
    const actionRate = totalEmails > 0 ? Math.round((emailsWithActions / totalEmails) * 100) : 0;

    // Get connection details if specific connection requested
    let connectionDetails = null;
    if (connectionId) {
      connectionDetails = await prisma.grand_central_connections.findUnique({
        where: { id: connectionId },
        select: {
          id: true,
          provider: true,
          status: true,
          lastSyncAt: true,
          metadata: true
        }
      });
    }

    const stats = {
      total: totalEmails,
      linked: linkedEmails,
      withActions: emailsWithActions,
      linkRate,
      actionRate,
      recentSyncs,
      lastSyncTime: lastSyncTime?.createdAt?.toISOString(),
      syncErrors,
      connectionDetails
    };

    return Response.json(stats);

  } catch (error) {
    console.error('❌ Failed to get email statistics:', error);

    return Response.json({
      error: 'Failed to get statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
