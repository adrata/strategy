import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Required for static export (desktop build)
 * export const dynamic = 'force-dynamic';
 * 
 * GET /api/v1/documents/documents/[id]/content
 * Get document content (used by Workbench)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const document = await prisma.workshopDocument.findUnique({
      where: {
        id: (await params).id,
        status: { not: 'deleted' },
      },
      select: {
        id: true,
        title: true,
        content: true,
        fileUrl: true,
        fileType: true,
        documentType: true,
        isEncrypted: true,
        ownerId: true,
        workspaceId: true,
        shares: {
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = await checkDocumentAccess(document, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Log content access
    await prisma.workshopActivity.create({
      data: {
        documentId: (await params).id,
        userId: session.user.id,
        activityType: 'content_accessed',
        description: `Accessed content of document "${document.title}"`,
        metadata: {
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      },
    });

    return NextResponse.json({
      content: document.content,
      fileUrl: document.fileUrl,
      fileType: document.fileType,
      documentType: document.documentType,
      isEncrypted: document.isEncrypted,
    });
  } catch (error) {
    console.error('Error fetching document content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document content' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/documents/documents/[id]/content
 * Update document content (used by Workbench)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, fileUrl, fileSize, createVersion = false } = body;

    // Get existing document to check permissions
    const existingDocument = await prisma.workshopDocument.findUnique({
      where: { id: (await params).id },
      include: {
        shares: true,
      },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has edit access
    const hasEditAccess = await checkDocumentEditAccess(existingDocument, session.user.id);
    if (!hasEditAccess) {
      return NextResponse.json({ error: 'Edit access denied' }, { status: 403 });
    }

    // Create version if requested
    if (createVersion) {
      await prisma.workshopVersion.create({
        data: {
          documentId: (await params).id,
          version: existingDocument.version,
          content: existingDocument.content,
          fileUrl: existingDocument.fileUrl,
          fileSize: existingDocument.fileSize,
          createdById: session.user.id,
          changelog: 'Auto-saved version',
          isAutoSave: true,
        },
      });
    }

    // Update document content
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (fileSize !== undefined) updateData.fileSize = fileSize;

    // Increment version number
    const currentVersion = parseFloat(existingDocument.version);
    updateData.version = (currentVersion + 0.1).toFixed(1);

    const document = await prisma.workshopDocument.update({
      where: { id: (await params).id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        fileUrl: true,
        fileType: true,
        documentType: true,
        version: true,
        updatedAt: true,
      },
    });

    // Log content update
    await prisma.workshopActivity.create({
      data: {
        documentId: (await params).id,
        userId: session.user.id,
        activityType: 'content_updated',
        description: `Updated content of document "${document.title}"`,
        metadata: {
          version: document.version,
          hasFileUrl: !!fileUrl,
          hasContent: !!content,
        },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document content:', error);
    return NextResponse.json(
      { error: 'Failed to update document content' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has access to view a document
 */
async function checkDocumentAccess(document: any, userId: string): Promise<boolean> {
  // Owner always has access
  if (document.ownerId === userId) {
    return true;
  }

  // Check if user is in the same workspace
  const workspaceUser = await prisma.workspace_users.findFirst({
    where: {
      workspaceId: document.workspaceId,
      userId,
      isActive: true,
    },
  });

  if (!workspaceUser) {
    return false;
  }

  // Check if document has any active shares
  const activeShares = document.shares.filter((share: any) => {
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return false;
    }
    return true;
  });

  // If no shares, only workspace members can access
  if (activeShares.length === 0) {
    return true;
  }

  // Check if user has access through shares
  for (const share of activeShares) {
    if (share.shareType === 'public') {
      return true;
    }
    if (share.shareType === 'internal') {
      return true; // Internal shares are accessible to workspace members
    }
  }

  return false;
}

/**
 * Check if user has edit access to a document
 */
async function checkDocumentEditAccess(document: any, userId: string): Promise<boolean> {
  // Owner always has edit access
  if (document.ownerId === userId) {
    return true;
  }

  // Check if user has edit permission through shares
  const activeShares = document.shares.filter((share: any) => {
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return false;
    }
    return share.permission === 'edit' || share.permission === 'admin';
  });

  if (activeShares.length > 0) {
    return true;
  }

  return false;
}
