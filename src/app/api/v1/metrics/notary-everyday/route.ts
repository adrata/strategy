import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { prisma } from '@/lib/prisma';

// Required for static export (desktop build)
export const dynamic = 'force-static';

interface NotaryEverydayMetrics {
  currentPeriod: string;
  metrics: {
    clients: {
      new: number;
      total: number;
      existing: number;
      decayed: number;
    };
    orders: {
      monthlyTotal: number;
      monthlyRevenue: number;
      avgPerClient: number;
      neCut: number;
    };
    funnel: {
      leads: number;
      prospects: number;
      opportunities: number;
      clients: number;
    };
    conversions: {
      leadToProspect: number;
      prospectToOpportunity: number;
      opportunityToClient: number;
      avgDaysToClose: number;
    };
  };
  historical: Array<{
    period: string;
    metrics: any;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Use platform's unified authentication system
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

    // Get workspace ID from authenticated context
    const workspaceId = context.workspaceId;
    
    if (!workspaceId) {
      return createErrorResponse('Workspace ID required', 'WORKSPACE_REQUIRED', 400);
    }

    // Check if this is Notary Everyday workspace
    const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || 
                            workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || 
                            workspaceId === 'cmezxb1ez0001pc94yry3ntjk';

    if (!isNotaryEveryday) {
      return createErrorResponse('Not Notary Everyday workspace', 'INVALID_WORKSPACE', 400);
    }

    // Get current quarter
    const now = new Date();
    const currentQuarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}:${now.getFullYear().toString().slice(-2)}`;
    
    // Calculate quarter start date
    const quarterStart = new Date(now.getFullYear(), Math.floor((now.getMonth()) / 3) * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), Math.floor((now.getMonth()) / 3) * 3 + 3, 0);

    // Get people counts by status
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

    // Convert to object for easier access
    const statusCounts = peopleCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get new clients this quarter
    const newClientsThisQuarter = await prisma.people.count({
      where: {
        workspaceId,
        status: 'CLIENT',
        createdAt: {
          gte: quarterStart,
          lte: quarterEnd
        },
        deletedAt: null
      }
    });

    // Get existing clients (created before this quarter)
    const existingClients = await prisma.people.count({
      where: {
        workspaceId,
        status: 'CLIENT',
        createdAt: {
          lt: quarterStart
        },
        deletedAt: null
      }
    });

    // Get order actions for this month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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

    // Calculate order metrics
    const monthlyTotalOrders = orderActions.length;
    const monthlyOrderRevenue = orderActions.reduce((sum, action) => {
      try {
        const outcome = action.outcome ? JSON.parse(action.outcome) : {};
        return sum + (outcome.amount || 0);
      } catch {
        return sum;
      }
    }, 0);

    const totalClients = statusCounts.CLIENT || 0;
    const avgClientOrders = totalClients > 0 ? monthlyTotalOrders / totalClients : 0;
    
    // Notary Everyday cut calculation (simplified - 26% of revenue)
    const neCut = monthlyOrderRevenue * 0.26;

    // Calculate conversion rates from audit logs
    const conversionRates = await calculateConversionRates(workspaceId, quarterStart, quarterEnd);

    // Calculate average days to close
    const avgDaysToClose = await calculateAverageDaysToClose(workspaceId, quarterStart, quarterEnd);

    const metrics: NotaryEverydayMetrics = {
      currentPeriod: currentQuarter,
      metrics: {
        clients: {
          new: newClientsThisQuarter,
          total: totalClients,
          existing: existingClients,
          decayed: 0 // Would need to track status changes to inactive
        },
        orders: {
          monthlyTotal: monthlyTotalOrders,
          monthlyRevenue: monthlyOrderRevenue,
          avgPerClient: Math.round(avgClientOrders * 100) / 100,
          neCut: Math.round(neCut * 100) / 100
        },
        funnel: {
          leads: statusCounts.LEAD || 0,
          prospects: statusCounts.PROSPECT || 0,
          opportunities: statusCounts.OPPORTUNITY || 0,
          clients: totalClients
        },
        conversions: {
          leadToProspect: conversionRates.leadToProspect,
          prospectToOpportunity: conversionRates.prospectToOpportunity,
          opportunityToClient: conversionRates.opportunityToClient,
          avgDaysToClose: avgDaysToClose
        }
      },
      historical: [] // Would populate with historical data
    };

    return createSuccessResponse(metrics, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('Error fetching Notary Everyday metrics:', error);
    return createErrorResponse('Failed to fetch metrics', 'METRICS_FETCH_ERROR', 500);
  }
}

async function calculateConversionRates(workspaceId: string, quarterStart: Date, quarterEnd: Date) {
  try {
    // Get status change audit logs for this quarter
    const statusChanges = await prisma.audit_logs.findMany({
      where: {
        workspaceId,
        entityType: 'PERSON',
        action: 'UPDATE',
        timestamp: {
          gte: quarterStart,
          lte: quarterEnd
        }
      },
      select: {
        oldValues: true,
        newValues: true
      }
    });

    let leadToProspect = 0;
    let prospectToOpportunity = 0;
    let opportunityToClient = 0;

    statusChanges.forEach(change => {
      try {
        const oldValues = change.oldValues as any;
        const newValues = change.newValues as any;
        
        if (oldValues?.status === 'LEAD' && newValues?.status === 'PROSPECT') {
          leadToProspect++;
        } else if (oldValues?.status === 'PROSPECT' && newValues?.status === 'OPPORTUNITY') {
          prospectToOpportunity++;
        } else if (oldValues?.status === 'OPPORTUNITY' && newValues?.status === 'CLIENT') {
          opportunityToClient++;
        }
      } catch (e) {
        // Skip malformed audit logs
      }
    });

    // Get total counts for denominator
    const totalLeads = await prisma.people.count({
      where: { workspaceId, status: 'LEAD', deletedAt: null }
    });
    const totalProspects = await prisma.people.count({
      where: { workspaceId, status: 'PROSPECT', deletedAt: null }
    });
    const totalOpportunities = await prisma.people.count({
      where: { workspaceId, status: 'OPPORTUNITY', deletedAt: null }
    });

    return {
      leadToProspect: totalLeads > 0 ? Math.round((leadToProspect / totalLeads) * 100 * 10) / 10 : 0,
      prospectToOpportunity: totalProspects > 0 ? Math.round((prospectToOpportunity / totalProspects) * 100 * 10) / 10 : 0,
      opportunityToClient: totalOpportunities > 0 ? Math.round((opportunityToClient / totalOpportunities) * 100 * 10) / 10 : 0
    };
  } catch (error) {
    console.error('Error calculating conversion rates:', error);
    return {
      leadToProspect: 0,
      prospectToOpportunity: 0,
      opportunityToClient: 0
    };
  }
}

async function calculateAverageDaysToClose(workspaceId: string, quarterStart: Date, quarterEnd: Date) {
  try {
    // Get people who became clients this quarter
    const newClients = await prisma.people.findMany({
      where: {
        workspaceId,
        status: 'CLIENT',
        createdAt: {
          gte: quarterStart,
          lte: quarterEnd
        },
        deletedAt: null
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    if (newClients.length === 0) return 0;

    // Calculate average days from creation to becoming client
    const totalDays = newClients.reduce((sum, client) => {
      const daysDiff = Math.ceil((client.updatedAt.getTime() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return sum + daysDiff;
    }, 0);

    return Math.round(totalDays / newClients.length);
  } catch (error) {
    console.error('Error calculating average days to close:', error);
    return 0;
  }
}


