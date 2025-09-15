const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDeprecatedTables() {
  console.log('🧹 CLEANING UP DEPRECATED TABLES');
  console.log('=================================');
  console.log('Removing deprecated action-related tables...\n');

  let stats = {
    tablesRemoved: 0,
    recordsMigrated: 0,
    errors: 0
  };

  try {
    // STEP 1: Remove speedrun_action_logs (data already migrated)
    console.log('🔄 STEP 1: Removing speedrun_action_logs...');
    
    try {
      const speedrunActionLogs = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM speedrun_action_logs
      `;
      console.log(`Found ${speedrunActionLogs[0].count} records in speedrun_action_logs`);
      
      if (speedrunActionLogs[0].count > 0) {
        console.log('⚠️  speedrun_action_logs has data - data should already be migrated to actions table');
        console.log('Proceeding with table removal...');
      }
      
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS speedrun_action_logs;`);
      console.log('✅ Removed speedrun_action_logs table');
      stats.tablesRemoved++;
    } catch (error) {
      console.error('❌ Failed to remove speedrun_action_logs:', error.message);
      stats.errors++;
    }

    // STEP 2: Remove speedrun_lead_interactions (empty table)
    console.log('\n🔄 STEP 2: Removing speedrun_lead_interactions...');
    
    try {
      const leadInteractions = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM speedrun_lead_interactions
      `;
      console.log(`Found ${leadInteractions[0].count} records in speedrun_lead_interactions`);
      
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS speedrun_lead_interactions;`);
      console.log('✅ Removed speedrun_lead_interactions table');
      stats.tablesRemoved++;
    } catch (error) {
      console.error('❌ Failed to remove speedrun_lead_interactions:', error.message);
      stats.errors++;
    }

    // STEP 3: Remove strategic_action_outcomes (empty table)
    console.log('\n🔄 STEP 3: Removing strategic_action_outcomes...');
    
    try {
      const strategicActions = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM strategic_action_outcomes
      `;
      console.log(`Found ${strategicActions[0].count} records in strategic_action_outcomes`);
      
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS strategic_action_outcomes;`);
      console.log('✅ Removed strategic_action_outcomes table');
      stats.tablesRemoved++;
    } catch (error) {
      console.error('❌ Failed to remove strategic_action_outcomes:', error.message);
      stats.errors++;
    }

    // STEP 4: Summary
    console.log('\n📋 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`Tables removed: ${stats.tablesRemoved}`);
    console.log(`Records migrated: ${stats.recordsMigrated}`);
    console.log(`Errors encountered: ${stats.errors}`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Deprecated tables cleanup completed successfully!');
      console.log('All deprecated action tables have been removed.');
    } else {
      console.log('\n⚠️  Cleanup completed with some errors.');
      console.log('Please review the errors above.');
    }

    // STEP 5: Verify cleanup
    console.log('\n🔍 VERIFICATION:');
    
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM speedrun_action_logs`;
      console.log('❌ speedrun_action_logs still exists');
    } catch (error) {
      console.log('✅ speedrun_action_logs removed');
    }

    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM speedrun_lead_interactions`;
      console.log('❌ speedrun_lead_interactions still exists');
    } catch (error) {
      console.log('✅ speedrun_lead_interactions removed');
    }

    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM strategic_action_outcomes`;
      console.log('❌ strategic_action_outcomes still exists');
    } catch (error) {
      console.log('✅ strategic_action_outcomes removed');
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDeprecatedTables()
  .then(() => {
    console.log('\n✅ Deprecated tables cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
