#!/usr/bin/env node

/**
 * Fix Production Speedrun Ranking Script
 * 
 * This script calls the production re-rank API to fix corrupted globalRank values
 * in the People table. Production currently shows ranks like 19235-19246 instead
 * of proper sequential ranks 1-50.
 * 
 * Usage:
 *   node scripts/fix-production-speedrun-ranks.js
 */

const PRODUCTION_URL = 'https://action.adrata.com';
const PRODUCTION_API_URL = `${PRODUCTION_URL}/api/v1/speedrun/re-rank`;

// Get workspace and user ID from environment or command line
const WORKSPACE_ID = process.env.PRODUCTION_WORKSPACE_ID || '01K7464TNANHQXPCZT1FYX205V'; // Adrata workspace
const USER_ID = process.env.PRODUCTION_USER_ID || '01K7469230N74BVGK2PABPNNZ9'; // Ross's user ID

async function fixProductionRanking() {
  console.log('🔧 Fixing Production Speedrun Ranking');
  console.log(`📍 Target: ${PRODUCTION_URL}`);
  console.log(`👤 User ID: ${USER_ID}`);
  console.log(`🏢 Workspace ID: ${WORKSPACE_ID}\n`);

  try {
    // Call the re-rank API
    console.log('🚀 Calling re-rank API...');
    
    const response = await fetch(PRODUCTION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': WORKSPACE_ID,
        'x-user-id': USER_ID
      },
      body: JSON.stringify({
        completedCount: 0,
        trigger: 'manual-fix',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Re-ranking failed: ${result.error}`);
    }

    console.log('\n✅ Successfully re-ranked speedrun data!');
    console.log(`📊 Results:`);
    console.log(`  🎯 Records ranked: ${result.data?.length || 'N/A'}`);
    console.log(`  ⏱️  Processing time: ${result.processingTime || 'N/A'}ms`);
    
    if (result.data && result.data.length > 0) {
      console.log('\n🏆 Top 10 after re-ranking:');
      result.data.slice(0, 10).forEach((person, index) => {
        console.log(`  ${index + 1}. ${person.name} at ${person.company} (Rank: ${person.globalRank})`);
      });
    }

    console.log('\n🎉 Production ranking fixed successfully!');
    console.log('💡 Refresh your production page to see the corrected ranks (1-50)\n');

  } catch (error) {
    console.error('\n❌ Error fixing production ranking:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('  1. Verify the production URL is correct');
    console.error('  2. Check that the workspace and user IDs are correct');
    console.error('  3. Ensure you have access to the production API');
    console.error('  4. Check production logs for more details\n');
    process.exit(1);
  }
}

// Run the script
fixProductionRanking();

