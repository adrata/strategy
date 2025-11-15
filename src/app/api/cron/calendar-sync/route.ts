import { NextRequest, NextResponse } from 'next/server';
import { CalendarSyncService } from '@/platform/services/calendar-sync-service';
import { prisma } from '@/lib/prisma';

/**
 * Vercel Cron Job: Automatic Calendar/Meeting Sync
 * 
 * This endpoint runs periodically (via Vercel Cron) to automatically sync calendar events
 * from all active Outlook/Gmail connections. This ensures meetings are synced even
 * if webhooks fail or aren't configured.
 * 
 * Configure in vercel.json with a cron schedule that runs every 5 minutes.
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

    console.log('🔄 [CRON] Starting automatic calendar sync...');

    // Get all active email connections that support calendar
    const activeConnections = await prisma.grand_central_connections.findMany({
      where: {
        OR: [
          { provider: 'outlook', status: 'active' }, // Outlook supports both email and calendar
          { provider: 'google-calendar', status: 'active' } // Separate Google Calendar connection
        ]
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
      console.log('📅 [CRON] No active calendar connections found');
      return NextResponse.json({
        success: true,
        message: 'No active connections',
        synced: 0
      });
    }

    console.log(`📅 [CRON] Found ${activeConnections.length} active calendar connection(s)`);

    const results = [];
    let totalEventsProcessed = 0;

    // Sync each workspace/user combination
    for (const connection of activeConnections) {
      try {
        console.log(`📅 [CRON] Syncing calendar for workspace ${connection.workspaceId}, user ${connection.userId}`);
        
        // Map provider to platform
        const platform = connection.provider === 'outlook' ? 'microsoft' : 'google';
        
        const calendarSyncService = CalendarSyncService.getInstance();
        const syncResult = await calendarSyncService.syncCalendarEvents(
          connection.userId,
          connection.workspaceId,
          platform
        );

        const eventsProcessed = syncResult.eventsCreated + syncResult.eventsUpdated;
        totalEventsProcessed += eventsProcessed;

        results.push({
          workspaceId: connection.workspaceId,
          userId: connection.userId,
          provider: connection.provider,
          success: syncResult.success,
          eventsCreated: syncResult.eventsCreated,
          eventsUpdated: syncResult.eventsUpdated,
          eventsDeleted: syncResult.eventsDeleted,
          errors: syncResult.errors
        });

        console.log(`✅ [CRON] Synced calendar for workspace ${connection.workspaceId}: ${syncResult.eventsCreated} created, ${syncResult.eventsUpdated} updated`);
      } catch (error) {
        console.error(`❌ [CRON] Failed to sync calendar for workspace ${connection.workspaceId}:`, error);
        
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

    console.log(`✅ [CRON] Calendar sync completed: ${successCount} successful, ${failureCount} failed, ${totalEventsProcessed} total events processed`);

    return NextResponse.json({
      success: true,
      message: 'Calendar sync completed',
      results: {
        totalConnections: activeConnections.length,
        successful: successCount,
        failed: failureCount,
        totalEventsProcessed
      },
      details: results
    });

  } catch (error) {
    console.error('❌ [CRON] Error in calendar sync cron job:', error);
    
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

