import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';
import { extractIdFromSlug } from '@/platform/utils/url-utils';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params (Next.js 15+ compatibility)
    const resolvedParams = await params;
    const paramValue = resolvedParams.id;
    
    // Extract ID from slug (handles both slug format "name-id" and raw ID)
    const storyId = extractIdFromSlug(paramValue);
    
    console.log('🔍 [STACKS API] GET single story request received');
    console.log('🔍 [STACKS API] Param value:', paramValue);
    console.log('🔍 [STACKS API] Extracted story ID:', storyId);
    
    // Use platform's unified authentication system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      console.log('❌ [STACKS API] Authentication failed');
      return response; // Return error response if authentication failed
    }

    if (!context) {
      console.log('❌ [STACKS API] No context after authentication');
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Get workspace ID from authenticated context
    const workspaceId = context.workspaceId;
    const userId = context.userId;
    
    console.log('✅ [STACKS API] Authenticated user:', userId, 'workspace:', workspaceId, 'storyId:', storyId);

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    if (!storyId) {
      return createErrorResponse('Story ID required', 'STORY_ID_REQUIRED', 400);
    }

    // Fetch the story with workspace validation
    // Use explicit select to avoid selecting viewType column that may not exist in database
    const story = await prisma.stacksStory.findFirst({
      where: {
        id: storyId,
        project: {
          workspaceId: workspaceId
        }
      },
      select: {
        id: true,
        epochId: true,
        projectId: true,
        title: true,
        description: true,
        acceptanceCriteria: true,
        status: true,
        priority: true,
        assigneeId: true,
        product: true,
        section: true,
        viewType: true,
        isFlagged: true,
        rank: true,
        statusChangedAt: true,
        createdAt: true,
        updatedAt: true,
        epoch: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // If story not found, check if it's a task
    if (!story) {
      console.log('🔍 [STACKS API] Story not found, checking for task:', storyId);
      
      // Try to fetch as a task
      const task = await prisma.stacksTask.findFirst({
        where: {
          id: storyId,
          project: {
            workspaceId: workspaceId
          }
        },
        select: {
          id: true,
          storyId: true,
          projectId: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          type: true,
          assigneeId: true,
          product: true,
          section: true,
          attachments: true,
          createdAt: true,
          updatedAt: true,
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          story: {
            select: {
              id: true,
              title: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!task) {
        console.log('❌ [STACKS API] Neither story nor task found:', storyId);
        return createErrorResponse('Story or task not found', 'STORY_NOT_FOUND', 404);
      }

      // Transform task data to match story response format
      const transformedStory = {
        id: task.id,
        title: task.title,
        description: task.description,
        acceptanceCriteria: null, // Tasks don't have acceptance criteria
        status: task.status,
        priority: task.priority,
        viewType: task.type === 'bug' ? 'bug' : 'detail', // Set viewType to 'bug' for bugs, 'detail' for other tasks
        product: task.product || null,
        section: task.section || null,
        attachments: task.attachments || null,
        rank: null, // Tasks don't have rank
        type: task.type || 'task', // Include type to distinguish from stories
        assignee: task.assignee ? {
          id: task.assignee.id,
          name: (() => {
            const firstName = task.assignee.firstName != null ? String(task.assignee.firstName) : '';
            const lastName = task.assignee.lastName != null ? String(task.assignee.lastName) : '';
            const fullName = `${firstName} ${lastName}`.trim();
            return fullName || 'Unknown';
          })(),
          email: task.assignee.email || ''
        } : null,
        epoch: null, // Tasks don't have epochs
        story: task.story ? {
          id: task.story.id,
          title: task.story.title
        } : null,
        project: task.project ? {
          id: task.project.id,
          name: task.project.name
        } : null,
        dueDate: null,
        tags: task.type === 'bug' ? ['bug'] : [], // Add bug tag if type is bug
        isFlagged: false, // Tasks don't have isFlagged
        points: null, // Tasks don't have points
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        timeInStatus: 0 // Tasks don't track statusChangedAt
      };

      console.log('✅ [STACKS API] Task found and transformed');
      return NextResponse.json({ story: transformedStory, type: 'task' });
    }

    // Transform the data to match the expected format
    const transformedStory = {
      id: story.id,
      title: story.title,
      description: story.description,
      acceptanceCriteria: (story as any).acceptanceCriteria || null, // Safe access if column doesn't exist
      status: story.status,
      priority: story.priority,
      viewType: (story as any).viewType || 'detail', // Use story's viewType or default to 'detail'
      product: (story as any).product || null, // Safe access if column doesn't exist
      section: (story as any).section || null, // Safe access if column doesn't exist
      rank: (story as any).rank || null, // Safe access if column doesn't exist
      type: 'story', // Explicitly mark as story
      assignee: story.assignee ? {
        id: story.assignee.id,
        name: (() => {
          // Handle null values properly - convert null to empty string
          const firstName = story.assignee.firstName != null ? String(story.assignee.firstName) : '';
          const lastName = story.assignee.lastName != null ? String(story.assignee.lastName) : '';
          const fullName = `${firstName} ${lastName}`.trim();
          // Use name field if available, otherwise fall back to constructed name
          return story.assignee.name || fullName || 'Unknown';
        })(),
        email: story.assignee.email || ''
      } : null,
      epoch: story.epoch ? {
        id: story.epoch.id,
        title: story.epoch.title,
        description: story.epoch.description
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name
      } : null,
      dueDate: null, // dueDate field doesn't exist in schema yet
      tags: [], // tags field doesn't exist in schema yet
      isFlagged: story.isFlagged || false,
      points: (story as any).points || null, // Safe access if column doesn't exist
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      // Calculate time in current status (in days) using statusChangedAt
      timeInStatus: story.statusChangedAt ? Math.floor((Date.now() - new Date(story.statusChangedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
    };

    console.log('✅ [STACKS API] Story found and transformed');
    return NextResponse.json({ story: transformedStory, type: 'story' });

  } catch (error) {
    console.error('❌ [STACKS API] Error fetching story:', error);
    
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      const columnName = prismaError.meta?.column_name || 'unknown';
      console.error('❌ [STACKS API] P2022 Error - Column does not exist:', {
        columnName,
        tableName: prismaError.meta?.table_name,
        modelName: prismaError.meta?.modelName
      });
      
      return createErrorResponse(
        columnName !== 'unknown'
          ? `Database column '${columnName}' does not exist. Please run database migrations.`
          : 'Database schema mismatch. Please run database migrations.',
        'SCHEMA_MISMATCH',
        500
      );
    }
    
    return createErrorResponse(
      'Failed to fetch story. Please try again.',
      'STORY_FETCH_ERROR',
      500
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params (Next.js 15+ compatibility)
    const resolvedParams = await params;
    const paramValue = resolvedParams.id;
    
    // Extract ID from slug (handles both slug format "name-id" and raw ID)
    const storyId = extractIdFromSlug(paramValue);
    
    // Use platform's unified authentication system
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

    const workspaceId = context.workspaceId;
    
    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    if (!storyId) {
      return createErrorResponse('Story ID required', 'STORY_ID_REQUIRED', 400);
    }

    const body = await request.json();
    const { title, description, acceptanceCriteria, priority, status, product, section, viewType, isFlagged, points, assigneeId, rank } = body;

    // Verify story belongs to workspace
    const existingStory = await prisma.stacksStory.findFirst({
      where: {
        id: storyId,
        project: {
          workspaceId: workspaceId
        }
      }
    });

    if (!existingStory) {
      return createErrorResponse('Story not found', 'STORY_NOT_FOUND', 404);
    }

    // Update story
    // Build update data - handle all editable fields
    const updateData: any = {
      updatedAt: new Date()
    };

    // Add fields to update if they are provided
    if (title !== undefined) {
      updateData.title = title;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (acceptanceCriteria !== undefined) {
      updateData.acceptanceCriteria = acceptanceCriteria;
    }
    if (priority !== undefined) {
      updateData.priority = priority;
    }
    if (status !== undefined) {
      updateData.status = status;
      // Update statusChangedAt when status changes
      if (status !== existingStory.status) {
        updateData.statusChangedAt = new Date();
      }
    }
    if (product !== undefined) {
      updateData.product = product;
    }
    if (section !== undefined) {
      updateData.section = section;
    }
    if (viewType !== undefined) {
      updateData.viewType = viewType;
    }
    if (isFlagged !== undefined) {
      updateData.isFlagged = isFlagged === true || isFlagged === 'true';
    }
    if (points !== undefined) {
      updateData.points = points === null || points === '' ? null : parseInt(points as string, 10);
    }
    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId || null;
    }
    if (rank !== undefined) {
      updateData.rank = rank === null || rank === '' ? null : parseInt(rank as string, 10);
    }

    const story = await prisma.stacksStory.update({
      where: { id: storyId },
      data: updateData,
      select: {
        id: true,
        epochId: true,
        projectId: true,
        title: true,
        description: true,
        acceptanceCriteria: true,
        status: true,
        priority: true,
        assigneeId: true,
        product: true,
        section: true,
        viewType: true,
        isFlagged: true,
        rank: true,
        statusChangedAt: true,
        createdAt: true,
        updatedAt: true,
        epoch: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Transform the data to match the expected format
    const transformedStory = {
      id: story.id,
      title: story.title,
      description: story.description,
      acceptanceCriteria: (story as any).acceptanceCriteria || null, // Safe access if column doesn't exist
      status: story.status,
      priority: story.priority,
      viewType: (story as any).viewType || 'detail', // Use story's viewType or default to 'detail'
      product: (story as any).product || null, // Safe access if column doesn't exist
      section: (story as any).section || null, // Safe access if column doesn't exist
      rank: (story as any).rank || null, // Safe access if column doesn't exist
      assignee: story.assignee ? {
        id: story.assignee.id,
        name: (() => {
          // Handle null values properly - convert null to empty string
          const firstName = story.assignee.firstName != null ? String(story.assignee.firstName) : '';
          const lastName = story.assignee.lastName != null ? String(story.assignee.lastName) : '';
          const fullName = `${firstName} ${lastName}`.trim();
          // Use name field if available, otherwise fall back to constructed name
          return story.assignee.name || fullName || 'Unknown';
        })(),
        email: story.assignee.email || ''
      } : null,
      epoch: story.epoch ? {
        id: story.epoch.id,
        title: story.epoch.title,
        description: story.epoch.description
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name
      } : null,
      isFlagged: story.isFlagged || false,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt
    };

    return NextResponse.json({ story: transformedStory });

  } catch (error) {
    console.error('❌ [STACKS API] Error updating story:', error);
    
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      const columnName = prismaError.meta?.column_name || 'unknown';
      
      return createErrorResponse(
        columnName !== 'unknown'
          ? `Database column '${columnName}' does not exist. Please run database migrations.`
          : 'Database schema mismatch. Please run database migrations.',
        'SCHEMA_MISMATCH',
        500
      );
    }
    
    return createErrorResponse(
      'Failed to update story. Please try again.',
      'STORY_UPDATE_ERROR',
      500
    );
  }
}
