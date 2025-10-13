import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/atrium/download/[id]
 * Download a document file
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

    // Get document
    const document = await prisma.atriumDocument.findUnique({
      where: {
        id: (await params).id,
        status: { not: 'deleted' },
      },
      include: {
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

    // Check if user has access
    const hasAccess = await checkDocumentAccess(document, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if document has a file URL
    if (!document.fileUrl) {
      return NextResponse.json({ error: 'No file available for download' }, { status: 404 });
    }

    // Check if file exists on disk
    const filePath = join(process.cwd(), 'public', document.fileUrl);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      // Update download count
      await prisma.atriumDocument.update({
        where: { id: (await params).id },
        data: {
          downloadCount: { increment: 1 },
        },
      });

      // Log download activity
      await prisma.atriumActivity.create({
        data: {
          documentId: (await params).id,
          userId: session.user.id,
          activityType: 'downloaded',
          description: `Downloaded document "${document.title}"`,
          metadata: {
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            fileSize: document.fileSize,
          },
        },
      });

      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': document.fileType,
          'Content-Disposition': `attachment; filename="${document.title}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
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
