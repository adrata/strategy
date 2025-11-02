/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Oasis Typing Indicators API
 * 
 * Handles typing indicators (ephemeral, no DB storage)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';

// POST /api/oasis/typing - Broadcast typing indicator
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, channelId, dmId, isTyping } = body;

    if (!workspaceId || (!channelId && !dmId)) {
      return NextResponse.json(
        { error: 'Workspace ID and channel ID or DM ID required' },
        { status: 400 }
      );
    }

    const userName = authUser.name || 'Unknown User';

    if (isTyping) {
      await OasisRealtimeService.broadcastTyping(
        workspaceId,
        authUser.id,
        userName,
        channelId,
        dmId
      );
    } else {
      await OasisRealtimeService.broadcastStopTyping(
        workspaceId,
        authUser.id,
        channelId,
        dmId
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [OASIS TYPING] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast typing indicator' },
      { status: 500 }
    );
  }
}
