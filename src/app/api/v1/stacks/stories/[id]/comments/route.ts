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

    // Verify story or task belongs to workspace
    let story = await prisma.stacksStory.findFirst({
      where: {
        id: storyId,
        project: {
          workspaceId: context.workspaceId
        }
      }
    });

    // If not a story, check if it's a task (bug)
    let task = null;
    let actualStoryId = storyId;
    
    if (!story) {
      task = await prisma.stacksTask.findFirst({
        where: {
          id: storyId,
          project: {
            workspaceId: context.workspaceId
          }
        },
        include: {
          story: true
        }
      });

      if (!task) {
        return createErrorResponse('Story or task not found', 'STORY_NOT_FOUND', 404);
      }

      // If task has a parent story, use that for comments
      if (task.storyId && task.story) {
        actualStoryId = task.storyId;
        story = task.story;
      } else {
        // For standalone tasks/bugs, check if a story with this ID exists
        // (it might have been created previously for comments)
        const existingStory = await prisma.stacksStory.findFirst({
          where: {
            id: storyId,
            projectId: task.projectId
          }
        });

        if (existingStory) {
          actualStoryId = existingStory.id;
          story = existingStory;
        } else {
          // For standalone bugs, we'll try to create a story with the same ID
          // This requires that the story and task don't conflict - we'll handle this carefully
          try {
            const newStory = await prisma.stacksStory.create({
              data: {
                id: storyId, // Use task ID - this will work if IDs don't conflict
                projectId: task.projectId,
                title: task.title || 'Bug/Task',
                description: task.description || null,
                status: task.status,
                priority: task.priority
              }
            });
            actualStoryId = newStory.id;
            story = newStory;
          } catch (error: any) {
            // If creation fails (e.g., ID conflict), we can't support comments for this task
            console.error('Failed to create story for task comments:', error);
            return createErrorResponse(
              'Comments are not available for this task. Please link it to a story first.',
              'COMMENTS_NOT_AVAILABLE',
              400
            );
          }
        }
      }
    }

    // Fetch all comments (not deleted)
    // For tasks/bugs, use the actual storyId (which might be the task's parent story or the task ID itself)
    const comments = await prisma.stacksComment.findMany({
      where: {
        storyId: actualStoryId,
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

    // Verify story or task belongs to workspace
    let story = await prisma.stacksStory.findFirst({
      where: {
        id: storyId,
        project: {
          workspaceId: context.workspaceId
        }
      }
    });

    // If not a story, check if it's a task (bug)
    let task = null;
    let actualStoryId = storyId;
    
    if (!story) {
      task = await prisma.stacksTask.findFirst({
        where: {
          id: storyId,
          project: {
            workspaceId: context.workspaceId
          }
        },
        include: {
          story: true
        }
      });

      if (!task) {
        return createErrorResponse('Story or task not found', 'STORY_NOT_FOUND', 404);
      }

      // If task has a parent story, use that for comments
      if (task.storyId && task.story) {
        actualStoryId = task.storyId;
        story = task.story;
      } else {
        // For standalone tasks/bugs, check if a story with this ID exists
        // (it might have been created previously for comments)
        const existingStory = await prisma.stacksStory.findFirst({
          where: {
            id: storyId,
            projectId: task.projectId
          }
        });

        if (existingStory) {
          actualStoryId = existingStory.id;
          story = existingStory;
        } else {
          // For standalone bugs, we'll try to create a story with the same ID
          // This requires that the story and task don't conflict - we'll handle this carefully
          try {
            const newStory = await prisma.stacksStory.create({
              data: {
                id: storyId, // Use task ID - this will work if IDs don't conflict
                projectId: task.projectId,
                title: task.title || 'Bug/Task',
                description: task.description || null,
                status: task.status,
                priority: task.priority
              }
            });
            actualStoryId = newStory.id;
            story = newStory;
          } catch (error: any) {
            // If creation fails (e.g., ID conflict), we can't support comments for this task
            console.error('Failed to create story for task comments:', error);
            return createErrorResponse(
              'Comments are not available for this task. Please link it to a story first.',
              'COMMENTS_NOT_AVAILABLE',
              400
            );
          }
        }
      }
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parent = await prisma.stacksComment.findFirst({
        where: {
          id: parentId,
          storyId: actualStoryId,
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
        storyId: actualStoryId,
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

    // Resolve actual storyId (might be a task, so check for that)
    let actualStoryId = storyId;
    const story = await prisma.stacksStory.findFirst({
      where: { id: storyId }
    });
    
    if (!story) {
      // Check if it's a task
      const task = await prisma.stacksTask.findFirst({
        where: { id: storyId },
        include: { story: true }
      });
      
      if (task) {
        if (task.storyId && task.story) {
          actualStoryId = task.storyId;
        } else {
          // For standalone tasks, try to find/create a story (same as POST logic)
          const existingStory = await prisma.stacksStory.findFirst({
            where: { id: storyId, projectId: task.projectId }
          });
          actualStoryId = existingStory?.id || storyId;
        }
      }
    }

    // Verify comment exists and belongs to user
    const existingComment = await prisma.stacksComment.findFirst({
      where: {
        id: commentId,
        storyId: actualStoryId,
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

    // Resolve actual storyId (might be a task, so check for that)
    let actualStoryId = storyId;
    const story = await prisma.stacksStory.findFirst({
      where: { id: storyId }
    });
    
    if (!story) {
      // Check if it's a task
      const task = await prisma.stacksTask.findFirst({
        where: { id: storyId },
        include: { story: true }
      });
      
      if (task) {
        if (task.storyId && task.story) {
          actualStoryId = task.storyId;
        } else {
          // For standalone tasks, try to find/create a story (same as POST logic)
          const existingStory = await prisma.stacksStory.findFirst({
            where: { id: storyId, projectId: task.projectId }
          });
          actualStoryId = existingStory?.id || storyId;
        }
      }
    }

    // Verify comment exists and belongs to user
    const existingComment = await prisma.stacksComment.findFirst({
      where: {
        id: commentId,
        storyId: actualStoryId,
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

