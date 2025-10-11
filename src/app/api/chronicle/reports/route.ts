import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/chronicle/reports
 * Fetch Chronicle reports for the current user's workspace
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Fetch reports for the workspace, ordered by most recent first
    const reports = await prisma.chronicleReport.findMany({
      where: {
        workspaceId,
        userId: session.user.id
      },
      include: {
        shares: {
          select: {
            id: true,
            shareToken: true,
            shareUrl: true,
            viewCount: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.chronicleReport.count({
      where: {
        workspaceId,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      reports,
      totalCount,
      hasMore: offset + reports.length < totalCount
    });

  } catch (error) {
    console.error('Error fetching Chronicle reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chronicle/reports
 * Create a new Chronicle report
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      reportType,
      content,
      weekStart,
      weekEnd,
      workspaceId
    } = body;

    if (!title || !reportType || !content || !weekStart || !weekEnd || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the report
    const report = await prisma.chronicleReport.create({
      data: {
        title,
        reportType,
        content,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        workspaceId,
        userId: session.user.id
      },
      include: {
        shares: true
      }
    });

    return NextResponse.json(report);

  } catch (error) {
    console.error('Error creating Chronicle report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
