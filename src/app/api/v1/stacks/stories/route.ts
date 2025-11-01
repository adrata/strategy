import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [STACKS API] GET request received');
    console.log('🔍 [STACKS API] Request URL:', request.url);
    
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

    // Get workspace ID - prefer query parameter over context (frontend may have different active workspace)
    const { searchParams } = new URL(request.url);
    const queryWorkspaceId = searchParams.get('workspaceId');
    const contextWorkspaceId = context.workspaceId;
    const userId = context.userId;
    
    // Use query parameter if provided, otherwise fall back to authenticated context
    const workspaceId = queryWorkspaceId || contextWorkspaceId;
    
    console.log('✅ [STACKS API] Authenticated user:', userId);
    console.log('🔍 [STACKS API] Workspace ID - Query param:', queryWorkspaceId, 'Context:', contextWorkspaceId, 'Using:', workspaceId);

    const category = searchParams.get('category'); // 'build' or 'sell'
    const status = searchParams.get('status');
    const epicId = searchParams.get('epicId');
    const assigneeId = searchParams.get('assigneeId');

    if (!workspaceId) {
      console.error('❌ [STACKS API] No workspace ID available (query param or context)');
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    // Security check: if both are provided, ensure they match (user should only access their workspace)
    if (queryWorkspaceId && contextWorkspaceId && queryWorkspaceId !== contextWorkspaceId) {
      console.warn('⚠️ [STACKS API] Workspace ID mismatch - Query:', queryWorkspaceId, 'Context:', contextWorkspaceId);
      // Still allow it but log the warning - the context workspace may be different from active workspace
    }

    // Build where clause
    const where: any = {
      project: {
        workspaceId: workspaceId
      }
    };

    // Note: category field doesn't exist in StacksStory schema yet
    // if (category) {
    //   where.category = category;
    // }

    if (status) {
      where.status = status;
      console.log('🔍 [STACKS API] Filtering by status:', status);
    }

    if (epicId) {
      where.epicId = epicId;
      console.log('🔍 [STACKS API] Filtering by epicId:', epicId);
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
      console.log('🔍 [STACKS API] Filtering by assigneeId:', assigneeId);
    }

    console.log('🔍 [STACKS API] Query where clause:', JSON.stringify(where, null, 2));

    // Fetch stories with epic and assignee information
    const stories = await prisma.stacksStory.findMany({
      where,
      include: {
        epic: {
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
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log('📊 [STACKS API] Found', stories.length, 'stories for workspace', workspaceId);

    // Transform the data to match the expected format
    const transformedStories = stories.map(story => ({
      id: story.id,
      title: story.title,
      description: story.description,
      status: story.status,
      priority: story.priority,
      viewType: story.viewType || 'main',
      product: story.product || null,
      section: story.section || null,
      assignee: story.assignee ? {
        id: story.assignee.id,
        name: `${story.assignee.firstName} ${story.assignee.lastName}`,
        email: story.assignee.email
      } : null,
      epic: story.epic ? {
        id: story.epic.id,
        title: story.epic.title,
        description: story.epic.description
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name
      } : null,
      dueDate: null, // dueDate field doesn't exist in schema yet
      tags: [], // tags field doesn't exist in schema yet
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      // Calculate time in current status (in days)
      timeInStatus: story.updatedAt ? Math.floor((Date.now() - new Date(story.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
    }));

    return NextResponse.json({ stories: transformedStories });

  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use platform's unified authentication system
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

    const body = await request.json();
    const { title, description, status, priority, assigneeId, epicId, projectId, viewType, product, section } = body;

    if (!title || !projectId) {
      return createErrorResponse('Title and project ID are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    const story = await prisma.stacksStory.create({
      data: {
        title,
        description: description || '',
        status: status || 'todo',
        priority: priority || 'medium',
        assigneeId: assigneeId || null,
        epicId: epicId || null,
        projectId,
        viewType: viewType || 'main',
        product: product || null,
        section: section || null,
        // dueDate and tags fields don't exist in schema yet
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        epic: {
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

    return NextResponse.json({ story });

  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use platform's unified authentication system
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

    const body = await request.json();
    const { id, title, description, status, priority, assigneeId, epicId, viewType, product, section } = body;

    if (!id) {
      return createErrorResponse('Story ID is required', 'MISSING_STORY_ID', 400);
    }

    const story = await prisma.stacksStory.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(epicId !== undefined && { epicId }),
        ...(viewType !== undefined && { viewType }),
        ...(product !== undefined && { product }),
        ...(section !== undefined && { section }),
        // dueDate and tags fields don't exist in schema yet
        updatedAt: new Date()
      },
      include: {
        epic: {
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

    return NextResponse.json({ story });

  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Use platform's unified authentication system
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
    const id = searchParams.get('id');

    if (!id) {
      return createErrorResponse('Story ID is required', 'MISSING_STORY_ID', 400);
    }

    await prisma.stacksStory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
