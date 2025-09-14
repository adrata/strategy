const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMeetingsCallsData() {
  try {
    console.log('🔍 CHECKING MEETINGS AND CALLS DATA');
    console.log('===================================');
    
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Calculate date ranges
    const now = new Date();
    
    // This week (Sunday to Saturday)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Last week
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    
    const endOfLastWeek = new Date(endOfWeek);
    endOfLastWeek.setDate(endOfWeek.getDate() - 7);
    
    console.log('Date ranges:');
    console.log(`This week: ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`);
    console.log(`Last week: ${startOfLastWeek.toISOString()} to ${endOfLastWeek.toISOString()}`);
    console.log('');
    
    // 1. Check calendar events (meetings) for this week
    console.log('📅 CALENDAR EVENTS (MEETINGS) THIS WEEK:');
    console.log('========================================');
    
    const thisWeekEvents = await prisma.events.findMany({
      where: {
        workspaceId,
        userId: userId,
        startTime: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true,
        platform: true,
        attendees: true,
        organizer: true
      },
      orderBy: { startTime: 'asc' }
    });
    
    console.log(`Total calendar events this week: ${thisWeekEvents.length}`);
    thisWeekEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Start: ${event.startTime.toISOString()}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Platform: ${event.platform}`);
      if (event.attendees) {
        console.log(`   Attendees: ${JSON.stringify(event.attendees)}`);
      }
      console.log('');
    });
    
    // 2. Check all calendar events (not just this week) to see what we have
    console.log('📅 ALL CALENDAR EVENTS (RECENT):');
    console.log('================================');
    
    const recentEvents = await prisma.events.findMany({
      where: {
        workspaceId,
        userId: userId,
        startTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
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
    
    console.log(`Recent calendar events (last 30 days): ${recentEvents.length}`);
    recentEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Start: ${event.startTime.toISOString()}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Platform: ${event.platform}`);
      console.log('');
    });
    
    // 3. Check activities for calls this week
    console.log('📞 ACTIVITIES (CALLS) THIS WEEK:');
    console.log('===============================');
    
    const thisWeekCallActivities = await prisma.activities.findMany({
      where: {
        workspaceId,
        userId: userId,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        },
        OR: [
          { type: { contains: 'call', mode: 'insensitive' } },
          { subject: { contains: 'call', mode: 'insensitive' } },
          { description: { contains: 'call', mode: 'insensitive' } }
        ]
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
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Call activities this week: ${thisWeekCallActivities.length}`);
    thisWeekCallActivities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.subject} (${activity.type})`);
      console.log(`   Status: ${activity.status}`);
      console.log(`   Created: ${activity.createdAt.toISOString()}`);
      if (activity.scheduledAt) {
        console.log(`   Scheduled: ${activity.scheduledAt.toISOString()}`);
      }
      if (activity.completedAt) {
        console.log(`   Completed: ${activity.completedAt.toISOString()}`);
      }
      console.log('');
    });
    
    // 4. Check activities for calls last week
    console.log('📞 ACTIVITIES (CALLS) LAST WEEK:');
    console.log('================================');
    
    const lastWeekCallActivities = await prisma.activities.findMany({
      where: {
        workspaceId,
        userId: userId,
        createdAt: {
          gte: startOfLastWeek,
          lte: endOfLastWeek
        },
        OR: [
          { type: { contains: 'call', mode: 'insensitive' } },
          { subject: { contains: 'call', mode: 'insensitive' } },
          { description: { contains: 'call', mode: 'insensitive' } }
        ]
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
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Call activities last week: ${lastWeekCallActivities.length}`);
    lastWeekCallActivities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.subject} (${activity.type})`);
      console.log(`   Status: ${activity.status}`);
      console.log(`   Created: ${activity.createdAt.toISOString()}`);
      if (activity.scheduledAt) {
        console.log(`   Scheduled: ${activity.scheduledAt.toISOString()}`);
      }
      if (activity.completedAt) {
        console.log(`   Completed: ${activity.completedAt.toISOString()}`);
      }
      console.log('');
    });
    
    // 5. Check notes for call-related content
    console.log('📝 NOTES WITH CALL CONTENT:');
    console.log('===========================');
    
    const callNotes = await prisma.notes.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
        },
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { content: { contains: 'call', mode: 'insensitive' } },
          { title: { contains: 'phone', mode: 'insensitive' } },
          { content: { contains: 'phone', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`Notes with call content (last 14 days): ${callNotes.length}`);
    callNotes.forEach((note, index) => {
      const preview = note.content ? note.content.substring(0, 100) + '...' : 'No content';
      console.log(`${index + 1}. ${note.title}`);
      console.log(`   Content: ${preview}`);
      console.log(`   Created: ${note.createdAt.toISOString()}`);
      console.log('');
    });
    
    // 6. Check all activities this week (not just calls)
    console.log('📋 ALL ACTIVITIES THIS WEEK:');
    console.log('============================');
    
    const allThisWeekActivities = await prisma.activities.findMany({
      where: {
        workspaceId,
        userId: userId,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      select: {
        id: true,
        type: true,
        subject: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`All activities this week: ${allThisWeekActivities.length}`);
    allThisWeekActivities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.subject} (${activity.type}) - ${activity.status}`);
      console.log(`   Created: ${activity.createdAt.toISOString()}`);
    });
    
    // Summary
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log(`📅 Calendar events this week: ${thisWeekEvents.length}`);
    console.log(`📞 Call activities this week: ${thisWeekCallActivities.length}`);
    console.log(`📞 Call activities last week: ${lastWeekCallActivities.length}`);
    console.log(`📝 Call-related notes (14 days): ${callNotes.length}`);
    console.log(`📋 All activities this week: ${allThisWeekActivities.length}`);
    
    if (thisWeekEvents.length > 0) {
      console.log('\n🚨 ISSUE: Dashboard shows 0 meetings but we have calendar events!');
    }
    
    if (thisWeekCallActivities.length > 0 || lastWeekCallActivities.length > 0) {
      console.log('\n🚨 ISSUE: Dashboard shows 0 calls but we have call activities!');
    }
    
  } catch (error) {
    console.error('❌ Error checking meetings and calls data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMeetingsCallsData();
