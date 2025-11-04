// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * Oasis Read Receipt API
 * 
 * Handles marking messages as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/lib/prisma';

// POST /api/v1/oasis/oasis/read-receipt - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = authUser.id;

    const body = await request.json();
    const { messageIds, workspaceId, channelId, dmId } = body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs required' },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID required' },
        { status: 400 }
      );
    }


    // Verify user has access to workspace
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId,
        userId: userId,
        isActive: true
      }
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify access to channel or DM
    if (channelId) {
      const channel = await prisma.oasisChannel.findFirst({
        where: {
          id: channelId,
          members: {
            some: { userId: userId }
          }
        }
      });

      if (!channel) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (dmId) {
      const dm = await prisma.oasisDirectMessage.findFirst({
        where: {
          id: dmId,
          participants: {
            some: { userId: userId }
          }
        }
      });

      if (!dm) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Create read receipts for each message
    // Using findFirst + create/update since Prisma composite unique constraints
    // may need to be accessed differently
    const readReceipts = await Promise.all(
      messageIds.map(async (messageId) => {
        // Check if read receipt already exists
        const existing = await prisma.oasisReadReceipt.findFirst({
          where: {
            userId: userId,
            messageId: messageId
          }
        });

        if (existing) {
          // Update existing read receipt
          return await prisma.oasisReadReceipt.update({
            where: {
              id: existing.id
            },
            data: {
              readAt: new Date()
            }
          });
        } else {
          // Create new read receipt
          return await prisma.oasisReadReceipt.create({
            data: {
              userId: userId,
              messageId: messageId,
              readAt: new Date()
            }
          });
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      readReceipts: readReceipts.length 
    });

  } catch (error) {
    console.error('❌ [OASIS READ RECEIPT] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}