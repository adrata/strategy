import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';
import { extractIdFromSlug } from '@/platform/utils/url-utils';

export const dynamic = 'force-dynamic';

// GET: Fetch all comments for a story (with replies nested)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const storyId = extractIdFromSlug(resolvedParams.id);

    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    if (!storyId) {
      return createErrorResponse('Story ID required', 'STORY_ID_REQUIRED', 400);
    }

    // Verify story belongs to workspace
    const story = await prisma.stacksStory.findFirst({
      where: {
        id: storyId,
        project: {
          workspaceId: context.workspaceId
        }
      }
    });

    if (!story) {
      return createErrorResponse('Story not found', 'STORY_NOT_FOUND', 404);
    }

    // Fetch all comments (not deleted)
    const comments = await prisma.stacksComment.findMany({
      where: {
        storyId: storyId,
        deletedAt: null
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Build nested structure (parent comments with replies)
    const parentComments = comments.filter(c => !c.parentId);
    const nestedComments = parentComments.map(parent => {
      const replies = comments
        .filter(c => c.parentId === parent.id)
        .map(reply => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
          author: {
            id: reply.createdBy.id,
            name: reply.createdBy.firstName && reply.createdBy.lastName
              ? `${reply.createdBy.firstName} ${reply.createdBy.lastName}`.trim()
              : reply.createdBy.firstName || reply.createdBy.lastName || reply.createdBy.name || reply.createdBy.email || 'Unknown User',
            email: reply.createdBy.email || ''
          }
        }));

      return {
        id: parent.id,
        content: parent.content,
        createdAt: parent.createdAt.toISOString(),
        updatedAt: parent.updatedAt.toISOString(),
        author: {
          id: parent.createdBy.id,
          name: parent.createdBy.firstName && parent.createdBy.lastName
            ? `${parent.createdBy.firstName} ${parent.createdBy.lastName}`.trim()
            : parent.createdBy.firstName || parent.createdBy.lastName || parent.createdBy.name || parent.createdBy.email || 'Unknown User',
          email: parent.createdBy.email || ''
        },
        replies
      };
    });

    return NextResponse.json({ comments: nestedComments });

  } catch (error) {
    console.error('❌ [STACKS COMMENTS API] Error fetching comments:', error);
    return createErrorResponse('Failed to fetch comments', 'COMMENTS_FETCH_ERROR', 500);
  }
}

// POST: Create new comment or reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const storyId = extractIdFromSlug(resolvedParams.id);

    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    if (!storyId) {
      return createErrorResponse('Story ID required', 'STORY_ID_REQUIRED', 400);
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return createErrorResponse('Comment content is required', 'CONTENT_REQUIRED', 400);
    }

    // Verify story belongs to workspace
    const story = await prisma.stacksStory.findFirst({
      where: {
        id: storyId,
        project: {
          workspaceId: context.workspaceId
        }
      }
    });

    if (!story) {
      return createErrorResponse('Story not found', 'STORY_NOT_FOUND', 404);
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parent = await prisma.stacksComment.findFirst({
        where: {
          id: parentId,
          storyId: storyId,
          deletedAt: null
        }
      });

      if (!parent) {
        return createErrorResponse('Parent comment not found', 'PARENT_NOT_FOUND', 404);
      }
    }

    // Create comment
    const comment = await prisma.stacksComment.create({
      data: {
        storyId: storyId,
        parentId: parentId || null,
        content: content.trim(),
        createdById: context.userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        parentId: comment.parentId,
        author: {
          id: comment.createdBy.id,
          name: comment.createdBy.firstName && comment.createdBy.lastName
            ? `${comment.createdBy.firstName} ${comment.createdBy.lastName}`.trim()
            : comment.createdBy.firstName || comment.createdBy.lastName || comment.createdBy.name || comment.createdBy.email || 'Unknown User',
          email: comment.createdBy.email || ''
        }
      }
    });

  } catch (error) {
    console.error('❌ [STACKS COMMENTS API] Error creating comment:', error);
    return createErrorResponse('Failed to create comment', 'COMMENT_CREATE_ERROR', 500);
  }
}

// PATCH: Update comment (own comments only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const storyId = extractIdFromSlug(resolvedParams.id);

    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return createErrorResponse('Comment ID required', 'COMMENT_ID_REQUIRED', 400);
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return createErrorResponse('Comment content is required', 'CONTENT_REQUIRED', 400);
    }

    // Verify comment exists and belongs to user
    const existingComment = await prisma.stacksComment.findFirst({
      where: {
        id: commentId,
        storyId: storyId,
        createdById: context.userId,
        deletedAt: null
      }
    });

    if (!existingComment) {
      return createErrorResponse('Comment not found or unauthorized', 'COMMENT_NOT_FOUND', 404);
    }

    // Update comment
    const updated = await prisma.stacksComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      comment: {
        id: updated.id,
        content: updated.content,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        parentId: updated.parentId,
        author: {
          id: updated.createdBy.id,
          name: updated.createdBy.firstName && updated.createdBy.lastName
            ? `${updated.createdBy.firstName} ${updated.createdBy.lastName}`.trim()
            : updated.createdBy.firstName || updated.createdBy.lastName || updated.createdBy.name || updated.createdBy.email || 'Unknown User',
          email: updated.createdBy.email || ''
        }
      }
    });

  } catch (error) {
    console.error('❌ [STACKS COMMENTS API] Error updating comment:', error);
    return createErrorResponse('Failed to update comment', 'COMMENT_UPDATE_ERROR', 500);
  }
}

// DELETE: Soft delete comment (own comments only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const storyId = extractIdFromSlug(resolvedParams.id);

    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return createErrorResponse('Comment ID required', 'COMMENT_ID_REQUIRED', 400);
    }

    // Verify comment exists and belongs to user
    const existingComment = await prisma.stacksComment.findFirst({
      where: {
        id: commentId,
        storyId: storyId,
        createdById: context.userId,
        deletedAt: null
      }
    });

    if (!existingComment) {
      return createErrorResponse('Comment not found or unauthorized', 'COMMENT_NOT_FOUND', 404);
    }

    // Soft delete comment
    await prisma.stacksComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ [STACKS COMMENTS API] Error deleting comment:', error);
    return createErrorResponse('Failed to delete comment', 'COMMENT_DELETE_ERROR', 500);
  }
}

