const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function startCalendarSync() {
  try {
    console.log('📅 STARTING CALENDAR SYNC SCHEDULER');
    console.log('='.repeat(50));
    console.log('');
    
    // Import the calendar sync scheduler
    const { calendarSyncScheduler } = require('./src/platform/services/CalendarSyncScheduler.ts');
    
    // Start the scheduler
    console.log('🚀 Starting calendar sync scheduler...');
    calendarSyncScheduler.startScheduler();
    
    // Get status
    const status = calendarSyncScheduler.getStatus();
    console.log('✅ Calendar sync scheduler started');
    console.log(`   Status: ${JSON.stringify(status, null, 2)}`);
    
    // Check accounts that will be synced
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
    
    console.log('');
    console.log(`📧 Accounts that will be synced: ${calendarAccounts.length}`);
    calendarAccounts.forEach(account => {
      console.log(`   - ${account.email} (${account.platform}): every ${account.syncFrequency} minutes`);
    });
    
    console.log('');
    console.log('🎉 Calendar sync scheduler is now running!');
    console.log('   The scheduler will check every 5 minutes for accounts that need syncing.');
    console.log('   Use Ctrl+C to stop the scheduler.');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('');
      console.log('⏹️ Stopping calendar sync scheduler...');
      calendarSyncScheduler.stopScheduler();
      console.log('✅ Calendar sync scheduler stopped');
      process.exit(0);
    });
    
    // Keep alive
    setInterval(() => {
      // Just keep the process running
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error starting calendar sync scheduler:', error);
    process.exit(1);
  }
}

startCalendarSync();
