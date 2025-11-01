import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, logAndCreateErrorResponse } from '@/platform/services/secure-api-helper';

export async function GET(request: NextRequest) {
  let context: any = null;
  
  try {
    // Authenticate and authorize user
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context: authContext, response } = authResult;
    context = authContext;

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const workspaceId = context.workspaceId;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const storyId = searchParams.get('storyId');
    const type = searchParams.get('type');

    if (!workspaceId) {
      return createErrorResponse('Workspace ID is required', 'WORKSPACE_REQUIRED', 400);
    }

    const where: any = {
      project: { workspaceId }
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (storyId) {
      where.storyId = storyId;
    }

    if (type) {
      where.type = type;
    }

    const tasks = await prisma.stacksTask.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'STACKS_TASKS_API_GET',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to fetch tasks',
      'STACKS_TASKS_FETCH_ERROR',
      500
    );
  }
}

export async function POST(request: NextRequest) {
  let context: any = null;
  
  try {
    // Authenticate and authorize user
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context: authContext, response } = authResult;
    context = authContext;

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const workspaceId = context.workspaceId;
    const userId = context.userId;
    const body = await request.json();
    const { projectId, storyId, title, description, status, priority, type, assigneeId, product, section } = body;

    if (!workspaceId || !userId || !projectId || !title) {
      return createErrorResponse('Workspace ID, user ID, project ID, and title are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    const task = await prisma.stacksTask.create({
      data: {
        projectId,
        storyId: storyId || null,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        type: type || 'task',
        assigneeId: assigneeId || null,
        product: product || null,
        section: section || null
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
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'STACKS_TASKS_API_POST',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to create task',
      'STACKS_TASKS_CREATE_ERROR',
      500
    );
  }
}
