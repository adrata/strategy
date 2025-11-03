import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, logAndCreateErrorResponse } from '@/platform/services/secure-api-helper';

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

    if (!workspaceId) {
      return createErrorResponse('Workspace ID is required', 'WORKSPACE_REQUIRED', 400);
    }

    // Wrap Prisma query in try-catch for better error handling
    let projects;
    try {
      projects = await prisma.stacksProject.findMany({
        where: { workspaceId },
        include: {
          _count: {
            select: {
              epics: true,
              stories: true,
              tasks: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbError) {
      // Handle specific Prisma errors
      const prismaError = dbError as any;
      
      // P2022: Column does not exist
      if (prismaError.code === 'P2022') {
        const columnName = prismaError.meta?.column_name || 'unknown';
        console.error('❌ [STACKS PROJECTS API] P2022 Error - Column does not exist:', {
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
        console.warn('⚠️ [STACKS PROJECTS API] P2001 Error - No records found (returning empty array):', {
          userId: context.userId,
          workspaceId: context.workspaceId
        });
        return NextResponse.json({ projects: [] });
      }

      // P1001: Database connection error
      if (prismaError.code === 'P1001') {
        console.error('❌ [STACKS PROJECTS API] P1001 Error - Database connection failed:', {
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
      console.error('❌ [STACKS PROJECTS API] Prisma error:', {
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

    return NextResponse.json({ projects });
  } catch (error) {
    // Handle non-database errors
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'STACKS_PROJECTS_API_GET',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to fetch projects',
      'STACKS_PROJECTS_FETCH_ERROR',
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
    const { name, description } = body;

    if (!workspaceId || !userId || !name) {
      return createErrorResponse('Workspace ID, user ID, and name are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    const project = await prisma.stacksProject.create({
      data: {
        workspaceId,
        name,
        description
      }
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('❌ [STACKS PROJECTS API] Error creating project:', error);
    
    // Handle P2022 error (column does not exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2022') {
      const prismaError = error as any;
      const columnName = prismaError.meta?.column_name || 'unknown';
      console.error('❌ [STACKS PROJECTS API] P2022 Error - Column does not exist:', {
        columnName,
        meta: prismaError.meta,
        endpoint: 'POST'
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
        endpoint: 'STACKS_PROJECTS_API_POST',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to create project',
      'STACKS_PROJECTS_CREATE_ERROR',
      500
    );
  }
}
