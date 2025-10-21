import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [METRICS] Starting metrics calculation...');
    
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      console.log('🔍 [METRICS] Auth response returned:', response.status);
      return response;
    }

    if (!context) {
      console.log('🔍 [METRICS] No context available');
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const workspaceId = context.workspaceId;
    console.log('🔍 [METRICS] Using workspaceId:', workspaceId);

    // Calculate weekly date ranges (Monday-Friday business days)
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const currentDay = today.getDay();
    
    // Calculate start of this week (Monday)
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days; otherwise go to Monday
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() + daysToMonday);
    startOfThisWeek.setHours(0, 0, 0, 0);
    
    // Calculate end of this week (Friday or today if before Friday)
    const endOfThisWeek = new Date(today);
    if (currentDay >= 1 && currentDay <= 5) { // Monday to Friday
      endOfThisWeek.setHours(23, 59, 59, 999);
    } else { // Weekend - use Friday of current week
      const daysToFriday = 5 - currentDay;
      endOfThisWeek.setDate(today.getDate() + daysToFriday);
      endOfThisWeek.setHours(23, 59, 59, 999);
    }
    
    // Calculate last week (previous Monday to Friday)
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);
    
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 4); // Monday + 4 days = Friday
    endOfLastWeek.setHours(23, 59, 59, 999);
    
    console.log('📅 Weekly date ranges:', {
      startOfThisWeek: startOfThisWeek.toISOString(),
      endOfThisWeek: endOfThisWeek.toISOString(),
      startOfLastWeek: startOfLastWeek.toISOString(),
      endOfLastWeek: endOfLastWeek.toISOString(),
      currentDay
    });

    // Get actions data for this week and last week
    console.log('🔍 [METRICS] Fetching actions from database...');
    const [thisWeekActions, lastWeekActions, allActions] = await Promise.all([
      // This week's actions
      prisma.actions.findMany({
        where: {
          workspaceId,
          createdAt: {
            gte: startOfThisWeek,
            lte: endOfThisWeek
          },
          deletedAt: null
        },
        include: {
          person: true,
          company: true
        }
      }),
      
      // Last week's actions
      prisma.actions.findMany({
        where: {
          workspaceId,
          createdAt: {
            gte: startOfLastWeek,
            lte: endOfLastWeek
          },
          deletedAt: null
        },
        include: {
          person: true,
          company: true
        }
      }),
      
      // All actions for charts (last 30 days)
      prisma.actions.findMany({
        where: {
          workspaceId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          deletedAt: null
        },
        include: {
          person: true,
          company: true
        }
      })
    ]);

    // Get people and companies data for conversion tracking
    console.log('🔍 [METRICS] Fetching people and companies from database...');
    const [people, companies, lastWeekPeople, lastWeekCompanies] = await Promise.all([
      prisma.people.findMany({
        where: {
          workspaceId,
          deletedAt: null
        }
      }),
      prisma.companies.findMany({
        where: {
          workspaceId,
          deletedAt: null
        }
      }),
      // Get people created before this week for historical comparison
      prisma.people.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          createdAt: {
            lt: startOfThisWeek
          }
        }
      }),
      // Get companies created before this week for historical comparison
      prisma.companies.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          createdAt: {
            lt: startOfThisWeek
          }
        }
      })
    ]);

    // Calculate metrics
    console.log('🔍 [METRICS] Calculating metrics...');
    const thisWeekPeopleActions = thisWeekActions.length;
    const lastWeekPeopleActions = lastWeekActions.length;
    
    // Debug: Log actual action types being stored
    console.log('🔍 [METRICS] This week action types found:', 
      thisWeekActions.map(a => a.type).filter(Boolean)
    );
    console.log('🔍 [METRICS] Last week action types found:', 
      lastWeekActions.map(a => a.type).filter(Boolean)
    );
    
    // Action types breakdown - using actual database values from action modals
    const getActionTypeCount = (actions: any[], type: string) => {
      return actions.filter(action => {
        const actionType = action.type?.toLowerCase() || '';
        switch (type) {
          case 'call':
            return actionType === 'call' || 
                   actionType === 'phone' || 
                   actionType.includes('phone call') ||
                   actionType.includes('linkedin connection') ||
                   actionType.includes('linkedin message');
          case 'email':
            return actionType === 'email' || 
                   actionType === 'email sent' ||
                   actionType.includes('linkedin inmail') ||
                   actionType.includes('inmail');
          case 'meeting':
            return actionType === 'meeting' || 
                   actionType === 'demo';
          case 'proposal':
            return actionType === 'proposal' || 
                   actionType.includes('proposal sent');
          case 'other':
            return actionType === 'other' || 
                   actionType === 'follow-up' ||
                   actionType === 'follow up' ||
                   (!actionType.includes('call') && 
                    !actionType.includes('phone') && 
                    !actionType.includes('email') && 
                    !actionType.includes('inmail') && 
                    !actionType.includes('meeting') &&
                    !actionType.includes('demo') &&
                    !actionType.includes('proposal'));
          default:
            return false;
        }
      }).length;
    };

    const thisWeekActionTypes = {
      call: getActionTypeCount(thisWeekActions, 'call'),
      email: getActionTypeCount(thisWeekActions, 'email'),
      meeting: getActionTypeCount(thisWeekActions, 'meeting'),
      proposal: getActionTypeCount(thisWeekActions, 'proposal'),
      other: getActionTypeCount(thisWeekActions, 'other')
    };

    const lastWeekActionTypes = {
      call: getActionTypeCount(lastWeekActions, 'call'),
      email: getActionTypeCount(lastWeekActions, 'email'),
      meeting: getActionTypeCount(lastWeekActions, 'meeting'),
      proposal: getActionTypeCount(lastWeekActions, 'proposal'),
      other: getActionTypeCount(lastWeekActions, 'other')
    };
    
    // Debug: Log calculated action type counts
    console.log('📊 [METRICS] This week action type counts:', thisWeekActionTypes);
    console.log('📊 [METRICS] Last week action type counts:', lastWeekActionTypes);

    // NEW THIS WEEK: People/companies created this week (Monday-Sunday)
    const thisWeekLeads = people.filter(p => 
      p.status === 'LEAD' && 
      p.createdAt >= startOfThisWeek && 
      p.createdAt <= endOfThisWeek
    ).length;
    
    const thisWeekProspects = people.filter(p => 
      p.status === 'PROSPECT' && 
      p.createdAt >= startOfThisWeek && 
      p.createdAt <= endOfThisWeek
    ).length;
    
    const thisWeekOpportunities = companies.filter(c => 
      c.status === 'OPPORTUNITY' && 
      c.createdAt >= startOfThisWeek && 
      c.createdAt <= endOfThisWeek
    ).length;
    
    const thisWeekClients = companies.filter(c => 
      c.status === 'CLIENT' && 
      c.createdAt >= startOfThisWeek && 
      c.createdAt <= endOfThisWeek
    ).length;

    // NEW LAST WEEK: People/companies created last week (Monday-Sunday)
    const lastWeekLeads = people.filter(p => 
      p.status === 'LEAD' && 
      p.createdAt >= startOfLastWeek && 
      p.createdAt <= endOfLastWeek
    ).length;
    
    const lastWeekProspects = people.filter(p => 
      p.status === 'PROSPECT' && 
      p.createdAt >= startOfLastWeek && 
      p.createdAt <= endOfLastWeek
    ).length;
    
    const lastWeekOpportunities = companies.filter(c => 
      c.status === 'OPPORTUNITY' && 
      c.createdAt >= startOfLastWeek && 
      c.createdAt <= endOfLastWeek
    ).length;
    
    const lastWeekClients = companies.filter(c => 
      c.status === 'CLIENT' && 
      c.createdAt >= startOfLastWeek && 
      c.createdAt <= endOfLastWeek
    ).length;
    
    // Debug: Log weekly conversion metrics
    console.log('📊 [METRICS] This week conversion metrics:', {
      leads: thisWeekLeads,
      prospects: thisWeekProspects,
      opportunities: thisWeekOpportunities,
      clients: thisWeekClients
    });
    console.log('📊 [METRICS] Last week conversion metrics:', {
      leads: lastWeekLeads,
      prospects: lastWeekProspects,
      opportunities: lastWeekOpportunities,
      clients: lastWeekClients
    });

    // Calculate conversion rates for this week
    const prospectsToOpportunitiesRate = thisWeekProspects > 0 ? (thisWeekOpportunities / thisWeekProspects) * 100 : 0;
    const opportunitiesToClientsRate = thisWeekOpportunities > 0 ? (thisWeekClients / thisWeekOpportunities) * 100 : 0;
    
    // Calculate last week's conversion rates for comparison
    const lastWeekProspectsToOpportunitiesRate = lastWeekProspects > 0 ? (lastWeekOpportunities / lastWeekProspects) * 100 : 0;

    // Generate chart data for last 7 days with real data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayActions = allActions.filter(action => 
        action.createdAt >= date && action.createdAt < nextDate
      );
      
      // Calculate real daily counts from database
      const dayProspects = people.filter(p => 
        p.status === 'PROSPECT' && 
        p.createdAt >= date && 
        p.createdAt < nextDate
      ).length;
      
      const dayOpportunities = companies.filter(c => 
        c.status === 'OPPORTUNITY' && 
        c.createdAt >= date && 
        c.createdAt < nextDate
      ).length;
      
      const dayClients = companies.filter(c => 
        c.status === 'CLIENT' && 
        c.createdAt >= date && 
        c.createdAt < nextDate
      ).length;
      
      // Calculate revenue from opportunities created that day
      const dayRevenue = companies
        .filter(c => c.status === 'OPPORTUNITY' && c.createdAt >= date && c.createdAt < nextDate)
        .reduce((sum, c) => {
          // Try to extract revenue from various possible fields
          const revenue = c.revenue || c.annualRevenue || c.estimatedValue || 0;
          return sum + (typeof revenue === 'number' ? revenue : 0);
        }, 0);
      
      chartData.push({
        date: date.toISOString().split('T')[0],
        actions: dayActions.length,
        prospects: dayProspects,
        opportunities: dayOpportunities,
        clients: dayClients,
        revenue: dayRevenue
      });
    }

    // Calculate trends for week-over-week comparison
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { direction: 'stable' as const, change: 0, comparison: 0 };
      const change = ((current - previous) / previous) * 100;
      return {
        direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'stable' as const,
        change: Math.round(change),
        comparison: previous
      };
    };


    const trends = {
      thisWeekPeopleActions: calculateTrend(thisWeekPeopleActions, lastWeekPeopleActions),
      lastWeekPeopleActions: calculateTrend(lastWeekPeopleActions, 0), // No comparison for last week
      calls: calculateTrend(thisWeekActionTypes.call, lastWeekActionTypes.call),
      emails: calculateTrend(thisWeekActionTypes.email, lastWeekActionTypes.email),
      meetings: calculateTrend(thisWeekActionTypes.meeting, lastWeekActionTypes.meeting),
      prospects: calculateTrend(thisWeekProspects, lastWeekProspects),
      opportunities: calculateTrend(thisWeekOpportunities, lastWeekOpportunities),
      clients: calculateTrend(thisWeekClients, lastWeekClients),
      conversionRate: calculateTrend(prospectsToOpportunitiesRate, lastWeekProspectsToOpportunitiesRate)
    };

    const metrics = {
      // Main stats
      thisWeekPeopleActions,
      lastWeekPeopleActions,
      
      // Action types (for pie chart)
      actionTypes: thisWeekActionTypes,
      
      // Conversion metrics - NEW THIS WEEK
      conversionMetrics: {
        leads: thisWeekLeads,
        prospects: thisWeekProspects,
        opportunities: thisWeekOpportunities,
        clients: thisWeekClients,
        prospectsToOpportunitiesRate: Math.round(prospectsToOpportunitiesRate),
        opportunitiesToClientsRate: Math.round(opportunitiesToClientsRate)
      },
      
      // Trends for week-over-week comparison
      trends,
      
      // Chart data
      chartData,
      
      // Raw data for debugging
      raw: {
        thisWeekActions: thisWeekActions.length,
        lastWeekActions: lastWeekActions.length,
        totalActions: allActions.length,
        totalPeople: people.length,
        totalCompanies: companies.length
      }
    };

    console.log('🔍 [METRICS] Returning metrics data...');
    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('❌ [METRICS] Error fetching metrics:', error);
    console.error('❌ [METRICS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
