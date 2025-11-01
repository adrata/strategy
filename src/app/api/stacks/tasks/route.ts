import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, logAndCreateErrorResponse } from '@/platform/services/secure-api-helper';

// Force dynamic rendering to prevent caching issues and ensure proper authentication
export const dynamic = 'force-dynamic';

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
        createdAt: true,
        updatedAt: true,
        project: {
          select: { id: true, name: true }
        },
        story: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform assignee field to match expected format
    const transformedTasks = tasks.map(task => ({
      ...task,
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim() || 'Unknown',
        email: task.assignee.email || ''
      } : null
    }));

    return NextResponse.json({ tasks: transformedTasks });
  } catch (error) {
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      const columnName = prismaError.meta?.column_name || 'unknown';
      console.error('❌ [STACKS TASKS API] P2022 Error - Column does not exist:', {
        columnName,
        meta: prismaError.meta,
        endpoint: 'GET'
      });
      
      return createErrorResponse(
        columnName !== 'unknown' 
          ? `Database column '${columnName}' does not exist. Please run database migrations.`
          : 'Database schema mismatch. Please run database migrations.',
        'SCHEMA_MISMATCH',
        500
      );
    }

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
  let createData: any = {};
  
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

    if (!workspaceId || !userId || !title) {
      return createErrorResponse('Workspace ID, user ID, and title are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    // Auto-create or get project for workspace
    let finalProjectId = projectId;
    if (!finalProjectId) {
      let project = await prisma.stacksProject.findFirst({
        where: { workspaceId }
      });
      
      if (!project) {
        project = await prisma.stacksProject.create({
          data: {
            workspaceId,
            name: 'Default Project',
            description: 'Default project for stacks'
          }
        });
      }
      finalProjectId = project.id;
    }

    // Build create data - only include defined fields
    const createData: any = {
      projectId: finalProjectId,
      storyId: storyId || null,
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      type: type || 'task'
    };

    // Only include optional fields if they are provided
    if (assigneeId !== undefined && assigneeId !== null) {
      createData.assigneeId = assigneeId;
    } else {
      createData.assigneeId = null;
    }

    if (product !== undefined && product !== null) {
      createData.product = product;
    } else {
      createData.product = null;
    }

    if (section !== undefined && section !== null) {
      createData.section = section;
    } else {
      createData.section = null;
    }

    const task = await prisma.stacksTask.create({
      data: createData,
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
        createdAt: true,
        updatedAt: true,
        project: {
          select: { id: true, name: true }
        },
        story: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // Transform assignee field to match expected format
    const transformedTask = {
      ...task,
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim() || 'Unknown',
        email: task.assignee.email || ''
      } : null
    };

    return NextResponse.json({ task: transformedTask });
  } catch (error) {
    console.error('❌ [STACKS TASKS API] Error creating task:', error);
    
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      const columnName = prismaError.meta?.column_name || 'unknown';
      console.error('❌ [STACKS TASKS API] P2022 Error - Column does not exist:', {
        columnName,
        meta: prismaError.meta,
        createDataKeys: Object.keys(createData || {})
      });
      
      return createErrorResponse(
        columnName !== 'unknown' 
          ? `Database column '${columnName}' does not exist. Please run database migrations.`
          : 'Database schema mismatch. Please run database migrations.',
        'SCHEMA_MISMATCH',
        500
      );
    }
    
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
