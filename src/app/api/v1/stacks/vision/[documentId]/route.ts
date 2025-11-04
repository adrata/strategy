import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
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

    const documentId = params?.documentId;

    if (!documentId) {
      return createErrorResponse('Document ID is required', 'MISSING_DOCUMENT_ID', 400);
    }

    // Fetch the document
    const document = await prisma.workshopDocument.findFirst({
      where: {
        id: documentId,
        workspaceId: context.workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        documentType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        viewCount: true,
        owner: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!document) {
      return createErrorResponse('Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    // Increment view count
    await prisma.workshopDocument.update({
      where: { id: documentId },
      data: {
        viewCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    });

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        description: document.description || '',
        content: document.content,
        documentType: document.documentType,
        status: document.status,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
        viewCount: (document.viewCount || 0) + 1,
        owner: document.owner ? {
          firstName: document.owner.firstName || '',
          lastName: document.owner.lastName || ''
        } : undefined
      }
    });

  } catch (error) {
    console.error('❌ [VISION API] Error fetching document:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return createErrorResponse(
      'Failed to fetch vision document',
      'VISION_FETCH_ERROR',
      500
    );
  }
}

