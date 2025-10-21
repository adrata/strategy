#!/usr/bin/env node

/**
 * CLI script to populate strategies for top N people
 * Usage: node scripts/populate-strategies-for-top-people.js <workspaceId> [limit]
 * 
 * Examples:
 * node scripts/populate-strategies-for-top-people.js workspace123 50
 * node scripts/populate-strategies-for-top-people.js workspace123 100
 * node scripts/populate-strategies-for-top-people.js workspace123 all
 */

const { autoStrategyPopulationServicePeople } = require('../src/platform/services/auto-strategy-population-service-people.ts');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('❌ Usage: node scripts/populate-strategies-for-top-people.js <workspaceId> [limit]');
    console.error('   Examples:');
    console.error('   node scripts/populate-strategies-for-top-people.js workspace123 50');
    console.error('   node scripts/populate-strategies-for-top-people.js workspace123 all');
    process.exit(1);
  }

  const workspaceId = args[0];
  const limitArg = args[1] || '50';
  
  let limit;
  if (limitArg.toLowerCase() === 'all') {
    limit = 1000; // Large number for "all"
  } else {
    limit = parseInt(limitArg, 10);
    if (isNaN(limit) || limit <= 0) {
      console.error('❌ Invalid limit. Must be a positive number or "all"');
      process.exit(1);
    }
  }

  console.log(`🚀 Starting strategy population for workspace: ${workspaceId}`);
  console.log(`📊 Limit: ${limitArg === 'all' ? 'All people' : limit} people`);
  console.log('');

  try {
    // Get initial stats
    console.log('📈 Getting current statistics...');
    const stats = await autoStrategyPopulationServicePeople.getPopulationStats(workspaceId);
    console.log(`   Total people: ${stats.totalPeople}`);
    console.log(`   People with strategy: ${stats.peopleWithStrategy}`);
    console.log(`   People without strategy: ${stats.peopleWithoutStrategy}`);
    console.log(`   Completion: ${stats.percentageComplete}%`);
    console.log('');

    if (stats.peopleWithoutStrategy === 0) {
      console.log('✅ All people already have strategy data!');
      return;
    }

    // Start population
    console.log('🔄 Starting strategy population...');
    const startTime = Date.now();
    
    const result = await autoStrategyPopulationServicePeople.populateStrategiesForTopPeople(workspaceId, limit);
    
    const duration = Date.now() - startTime;
    
    // Display results
    console.log('');
    console.log('📊 RESULTS:');
    console.log(`   Total processed: ${result.totalProcessed}`);
    console.log(`   Successful: ${result.successful}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Success rate: ${result.totalProcessed > 0 ? Math.round((result.successful / result.totalProcessed) * 100) : 0}%`);
    
    if (result.errors.length > 0) {
      console.log('');
      console.log('❌ ERRORS:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Get updated stats
    console.log('');
    console.log('📈 Updated statistics:');
    const updatedStats = await autoStrategyPopulationServicePeople.getPopulationStats(workspaceId);
    console.log(`   Total people: ${updatedStats.totalPeople}`);
    console.log(`   People with strategy: ${updatedStats.peopleWithStrategy}`);
    console.log(`   People without strategy: ${updatedStats.peopleWithoutStrategy}`);
    console.log(`   Completion: ${updatedStats.percentageComplete}%`);

    if (result.successful > 0) {
      console.log('');
      console.log('🎉 Strategy population completed successfully!');
    } else {
      console.log('');
      console.log('⚠️ No strategies were generated. Check the errors above.');
    }

  } catch (error) {
    console.error('💥 Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { main };
