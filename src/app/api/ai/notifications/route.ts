/**
 * AI Notifications API
 * 
 * Provides proactive notifications to AI panel about:
 * - People who left companies
 * - High churn risk individuals
 * - Buyer groups needing updates
 * - Stale data warnings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/notifications
 * 
 * Returns unread notifications for AI panel
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    // Import notification generator dynamically
    // Use relative path since scripts folder is outside src
    const { AINotificationGenerator } = require('../../../../../scripts/_future_now/real-time-system/AINotificationGenerator');
    const generator = new AINotificationGenerator();
    
    // Generate notifications
    const notifications = await generator.getNotificationsForDisplay(context.workspaceId);
    
    return NextResponse.json({
      notifications,
      count: notifications.length,
      hasUnread: notifications.length > 0,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Failed to get AI notifications:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/notifications/mark-read
 * 
 * Mark notification as read/shown
 */
export async function POST(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    const body = await request.json();
    const { personId, changeIndex } = body;

    if (!personId) {
      return NextResponse.json(
        { error: 'Person ID required' },
        { status: 400 }
      );
    }

    // Use relative path since scripts folder is outside src
    const { AINotificationGenerator } = require('../../../../../scripts/_future_now/real-time-system/AINotificationGenerator');
    const generator = new AINotificationGenerator();
    
    await generator.markNotificationShown(personId, changeIndex);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

