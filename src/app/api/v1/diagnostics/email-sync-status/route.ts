import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/lib/prisma';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/diagnostics/email-sync-status
 * Check email sync status and connection status in production database
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user || !user.activeWorkspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = user.activeWorkspaceId;

    // Check Outlook connections
    const connections = await prisma.grand_central_connections.findMany({
      where: {
        workspaceId,
        provider: 'outlook'
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        provider: true,
        status: true,
        nangoConnectionId: true,
        lastSyncAt: true,
        createdAt: true,
        userId: true
      }
    });

    // Check email counts
    const totalEmails = await prisma.email_messages.count({
      where: { workspaceId }
    });

    const outlookEmails = await prisma.email_messages.count({
      where: {
        workspaceId,
        provider: 'outlook'
      }
    });

    const templateEmails = await prisma.email_messages.count({
      where: {
        workspaceId,
        OR: [
          { messageId: { startsWith: 'demo-' } },
          { subject: { contains: 'Welcome to Adrata' } }
        ]
      }
    });

    // Get recent emails
    const recentEmails = await prisma.email_messages.findMany({
      where: { workspaceId },
      orderBy: { receivedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        subject: true,
        from: true,
        provider: true,
        receivedAt: true,
        messageId: true,
        isRead: true
      }
    });

    // Check if email sync service ran
    const hasActiveConnection = connections.some(c => c.status === 'active');
    const hasRecentSync = connections.some(c => 
      c.lastSyncAt && (new Date().getTime() - new Date(c.lastSyncAt).getTime()) < 3600000 // Within last hour
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      workspaceId,
      userId: user.id,
      connections: {
        total: connections.length,
        active: connections.filter(c => c.status === 'active').length,
        pending: connections.filter(c => c.status === 'pending').length,
        list: connections
      },
      emails: {
        total: totalEmails,
        outlook: outlookEmails,
        template: templateEmails,
        realEmails: totalEmails - templateEmails,
        recentEmails
      },
      status: {
        hasActiveConnection,
        hasRecentSync,
        syncWorking: hasActiveConnection && outlookEmails > 0,
        message: !hasActiveConnection 
          ? 'No active Outlook connection'
          : outlookEmails === 0 
            ? 'Connection active but no Outlook emails synced yet'
            : `Working! ${outlookEmails} Outlook emails synced`
      }
    });
  } catch (error) {
    console.error('❌ Error checking email sync status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check email sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

