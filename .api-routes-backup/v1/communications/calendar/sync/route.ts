import { NextRequest, NextResponse } from 'next/server';
import { CalendarSyncService } from '@/platform/services/calendar-sync-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 📅 CALENDAR SYNC API ENDPOINT
 * POST /api/calendar/sync
 * Syncs calendar events from Microsoft Graph API and Google Calendar API
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, workspaceId, platform = 'microsoft' } = await request.json();

    if (!userId || !workspaceId) {
      return NextResponse.json(
        { error: 'userId and workspaceId are required' },
        { status: 400 }
      );
    }

    if (!['microsoft', 'google'].includes(platform)) {
      return NextResponse.json(
        { error: 'platform must be either "microsoft" or "google"' },
        { status: 400 }
      );
    }

    console.log(`📅 [API] Starting calendar sync for user ${userId} on platform ${platform}`);

    const calendarSyncService = CalendarSyncService.getInstance();
    const result = await calendarSyncService.syncCalendarEvents(userId, workspaceId, platform);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Calendar sync completed successfully',
        data: result
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Calendar sync failed',
          errors: result.errors
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [API] Calendar sync error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/sync
 * Get calendar sync status and recent sync results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');

    if (!userId || !workspaceId) {
      return NextResponse.json(
        { error: 'userId and workspaceId are required' },
        { status: 400 }
      );
    }

    // Get recent sync results
    const recentSyncs = await prisma.calendar.findMany({
      where: {
        userId,
        workspaceId
      },
      select: {
        id: true,
        name: true,
        platform: true,
        lastSyncAt: true,
        isActive: true
      },
      orderBy: {
        lastSyncAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        calendars: recentSyncs,
        totalCalendars: recentSyncs.length,
        activeCalendars: recentSyncs.filter(cal => cal.isActive).length
      }
    });

  } catch (error) {
    console.error('❌ [API] Calendar sync status error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
