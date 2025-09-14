const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCalendarUserId() {
  try {
    console.log('🔧 FIXING CALENDAR USER ID ISSUE');
    console.log('=================================');
    
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const correctUserId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Find events with wrong user ID (using workspace ID as user ID)
    const eventsWithWrongUserId = await prisma.events.findMany({
      where: {
        workspaceId,
        userId: workspaceId // This is wrong - should be the actual user ID
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        userId: true,
        platform: true
      }
    });
    
    console.log(`Found ${eventsWithWrongUserId.length} events with wrong user ID:`);
    eventsWithWrongUserId.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Current User ID: ${event.userId} (WRONG - this is workspace ID)`);
      console.log(`   Start Time: ${event.startTime.toISOString()}`);
      console.log(`   Platform: ${event.platform}`);
      console.log('');
    });
    
    if (eventsWithWrongUserId.length > 0) {
      console.log('🔧 FIXING EVENTS...');
      
      // Update all events to use the correct user ID
      const updateResult = await prisma.events.updateMany({
        where: {
          workspaceId,
          userId: workspaceId
        },
        data: {
          userId: correctUserId
        }
      });
      
      console.log(`✅ Updated ${updateResult.count} events to use correct user ID: ${correctUserId}`);
      
      // Verify the fix
      const eventsAfterFix = await prisma.events.findMany({
        where: {
          workspaceId,
          userId: correctUserId
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          userId: true
        }
      });
      
      console.log(`\n✅ VERIFICATION: Found ${eventsAfterFix.length} events with correct user ID:`);
      eventsAfterFix.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} (User: ${event.userId})`);
      });
      
    } else {
      console.log('✅ No events found with wrong user ID');
    }
    
    // Also check if there are any calendar records with wrong user ID
    const calendarsWithWrongUserId = await prisma.calendar.findMany({
      where: {
        workspaceId,
        userId: workspaceId
      },
      select: {
        id: true,
        name: true,
        userId: true,
        platform: true
      }
    });
    
    console.log(`\n📅 Found ${calendarsWithWrongUserId.length} calendar records with wrong user ID:`);
    calendarsWithWrongUserId.forEach((calendar, index) => {
      console.log(`${index + 1}. ${calendar.name} (User: ${calendar.userId})`);
    });
    
    if (calendarsWithWrongUserId.length > 0) {
      console.log('🔧 FIXING CALENDAR RECORDS...');
      
      const calendarUpdateResult = await prisma.calendar.updateMany({
        where: {
          workspaceId,
          userId: workspaceId
        },
        data: {
          userId: correctUserId
        }
      });
      
      console.log(`✅ Updated ${calendarUpdateResult.count} calendar records to use correct user ID`);
    }
    
    // Test the dashboard API after the fix
    console.log('\n🧪 TESTING DASHBOARD API AFTER FIX...');
    
    const dashboardResponse = await fetch(`http://localhost:3000/api/pipeline/dashboard?workspaceId=${workspaceId}&userId=${correctUserId}`);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard API Response:');
      console.log(`   Meetings Scheduled: ${dashboardData.data.meetingsScheduled}`);
      console.log(`   Emails Sent: ${dashboardData.data.emailsSent}`);
      console.log(`   Calls Made: ${dashboardData.data.callsMade}`);
    } else {
      console.log('❌ Dashboard API Error:', dashboardResponse.status, await dashboardResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Error fixing calendar user ID:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCalendarUserId();
