import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * GET /api/chronicle/share/[token]
 * Access a shared Chronicle report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Find the share
    const share = await prisma.chronicleShare.findUnique({
      where: { shareToken: token },
      include: {
        report: true
      }
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if share has expired
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: 'Share has expired' }, { status: 410 });
    }

    // Increment view count
    await prisma.chronicleShare.update({
      where: { id: share.id },
      data: { viewCount: share.viewCount + 1 }
    });

    return NextResponse.json({
      report: share.report,
      share: {
        id: share.id,
        shareToken: share.shareToken,
        viewCount: share.viewCount + 1,
        createdAt: share.createdAt
      }
    });

  } catch (error) {
    console.error('Error accessing Chronicle share:', error);
    return NextResponse.json(
      { error: 'Failed to access share' },
      { status: 500 }
    );
  }
}
