import { NextRequest } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

export const dynamic = 'force-dynamic';

// GET /api/v1/lists/[id] - Get a specific list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const listId = resolvedParams.id;

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
    const section = searchParams.get('section');
    const workspaceId = queryWorkspaceId || context.workspaceId;
    const userId = context.userId;

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    const list = await prisma.lists.findFirst({
      where: {
        id: listId,
        workspaceId,
        userId,
        ...(section && { section }),
        deletedAt: null
      }
    });

    if (!list) {
      return createErrorResponse('List not found', 'NOT_FOUND', 404);
    }

    return createSuccessResponse(list);
  } catch (error) {
    console.error('Error fetching list:', error);
    return createErrorResponse(
      'Failed to fetch list',
      'FETCH_ERROR',
      500
    );
  }
}

// PUT /api/v1/lists/[id] - Update existing list
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const listId = resolvedParams.id;

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

    const { searchParams } = new URL(request.url);
    const queryWorkspaceId = searchParams.get('workspaceId');
    const section = searchParams.get('section');
    const workspaceId = queryWorkspaceId || context.workspaceId;
    const userId = context.userId;

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    // Verify list exists and belongs to user
    const existingList = await prisma.lists.findFirst({
      where: {
        id: listId,
        workspaceId,
        userId,
        ...(section && { section }),
        deletedAt: null
      }
    });

    if (!existingList) {
      return createErrorResponse('List not found', 'NOT_FOUND', 404);
    }

    // If name is being changed, check for duplicates
    if (name && name.trim() !== existingList.name) {
      const duplicateList = await prisma.lists.findFirst({
        where: {
          workspaceId,
          userId,
          section: existingList.section,
          name: name.trim(),
          id: { not: listId },
          deletedAt: null
        }
      });

      if (duplicateList) {
        return createErrorResponse('A list with this name already exists', 'DUPLICATE_NAME', 409);
      }
    }

    // Update the list
    const updatedList = await prisma.lists.update({
      where: { id: listId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isDefault !== undefined && { isDefault }),
        ...(filters !== undefined && { filters }),
        ...(sortField !== undefined && { sortField: sortField || null }),
        ...(sortDirection !== undefined && { sortDirection: sortDirection || null }),
        ...(searchQuery !== undefined && { searchQuery: searchQuery?.trim() || null }),
        ...(visibleFields !== undefined && { visibleFields: visibleFields && Array.isArray(visibleFields) ? visibleFields : null })
      }
    });

    return createSuccessResponse(updatedList, { message: 'List updated successfully' });
  } catch (error) {
    console.error('Error updating list:', error);
    return createErrorResponse(
      'Failed to update list',
      'UPDATE_ERROR',
      500
    );
  }
}

// DELETE /api/v1/lists/[id] - Delete list (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const listId = resolvedParams.id;

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
    const section = searchParams.get('section');
    const workspaceId = queryWorkspaceId || context.workspaceId;
    const userId = context.userId;

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    // Verify list exists and belongs to user
    const existingList = await prisma.lists.findFirst({
      where: {
        id: listId,
        workspaceId,
        userId,
        ...(section && { section }),
        deletedAt: null
      }
    });

    if (!existingList) {
      return createErrorResponse('List not found', 'NOT_FOUND', 404);
    }

    // Prevent deletion of default lists
    if (existingList.isDefault) {
      return createErrorResponse('Cannot delete default lists', 'CANNOT_DELETE_DEFAULT', 400);
    }

    // Soft delete
    await prisma.lists.update({
      where: { id: listId },
      data: {
        deletedAt: new Date()
      }
    });

    return createSuccessResponse({ id: listId }, { message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    return createErrorResponse(
      'Failed to delete list',
      'DELETE_ERROR',
      500
    );
  }
}

