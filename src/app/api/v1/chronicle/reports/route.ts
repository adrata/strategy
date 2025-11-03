import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { sampleChronicleReports } from '@/lib/chronicle-sample-data';

// Force dynamic rendering for API routes (required for authentication)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Use unified auth system instead of NextAuth
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || context.workspaceId;
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [Chronicle API] Request from user:', context.userId);
      console.log('🔍 [Chronicle API] Workspace ID:', workspaceId);
    }
    
    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_ID_REQUIRED', 400);
    }

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
            userId: context.userId
          }
        }
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [Chronicle API] Found reports in database:', reports.length);
      console.log('🔍 [Chronicle API] Reports:', reports.map(r => ({ id: r.id, title: r.title, type: r.reportType })));
    }

    // If no reports in database, fall back to sample data
    if (reports.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No reports in database, using sample data');
      }
      const sampleReports = sampleChronicleReports.map(report => ({
        ...report,
        shares: [] // Mock shares for now
      }));

      return createSuccessResponse({
        reports: sampleReports.slice(0, limit),
        total: sampleReports.length
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

    return createSuccessResponse({
      reports: mappedReports,
      total: reports.length,
      unreadCount
    });

  } catch (error) {
    console.error('❌ [Chronicle API] Error fetching reports:', error);
    return createErrorResponse(
      'Failed to fetch chronicle reports',
      'CHRONICLE_FETCH_ERROR',
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use unified auth system instead of NextAuth
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const { title, reportDate, reportType, content } = body;
    const workspaceId = context.workspaceId;

    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_ID_REQUIRED', 400);
    }

    // Create new chronicle report
    const report = await prisma.chronicleReport.create({
      data: {
        workspaceId,
        title,
        weekStart: new Date(reportDate),
        weekEnd: new Date(reportDate),
        reportType: reportType === 'WEEKLY' ? 'FRIDAY_RECAP' : 'DAILY',
        content,
        userId: context.userId,
      },
    });

    return createSuccessResponse(report);

  } catch (error) {
    console.error('❌ [Chronicle API] Error creating report:', error);
    return createErrorResponse(
      'Failed to create chronicle report',
      'CHRONICLE_CREATE_ERROR',
      500
    );
  }
}
