import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * GET /api/chronicle/reports
 * Fetch Chronicle reports for the current user's workspace
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user using unified auth system
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch reports for the workspace, ordered by most recent first
    const reports = await prisma.chronicleReport.findMany({
      where: {
        workspaceId: context.workspaceId,
        userId: context.userId
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
        workspaceId: context.workspaceId,
        userId: context.userId
      }
    });

    return createSuccessResponse({
      reports,
      totalCount,
      hasMore: offset + reports.length < totalCount
    });

  } catch (error) {
    console.error('Error fetching Chronicle reports:', error);
    return createErrorResponse(
      'Failed to fetch reports',
      'CHRONICLE_FETCH_ERROR',
      500
    );
  }
}

/**
 * POST /api/chronicle/reports
 * Create a new Chronicle report
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user using unified auth system
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
    const {
      title,
      reportType,
      content,
      weekStart,
      weekEnd
    } = body;

    if (!title || !reportType || !content || !weekStart || !weekEnd) {
      return createErrorResponse(
        'Missing required fields',
        'MISSING_FIELDS',
        400
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
        workspaceId: context.workspaceId,
        userId: context.userId
      },
      include: {
        shares: true
      }
    });

    return createSuccessResponse(report);

  } catch (error) {
    console.error('Error creating Chronicle report:', error);
    return createErrorResponse(
      'Failed to create report',
      'CHRONICLE_CREATE_ERROR',
      500
    );
  }
}
