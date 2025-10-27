#!/usr/bin/env node

/**
 * Clear Speedrun Cache and Re-rank Script
 * 
 * This script clears the Redis cache and triggers a re-rank to fix
 * the corrupted globalRank values (19235-19246 → 1-50).
 */

const PRODUCTION_URL = 'https://action.adrata.com';

async function clearCacheAndRerank() {
  console.log('🧹 Clearing Speedrun Cache and Re-ranking');
  console.log(`📍 Target: ${PRODUCTION_URL}\n`);

  try {
    // Step 1: Clear the cache by calling the POST endpoint
    console.log('🗑️  Step 1: Clearing speedrun cache...');
    
    const clearResponse = await fetch(`${PRODUCTION_URL}/api/v1/speedrun`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!clearResponse.ok) {
      throw new Error(`Cache clear failed: ${clearResponse.status} ${clearResponse.statusText}`);
    }

    const clearResult = await clearResponse.json();
    console.log('✅ Cache cleared successfully');
    console.log(`   Message: ${clearResult.message || 'Cache invalidated'}\n`);

    // Step 2: Trigger re-ranking
    console.log('🔄 Step 2: Triggering re-ranking...');
    
    const rerankResponse = await fetch(`${PRODUCTION_URL}/api/v1/speedrun/re-rank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        completedCount: 0,
        trigger: 'manual-cache-clear',
        timestamp: new Date().toISOString()
      })
    });

    if (!rerankResponse.ok) {
      const errorText = await rerankResponse.text();
      throw new Error(`Re-ranking failed: ${rerankResponse.status} ${rerankResponse.statusText}\n${errorText}`);
    }

    const rerankResult = await rerankResponse.json();
    
    if (!rerankResult.success) {
      throw new Error(`Re-ranking failed: ${rerankResult.error}`);
    }

    console.log('✅ Re-ranking completed successfully');
    console.log(`   Records processed: ${rerankResult.data?.length || 'N/A'}\n`);

    // Step 3: Verify the fix by fetching fresh data
    console.log('🔍 Step 3: Verifying the fix...');
    
    const verifyResponse = await fetch(`${PRODUCTION_URL}/api/v1/speedrun?limit=10`);
    
    if (!verifyResponse.ok) {
      throw new Error(`Verification failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
    }

    const verifyResult = await verifyResponse.json();
    
    if (verifyResult.success && verifyResult.data && verifyResult.data.length > 0) {
      console.log('✅ Verification successful! New ranks:');
      verifyResult.data.slice(0, 5).forEach((person, index) => {
        console.log(`   ${index + 1}. Rank ${person.rank}: ${person.name} (${person.company?.name})`);
      });
      
      // Check if ranks are now in the correct range (1-50)
      const ranks = verifyResult.data.map(p => p.rank).filter(r => r !== null);
      const maxRank = Math.max(...ranks);
      const minRank = Math.min(...ranks);
      
      if (maxRank <= 50 && minRank >= 1) {
        console.log('\n🎉 SUCCESS! Ranks are now in the correct range (1-50)');
        console.log('💡 Refresh your production page to see the corrected ranks');
      } else {
        console.log(`\n⚠️  Ranks are still out of range: ${minRank}-${maxRank}`);
        console.log('   This might indicate a deeper issue with the ranking algorithm');
      }
    } else {
      console.log('❌ Verification failed - no data returned');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('  1. Check that the production URL is accessible');
    console.error('  2. Verify you have the correct authentication');
    console.error('  3. Check production logs for more details');
    process.exit(1);
  }
}

// Run the script
clearCacheAndRerank();
