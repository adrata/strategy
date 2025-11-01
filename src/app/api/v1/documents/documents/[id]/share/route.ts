import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { randomBytes } from 'crypto';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * POST /api/workshop/documents/[id]/share
 * Create a share link for a document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      shareType = 'internal',
      permission = 'view',
      expiresAt,
      maxViews,
      password,
      allowedEmails = [],
      allowedDomains = [],
      allowDownload = true,
      allowComments = false,
      watermark = false,
    } = body;

    // Get existing document to check permissions
    const document = await prisma.workshopDocument.findUnique({
      where: { id: (await params).id },
      include: {
        shares: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has admin access (only owner or admin can create shares)
    const hasAdminAccess = await checkDocumentAdminAccess(document, session.user.id);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Share access denied' }, { status: 403 });
    }

    // Generate secure share token
    const shareToken = randomBytes(32).toString('hex');
    const shareUrl = `${process.env.NEXTAUTH_URL}/workshop/shared/${shareToken}`;

    // Create share
    const share = await prisma.workshopShare.create({
      data: {
        documentId: (await params).id,
        shareType,
        permission,
        shareToken,
        shareUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxViews,
        password: password ? await hashPassword(password) : null,
        allowedEmails,
        allowedDomains,
        allowDownload,
        allowComments,
        watermark,
      },
    });

    // Log share creation
    await prisma.workshopActivity.create({
      data: {
        documentId: (await params).id,
        userId: session.user.id,
        activityType: 'shared',
        description: `Created ${shareType} share link for document "${document.title}"`,
        metadata: {
          shareType,
          permission,
          hasPassword: !!password,
          expiresAt,
          maxViews,
        },
      },
    });

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workshop/documents/[id]/share
 * Get all shares for a document
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

    // Get existing document to check permissions
    const document = await prisma.workshopDocument.findUnique({
      where: { id: (await params).id },
      include: {
        shares: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has access to view shares
    const hasAccess = await checkDocumentAccess(document, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all active shares
    const shares = await prisma.workshopShare.findMany({
      where: {
        documentId: (await params).id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(shares);
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shares' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workshop/documents/[id]/share
 * Revoke a share link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    // Get share to check permissions
    const share = await prisma.workshopShare.findUnique({
      where: { id: shareId },
      include: {
        document: true,
      },
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    if (share.documentId !== (await params).id) {
      return NextResponse.json({ error: 'Share does not belong to this document' }, { status: 400 });
    }

    // Check if user has admin access
    const hasAdminAccess = await checkDocumentAdminAccess(share.document, session.user.id);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Revoke access denied' }, { status: 403 });
    }

    // Delete share
    await prisma.workshopShare.delete({
      where: { id: shareId },
    });

    // Log share revocation
    await prisma.workshopActivity.create({
      data: {
        documentId: (await params).id,
        userId: session.user.id,
        activityType: 'share_revoked',
        description: `Revoked share link for document "${share.document.title}"`,
        metadata: {
          shareType: share.shareType,
          permission: share.permission,
        },
      },
    });

    return NextResponse.json({ message: 'Share revoked successfully' });
  } catch (error) {
    console.error('Error revoking share:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share' },
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

  return !!workspaceUser;
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

/**
 * Hash password for share protection
 */
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 12);
}
