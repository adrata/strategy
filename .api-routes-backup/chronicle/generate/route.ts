import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

/**
 * POST /api/chronicle/generate
 * Generate a new Chronicle report (Monday prep or Friday recap)
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
    const { reportType } = body;

    if (!reportType) {
      return createErrorResponse(
        'Report type required',
        'MISSING_REPORT_TYPE',
        400
      );
    }

    if (!['MONDAY_PREP', 'FRIDAY_RECAP'].includes(reportType)) {
      return createErrorResponse(
        'Invalid report type',
        'INVALID_REPORT_TYPE',
        400
      );
    }

    // Calculate week dates
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(now.getDate() + daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Generate report content based on type
    const reportContent = await generateReportContent(
      reportType,
      context.workspaceId,
      context.userId,
      startOfWeek,
      endOfWeek
    );

    // Create report title
    const weekLabel = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const title = `Week of ${weekLabel} - ${reportType === 'MONDAY_PREP' ? 'Monday Prep' : 'Friday Recap'}`;

    // Check if report already exists for this week and type
    const existingReport = await prisma.chronicleReport.findFirst({
      where: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        reportType,
        weekStart: startOfWeek,
        weekEnd: endOfWeek
      }
    });

    if (existingReport) {
      // Update existing report
      const updatedReport = await prisma.chronicleReport.update({
        where: { id: existingReport.id },
        data: {
          title,
          content: reportContent,
          updatedAt: new Date()
        },
        include: {
          shares: true
        }
      });

      return createSuccessResponse(updatedReport);
    } else {
      // Create new report
      const newReport = await prisma.chronicleReport.create({
        data: {
          title,
          reportType,
          content: reportContent,
          weekStart: startOfWeek,
          weekEnd: endOfWeek,
          workspaceId: context.workspaceId,
          userId: context.userId
        },
        include: {
          shares: true
        }
      });

      return createSuccessResponse(newReport);
    }

  } catch (error) {
    console.error('Error generating Chronicle report:', error);
    return createErrorResponse(
      'Failed to generate report',
      'CHRONICLE_GENERATE_ERROR',
      500
    );
  }
}

/**
 * Generate report content based on type and data
 */
async function generateReportContent(
  reportType: string,
  workspaceId: string,
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<any> {
  // Fetch relevant data for the report
  const [opportunities, activities] = await Promise.all([
    // Get opportunities data
    prisma.opportunities.findMany({
      where: {
        workspaceId,
        userId
      },
      select: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        closeDate: true,
        updatedAt: true
      }
    }),
    // Get activities data (if available)
    prisma.actions.findMany({
      where: {
        workspaceId,
        userId,
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      select: {
        type: true,
        subject: true,
        createdAt: true
      }
    })
  ]);

  // Calculate metrics
  const openOpportunities = opportunities.filter(opp => 
    !opp.stage?.toLowerCase().includes('closed') && 
    !opp.stage?.toLowerCase().includes('won') && 
    !opp.stage?.toLowerCase().includes('lost')
  );

  const totalPipelineValue = openOpportunities.reduce((sum, opp) => 
    sum + (parseFloat(opp.amount?.toString() || '0') || 0), 0
  );

  const callsThisWeek = activities.filter(act => act.type === 'call').length;
  const emailsThisWeek = activities.filter(act => act.type === 'email').length;
  const meetingsThisWeek = activities.filter(act => act.type === 'meeting').length;

  if (reportType === 'MONDAY_PREP') {
    return {
      type: 'monday_prep',
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      generatedAt: new Date().toISOString(),
      content: {
        overview: {
          totalPipelineValue: `$${(totalPipelineValue / 1000000).toFixed(1)}M`,
          openOpportunities: openOpportunities.length,
          keyFocus: "Drive revenue through active pipeline management"
        },
        thisWeekGoals: [
          "Advance 3+ opportunities to next stage",
          "Schedule 5+ discovery calls",
          "Close 1+ deal this week"
        ],
        keyOpportunities: openOpportunities.slice(0, 5).map(opp => ({
          name: opp.name,
          stage: opp.stage,
          amount: opp.amount,
          closeDate: opp.closeDate
        })),
        actionItems: [
          "Review pipeline and update opportunity stages",
          "Schedule follow-up calls with hot prospects",
          "Prepare proposals for qualified opportunities"
        ],
        metrics: {
          callsTarget: 20,
          emailsTarget: 50,
          meetingsTarget: 5
        }
      }
    };
  } else {
    // FRIDAY_RECAP
    return {
      type: 'friday_recap',
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      generatedAt: new Date().toISOString(),
      content: {
        overview: {
          totalPipelineValue: `$${(totalPipelineValue / 1000000).toFixed(1)}M`,
          openOpportunities: openOpportunities.length,
          weekSummary: "Week completed with focus on pipeline advancement"
        },
        achievements: [
          `Made ${callsThisWeek} calls this week`,
          `Sent ${emailsThisWeek} emails`,
          `Scheduled ${meetingsThisWeek} meetings`
        ],
        wins: openOpportunities.filter(opp => 
          opp.updatedAt && new Date(opp.updatedAt) >= weekStart
        ).map(opp => ({
          name: opp.name,
          stage: opp.stage,
          amount: opp.amount
        })),
        nextWeekPriorities: [
          "Follow up on this week's meetings",
          "Advance opportunities to proposal stage",
          "Generate new qualified leads"
        ],
        metrics: {
          callsCompleted: callsThisWeek,
          emailsCompleted: emailsThisWeek,
          meetingsCompleted: meetingsThisWeek
        }
      }
    };
  }
}
