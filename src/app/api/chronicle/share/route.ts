import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { randomBytes } from 'crypto';
import { getBaseUrl } from '@/lib/env-urls';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * POST /api/chronicle/share
 * Create a share link for a Chronicle report
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      reportId,
      expiresAt,
      allowedEmails = [],
      password
    } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    }

    // Get the report to check permissions
    const report = await prisma.chronicleReport.findUnique({
      where: { id: reportId },
      include: {
        shares: true
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if user has access to this report
    if (report.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate secure share token
    const shareToken = randomBytes(32).toString('hex');
    const shareUrl = `${getBaseUrl()}/chronicle/shared/${shareToken}`;

    // Create share
    const share = await prisma.chronicleShare.create({
      data: {
        reportId,
        shareToken,
        shareUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        allowedEmails,
        viewCount: 0
      }
    });

    return NextResponse.json(share);

  } catch (error) {
    console.error('Error creating Chronicle share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}

