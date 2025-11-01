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
    const search = searchParams.get('search');

    if (!workspaceId) {
      return createErrorResponse('Workspace ID is required', 'WORKSPACE_REQUIRED', 400);
    }

    const where: any = {
      project: { workspaceId }
    };

    if (projectId) {
      where.projectId = projectId;
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const epics = await prisma.stacksEpic.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { stories: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ epics });
  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'STACKS_EPICS_API_GET',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to fetch epics',
      'STACKS_EPICS_FETCH_ERROR',
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
    const { projectId, title, description, status, priority, product, section } = body;

    if (!workspaceId || !userId || !projectId || !title) {
      return createErrorResponse('Workspace ID, user ID, project ID, and title are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    const epic = await prisma.stacksEpic.create({
      data: {
        projectId,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        product: product || null,
        section: section || null
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ epic });
  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'STACKS_EPICS_API_POST',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to create epic',
      'STACKS_EPICS_CREATE_ERROR',
      500
    );
  }
}
