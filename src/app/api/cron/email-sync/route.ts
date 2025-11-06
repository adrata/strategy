import { NextRequest, NextResponse } from 'next/server';
import { UnifiedEmailSyncService } from '@/platform/services/UnifiedEmailSyncService';
import { prisma } from '@/lib/prisma';

/**
 * Vercel Cron Job: Automatic Email Sync
 * 
 * This endpoint runs periodically (via Vercel Cron) to automatically sync emails
 * from all active Outlook/Gmail connections. This ensures emails are synced even
 * if webhooks fail or aren't configured.
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/email-sync",
 *     "schedule": "*/5 * * * *"  // Every 5 minutes
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 [CRON] Starting automatic email sync...');

    // Get all active email connections grouped by workspace/user
    const activeConnections = await prisma.grand_central_connections.findMany({
      where: {
        provider: { in: ['outlook', 'gmail'] },
        status: 'active'
      },
      select: {
        workspaceId: true,
        userId: true,
        provider: true,
        nangoConnectionId: true,
        lastSyncAt: true
      },
      distinct: ['workspaceId', 'userId']
    });

    if (activeConnections.length === 0) {
      console.log('📧 [CRON] No active email connections found');
      return NextResponse.json({
        success: true,
        message: 'No active connections',
        synced: 0
      });
    }

    console.log(`📧 [CRON] Found ${activeConnections.length} active email connection(s)`);

    const results = [];
    let totalEmailsProcessed = 0;

    // Sync each workspace/user combination
    for (const connection of activeConnections) {
      try {
        console.log(`📧 [CRON] Syncing emails for workspace ${connection.workspaceId}, user ${connection.userId}`);
        
        const syncResult = await UnifiedEmailSyncService.syncWorkspaceEmails(
          connection.workspaceId,
          connection.userId
        );

        const emailCount = Array.isArray(syncResult) 
          ? syncResult.reduce((sum, r) => sum + (r.count || 0), 0)
          : 0;

        totalEmailsProcessed += emailCount;

        results.push({
          workspaceId: connection.workspaceId,
          userId: connection.userId,
          provider: connection.provider,
          success: true,
          emailsProcessed: emailCount
        });

        console.log(`✅ [CRON] Synced ${emailCount} email(s) for workspace ${connection.workspaceId}`);
      } catch (error) {
        console.error(`❌ [CRON] Failed to sync emails for workspace ${connection.workspaceId}:`, error);
        
        results.push({
          workspaceId: connection.workspaceId,
          userId: connection.userId,
          provider: connection.provider,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`✅ [CRON] Email sync completed: ${successCount} successful, ${failureCount} failed, ${totalEmailsProcessed} total emails processed`);

    return NextResponse.json({
      success: true,
      message: 'Email sync completed',
      results: {
        totalConnections: activeConnections.length,
        successful: successCount,
        failed: failureCount,
        totalEmailsProcessed
      },
      details: results
    });

  } catch (error) {
    console.error('❌ [CRON] Error in email sync cron job:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggering (optional)
export async function POST(request: NextRequest) {
  return GET(request);
}

