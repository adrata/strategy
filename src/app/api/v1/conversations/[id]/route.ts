import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

/**
 * Individual Conversation API v1
 * GET /api/v1/conversations/{id} - Get conversation with messages
 * PATCH /api/v1/conversations/{id} - Update conversation
 * DELETE /api/v1/conversations/{id} - Soft delete conversation
 */

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

// GET /api/v1/conversations/{id} - Get conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize user using unified auth system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { id: conversationId } = await params;

    if (!conversationId) {
      return createErrorResponse('Conversation ID is required', 'INVALID_CONVERSATION_ID', 400);
    }

    const { searchParams } = new URL(request.url);
    const includeMessages = searchParams.get('includeMessages') !== 'false'; // Default to true
    const messagePage = parseInt(searchParams.get('messagePage') || '1');
    const messageLimit = Math.min(parseInt(searchParams.get('messageLimit') || '100'), 500);
    const messageOffset = (messagePage - 1) * messageLimit;

    console.log(`🔍 [V1 CONVERSATION API] Getting conversation ${conversationId} for workspace: ${context.workspaceId}, user: ${context.userId}`);

    // Find conversation with workspace and user isolation
    const conversation = await prisma.ai_conversations.findFirst({
      where: {
        id: conversationId,
        workspaceId: context.workspaceId,
        userId: context.userId,
        deletedAt: null
      },
      include: {
        messages: includeMessages ? {
          orderBy: { createdAt: 'asc' },
          skip: messageOffset,
          take: messageLimit
        } : false,
        _count: {
          select: { messages: true }
        }
      }
    });

    if (!conversation) {
      return createErrorResponse('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
    }

    // Transform response
    const transformedConversation = {
      id: conversation.id,
      title: conversation.title,
      lastActivity: conversation.lastActivity,
      isActive: conversation.isActive,
      welcomeMessage: conversation.welcomeMessage,
      metadata: conversation.metadata,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageCount: conversation._count.messages,
      messages: includeMessages && conversation.messages ? conversation.messages.map(msg => ({
        id: msg.id,
        type: msg.type.toLowerCase(), // Convert USER/ASSISTANT to user/assistant
        content: msg.content,
        timestamp: msg.createdAt,
        metadata: msg.metadata
      })) : undefined
    };

    return createSuccessResponse({
      conversation: transformedConversation,
      ...(includeMessages && {
        messagePagination: {
          page: messagePage,
          limit: messageLimit,
          totalCount: conversation._count.messages,
          totalPages: Math.ceil(conversation._count.messages / messageLimit)
        }
      })
    });

  } catch (error) {
    console.error('❌ [V1 CONVERSATION API] Get error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve conversation',
      'CONVERSATION_FETCH_ERROR',
      500
    );
  }
}

// PATCH /api/v1/conversations/{id} - Update conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize user using unified auth system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { id: conversationId } = await params;

    if (!conversationId) {
      return createErrorResponse('Conversation ID is required', 'INVALID_CONVERSATION_ID', 400);
    }

    const body = await request.json();
    const { title, welcomeMessage, metadata, isActive } = body;

    // Validate title if provided
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return createErrorResponse('Title must be a non-empty string', 'INVALID_TITLE', 400);
    }

    console.log(`🔍 [V1 CONVERSATION API] Updating conversation ${conversationId} for workspace: ${context.workspaceId}, user: ${context.userId}`);

    // Build update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Support restoring deleted conversations
    if (body.restore === true) {
      updateData.deletedAt = null;
      updateData.isActive = false; // Don't auto-activate when restoring
    }

    // Build where clause - allow updating deleted conversations if restoring
    const whereClause: any = {
      id: conversationId,
      workspaceId: context.workspaceId,
      userId: context.userId
    };
    
    // If restoring, don't filter by deletedAt (allow restoring deleted conversations)
    // Otherwise, only update non-deleted conversations
    if (body.restore !== true) {
      whereClause.deletedAt = null;
    }

    // Update conversation with workspace and user isolation
    const conversation = await prisma.ai_conversations.updateMany({
      where: whereClause,
      data: updateData
    });

    if (conversation.count === 0) {
      return createErrorResponse('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
    }

    // Fetch updated conversation (may be deleted if we just restored it)
    const updatedConversation = await prisma.ai_conversations.findFirst({
      where: {
        id: conversationId,
        workspaceId: context.workspaceId,
        userId: context.userId
      },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    // Transform response
    const transformedConversation = {
      id: updatedConversation!.id,
      title: updatedConversation!.title,
      lastActivity: updatedConversation!.lastActivity,
      isActive: updatedConversation!.isActive,
      welcomeMessage: updatedConversation!.welcomeMessage,
      metadata: updatedConversation!.metadata,
      createdAt: updatedConversation!.createdAt,
      updatedAt: updatedConversation!.updatedAt,
      messageCount: updatedConversation!._count.messages
    };

    return createSuccessResponse({
      conversation: transformedConversation
    });

  } catch (error) {
    console.error('❌ [V1 CONVERSATION API] Update error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update conversation',
      'CONVERSATION_UPDATE_ERROR',
      500
    );
  }
}

// DELETE /api/v1/conversations/{id} - Soft delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize user using unified auth system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { id: conversationId } = await params;

    if (!conversationId) {
      return createErrorResponse('Conversation ID is required', 'INVALID_CONVERSATION_ID', 400);
    }

    console.log(`🔍 [V1 CONVERSATION API] Deleting conversation ${conversationId} for workspace: ${context.workspaceId}, user: ${context.userId}`);

    // Soft delete conversation with workspace and user isolation
    const conversation = await prisma.ai_conversations.updateMany({
      where: {
        id: conversationId,
        workspaceId: context.workspaceId,
        userId: context.userId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    });

    if (conversation.count === 0) {
      return createErrorResponse('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
    }

    return createSuccessResponse({
      message: 'Conversation deleted successfully',
      conversationId
    });

  } catch (error) {
    console.error('❌ [V1 CONVERSATION API] Delete error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete conversation',
      'CONVERSATION_DELETE_ERROR',
      500
    );
  }
}
