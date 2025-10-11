import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/atrium/documents/[id]
 * Get a specific document by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const document = await prisma.atriumDocument.findUnique({
      where: {
        id: params.id,
        status: { not: 'deleted' },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        shares: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            shares: true,
            versions: true,
            comments: true,
            activities: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has access to this document
    const hasAccess = await checkDocumentAccess(document, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update view count and last accessed
    await prisma.atriumDocument.update({
      where: { id: params.id },
      data: {
        viewCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // Log view activity
    await prisma.atriumActivity.create({
      data: {
        documentId: params.id,
        userId: session.user.id,
        activityType: 'viewed',
        description: `Viewed document "${document.title}"`,
        metadata: {
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/atrium/documents/[id]
 * Update a document
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      content,
      folderId,
      tags,
      isStarred,
      status,
      classification,
    } = body;

    // Get existing document to check permissions
    const existingDocument = await prisma.atriumDocument.findUnique({
      where: { id: params.id },
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

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (folderId !== undefined) updateData.folderId = folderId;
    if (tags !== undefined) updateData.tags = tags;
    if (isStarred !== undefined) updateData.isStarred = isStarred;
    if (status !== undefined) updateData.status = status;
    if (classification !== undefined) updateData.classification = classification;

    // Update document
    const document = await prisma.atriumDocument.update({
      where: { id: params.id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log update activity
    await prisma.atriumActivity.create({
      data: {
        documentId: params.id,
        userId: session.user.id,
        activityType: 'updated',
        description: `Updated document "${document.title}"`,
        metadata: {
          changes: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/atrium/documents/[id]
 * Soft delete a document (move to trash)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing document to check permissions
    const existingDocument = await prisma.atriumDocument.findUnique({
      where: { id: params.id },
      include: {
        shares: true,
      },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has admin access (only owner or admin can delete)
    const hasAdminAccess = await checkDocumentAdminAccess(existingDocument, session.user.id);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Delete access denied' }, { status: 403 });
    }

    // Soft delete (update status to deleted)
    const document = await prisma.atriumDocument.update({
      where: { id: params.id },
      data: {
        status: 'deleted',
        archivedAt: new Date(),
      },
    });

    // Log delete activity
    await prisma.atriumActivity.create({
      data: {
        documentId: params.id,
        userId: session.user.id,
        activityType: 'deleted',
        description: `Deleted document "${document.title}"`,
      },
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
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

/**
 * Check if user has admin access to a document
 */
async function checkDocumentAdminAccess(document: any, userId: string): Promise<boolean> {
  // Owner always has admin access
  if (document.ownerId === userId) {
    return true;
  }

  // Check if user has admin permission through shares
  const adminShares = document.shares.filter((share: any) => {
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return false;
    }
    return share.permission === 'admin';
  });

  return adminShares.length > 0;
}
