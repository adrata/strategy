import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * Conversations API v1
 * GET /api/v1/conversations - List user's conversations
 * POST /api/v1/conversations - Create new conversation
 */

// GET /api/v1/conversations - List user's conversations with message counts
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user using unified auth system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const includeMessages = searchParams.get('includeMessages') === 'true';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const offset = (page - 1) * limit;

    console.log(`🔍 [V1 CONVERSATIONS API] Querying conversations for workspace: ${context.workspaceId}, user: ${context.userId}, includeDeleted: ${includeDeleted}`);

    // Build where clause for workspace and user isolation
    const where: any = {
      workspaceId: context.workspaceId,
      userId: context.userId
    };
    
    // Only filter by deletedAt if includeDeleted is false
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    // Get conversations with optional message inclusion
    const conversations = await prisma.ai_conversations.findMany({
      where,
      include: {
        messages: includeMessages ? {
          orderBy: { createdAt: 'asc' }
        } : {
          select: { id: true, type: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1 // Just get the latest message for preview
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { lastActivity: 'desc' },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.ai_conversations.count({ where });

    // Transform the response to match frontend expectations
    const transformedConversations = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastActivity: conv.lastActivity,
      isActive: conv.isActive,
      welcomeMessage: conv.welcomeMessage,
      metadata: conv.metadata,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      deletedAt: conv.deletedAt, // Include deletedAt to indicate deletion status
      messageCount: conv._count.messages,
      messages: includeMessages ? conv.messages.map(msg => ({
        id: msg.id,
        type: msg.type.toLowerCase(), // Convert USER/ASSISTANT to user/assistant
        content: msg.content,
        timestamp: msg.createdAt,
        metadata: msg.metadata
      })) : undefined,
      latestMessage: !includeMessages && conv.messages.length > 0 ? {
        id: conv.messages[0].id,
        type: conv.messages[0].type.toLowerCase(),
        timestamp: conv.messages[0].createdAt
      } : undefined
    }));

    return createSuccessResponse({
      conversations: transformedConversations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('❌ [V1 CONVERSATIONS API] Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve conversations',
      'CONVERSATIONS_FETCH_ERROR',
      500
    );
  }
}

// POST /api/v1/conversations - Create new conversation
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, welcomeMessage, metadata } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return createErrorResponse('Title is required', 'INVALID_TITLE', 400);
    }

    console.log(`🔍 [V1 CONVERSATIONS API] Creating conversation for workspace: ${context.workspaceId}, user: ${context.userId}`);

    // Create new conversation
    const conversation = await prisma.ai_conversations.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        title: title.trim(),
        welcomeMessage: welcomeMessage || null,
        metadata: metadata || null
      },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

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
      messages: []
    };

    return createSuccessResponse({
      conversation: transformedConversation
    }, 201);

  } catch (error) {
    console.error('❌ [V1 CONVERSATIONS API] Create error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create conversation',
      'CONVERSATION_CREATE_ERROR',
      500
    );
  }
}
