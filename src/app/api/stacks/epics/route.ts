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

    // Wrap Prisma query in try-catch for better error handling
    let epochs;
    try {
      epochs = await prisma.stacksEpic.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true }
          },
          _count: {
            select: { stories: true }
          }
        },
        orderBy: [
          { rank: 'asc' }, // Order by rank first (lower = more important, nulls last)
          { createdAt: 'desc' } // Then by creation date
        ]
      });
    } catch (dbError) {
      // Handle specific Prisma errors
      const prismaError = dbError as any;
      
      // P2022: Column does not exist
      if (prismaError.code === 'P2022') {
        const columnName = prismaError.meta?.column_name || 'unknown';
        console.error('❌ [STACKS EPOCHS API] P2022 Error - Column does not exist:', {
          columnName,
          meta: prismaError.meta,
          endpoint: 'GET',
          userId: context.userId,
          workspaceId: context.workspaceId,
          errorMessage: prismaError.message,
          stack: prismaError.stack
        });
        
        return createErrorResponse(
          columnName !== 'unknown' 
            ? `Database column '${columnName}' does not exist. Please run database migrations.`
            : 'Database schema mismatch. Please run database migrations.',
          'SCHEMA_MISMATCH',
          500
        );
      }

      // P2001: Record not found (shouldn't happen with findMany, but handle anyway)
      if (prismaError.code === 'P2001') {
        console.warn('⚠️ [STACKS EPOCHS API] P2001 Error - No records found (returning empty array):', {
          userId: context.userId,
          workspaceId: context.workspaceId
        });
        return NextResponse.json({ epics: [], epochs: [] });
      }

      // P1001: Database connection error
      if (prismaError.code === 'P1001') {
        console.error('❌ [STACKS EPOCHS API] P1001 Error - Database connection failed:', {
          userId: context.userId,
          workspaceId: context.workspaceId,
          errorMessage: prismaError.message
        });
        return createErrorResponse(
          'Database connection failed. Please try again later.',
          'DATABASE_CONNECTION_ERROR',
          503
        );
      }

      // Unknown Prisma error
      console.error('❌ [STACKS EPOCHS API] Prisma error:', {
        code: prismaError.code,
        message: prismaError.message,
        meta: prismaError.meta,
        userId: context.userId,
        workspaceId: context.workspaceId,
        stack: prismaError.stack
      });
      
      return createErrorResponse(
        `Database query failed: ${prismaError.message || 'Unknown error'}`,
        'DATABASE_QUERY_ERROR',
        500
      );
    }

    return NextResponse.json({ epics: epochs, epochs });
  } catch (error) {
    // Handle non-database errors
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'STACKS_EPOCHS_API_GET',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to fetch epochs',
      'STACKS_EPOCHS_FETCH_ERROR',
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

    // Get current max rank to assign new epic
    const maxRankEpic = await prisma.stacksEpic.findFirst({
      where: { projectId: finalProjectId },
      orderBy: { rank: 'desc' },
      select: { rank: true }
    });
    const nextRank = maxRankEpic?.rank ? maxRankEpic.rank + 1 : 1;

    const epoch = await prisma.stacksEpic.create({
      data: {
        projectId: finalProjectId,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        rank: nextRank, // Assign next rank
        product: product || null,
        section: section || null
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ epic: epoch, epoch });
  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'STACKS_EPOCHS_API_POST',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to create epoch',
      'STACKS_EPOCHS_CREATE_ERROR',
      500
    );
  }
}
