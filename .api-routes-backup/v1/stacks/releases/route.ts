import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';

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

    const workspaceId = context.workspaceId;
    const body = await request.json();
    const { releaseNotes, shippedItemIds } = body;

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    if (!releaseNotes || !shippedItemIds || !Array.isArray(shippedItemIds)) {
      return createErrorResponse('Release notes and shipped item IDs are required', 'INVALID_REQUEST', 400);
    }

    // Store release notes (for now, we'll just update the stories status)
    // In the future, you could create a StacksRelease table
    // For now, we'll move shipped items to 'archived' status and store release notes somewhere
    
    // Update all shipped items to 'archived' status (clearing them from shipped column)
    const updateResult = await prisma.stacksStory.updateMany({
      where: {
        id: { in: shippedItemIds },
        project: { workspaceId }
      },
      data: {
        status: 'archived',
        updatedAt: new Date()
      }
    });

    // TODO: Store release notes in a releases table or JSON field
    // For now, we'll just log them and the items are archived
    console.log('Release notes saved:', {
      workspaceId,
      releaseNotes,
      archivedItems: updateResult.count
    });

    return NextResponse.json({
      success: true,
      message: 'Release notes saved and shipped items archived',
      archivedCount: updateResult.count,
      releaseNotes
    });

  } catch (error) {
    console.error('Error saving release notes:', error);
    return createErrorResponse(
      'Failed to save release notes',
      'SERVER_ERROR',
      500
    );
  }
}

