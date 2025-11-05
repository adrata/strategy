import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { extractIdFromSlug } from '@/platform/utils/url-utils';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params (Next.js 15+ compatibility)
    const resolvedParams = await params;
    const paramValue = resolvedParams.id;
    
    // Extract ID from slug (handles both slug format "name-id" and raw ID)
    const taskId = extractIdFromSlug(paramValue);
    
    console.log('🔍 [STACKS TASKS API] GET single task request received');
    console.log('🔍 [STACKS TASKS API] Param value:', paramValue);
    console.log('🔍 [STACKS TASKS API] Extracted task ID:', taskId);
    
    // Use platform's unified authentication system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      console.log('❌ [STACKS TASKS API] Authentication failed');
      return response; // Return error response if authentication failed
    }

    if (!context) {
      console.log('❌ [STACKS TASKS API] No context after authentication');
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Get workspace ID from authenticated context
    const workspaceId = context.workspaceId;
    const userId = context.userId;
    
    console.log('✅ [STACKS TASKS API] Authenticated user:', userId, 'workspace:', workspaceId, 'taskId:', taskId);

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    if (!taskId) {
      return createErrorResponse('Task ID required', 'TASK_ID_REQUIRED', 400);
    }

    // Fetch the task with workspace validation
    const task = await prisma.stacksTask.findFirst({
      where: {
        id: taskId,
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
        rank: true,
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
      console.log('❌ [STACKS TASKS API] Task not found:', taskId);
      return createErrorResponse('Task not found', 'TASK_NOT_FOUND', 404);
    }

    // Transform the data to match the expected format
    const transformedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type || 'task',
      product: task.product || null,
      section: task.section || null,
      rank: (task as any).rank || null,
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
      story: task.story ? {
        id: task.story.id,
        title: task.story.title
      } : null,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name
      } : null,
      tags: task.type === 'bug' ? ['bug'] : [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };

    console.log('✅ [STACKS TASKS API] Task found and transformed');
    return NextResponse.json({ task: transformedTask });

  } catch (error) {
    console.error('❌ [STACKS TASKS API] Error fetching task:', error);
    
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      const columnName = prismaError.meta?.column_name || 'unknown';
      console.error('❌ [STACKS TASKS API] P2022 Error - Column does not exist:', {
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
      'Failed to fetch task. Please try again.',
      'TASK_FETCH_ERROR',
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
    const taskId = extractIdFromSlug(paramValue);
    
    const body = await request.json();
    const { userId, title, description, status, priority, type, assigneeId, rank } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const task = await prisma.stacksTask.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(type && { type }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(rank !== undefined && { rank: rank === null || rank === '' ? null : parseInt(rank as string, 10) })
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        story: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params (Next.js 15+ compatibility)
    const resolvedParams = await params;
    const paramValue = resolvedParams.id;
    
    // Extract ID from slug (handles both slug format "name-id" and raw ID)
    const taskId = extractIdFromSlug(paramValue);
    
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.stacksTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
