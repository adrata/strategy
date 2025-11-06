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

    // Validate that all messageIds exist and belong to the channel/DM
    const messages = await prisma.oasisMessage.findMany({
      where: {
        id: { in: messageIds },
        ...(channelId ? { channelId } : {}),
        ...(dmId ? { dmId } : {}),
      },
      select: { id: true }
    });

    const validMessageIds = messages.map(m => m.id);
    const invalidMessageIds = messageIds.filter(id => !validMessageIds.includes(id));

    if (invalidMessageIds.length > 0) {
      console.warn(`⚠️ [OASIS READ RECEIPT] Invalid message IDs: ${invalidMessageIds.join(', ')}`);
      // Continue with valid messages only
    }

    if (validMessageIds.length === 0) {
      console.error('❌ [OASIS READ RECEIPT] No valid messages found:', {
        requestedMessageIds: messageIds,
        invalidMessageIds,
        channelId,
        dmId,
        workspaceId,
        userId
      });
      return NextResponse.json({ 
        error: 'No valid messages found',
        invalidMessageIds,
        details: 'The provided message IDs do not exist or do not belong to the specified channel/DM'
      }, { status: 400 });
    }

    // Create or update read receipts using findFirst + create/update pattern
    // This avoids constraint name issues and provides better error handling
    const readReceipts = await Promise.all(
      validMessageIds.map(async (messageId) => {
        try {
          // Check if receipt already exists
          const existing = await prisma.oasisReadReceipt.findFirst({
            where: {
              userId: userId,
              messageId: messageId
            }
          });

          if (existing) {
            // Update existing receipt
            return await prisma.oasisReadReceipt.update({
              where: {
                id: existing.id
              },
              data: {
                readAt: new Date()
              }
            });
          } else {
            // Create new receipt
            return await prisma.oasisReadReceipt.create({
              data: {
                userId: userId,
                messageId: messageId,
                readAt: new Date()
              }
            });
          }
        } catch (error: any) {
          // Handle specific Prisma errors
          if (error.code === 'P2002') {
            // Unique constraint violation - receipt was created by another request
            // Try to fetch the existing one
            const existing = await prisma.oasisReadReceipt.findFirst({
              where: {
                userId: userId,
                messageId: messageId
              }
            });
            if (existing) {
              return existing;
            }
            throw error;
          } else if (error.code === 'P2003') {
            // Foreign key constraint violation - message doesn't exist
            console.error(`❌ [OASIS READ RECEIPT] Foreign key violation for messageId: ${messageId}`);
            throw error;
          } else if (error.code === 'P2025') {
            // Record not found
            console.error(`❌ [OASIS READ RECEIPT] Record not found for messageId: ${messageId}`);
            throw error;
          }
          throw error;
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      readReceipts: readReceipts.length,
      processed: validMessageIds.length,
      skipped: invalidMessageIds.length
    });

  } catch (error: any) {
    // Enhanced error logging with Prisma-specific details
    console.error('❌ [OASIS READ RECEIPT] POST error:', error);
    
    const errorDetails: any = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined
    };

    // Add Prisma-specific error information
    if (error && typeof error === 'object' && 'code' in error) {
      errorDetails.prismaCode = error.code;
      errorDetails.prismaMeta = error.meta;
      errorDetails.clientVersion = error.clientVersion;
    }

    console.error('❌ [OASIS READ RECEIPT] Error details:', errorDetails);

    // Handle specific Prisma error codes with appropriate HTTP status
    if (error.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json(
        { 
          error: 'Read receipt already exists',
          code: 'DUPLICATE_RECEIPT',
          details: error.message
        },
        { status: 409 }
      );
    } else if (error.code === 'P2003') {
      // Foreign key constraint violation
      return NextResponse.json(
        { 
          error: 'Invalid message reference',
          code: 'INVALID_MESSAGE',
          details: error.message
        },
        { status: 400 }
      );
    } else if (error.code === 'P2025') {
      // Record not found
      return NextResponse.json(
        { 
          error: 'Record not found',
          code: 'NOT_FOUND',
          details: error.message
        },
        { status: 404 }
      );
    } else if (error.code === 'P2021') {
      // Table does not exist
      console.error('❌ [OASIS READ RECEIPT] Table does not exist - migration required');
      return NextResponse.json(
        { 
          error: 'Database migration required',
          code: 'MIGRATION_REQUIRED',
          details: 'OasisReadReceipt table does not exist'
        },
        { status: 503 }
      );
    }

    // Generic error fallback
    return NextResponse.json(
      { 
        error: 'Failed to mark messages as read',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}