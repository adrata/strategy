import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/platform/api/response';

interface ChronicleReportData {
  title: string;
  reportType: 'DAILY' | 'WEEKLY' | 'BIWEEKLY';
  content: {
    summary: {
      period: string;
      keyMetrics: {
        newClients: number;
        totalClients: number;
        monthlyOrders: number;
        monthlyRevenue: number;
        leads: number;
        prospects: number;
        opportunities: number;
        conversionRates: {
          leadToProspect: number;
          prospectToOpportunity: number;
          opportunityToClient: number;
        };
      };
    };
    insights: {
      topPerforming: string[];
      areasForImprovement: string[];
      actionableRecommendations: string[];
      marketTrends: string[];
    };
    detailedAnalysis: {
      funnelHealth: {
        leadQuality: 'high' | 'medium' | 'low';
        conversionVelocity: 'fast' | 'moderate' | 'slow';
        clientRetention: 'excellent' | 'good' | 'needs_attention';
      };
      revenueAnalysis: {
        growthRate: number;
        averageDealSize: number;
        revenuePerClient: number;
        projectedMonthlyRevenue: number;
      };
      activityAnalysis: {
        totalActions: number;
        callsMade: number;
        emailsSent: number;
        meetingsScheduled: number;
        followUpsCompleted: number;
      };
    };
    nextSteps: {
      immediate: string[];
      thisWeek: string[];
      thisMonth: string[];
    };
    motivational: {
      achievements: string[];
      goals: string[];
      encouragement: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { reportType, workspaceId, userId, targetDate } = await request.json();
    
    if (!reportType || !workspaceId) {
      return createErrorResponse('Report type and workspace ID are required', 400);
    }

    // Use provided userId or fall back to session user
    const reportUserId = userId || session.user.id;

    // Check if this is Notary Everyday workspace
    const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || 
                            workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || 
                            workspaceId === 'cmezxb1ez0001pc94yry3ntjk';

    if (!isNotaryEveryday) {
      return createErrorResponse('Enhanced reports only available for Notary Everyday workspace', 400);
    }

    // Parse target date if provided
    const reportDate = targetDate ? new Date(targetDate) : new Date();
    
    // Generate report data based on Notary Everyday model
    const reportData = await generateNotaryEverydayReport(reportType, workspaceId, reportUserId, reportDate);
    
    // Calculate week start and end dates
    const weekStart = getStartDate(reportType, reportDate);
    const weekEnd = getEndDate(reportType, reportDate);
    
    // Create report in database
    const report = await prisma.chronicleReport.create({
      data: {
        title: reportData.title,
        reportType: reportData.reportType,
        content: reportData.content,
        weekStart,
        weekEnd,
        workspaceId,
        userId: reportUserId
      }
    });

    // Store in Workshop as well
    await storeInWorkshop(reportData, workspaceId, reportUserId);

    return createSuccessResponse(report);

  } catch (error) {
    console.error('Error generating enhanced Chronicle report:', error);
    return createErrorResponse('Failed to generate report', 500);
  }
}

async function generateNotaryEverydayReport(
  reportType: 'DAILY' | 'WEEKLY' | 'BIWEEKLY',
  workspaceId: string,
  userId: string,
  targetDate: Date = new Date()
): Promise<ChronicleReportData> {
  const now = targetDate;
  const period = getPeriodLabel(reportType, now);
  
  // Get current metrics data
  const metrics = await getNotaryEverydayMetrics(workspaceId);
  
  // Get activity data
  const activityData = await getActivityData(workspaceId, reportType, now);
  
  // Get funnel data
  const funnelData = await getFunnelData(workspaceId);
  
  // Generate insights based on the model
  const insights = generateInsights(metrics, activityData, funnelData, reportType);
  
  // Generate motivational content
  const motivational = generateMotivationalContent(metrics, activityData, reportType);

  return {
    title: `${reportType} Report - ${period}`,
    reportType,
    content: {
      summary: {
        period,
        keyMetrics: {
          newClients: metrics.clients.new,
          totalClients: metrics.clients.total,
          monthlyOrders: metrics.orders.monthlyTotal,
          monthlyRevenue: metrics.orders.monthlyRevenue,
          leads: metrics.funnel.leads,
          prospects: metrics.funnel.prospects,
          opportunities: metrics.funnel.opportunities,
          conversionRates: metrics.conversions
        }
      },
      insights,
      detailedAnalysis: {
        funnelHealth: analyzeFunnelHealth(metrics),
        revenueAnalysis: analyzeRevenue(metrics),
        activityAnalysis: activityData
      },
      nextSteps: generateNextSteps(metrics, activityData, reportType),
      motivational
    }
  };
}

async function getNotaryEverydayMetrics(workspaceId: string) {
  // This would call the same logic as the metrics API
  const peopleCounts = await prisma.people.groupBy({
    by: ['status'],
    where: {
      workspaceId,
      deletedAt: null
    },
    _count: {
      id: true
    }
  });

  const statusCounts = peopleCounts.reduce((acc, item) => {
    acc[item.status] = item._count.id;
    return acc;
  }, {} as Record<string, number>);

  // Get order data
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  const currentMonthEnd = new Date();
  currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1, 0);

  const orderActions = await prisma.actions.findMany({
    where: {
      workspaceId,
      type: 'ORDER',
      status: 'COMPLETED',
      completedAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd
      },
      deletedAt: null
    }
  });

  const monthlyTotalOrders = orderActions.length;
  const monthlyOrderRevenue = orderActions.reduce((sum, action) => {
    try {
      const outcome = action.outcome ? JSON.parse(action.outcome) : {};
      return sum + (outcome.amount || 0);
    } catch {
      return sum;
    }
  }, 0);

  return {
    clients: {
      new: 0, // Would calculate based on quarter
      total: statusCounts.CLIENT || 0,
      existing: 0,
      decayed: 0
    },
    orders: {
      monthlyTotal: monthlyTotalOrders,
      monthlyRevenue: monthlyOrderRevenue,
      avgPerClient: statusCounts.CLIENT > 0 ? monthlyTotalOrders / statusCounts.CLIENT : 0,
      neCut: monthlyOrderRevenue * 0.26
    },
    funnel: {
      leads: statusCounts.LEAD || 0,
      prospects: statusCounts.PROSPECT || 0,
      opportunities: statusCounts.OPPORTUNITY || 0,
      clients: statusCounts.CLIENT || 0
    },
    conversions: {
      leadToProspect: 0,
      prospectToOpportunity: 0,
      opportunityToClient: 0,
      avgDaysToClose: 0
    }
  };
}

async function getActivityData(workspaceId: string, reportType: string, date: Date) {
  const startDate = getStartDate(reportType, date);
  const endDate = getEndDate(reportType, date);

  const actions = await prisma.actions.findMany({
    where: {
      workspaceId,
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      deletedAt: null
    }
  });

  const actionCounts = actions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalActions: actions.length,
    callsMade: actionCounts.CALL || 0,
    emailsSent: actionCounts.EMAIL || 0,
    meetingsScheduled: actionCounts.MEETING || 0,
    followUpsCompleted: actionCounts.FOLLOW_UP || 0
  };
}

async function getFunnelData(workspaceId: string) {
  // Get recent status changes for conversion analysis
  const statusChanges = await prisma.audit_logs.findMany({
    where: {
      workspaceId,
      entityType: 'PERSON',
      action: 'UPDATE',
      timestamp: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    },
    select: {
      oldValues: true,
      newValues: true,
      timestamp: true
    }
  });

  return {
    recentConversions: statusChanges.length,
    conversionVelocity: calculateConversionVelocity(statusChanges)
  };
}

function generateInsights(metrics: any, activityData: any, funnelData: any, reportType: string) {
  const insights = {
    topPerforming: [] as string[],
    areasForImprovement: [] as string[],
    actionableRecommendations: [] as string[],
    marketTrends: [] as string[]
  };

  // Analyze performance
  if (metrics.clients.new > 2) {
    insights.topPerforming.push(`Strong client acquisition with ${metrics.clients.new} new clients`);
  }
  
  if (metrics.orders.monthlyRevenue > 50000) {
    insights.topPerforming.push(`Excellent revenue performance: $${(metrics.orders.monthlyRevenue / 1000).toFixed(1)}K this month`);
  }

  // Identify improvement areas
  if (metrics.funnel.leads < 50) {
    insights.areasForImprovement.push('Lead generation needs attention - consider increasing outreach activities');
  }
  
  if (metrics.conversions.leadToProspect < 15) {
    insights.areasForImprovement.push('Lead qualification process could be improved');
  }

  // Generate recommendations
  if (activityData.callsMade < 20) {
    insights.actionableRecommendations.push('Increase daily call volume to 5+ calls per day');
  }
  
  if (metrics.funnel.prospects < 20) {
    insights.actionableRecommendations.push('Focus on nurturing existing leads to prospect stage');
  }

  // Market trends (simplified)
  insights.marketTrends.push('Notary automation market showing strong growth potential');
  insights.marketTrends.push('Title companies increasingly adopting digital solutions');

  return insights;
}

function generateMotivationalContent(metrics: any, activityData: any, reportType: string) {
  const achievements = [];
  const goals = [];
  let encouragement = '';

  // Celebrate achievements
  if (metrics.clients.total > 0) {
    achievements.push(`Successfully acquired ${metrics.clients.total} clients`);
  }
  
  if (activityData.totalActions > 50) {
    achievements.push(`Completed ${activityData.totalActions} actions this period`);
  }

  // Set goals
  goals.push('Reach 20+ total clients by end of quarter');
  goals.push('Maintain 5+ calls per day average');
  goals.push('Convert 15%+ of leads to prospects');

  // Encouragement
  if (reportType === 'DAILY') {
    encouragement = 'Every call brings you closer to your next client. Stay focused and consistent!';
  } else if (reportType === 'WEEKLY') {
    encouragement = 'Great week! Your persistence is paying off. Keep building those relationships.';
  } else {
    encouragement = 'Outstanding progress! You\'re building a strong foundation for long-term success.';
  }

  return {
    achievements,
    goals,
    encouragement
  };
}

function analyzeFunnelHealth(metrics: any) {
  return {
    leadQuality: metrics.funnel.leads > 100 ? 'high' : metrics.funnel.leads > 50 ? 'medium' : 'low',
    conversionVelocity: metrics.conversions.avgDaysToClose < 30 ? 'fast' : metrics.conversions.avgDaysToClose < 60 ? 'moderate' : 'slow',
    clientRetention: metrics.clients.decayed < 2 ? 'excellent' : metrics.clients.decayed < 5 ? 'good' : 'needs_attention'
  };
}

function analyzeRevenue(metrics: any) {
  return {
    growthRate: 0, // Would calculate based on historical data
    averageDealSize: metrics.orders.avgPerClient * 150, // Assuming $150 average order
    revenuePerClient: metrics.clients.total > 0 ? metrics.orders.monthlyRevenue / metrics.clients.total : 0,
    projectedMonthlyRevenue: metrics.orders.monthlyRevenue * 1.1 // 10% growth assumption
  };
}

function generateNextSteps(metrics: any, activityData: any, reportType: string) {
  const immediate = [];
  const thisWeek = [];
  const thisMonth = [];

  // Immediate actions
  if (activityData.callsMade < 5) {
    immediate.push('Make 5+ calls today to reach daily target');
  }
  
  if (metrics.funnel.leads < 20) {
    immediate.push('Identify 10 new lead sources for outreach');
  }

  // This week
  thisWeek.push('Schedule follow-up calls with all prospects');
  thisWeek.push('Review and update lead qualification criteria');
  
  if (metrics.funnel.opportunities < 5) {
    thisWeek.push('Focus on converting 3+ prospects to opportunities');
  }

  // This month
  thisMonth.push('Implement systematic follow-up process');
  thisMonth.push('Analyze and optimize conversion rates');
  thisMonth.push('Plan Q2 strategy based on current performance');

  return { immediate, thisWeek, thisMonth };
}

function getPeriodLabel(reportType: string, date: Date): string {
  if (reportType === 'DAILY') {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  } else if (reportType === 'WEEKLY') {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } else {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return `${monthStart.toLocaleDateString('en-US', { month: 'long' })} ${date.getFullYear()}`;
  }
}

function getStartDate(reportType: string, date: Date): Date {
  if (reportType === 'DAILY') {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  } else if (reportType === 'WEEKLY') {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  } else {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}

function getEndDate(reportType: string, date: Date): Date {
  if (reportType === 'DAILY') {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  } else if (reportType === 'WEEKLY') {
    const end = new Date(date);
    end.setDate(date.getDate() - date.getDay() + 6); // End of week (Saturday)
    end.setHours(23, 59, 59, 999);
    return end;
  } else {
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of month
    end.setHours(23, 59, 59, 999);
    return end;
  }
}

function calculateConversionVelocity(statusChanges: any[]): number {
  // Simplified calculation - would be more sophisticated in production
  return statusChanges.length / 30; // conversions per day over last 30 days
}

async function storeInWorkshop(reportData: ChronicleReportData, workspaceId: string, userId: string) {
  try {
    console.log('Storing Chronicle report in Workshop:', {
      title: reportData.title,
      workspaceId,
      userId,
      type: 'PAPER'
    });

    // Create the document in Workshop
    const document = await prisma.workshopDocument.create({
      data: {
        title: reportData.title,
        content: reportData.content,
        type: 'PAPER',
        workspaceId,
        createdById: userId,
        reportType: reportData.reportType,
        sourceRecordId: null, // Chronicle reports are not tied to specific records
        sourceRecordType: 'CHRONICLE',
        generatedByAI: true, // These are AI-generated reports
        metadata: {
          reportType: reportData.reportType,
          generatedAt: new Date().toISOString(),
          sourceSystem: 'Chronicle',
          version: '1.0'
        }
      },
      include: {
        workspace: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create activity log
    await prisma.workshopActivity.create({
      data: {
        documentId: document.id,
        activityType: 'CREATED',
        description: `AI-generated ${reportData.reportType} Chronicle report created`,
        metadata: {
          reportType: reportData.reportType,
          sourceSystem: 'Chronicle',
          generatedByAI: true
        },
        performedById: userId
      }
    });

    console.log('✅ Chronicle report stored in Workshop:', document.id);
    return document;

  } catch (error) {
    console.error('❌ Failed to store Chronicle report in Workshop:', error);
    // Don't throw - we don't want Workshop storage failure to break Chronicle generation
    return null;
  }
}
