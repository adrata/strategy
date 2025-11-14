import { NextRequest } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

export const dynamic = 'force-dynamic';

// GET /api/v1/lists - Get all lists for current user/workspace/section
export async function GET(request: NextRequest) {
  // Define variables outside try block for error logging
  let workspaceId: string | undefined;
  let userId: string | undefined;
  let section: string | null = null;
  
  try {
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

    const { searchParams } = new URL(request.url);
    const queryWorkspaceId = searchParams.get('workspaceId');
    section = searchParams.get('section');
    workspaceId = queryWorkspaceId || context.workspaceId;
    userId = context.userId;

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    if (!section) {
      return createErrorResponse('Section is required', 'SECTION_REQUIRED', 400);
    }

    // Check if prisma.lists is available (Prisma client must be regenerated)
    if (!prisma.lists) {
      console.error('❌ [V1 LISTS API] prisma.lists is undefined - Prisma client needs regeneration');
      // Return empty array instead of error to prevent blocking page load
      console.warn('⚠️ [V1 LISTS API] Returning empty lists - Prisma client missing lists model');
      return createSuccessResponse([], { count: 0, warning: 'Lists model not available in Prisma client' });
    }

    // Get all lists for the user in this workspace and section
    const lists = await prisma.lists.findMany({
      where: {
        workspaceId,
        userId,
        section,
        deletedAt: null
      },
      orderBy: [
        { isDefault: 'desc' }, // Default lists first
        { createdAt: 'asc' } // Then by creation date
      ]
    });

    return createSuccessResponse(lists, { count: lists.length });
  } catch (error: any) {
    // Enhanced error logging with full error details
    console.error('❌ [V1 LISTS API] Error fetching lists:', {
      error: error,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
      workspaceId,
      userId,
      section
    });
    
    // Handle P2022 errors (column/table doesn't exist)
    if (error?.code === 'P2022') {
      const columnName = error?.meta?.column_name;
      const tableName = error?.meta?.table_name;
      console.error('❌ [V1 LISTS API] P2022 Error - Schema mismatch:', {
        columnName,
        tableName,
        error
      });
      return createErrorResponse(
        `Database schema mismatch: Column '${columnName}' or table '${tableName}' does not exist. Please regenerate the Prisma client from the streamlined schema.`,
        'SCHEMA_MISMATCH',
        500
      );
    }
    
    // Handle Prisma connection errors
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database server')) {
      console.error('❌ [V1 LISTS API] Database connection error:', error);
      return createErrorResponse(
        'Database connection failed. Please try again later.',
        'DATABASE_CONNECTION_ERROR',
        503
      );
    }
    
    // Handle other Prisma errors
    if (error?.code?.startsWith('P')) {
      console.error('❌ [V1 LISTS API] Prisma error:', {
        code: error.code,
        message: error.message,
        meta: error.meta
      });
      return createErrorResponse(
        `Database error: ${error.message || 'Unknown Prisma error'}`,
        'DATABASE_ERROR',
        500
      );
    }
    
    // Generic error - return empty array instead of error to prevent blocking
    // The frontend can handle empty lists gracefully
    console.warn('⚠️ [V1 LISTS API] Returning empty lists due to error:', error?.message || 'Unknown error');
    return createSuccessResponse([], { count: 0, warning: 'Failed to fetch lists, returning empty array' });
  }
}

// POST /api/v1/lists - Create new list
export async function POST(request: NextRequest) {
  // Define variables outside try block for error logging
  let workspaceId: string | undefined;
  let userId: string | undefined;
  let section: string | null = null;
  
  try {
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

    const body = await request.json();
    const { name, description, filters, sortField, sortDirection, searchQuery, isDefault, visibleFields } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return createErrorResponse('List name is required', 'MISSING_NAME', 400);
    }

    const { searchParams } = new URL(request.url);
    const queryWorkspaceId = searchParams.get('workspaceId');
    section = searchParams.get('section');
    workspaceId = queryWorkspaceId || context.workspaceId;
    userId = context.userId;

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    if (!section) {
      return createErrorResponse('Section is required', 'SECTION_REQUIRED', 400);
    }

    // Check if prisma.lists is available (Prisma client must be regenerated)
    if (!prisma.lists) {
      console.error('❌ [V1 LISTS API] prisma.lists is undefined - Prisma client needs regeneration');
      return createErrorResponse(
        'Database schema mismatch: The Prisma client was generated with an outdated schema. The lists model is missing. Please regenerate the Prisma client from the streamlined schema.',
        'SCHEMA_MISMATCH',
        500
      );
    }

    // Check if a list with the same name already exists for this user/workspace/section
    const existingList = await prisma.lists.findFirst({
      where: {
        workspaceId,
        userId,
        section,
        name: name.trim(),
        deletedAt: null
      }
    });

    if (existingList) {
      return createErrorResponse('A list with this name already exists', 'DUPLICATE_NAME', 409);
    }

    // Create the list
    const newList = await prisma.lists.create({
      data: {
        workspaceId,
        userId,
        section,
        name: name.trim(),
        description: description?.trim() || null,
        isDefault: isDefault === true,
        filters: filters || null,
        sortField: sortField || null,
        sortDirection: sortDirection || null,
        searchQuery: searchQuery?.trim() || null,
        visibleFields: visibleFields && Array.isArray(visibleFields) ? visibleFields : null
      }
    });

    return createSuccessResponse(newList, { message: 'List created successfully' });
  } catch (error: any) {
    console.error('Error creating list:', error);
    
    // Handle P2022 errors (column/table doesn't exist)
    if (error?.code === 'P2022') {
      const columnName = error?.meta?.column_name;
      const tableName = error?.meta?.table_name;
      console.error('❌ [V1 LISTS API] P2022 Error - Schema mismatch:', {
        columnName,
        tableName,
        error
      });
      return createErrorResponse(
        `Database schema mismatch: Column '${columnName}' or table '${tableName}' does not exist. Please regenerate the Prisma client from the streamlined schema.`,
        'SCHEMA_MISMATCH',
        500
      );
    }
    
    return createErrorResponse(
      'Failed to create list',
      'CREATE_ERROR',
      500
    );
  }
}

