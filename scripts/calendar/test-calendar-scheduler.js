const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCalendarScheduler() {
  try {
    console.log('📅 TESTING CALENDAR SYNC SCHEDULER');
    console.log('='.repeat(50));
    console.log('');
    
    // 1. Check current calendar events
    const totalEvents = await prisma.events.count();
    console.log(`📊 Current calendar events in database: ${totalEvents}`);
    
    // 2. Check accounts that support calendar sync
    const calendarAccounts = await prisma.email_accounts.findMany({
      where: {
        isActive: true,
        autoSync: true,
        platform: {
          in: ['outlook', 'google']
        }
      },
      select: {
        id: true,
        email: true,
        platform: true,
        syncStatus: true,
        lastSyncAt: true,
        syncFrequency: true
      }
    });
    
    console.log(`📧 Accounts that support calendar sync: ${calendarAccounts.length}`);
    calendarAccounts.forEach(account => {
      console.log(`   - ${account.email} (${account.platform}): ${account.syncStatus}, last sync: ${account.lastSyncAt ? account.lastSyncAt.toLocaleString() : 'Never'}`);
    });
    console.log('');
    
    // 3. Test the calendar sync API
    console.log('🔄 TESTING CALENDAR SYNC API:');
    console.log('-'.repeat(30));
    
    const response = await fetch('http://localhost:3000/api/calendar/scheduler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'start'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Calendar sync scheduler started successfully');
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    } else {
      console.log('❌ Failed to start calendar sync scheduler');
      const error = await response.text();
      console.log(`   Error: ${error}`);
    }
    console.log('');
    
    // 4. Check scheduler status
    console.log('📊 CHECKING SCHEDULER STATUS:');
    console.log('-'.repeat(30));
    
    const statusResponse = await fetch('http://localhost:3000/api/calendar/scheduler');
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Scheduler status retrieved');
      console.log(`   Status: ${JSON.stringify(status, null, 2)}`);
    } else {
      console.log('❌ Failed to get scheduler status');
    }
    console.log('');
    
    // 5. Test manual sync for Dano's account
    console.log('🔄 TESTING MANUAL SYNC FOR DANO:');
    console.log('-'.repeat(30));
    
    const danoAccount = await prisma.email_accounts.findFirst({
      where: {
        email: 'dano@retail-products.com',
        platform: 'outlook'
      }
    });
    
    if (danoAccount) {
      console.log(`📧 Found Dano's account: ${danoAccount.id}`);
      
      const syncResponse = await fetch('http://localhost:3000/api/calendar/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sync-account',
          accountId: danoAccount.id
        })
      });
      
      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        console.log('✅ Manual sync completed');
        console.log(`   Result: ${JSON.stringify(syncResult, null, 2)}`);
      } else {
        console.log('❌ Manual sync failed');
        const error = await syncResponse.text();
        console.log(`   Error: ${error}`);
      }
    } else {
      console.log('❌ Dano\'s account not found');
    }
    console.log('');
    
    // 6. Check updated event count
    const updatedEvents = await prisma.events.count();
    console.log(`📊 Updated calendar events in database: ${updatedEvents}`);
    console.log(`   Change: ${updatedEvents - totalEvents} events`);
    
    console.log('');
    console.log('🎉 CALENDAR SCHEDULER TEST COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error testing calendar scheduler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCalendarScheduler();
