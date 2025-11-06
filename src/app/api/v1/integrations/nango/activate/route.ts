import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/platform/database/prisma-client';
import { Nango } from '@nangohq/node';
import { UnifiedEmailSyncService } from '@/platform/services/UnifiedEmailSyncService';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/integrations/nango/activate
 * Manually activate a pending Nango connection using the connection ID from Nango dashboard
 * 
 * Use this when webhooks aren't working to manually activate a connection
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nangoConnectionId, workspaceId } = await request.json();

    if (!nangoConnectionId || !workspaceId) {
      return NextResponse.json(
        { error: 'nangoConnectionId and workspaceId are required' },
        { status: 400 }
      );
    }

    console.log(`🔗 [MANUAL ACTIVATE] Activating connection: ${nangoConnectionId}`);

    // Find pending connection for this user and workspace
    const pendingConnection = await prisma.grand_central_connections.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        provider: 'outlook',
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (pendingConnection) {
      // Update with actual Nango connection ID and set to active
      await prisma.grand_central_connections.update({
        where: { id: pendingConnection.id },
        data: {
          nangoConnectionId,
          status: 'active',
          lastSyncAt: new Date(),
          metadata: {
            ...(pendingConnection.metadata as any || {}),
            manuallyActivated: true,
            activatedAt: new Date().toISOString(),
            connectionId: nangoConnectionId
          }
        }
      });

      console.log(`✅ [MANUAL ACTIVATE] Connection activated: ${nangoConnectionId}`);

      // Trigger initial email sync
      try {
        console.log(`📧 [MANUAL ACTIVATE] Triggering initial email sync...`);
        await UnifiedEmailSyncService.syncWorkspaceEmails(workspaceId, user.id);
        console.log(`✅ [MANUAL ACTIVATE] Email sync completed`);
      } catch (syncError) {
        console.error(`❌ [MANUAL ACTIVATE] Email sync failed:`, syncError);
        // Don't fail the activation if sync fails
      }

      return NextResponse.json({
        success: true,
        message: 'Connection activated successfully',
        connectionId: nangoConnectionId,
        databaseId: pendingConnection.id
      });
    } else {
      // No pending connection found - create a new one
      console.log(`ℹ️ [MANUAL ACTIVATE] No pending connection found, creating new one...`);
      
      const newConnection = await prisma.grand_central_connections.create({
        data: {
          workspaceId,
          userId: user.id,
          provider: 'outlook',
          providerConfigKey: 'outlook',
          nangoConnectionId,
          connectionName: 'Outlook Connection',
          status: 'active',
          lastSyncAt: new Date(),
          metadata: {
            manuallyActivated: true,
            activatedAt: new Date().toISOString(),
            connectionId: nangoConnectionId
          }
        }
      });

      console.log(`✅ [MANUAL ACTIVATE] New connection created and activated: ${nangoConnectionId}`);

      // Trigger initial email sync
      try {
        console.log(`📧 [MANUAL ACTIVATE] Triggering initial email sync...`);
        await UnifiedEmailSyncService.syncWorkspaceEmails(workspaceId, user.id);
        console.log(`✅ [MANUAL ACTIVATE] Email sync completed`);
      } catch (syncError) {
        console.error(`❌ [MANUAL ACTIVATE] Email sync failed:`, syncError);
      }

      return NextResponse.json({
        success: true,
        message: 'Connection created and activated successfully',
        connectionId: nangoConnectionId,
        databaseId: newConnection.id
      });
    }
  } catch (error) {
    console.error('❌ [MANUAL ACTIVATE] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to activate connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

