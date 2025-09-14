const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDashboardMeetingsCalls() {
  try {
    console.log('🔍 DEBUGGING DASHBOARD MEETINGS & CALLS LOGIC');
    console.log('=============================================');
    
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Check what the dashboard API is actually doing
    console.log('📊 DASHBOARD API LOGIC DEBUG:');
    console.log('=============================');
    
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Week start: ${startOfWeek.toISOString()}`);
    console.log(`Week end: ${endOfWeek.toISOString()}`);
    console.log(`Day of week: ${dayOfWeek} (0=Sunday)`);
    console.log('');
    
    // 1. Check calendar events with the exact same query as dashboard API
    console.log('📅 CALENDAR EVENTS (Dashboard API Query):');
    console.log('=========================================');
    
    const dashboardCalendarEvents = await prisma.events.count({
      where: {
        workspaceId,
        userId: userId,
        startTime: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    });
    
    console.log(`Dashboard calendar events count: ${dashboardCalendarEvents}`);
    
    // Let's also check if there are ANY calendar events for this user
    const allUserEvents = await prisma.events.findMany({
      where: {
        workspaceId,
        userId: userId
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true,
        platform: true
      },
      orderBy: { startTime: 'desc' },
      take: 10
    });
    
    console.log(`Total calendar events for user: ${allUserEvents.length}`);
    allUserEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Start: ${event.startTime.toISOString()}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Platform: ${event.platform}`);
      console.log('');
    });
    
    // 2. Check activities with the exact same query as dashboard API
    console.log('📞 ACTIVITIES (Dashboard API Query):');
    console.log('====================================');
    
    // This is what the dashboard API does for activities
    const thisWeekActivities = await prisma.activities.groupBy({
      by: ['type'],
      where: {
        workspaceId,
        userId: userId,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      _count: { type: true }
    });
    
    console.log('This week activities by type:', thisWeekActivities);
    
    // Check what activity types exist
    const allActivityTypes = await prisma.activities.findMany({
      where: {
        workspaceId,
        userId: userId
      },
      select: {
        type: true
      },
      distinct: ['type']
    });
    
    console.log('All activity types for user:', allActivityTypes.map(a => a.type));
    
    // 3. Check if there are activities but with different date ranges
    console.log('\n📋 ACTIVITIES WITH DIFFERENT DATE RANGES:');
    console.log('=========================================');
    
    // Last 7 days
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysActivities = await prisma.activities.count({
      where: {
        workspaceId,
        userId: userId,
        createdAt: {
          gte: last7Days
        }
      }
    });
    
    console.log(`Activities in last 7 days: ${last7DaysActivities}`);
    
    // Last 30 days
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const last30DaysActivities = await prisma.activities.count({
      where: {
        workspaceId,
        userId: userId,
        createdAt: {
          gte: last30Days
        }
      }
    });
    
    console.log(`Activities in last 30 days: ${last30DaysActivities}`);
    
    // 4. Check if there are activities but for different users
    console.log('\n👥 ACTIVITIES FOR ALL USERS IN WORKSPACE:');
    console.log('=========================================');
    
    const allUsersActivities = await prisma.activities.groupBy({
      by: ['userId', 'type'],
      where: {
        workspaceId,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      _count: { type: true }
    });
    
    console.log('All users activities this week:', allUsersActivities);
    
    // 5. Check if there are calendar events but for different users
    console.log('\n📅 CALENDAR EVENTS FOR ALL USERS IN WORKSPACE:');
    console.log('==============================================');
    
    const allUsersEvents = await prisma.events.findMany({
      where: {
        workspaceId,
        startTime: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        userId: true,
        status: true
      },
      orderBy: { startTime: 'desc' }
    });
    
    console.log(`Calendar events for all users this week: ${allUsersEvents.length}`);
    allUsersEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (User: ${event.userId})`);
      console.log(`   Start: ${event.startTime.toISOString()}`);
      console.log(`   Status: ${event.status}`);
      console.log('');
    });
    
    // 6. Check the specific call activity we found
    console.log('\n📞 DETAILED CALL ACTIVITY ANALYSIS:');
    console.log('===================================');
    
    const callActivity = await prisma.activities.findFirst({
      where: {
        workspaceId,
        userId: userId,
        type: { contains: 'call', mode: 'insensitive' }
      },
      select: {
        id: true,
        type: true,
        subject: true,
        description: true,
        status: true,
        createdAt: true,
        scheduledAt: true,
        completedAt: true
      }
    });
    
    if (callActivity) {
      console.log('Found call activity:');
      console.log(`ID: ${callActivity.id}`);
      console.log(`Type: ${callActivity.type}`);
      console.log(`Subject: ${callActivity.subject}`);
      console.log(`Status: ${callActivity.status}`);
      console.log(`Created: ${callActivity.createdAt.toISOString()}`);
      console.log(`Scheduled: ${callActivity.scheduledAt?.toISOString() || 'None'}`);
      console.log(`Completed: ${callActivity.completedAt?.toISOString() || 'None'}`);
    } else {
      console.log('No call activities found');
    }
    
  } catch (error) {
    console.error('❌ Error debugging dashboard meetings & calls:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDashboardMeetingsCalls();
