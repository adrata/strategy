import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sampleChronicleReports } from '@/lib/chronicle-sample-data';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || session.user.activeWorkspaceId;
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('🔍 [Chronicle API] Request from user:', session.user.id);
    console.log('🔍 [Chronicle API] Workspace ID:', workspaceId);
    
    if (!workspaceId) {
      return NextResponse.json({ success: false, error: 'Workspace ID required' }, { status: 400 });
    }

    // Check if this is Notary Everyday workspace
    const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || workspaceId === 'cmezxb1ez0001pc94yry3ntjk';
    console.log('🔍 [Chronicle API] Is Notary Everyday:', isNotaryEveryday);
    
    // Temporarily allow all workspaces for debugging
    console.log('🔍 [Chronicle API] Allowing all workspaces for debugging');

    // Query actual reports from database with read status
    const reports = await prisma.chronicleReport.findMany({
      where: {
        workspaceId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        ChronicleShare: true,
        ChronicleReadStatus: {
          where: {
            userId: session.user.id
          }
        }
      }
    });

    console.log('🔍 [Chronicle API] Found reports in database:', reports.length);
    console.log('🔍 [Chronicle API] Reports:', reports.map(r => ({ id: r.id, title: r.title, type: r.reportType })));

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
    const mappedReports = reports.map(report => {
      const readStatus = report.ChronicleReadStatus[0]; // Get the first (and only) read status for this user
      return {
        id: report.id,
        title: report.title,
        reportDate: report.weekStart.toISOString(), // Use weekStart as reportDate
        reportType: report.reportType === 'FRIDAY_RECAP' ? 'WEEKLY' : 'DAILY', // Map enum to frontend format
        content: report.content,
        createdAt: report.createdAt.toISOString(),
        isRead: !!readStatus, // True if read status exists
        lastReadAt: readStatus?.readAt?.toISOString() || null,
        shares: report.ChronicleShare.map(share => ({
          id: share.id,
          shareToken: share.shareToken,
          shareUrl: share.shareUrl,
          viewCount: share.viewCount,
          createdAt: share.createdAt.toISOString()
        }))
      };
    });

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
