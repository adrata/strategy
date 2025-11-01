import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token required' }, { status: 400 });
    }

    // Find the share record
    const share = await prisma.chronicle_shares.findUnique({
      where: { shareToken: token },
      include: {
        report: true
      }
    });

    if (!share) {
      return NextResponse.json({ success: false, error: 'Share not found' }, { status: 404 });
    }

    // Check if share has expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Share has expired' }, { status: 410 });
    }

    // Increment view count
    await prisma.chronicle_shares.update({
      where: { id: share.id },
      data: { viewCount: share.viewCount + 1 }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...share.report,
        shares: [share]
      }
    });

  } catch (error) {
    console.error('Error fetching shared chronicle report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shared report' },
      { status: 500 }
    );
  }
}
