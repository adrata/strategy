import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || session.user.activeWorkspaceId;
    
    if (!workspaceId) {
      return NextResponse.json({ success: false, error: 'Workspace ID required' }, { status: 400 });
    }

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
    const [people, companies] = await Promise.all([
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
      })
    ]);

    // Calculate metrics
    const thisWeekPeopleActions = thisWeekActions.length;
    const lastWeekPeopleActions = lastWeekActions.length;
    
    // Action types breakdown
    const actionTypes = {
      call: ['cold_call', 'follow_up_call', 'discovery_call', 'demo_call', 'qualification_call'],
      email: ['cold_email', 'follow_up_email', 'email_conversation'],
      meeting: ['meeting_scheduled', 'meeting_completed', 'demo_meeting', 'discovery_meeting'],
      proposal: ['proposal_sent', 'proposal_follow_up'],
      other: ['relationship_building', 'research_completed', 'note_added', 'status_changed']
    };

    const getActionTypeCount = (actions: any[], type: string) => {
      return actions.filter(action => actionTypes[type as keyof typeof actionTypes].includes(action.type)).length;
    };

    const thisWeekActionTypes = {
      call: getActionTypeCount(thisWeekActions, 'call'),
      email: getActionTypeCount(thisWeekActions, 'email'),
      meeting: getActionTypeCount(thisWeekActions, 'meeting'),
      proposal: getActionTypeCount(thisWeekActions, 'proposal'),
      other: getActionTypeCount(thisWeekActions, 'other')
    };

    // Conversion metrics
    const leads = people.filter(p => p.status === 'LEAD').length;
    const prospects = people.filter(p => p.status === 'PROSPECT').length;
    const opportunities = companies.filter(c => c.status === 'OPPORTUNITY').length;
    const clients = companies.filter(c => c.status === 'CLIENT').length;

    // Calculate conversion rates
    const prospectsToOpportunitiesRate = prospects > 0 ? (opportunities / prospects) * 100 : 0;
    const opportunitiesToClientsRate = opportunities > 0 ? (clients / opportunities) * 100 : 0;

    // Generate chart data for last 7 days (for weekly context)
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
      
      chartData.push({
        date: date.toISOString().split('T')[0],
        actions: dayActions.length,
        prospects: Math.floor(Math.random() * 10) + 5, // Mock data for now
        opportunities: Math.floor(Math.random() * 5) + 2,
        clients: Math.floor(Math.random() * 3) + 1,
        revenue: Math.floor(Math.random() * 50000) + 10000
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
      calls: calculateTrend(thisWeekActionTypes.call, 0), // Simplified - would need last week's call data
      emails: calculateTrend(thisWeekActionTypes.email, 0), // Simplified - would need last week's email data
      meetings: calculateTrend(thisWeekActionTypes.meeting, 0), // Simplified - would need last week's meeting data
      prospects: calculateTrend(prospects, 0), // Rolling count
      opportunities: calculateTrend(opportunities, 0), // Rolling count
      clients: calculateTrend(clients, 0), // Rolling count
      conversionRate: calculateTrend(prospectsToOpportunitiesRate, 0) // Rolling rate
    };

    const metrics = {
      // Main stats
      thisWeekPeopleActions,
      lastWeekPeopleActions,
      
      // Action types (for pie chart)
      actionTypes: thisWeekActionTypes,
      
      // Conversion metrics
      conversionMetrics: {
        leads,
        prospects,
        opportunities,
        clients,
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

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
