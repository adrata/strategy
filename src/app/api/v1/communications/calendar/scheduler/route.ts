import { NextRequest, NextResponse } from 'next/server';
import { calendarSyncScheduler } from '@/platform/services/CalendarSyncScheduler';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * 📅 CALENDAR SYNC SCHEDULER API ENDPOINT
 * 
 * GET: Get scheduler status
 * POST: Start/stop scheduler or sync specific account
 */

export async function GET(request: NextRequest) {
  try {
    const status = calendarSyncScheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        isRunning: status.isRunning,
        nextCheck: status.nextCheck,
        message: status.isRunning 
          ? 'Calendar sync scheduler is running' 
          : 'Calendar sync scheduler is stopped'
      }
    });

  } catch (error) {
    console.error('❌ [API] Error getting calendar scheduler status:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get scheduler status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, accountId } = await request.json();

    switch (action) {
      case 'start':
        calendarSyncScheduler.startScheduler();
        return NextResponse.json({
          success: true,
          message: 'Calendar sync scheduler started'
        });

      case 'stop':
        calendarSyncScheduler.stopScheduler();
        return NextResponse.json({
          success: true,
          message: 'Calendar sync scheduler stopped'
        });

      case 'force-check':
        await calendarSyncScheduler.forceSyncCheck();
        return NextResponse.json({
          success: true,
          message: 'Calendar sync check completed'
        });

      case 'sync-account':
        if (!accountId) {
          return NextResponse.json(
            { success: false, error: 'accountId is required for sync-account action' },
            { status: 400 }
          );
        }
        
        const syncResult = await calendarSyncScheduler.syncAccount(accountId);
        return NextResponse.json({
          success: syncResult,
          message: syncResult 
            ? 'Account calendar sync completed successfully' 
            : 'Account calendar sync failed'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start, stop, force-check, or sync-account' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ [API] Error in calendar scheduler action:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to execute scheduler action',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
