import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { randomBytes } from 'crypto';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, allowedEmails = [], expiresAt } = body;

    if (!reportId) {
      return NextResponse.json({ success: false, error: 'Report ID required' }, { status: 400 });
    }

    // Generate unique share token
    const shareToken = randomBytes(32).toString('hex');
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chronicle/shared/${shareToken}`;

    // Set default expiration (30 days from now)
    const defaultExpiresAt = new Date();
    defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 30);

    // Create share record
    const share = await prisma.chronicle_shares.create({
      data: {
        reportId,
        shareToken,
        shareUrl,
        allowedEmails,
        expiresAt: expiresAt ? new Date(expiresAt) : defaultExpiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      data: share
    });

  } catch (error) {
    console.error('Error creating chronicle share:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
