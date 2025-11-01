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
    const epicId = searchParams.get('epicId');

    if (!workspaceId) {
      return createErrorResponse('Workspace ID is required', 'WORKSPACE_REQUIRED', 400);
    }

    const where: any = {
      project: { workspaceId }
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (epicId) {
      where.epicId = epicId;
    }

    const stories = await prisma.stacksStory.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true }
        },
        epic: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ stories });
  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'STACKS_STORIES_API_GET',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to fetch stories',
      'STACKS_STORIES_FETCH_ERROR',
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
    const { projectId, epicId, title, description, status, priority, assigneeId } = body;

    if (!workspaceId || !userId || !projectId || !title) {
      return createErrorResponse('Workspace ID, user ID, project ID, and title are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    const story = await prisma.stacksStory.create({
      data: {
        projectId,
        epicId: epicId || null,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        assigneeId: assigneeId || null
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        epic: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ story });
  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'STACKS_STORIES_API_POST',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to create story',
      'STACKS_STORIES_CREATE_ERROR',
      500
    );
  }
}
