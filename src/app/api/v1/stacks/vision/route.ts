import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/platform/database/prisma-client';

export async function GET(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      console.error('❌ [VISION API] Auth failed:', response.status);
      return response;
    }

    if (!context) {
      console.error('❌ [VISION API] No context');
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || context.workspaceId;

    console.log('🔍 [VISION API] Fetching documents for workspace:', workspaceId);

    // Fetch vision documents from workshopDocument table
    // Filter for documents that are papers or pitches
    const documents = await prisma.workshopDocument.findMany({
      where: {
        workspaceId,
        documentType: {
          in: ['paper', 'pitch']
        },
        deletedAt: null // Only show non-deleted documents
      },
      select: {
        id: true,
        title: true,
        description: true,
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log('✅ [VISION API] Found', documents.length, 'documents');

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description || '',
        documentType: doc.documentType,
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        viewCount: doc.viewCount || 0,
        owner: doc.owner ? {
          firstName: doc.owner.firstName || '',
          lastName: doc.owner.lastName || ''
        } : undefined
      }))
    });

  } catch (error) {
    console.error('❌ [VISION API] Error fetching documents:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error('❌ [VISION API] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // Check if the error is about missing table - return empty array instead of error
    if (errorMessage.includes('does not exist') || errorMessage.includes('workshopDocument')) {
      console.warn('⚠️ [VISION API] workshopDocument table does not exist, returning empty array');
      return NextResponse.json({
        documents: []
      });
    }
    
    return createErrorResponse(
      `Failed to fetch vision documents: ${errorMessage}`,
      'VISION_FETCH_ERROR',
      500
    );
  }
}

