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

    // Get today and yesterday dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Set to start of day
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);

    // Get actions data for today and yesterday
    const [todayActions, yesterdayActions, allActions, scheduledMeetings] = await Promise.all([
      // Today's actions
      prisma.actions.findMany({
        where: {
          workspaceId,
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          deletedAt: null
        },
        include: {
          person: true,
          company: true
        }
      }),
      
      // Yesterday's actions
      prisma.actions.findMany({
        where: {
          workspaceId,
          createdAt: {
            gte: yesterday,
            lt: today
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
      }),

      // Scheduled meetings (today and future)
      prisma.actions.findMany({
        where: {
          workspaceId,
          type: {
            in: ['meeting_scheduled', 'meeting_completed', 'demo_meeting', 'discovery_meeting']
          },
          OR: [
            {
              scheduledAt: {
                gte: today
              }
            },
            {
              status: 'PLANNED',
              scheduledAt: {
                gte: today
              }
            }
          ],
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
    const todayPeopleActions = todayActions.length;
    const yesterdayPeopleActions = yesterdayActions.length;
    
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

    // Calculate meeting count including scheduled meetings
    const todayMeetingActions = getActionTypeCount(todayActions, 'meeting');
    const scheduledMeetingCount = scheduledMeetings.length;
    const totalMeetingCount = todayMeetingActions + scheduledMeetingCount;

    const todayActionTypes = {
      call: getActionTypeCount(todayActions, 'call'),
      email: getActionTypeCount(todayActions, 'email'),
      meeting: totalMeetingCount, // Include both today's meetings and scheduled meetings
      proposal: getActionTypeCount(todayActions, 'proposal'),
      other: getActionTypeCount(todayActions, 'other')
    };

    // Conversion metrics
    const leads = people.filter(p => p.status === 'LEAD').length;
    const prospects = people.filter(p => p.status === 'PROSPECT').length;
    const opportunities = companies.filter(c => c.status === 'OPPORTUNITY').length;
    const clients = companies.filter(c => c.status === 'CLIENT').length;

    // Calculate conversion rates
    const prospectsToOpportunitiesRate = prospects > 0 ? (opportunities / prospects) * 100 : 0;
    const opportunitiesToClientsRate = opportunities > 0 ? (clients / opportunities) * 100 : 0;

    // Generate chart data for last 7 days
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

    const metrics = {
      // Main stats
      todayPeopleActions,
      yesterdayPeopleActions,
      
      // Action types (for pie chart)
      actionTypes: todayActionTypes,
      
      // Conversion metrics
      conversionMetrics: {
        leads,
        prospects,
        opportunities,
        clients,
        prospectsToOpportunitiesRate: Math.round(prospectsToOpportunitiesRate),
        opportunitiesToClientsRate: Math.round(opportunitiesToClientsRate)
      },
      
      // Chart data
      chartData,
      
      // Raw data for debugging
      raw: {
        todayActions: todayActions.length,
        yesterdayActions: yesterdayActions.length,
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
