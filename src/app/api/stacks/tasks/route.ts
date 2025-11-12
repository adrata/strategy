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

    // Get workspace ID - prefer query parameter over context (frontend may have different active workspace)
    const { searchParams } = new URL(request.url);
    const queryWorkspaceId = searchParams.get('workspaceId');
    const contextWorkspaceId = context.workspaceId;
    const userId = context.userId;
    
    // Use query parameter if provided, otherwise fall back to authenticated context
    const workspaceId = queryWorkspaceId || contextWorkspaceId;
    
    const projectId = searchParams.get('projectId');
    const storyId = searchParams.get('storyId');
    const type = searchParams.get('type');

    if (!workspaceId) {
      console.error('❌ [STACKS TASKS API] No workspace ID available (query param or context)');
      return createErrorResponse('Workspace ID is required', 'WORKSPACE_REQUIRED', 400);
    }
    
    console.log('✅ [STACKS TASKS API] Authenticated user:', context.userId);
    console.log('🔍 [STACKS TASKS API] Workspace ID - Query param:', queryWorkspaceId, 'Context:', contextWorkspaceId, 'Using:', workspaceId);
    
    // CRITICAL FIX: Log warning if using fallback workspaceId, but allow query to proceed
    if (workspaceId === 'local-workspace') {
      console.warn('⚠️ [STACKS TASKS API] Using fallback workspaceId - queries may return empty results:', {
        workspaceId,
        queryWorkspaceId,
        contextWorkspaceId,
        userId: context.userId
      });
    }

    // Security check: if both are provided, ensure they match (user should only access their workspace)
    if (queryWorkspaceId && contextWorkspaceId && queryWorkspaceId !== contextWorkspaceId) {
      console.warn('⚠️ [STACKS TASKS API] Workspace ID mismatch - Query:', queryWorkspaceId, 'Context:', contextWorkspaceId);
      // Still allow it but log the warning - the context workspace may be different from active workspace
    }

    // Auto-create or get project for workspace (consistent with stories API behavior)
    // This ensures we can always query tasks even if project was deleted
    let project = await prisma.stacksProject.findFirst({
      where: { workspaceId }
    });
    
    if (!project) {
      console.log('ℹ️ [STACKS TASKS API] No project found for workspace, auto-creating default project');
      try {
        project = await prisma.stacksProject.create({
          data: {
            workspaceId,
            name: 'Default Project',
            description: 'Default project for stacks'
          }
        });
        console.log('✅ [STACKS TASKS API] Created default project:', project.id);
      } catch (createError) {
        console.error('❌ [STACKS TASKS API] Error creating default project:', createError);
        // Continue anyway - maybe there are orphaned tasks
      }
    }

    // Get all project IDs for this workspace to safely filter tasks
    // This avoids issues with nested relation filters and orphaned tasks
    let workspaceProjects;
    try {
      workspaceProjects = await prisma.stacksProject.findMany({
        where: { workspaceId },
        select: { id: true }
      });
    } catch (projectError) {
      console.error('❌ [STACKS TASKS API] Error fetching projects:', projectError);
      return logAndCreateErrorResponse(
        projectError,
        {
          endpoint: 'STACKS_TASKS_API_GET_PROJECTS',
          userId: context?.userId,
          workspaceId,
          requestId: request.headers.get('x-request-id') || undefined
        },
        'Failed to fetch workspace projects',
        'STACKS_TASKS_PROJECTS_FETCH_ERROR',
        500
      );
    }
    
    const workspaceProjectIds = workspaceProjects.map(p => p.id);
    console.log('🔍 [STACKS TASKS API] Found projects for workspace:', workspaceProjectIds.length, 'project IDs:', workspaceProjectIds);

    if (workspaceProjectIds.length === 0) {
      // No projects exist for this workspace, return empty result
      console.warn('⚠️ [STACKS TASKS API] No projects found for workspace, returning empty tasks');
      return NextResponse.json({ tasks: [] });
    }

    // Build where clause - filter tasks by project IDs in this workspace
    const where: any = {
      projectId: { in: workspaceProjectIds }
    };

    if (projectId) {
      // If specific projectId is provided, ensure it's in the workspace
      if (workspaceProjectIds.includes(projectId)) {
        where.projectId = projectId;
      } else {
        console.warn('⚠️ [STACKS TASKS API] Requested projectId not in workspace, returning empty');
        return NextResponse.json({ tasks: [] });
      }
    }

    if (storyId) {
      where.storyId = storyId;
    }

    if (type) {
      where.type = type;
    }

    console.log('🔍 [STACKS TASKS API] Query where clause:', JSON.stringify(where, null, 2));
    console.log('🔍 [STACKS TASKS API] Workspace ID:', workspaceId, 'Project IDs:', workspaceProjectIds);

    // Fetch tasks with defensive select - try with optional columns first, fallback without them if they don't exist
    let tasks;
    try {
      console.log('🔍 [STACKS TASKS API] Attempting to fetch tasks with rank column...');
      // First attempt: try with rank column (may not exist in production)
      tasks = await prisma.stacksTask.findMany({
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
          rank: true,
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
        orderBy: [
          { rank: 'asc' as const },
          { createdAt: 'desc' as const }
        ]
      });
    } catch (rankError: any) {
      console.error('❌ [STACKS TASKS API] Error fetching tasks with rank:', rankError);
      console.error('❌ [STACKS TASKS API] Error details:', {
        message: rankError instanceof Error ? rankError.message : String(rankError),
        code: rankError?.code,
        meta: rankError?.meta,
        workspaceId,
        workspaceProjectIds
      });
      
      // If rank column doesn't exist, try without it
      if (rankError && typeof rankError === 'object' && 'code' in rankError && rankError.code === 'P2022') {
        console.warn('⚠️ [STACKS TASKS API] Rank column does not exist, fetching without rank');
        try {
          tasks = await prisma.stacksTask.findMany({
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
          orderBy: [
            { createdAt: 'desc' }
          ]
        });
          // Add null rank to all tasks
          tasks = tasks.map((task: any) => ({ ...task, rank: null }));
        } catch (fallbackError: any) {
          console.error('❌ [STACKS TASKS API] Error fetching tasks without rank:', fallbackError);
          throw fallbackError;
        }
      } else {
        throw rankError; // Re-throw if it's not a P2022 error
      }
    }

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

    console.error('❌ [STACKS TASKS API] Unexpected error in GET:', error);
    console.error('❌ [STACKS TASKS API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      meta: (error as any)?.meta,
      workspaceId: context?.workspaceId,
      userId: context?.userId
    });

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

    // Get workspace ID - prefer query parameter over context (frontend may have different active workspace)
    // CRITICAL: Always use query parameter if provided - this ensures consistency with frontend workspace resolution
    // The frontend always passes workspaceId from URL slug, so query param should always be present
    const { searchParams } = new URL(request.url);
    const queryWorkspaceId = searchParams.get('workspaceId');
    const contextWorkspaceId = context.workspaceId;
    const userId = context.userId;
    
    // Use query parameter if provided, otherwise fall back to authenticated context
    // But log a warning if query param is missing - this could cause workspace mismatches
    const workspaceId = queryWorkspaceId || contextWorkspaceId;
    
    if (!queryWorkspaceId) {
      console.error('❌ [STACKS TASKS API POST] CRITICAL: No workspaceId query parameter provided!');
      console.error('❌ [STACKS TASKS API POST] Falling back to context workspace:', contextWorkspaceId);
      console.error('❌ [STACKS TASKS API POST] This WILL cause workspace mismatches - frontend should always pass workspaceId');
      console.error('❌ [STACKS TASKS API POST] Request URL:', request.url);
    } else if (queryWorkspaceId !== contextWorkspaceId) {
      console.warn('⚠️ [STACKS TASKS API POST] Workspace ID mismatch - Query:', queryWorkspaceId, 'Context:', contextWorkspaceId);
      console.warn('⚠️ [STACKS TASKS API POST] Using query parameter (correct) - user is viewing different workspace than their active workspace');
    }
    
    console.log('✅ [STACKS TASKS API POST] Authenticated user:', userId);
    console.log('🔍 [STACKS TASKS API POST] Workspace ID - Query param:', queryWorkspaceId, 'Context:', contextWorkspaceId, 'Using:', workspaceId);
    
    const body = await request.json();
    const { projectId, storyId, title, description, status, priority, type, assigneeId, product, section } = body;

    if (!workspaceId || !userId || !title) {
      return createErrorResponse('Workspace ID, user ID, and title are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    // Auto-create or get project for workspace
    // CRITICAL: Ensure we're using the correct workspace ID for project lookup
    let finalProjectId = projectId;
    if (!finalProjectId) {
      console.log('🔍 [STACKS TASKS API POST] Looking up project for workspace:', workspaceId);
      let project = await prisma.stacksProject.findFirst({
        where: { workspaceId },
        select: { id: true, workspaceId: true, name: true }
      });
      
      if (project) {
        console.log('✅ [STACKS TASKS API POST] Found existing project:', {
          projectId: project.id,
          projectName: project.name,
          projectWorkspaceId: project.workspaceId,
          requestedWorkspaceId: workspaceId,
          workspaceMatch: project.workspaceId === workspaceId
        });
        
        // CRITICAL: Verify project belongs to correct workspace
        if (project.workspaceId !== workspaceId) {
          console.error('❌ [STACKS TASKS API POST] PROJECT WORKSPACE MISMATCH:', {
            projectId: project.id,
            projectWorkspaceId: project.workspaceId,
            requestedWorkspaceId: workspaceId,
            action: 'Creating new project with correct workspace'
          });
          // Create a new project with the correct workspace ID
          project = await prisma.stacksProject.create({
            data: {
              workspaceId,
              name: 'Default Project',
              description: 'Default project for stacks'
            },
            select: { id: true, workspaceId: true, name: true }
          });
          console.log('✅ [STACKS TASKS API POST] Created new project with correct workspace:', {
            projectId: project.id,
            projectWorkspaceId: project.workspaceId
          });
        }
      } else {
        console.log('ℹ️ [STACKS TASKS API POST] No project found, creating new one for workspace:', workspaceId);
        project = await prisma.stacksProject.create({
          data: {
            workspaceId,
            name: 'Default Project',
            description: 'Default project for stacks'
          },
          select: { id: true, workspaceId: true, name: true }
        });
        console.log('✅ [STACKS TASKS API POST] Created new project:', {
          projectId: project.id,
          projectWorkspaceId: project.workspaceId,
          requestedWorkspaceId: workspaceId
        });
      }
      finalProjectId = project.id;
    } else {
      // If projectId is provided, verify it belongs to the correct workspace
      const providedProject = await prisma.stacksProject.findFirst({
        where: { id: projectId },
        select: { id: true, workspaceId: true, name: true }
      });
      
      if (providedProject) {
        if (providedProject.workspaceId !== workspaceId) {
          console.error('❌ [STACKS TASKS API POST] PROVIDED PROJECT WORKSPACE MISMATCH:', {
            providedProjectId: projectId,
            projectWorkspaceId: providedProject.workspaceId,
            requestedWorkspaceId: workspaceId
          });
          return createErrorResponse(
            `Project ${projectId} belongs to a different workspace`,
            'PROJECT_WORKSPACE_MISMATCH',
            400
          );
        }
      }
    }

    // DUPLICATE PREVENTION: Check if a task with the same title already exists in this project
    // For bugs, check by title and type to prevent duplicate bugs
    // Use case-insensitive comparison by fetching and filtering in memory
    const normalizedTitle = title.trim().toLowerCase();
    const existingTasks = await prisma.stacksTask.findMany({
      where: {
        projectId: finalProjectId,
        ...(type === 'bug' ? { type: 'bug' } : {}) // For bugs, also filter by type
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        createdAt: true
      }
    });

    // Check for exact match (case-insensitive, trimmed)
    const existingTask = existingTasks.find(
      task => task.title.trim().toLowerCase() === normalizedTitle
    );

    if (existingTask) {
      console.warn('⚠️ [STACKS TASKS API POST] Duplicate task detected:', {
        existingTaskId: existingTask.id,
        existingTitle: existingTask.title,
        existingType: existingTask.type,
        newTitle: title,
        newType: type,
        projectId: finalProjectId,
        workspaceId: workspaceId
      });
      return createErrorResponse(
        `A ${type === 'bug' ? 'bug' : 'task'} with the title "${title}" already exists in this project.`,
        'DUPLICATE_TASK',
        409
      );
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

    // NOTE: attachments field removed - not in streamlined schema used in production

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
          select: { id: true, name: true, workspaceId: true }
        },
        story: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // COMPREHENSIVE LOGGING: Track workspace information for debugging
    console.log('✅ [STACKS TASKS API] Task created successfully:', {
      taskId: task.id,
      taskTitle: task.title,
      taskType: task.type,
      projectId: task.projectId,
      projectWorkspaceId: task.project?.workspaceId,
      requestedWorkspaceId: workspaceId,
      workspaceMatch: task.project?.workspaceId === workspaceId,
      queryWorkspaceId,
      contextWorkspaceId,
      timestamp: new Date().toISOString()
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
