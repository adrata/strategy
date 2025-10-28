import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sampleChronicleReports } from '@/lib/chronicle-sample-data';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || session.user.activeWorkspaceId;
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!workspaceId) {
      return NextResponse.json({ success: false, error: 'Workspace ID required' }, { status: 400 });
    }

    // Check if this is Notary Everyday workspace
    const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || workspaceId === 'cmezxb1ez0001pc94yry3ntjk';
    
    if (!isNotaryEveryday) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Query actual reports from database
    const reports = await prisma.chronicleReport.findMany({
      where: {
        workspaceId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        ChronicleShare: true
      }
    });

    // If no reports in database, fall back to sample data
    if (reports.length === 0) {
      console.log('No reports in database, using sample data');
      const sampleReports = sampleChronicleReports.map(report => ({
        ...report,
        shares: [] // Mock shares for now
      }));

      return NextResponse.json({
        success: true,
        data: {
          reports: sampleReports.slice(0, limit),
          total: sampleReports.length
        }
      });
    }

    // Map database fields to frontend format
    const mappedReports = reports.map(report => ({
      id: report.id,
      title: report.title,
      reportDate: report.weekStart.toISOString(), // Use weekStart as reportDate
      reportType: report.reportType === 'FRIDAY_RECAP' ? 'WEEKLY' : 'DAILY', // Map enum to frontend format
      content: report.content,
      createdAt: report.createdAt.toISOString(),
      isRead: false, // Temporary: all reports are unread
      lastReadAt: null,
      shares: report.ChronicleShare.map(share => ({
        id: share.id,
        shareToken: share.shareToken,
        shareUrl: share.shareUrl,
        viewCount: share.viewCount,
        createdAt: share.createdAt.toISOString()
      }))
    }));

    const unreadCount = mappedReports.filter(r => !r.isRead).length;

    return NextResponse.json({
      success: true,
      data: {
        reports: mappedReports,
        total: reports.length,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching chronicle reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chronicle reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, reportDate, reportType, content } = body;
    const workspaceId = session.user.activeWorkspaceId;

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: 'Workspace ID required' }, { status: 400 });
    }

    // Create new chronicle report
    const report = await prisma.chronicle_reports.create({
      data: {
        workspaceId,
        title,
        reportDate: new Date(reportDate),
        reportType,
        content,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error creating chronicle report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create chronicle report' },
      { status: 500 }
    );
  }
}
