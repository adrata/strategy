import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This would typically be called by a cron job or scheduled task
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

export async function POST(request: NextRequest) {
  try {
    const { reportType, workspaceId } = await request.json();
    
    if (!reportType || !workspaceId) {
      return NextResponse.json({ error: 'Report type and workspace ID are required' }, { status: 400 });
    }

    // Check if this is Notary Everyday workspace
    const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || 
                            workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || 
                            workspaceId === 'cmezxb1ez0001pc94yry3ntjk';

    if (!isNotaryEveryday) {
      return NextResponse.json({ error: 'Scheduled reports only available for Notary Everyday workspace' }, { status: 400 });
    }

    // Get all users in the workspace
    const users = await prisma.users.findMany({
      where: {
        activeWorkspaceId: workspaceId
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found in workspace' }, { status: 404 });
    }

    // Generate reports for each user
    const results = [];
    for (const user of users) {
      try {
        const report = await generateScheduledReport(reportType, workspaceId, user.id);
        results.push({
          userId: user.id,
          userEmail: user.email,
          reportId: report.id,
          success: true
        });
      } catch (error) {
        console.error(`Failed to generate report for user ${user.id}:`, error);
        results.push({
          userId: user.id,
          userEmail: user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${reportType} reports for ${results.filter(r => r.success).length} users`,
      results
    });

  } catch (error) {
    console.error('Error in Chronicle scheduler:', error);
    return NextResponse.json({ error: 'Failed to generate scheduled reports' }, { status: 500 });
  }
}

async function generateScheduledReport(reportType: 'DAILY' | 'WEEKLY' | 'BIWEEKLY', workspaceId: string, userId: string) {
  // Call the enhanced report generation API
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/v1/chronicle/generate-enhanced`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reportType,
      workspaceId,
      userId
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate report: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

// GET endpoint to check scheduler status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Get recent reports for the workspace
    const recentReports = await prisma.chronicleReport.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        id: true,
        title: true,
        reportType: true,
        createdAt: true,
        userId: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      recentReports,
      totalReports: recentReports.length
    });

  } catch (error) {
    console.error('Error checking scheduler status:', error);
    return NextResponse.json({ error: 'Failed to check scheduler status' }, { status: 500 });
  }
}

