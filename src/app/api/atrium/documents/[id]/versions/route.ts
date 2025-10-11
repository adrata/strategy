import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/atrium/documents/[id]/versions
 * Get version history for a document
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get document to check permissions
    const document = await prisma.atriumDocument.findUnique({
      where: { id: params.id },
      include: {
        shares: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has access
    const hasAccess = await checkDocumentAccess(document, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get versions with pagination
    const [versions, total] = await Promise.all([
      prisma.atriumVersion.findMany({
        where: { documentId: params.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          parentVersion: {
            select: {
              id: true,
              version: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.atriumVersion.count({
        where: { documentId: params.id },
      }),
    ]);

    return NextResponse.json({
      versions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/atrium/documents/[id]/versions
 * Create a new version of a document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, fileUrl, fileSize, changelog, isAutoSave = false } = body;

    // Get document to check permissions
    const document = await prisma.atriumDocument.findUnique({
      where: { id: params.id },
      include: {
        shares: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has edit access
    const hasEditAccess = await checkDocumentEditAccess(document, session.user.id);
    if (!hasEditAccess) {
      return NextResponse.json({ error: 'Edit access denied' }, { status: 403 });
    }

    // Create new version
    const version = await prisma.atriumVersion.create({
      data: {
        documentId: params.id,
        version: document.version,
        content: document.content,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        createdById: session.user.id,
        changelog: changelog || (isAutoSave ? 'Auto-saved version' : 'Manual version save'),
        isAutoSave,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log version creation
    await prisma.atriumActivity.create({
      data: {
        documentId: params.id,
        userId: session.user.id,
        activityType: 'version_created',
        description: `Created version ${version.version} of document "${document.title}"`,
        metadata: {
          version: version.version,
          isAutoSave,
          changelog,
        },
      },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/atrium/documents/[id]/versions/restore
 * Restore a document to a specific version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID is required' }, { status: 400 });
    }

    // Get document to check permissions
    const document = await prisma.atriumDocument.findUnique({
      where: { id: params.id },
      include: {
        shares: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has edit access
    const hasEditAccess = await checkDocumentEditAccess(document, session.user.id);
    if (!hasEditAccess) {
      return NextResponse.json({ error: 'Edit access denied' }, { status: 403 });
    }

    // Get version to restore
    const version = await prisma.atriumVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.documentId !== params.id) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Create a backup of current version before restoring
    await prisma.atriumVersion.create({
      data: {
        documentId: params.id,
        version: document.version,
        content: document.content,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        createdById: session.user.id,
        changelog: `Backup before restoring to version ${version.version}`,
        isAutoSave: false,
      },
    });

    // Restore document to the selected version
    const restoredDocument = await prisma.atriumDocument.update({
      where: { id: params.id },
      data: {
        content: version.content,
        fileUrl: version.fileUrl,
        fileSize: version.fileSize,
        version: (parseFloat(version.version) + 1).toFixed(1),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log restoration
    await prisma.atriumActivity.create({
      data: {
        documentId: params.id,
        userId: session.user.id,
        activityType: 'version_restored',
        description: `Restored document "${document.title}" to version ${version.version}`,
        metadata: {
          restoredVersion: version.version,
          newVersion: restoredDocument.version,
        },
      },
    });

    return NextResponse.json(restoredDocument);
  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json(
      { error: 'Failed to restore version' },
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
