import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  let workspaceId: string | null = null;
  
  try {
    console.log('🔍 [VISION API] GET document request received');
    
    // Use platform's unified authentication system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      console.error('❌ [VISION API] Auth failed:', response.status);
      return response; // Return error response if authentication failed
    }

    if (!context) {
      console.error('❌ [VISION API] No context after authentication');
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Get workspace ID from query or context
    const { searchParams } = new URL(request.url);
    const queryWorkspaceId = searchParams.get('workspaceId');
    workspaceId = queryWorkspaceId || context.workspaceId;
    
    console.log('✅ [VISION API] Authenticated user:', context.userId);
    console.log('🔍 [VISION API] Workspace ID:', workspaceId);

    // Resolve params (Next.js 15+ uses Promise)
    const resolvedParams = await params;
    const documentId = resolvedParams?.documentId;

    if (!documentId) {
      return createErrorResponse('Document ID is required', 'MISSING_DOCUMENT_ID', 400);
    }

    if (!workspaceId) {
      console.error('❌ [VISION API] No workspace ID available');
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    console.log('🔍 [VISION API] Fetching document:', documentId, 'for workspace:', workspaceId);

    // Fetch the document
    const document = await prisma.workshopDocument.findFirst({
      where: {
        id: documentId,
        workspaceId: workspaceId,
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

