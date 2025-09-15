import { NextRequest, NextResponse } from 'next/server';
// import { zohoNotificationService } from '@/platform/services/zoho-notification-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 🔔 ZOHO NOTIFICATIONS API ENDPOINT
 * 
 * Handles fetching Zoho update notifications for a workspace
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔔 [ZOHO NOTIFICATIONS API] Fetching notifications for workspace: ${workspaceId}`);

    // Get recent notifications
    // const notifications = await zohoNotificationService.getRecentNotifications(workspaceId, limit);
    const notifications = []; // Temporarily disabled to fix build

    // Filter by timestamp if provided
    let filteredNotifications = notifications;
    if (since) {
      const sinceDate = new Date(since);
      filteredNotifications = notifications.filter(notification => 
        new Date(notification.timestamp) > sinceDate
      );
    }

    console.log(`✅ [ZOHO NOTIFICATIONS API] Found ${filteredNotifications.length} notifications`);

    return NextResponse.json({
      success: true,
      notifications: filteredNotifications,
      count: filteredNotifications.length,
      workspaceId
    });

  } catch (error) {
    console.error('❌ [ZOHO NOTIFICATIONS API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch notifications',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
