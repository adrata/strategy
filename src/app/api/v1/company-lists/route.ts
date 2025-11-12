import { NextRequest } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

export const dynamic = 'force-dynamic';

// GET /api/v1/company-lists - Get all lists for current user/workspace
export async function GET(request: NextRequest) {
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
    const workspaceId = queryWorkspaceId || context.workspaceId;
    const userId = context.userId;

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    // Get all lists for the user in this workspace, including defaults
    const lists = await prisma.company_lists.findMany({
      where: {
        workspaceId,
        userId,
        deletedAt: null
      },
      orderBy: [
        { isDefault: 'desc' }, // Default lists first
        { createdAt: 'asc' } // Then by creation date
      ]
    });

    return createSuccessResponse(lists, { count: lists.length });
  } catch (error) {
    console.error('Error fetching company lists:', error);
    return createErrorResponse(
      'Failed to fetch company lists',
      'FETCH_ERROR',
      500
    );
  }
}

// POST /api/v1/company-lists - Create new list
export async function POST(request: NextRequest) {
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
    const { name, description, filters, sortField, sortDirection, searchQuery, isDefault } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return createErrorResponse('List name is required', 'MISSING_NAME', 400);
    }

    const { searchParams } = new URL(request.url);
    const queryWorkspaceId = searchParams.get('workspaceId');
    const workspaceId = queryWorkspaceId || context.workspaceId;
    const userId = context.userId;

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    // Check if a list with the same name already exists for this user/workspace
    const existingList = await prisma.company_lists.findFirst({
      where: {
        workspaceId,
        userId,
        name: name.trim(),
        deletedAt: null
      }
    });

    if (existingList) {
      return createErrorResponse('A list with this name already exists', 'DUPLICATE_NAME', 409);
    }

    // Create the list
    const newList = await prisma.company_lists.create({
      data: {
        workspaceId,
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        isDefault: isDefault === true,
        filters: filters || null,
        sortField: sortField || null,
        sortDirection: sortDirection || null,
        searchQuery: searchQuery?.trim() || null
      }
    });

    return createSuccessResponse(newList, { message: 'List created successfully' });
  } catch (error) {
    console.error('Error creating company list:', error);
    return createErrorResponse(
      'Failed to create company list',
      'CREATE_ERROR',
      500
    );
  }
}

