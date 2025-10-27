/**
 * Oasis Read Receipts API
 * 
 * Handles message read receipts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';

// POST /api/oasis/read-receipt - Mark message as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageIds, workspaceId, channelId, dmId } = body;

    if (!messageIds || !Array.isArray(messageIds) || !workspaceId) {
      return NextResponse.json(
        { error: 'Message IDs array and workspace ID required' },
        { status: 400 }
      );
    }

    // Broadcast read receipt for each message
    for (const messageId of messageIds) {
      await OasisRealtimeService.broadcastMessageRead(
        workspaceId,
        messageId,
        session.user.id,
        channelId,
        dmId
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [OASIS READ RECEIPT] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}
