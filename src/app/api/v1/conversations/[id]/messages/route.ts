import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

/**
 * Conversation Messages API v1
 * GET /api/v1/conversations/{id}/messages - Get messages for a conversation
 * POST /api/v1/conversations/{id}/messages - Add message to conversation
 */

// GET /api/v1/conversations/{id}/messages - Get messages for a conversation
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = (page - 1) * limit;

    console.log(`🔍 [V1 MESSAGES API] Getting messages for conversation ${conversationId} for workspace: ${context.workspaceId}, user: ${context.userId}`);

    // First verify the conversation exists and belongs to the user
    const conversation = await prisma.ai_conversations.findFirst({
      where: {
        id: conversationId,
        workspaceId: context.workspaceId,
        userId: context.userId,
        deletedAt: null
      }
    });

    if (!conversation) {
      return createErrorResponse('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
    }

    // Get messages for the conversation
    const messages = await prisma.ai_messages.findMany({
      where: {
        conversationId: conversationId
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.ai_messages.count({
      where: {
        conversationId: conversationId
      }
    });

    // Transform response
    const transformedMessages = messages.map(msg => ({
      id: msg.id,
      type: msg.type.toLowerCase(), // Convert USER/ASSISTANT to user/assistant
      content: msg.content,
      timestamp: msg.createdAt,
      metadata: msg.metadata
    }));

    return createSuccessResponse({
      messages: transformedMessages,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('❌ [V1 MESSAGES API] Get error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve messages',
      'MESSAGES_FETCH_ERROR',
      500
    );
  }
}

// POST /api/v1/conversations/{id}/messages - Add message to conversation
export async function POST(
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
    const { type, content, metadata } = body;

    // Validate required fields
    if (!type || !['user', 'assistant', 'USER', 'ASSISTANT'].includes(type)) {
      return createErrorResponse('Type must be "user" or "assistant"', 'INVALID_MESSAGE_TYPE', 400);
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return createErrorResponse('Content is required and must be a non-empty string', 'INVALID_CONTENT', 400);
    }

    console.log(`🔍 [V1 MESSAGES API] Adding message to conversation ${conversationId} for workspace: ${context.workspaceId}, user: ${context.userId}`);

    // First verify the conversation exists and belongs to the user
    const conversation = await prisma.ai_conversations.findFirst({
      where: {
        id: conversationId,
        workspaceId: context.workspaceId,
        userId: context.userId,
        deletedAt: null
      }
    });

    if (!conversation) {
      return createErrorResponse('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
    }

    // Create the message
    const message = await prisma.ai_messages.create({
      data: {
        conversationId: conversationId,
        type: type.toUpperCase() as 'USER' | 'ASSISTANT', // Convert to uppercase for database
        content: content.trim(),
        metadata: metadata || null
      }
    });

    // Update conversation's lastActivity
    await prisma.ai_conversations.update({
      where: { id: conversationId },
      data: { lastActivity: new Date() }
    });

    // Transform response
    const transformedMessage = {
      id: message.id,
      type: message.type.toLowerCase(), // Convert back to lowercase for frontend
      content: message.content,
      timestamp: message.createdAt,
      metadata: message.metadata
    };

    return createSuccessResponse({
      message: transformedMessage
    }, 201);

  } catch (error) {
    console.error('❌ [V1 MESSAGES API] Create error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create message',
      'MESSAGE_CREATE_ERROR',
      500
    );
  }
}
