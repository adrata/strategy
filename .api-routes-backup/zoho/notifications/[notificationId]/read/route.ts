import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 🔔 ZOHO NOTIFICATION READ API ENDPOINT
 * 
 * Marks a Zoho notification as read
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const { notificationId } = params;
    const body = await request.json();
    const { workspaceId, userId } = body;

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { error: 'Workspace ID and User ID are required' },
        { status: 400 }
      );
    }

    console.log(`🔔 [ZOHO NOTIFICATION READ] Marking notification as read: ${notificationId}`);

    // Update the notification status in the database
    const updatedSignal = await prisma.signals.updateMany({
      where: {
        id: notificationId,
        workspaceId: workspaceId,
        type: 'ZOHO_UPDATE'
      },
      data: {
        status: 'read',
        updatedAt: new Date()
      }
    });

    if (updatedSignal.count === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [ZOHO NOTIFICATION READ] Successfully marked notification as read`);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notificationId,
      workspaceId
    });

  } catch (error) {
    console.error('❌ [ZOHO NOTIFICATION READ] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to mark notification as read',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
