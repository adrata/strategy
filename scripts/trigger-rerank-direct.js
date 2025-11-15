#!/usr/bin/env node

/**
 * Direct Manual Trigger Re-rank Script
 * 
 * Calls the re-rank API directly without Prisma queries.
 * Works with production API URL.
 * 
 * Usage:
 *   node scripts/trigger-rerank-direct.js [workspace-id] [user-id]
 *   node scripts/trigger-rerank-direct.js  # Will use environment variables
 */

// Use production API URL
const API_URL = process.env.API_URL || process.env.NEXTAUTH_URL || 'https://action.adrata.com';

// Get IDs from command line or environment
const workspaceId = process.argv[2] || process.env.WORKSPACE_ID || '01K9QAP09FHT6EAP1B4G2KP3D2';
const userId = process.argv[3] || process.env.USER_ID || '01K9QD2E6RKVPNBDFBDGTXMN0Q';

async function triggerRerankDirect() {
  console.log('🔄 Direct Manual Trigger: Speedrun Re-ranking');
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`✅ Workspace ID: ${workspaceId}`);
  console.log(`✅ User ID: ${userId}\n`);

  try {
    console.log('🔄 Triggering re-ranking...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    const startTime = Date.now();
    
    const response = await fetch(`${API_URL}/api/v1/speedrun/re-rank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId,
        'x-user-id': userId
      },
      body: JSON.stringify({
        completedCount: 0,
        trigger: 'manual-direct-trigger',
        timestamp: new Date().toISOString(),
        isDailyReset: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Re-ranking failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage += `\n   Error: ${errorJson.error || errorText}`;
      } catch {
        errorMessage += `\n   Response: ${errorText.substring(0, 500)}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Re-ranking failed: ${result.error || 'Unknown error'}`);
    }

    console.log(`✅ Re-ranking completed successfully! (took ${duration}s)`);
    console.log(`   Batch number: ${result.data?.batchNumber || 'N/A'}`);
    console.log(`   Records in batch: ${result.data?.newBatch?.length || 'N/A'}`);
    
    if (result.data?.newBatch && result.data.newBatch.length > 0) {
      console.log('\n📋 Sample of ranked records:');
      result.data.newBatch.slice(0, 5).forEach((record, index) => {
        const lastAction = record.lastContact || record.lastActionDate 
          ? new Date(record.lastContact || record.lastActionDate).toLocaleDateString()
          : 'Never';
        console.log(`   ${index + 1}. Rank ${record.globalRank || record.rank}: ${record.name || record.fullName}`);
        console.log(`      Last action: ${lastAction}`);
      });
    }

    console.log('\n🎉 Re-ranking complete!');
    console.log('💡 The new filter is now active - people contacted today/yesterday are excluded.');
    console.log('💡 Refresh your speedrun page to see the updated rankings.\n');

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('\n❌ Error: Request timed out after 2 minutes.');
      console.error('   The re-ranking might still be processing. Check your speedrun page in a few minutes.\n');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND') || error.message.includes('fetch failed')) {
      console.error('\n❌ Error: Connection failed');
      console.error(`   Could not reach ${API_URL}`);
      console.error('   Check your internet/VPN connection and try again.\n');
    } else {
      console.error('\n❌ Error:', error.message);
      console.error('\n🔍 Troubleshooting:');
      console.error(`  1. Check that the API URL is accessible: ${API_URL}`);
      console.error('  2. Verify workspace ID and user ID are correct');
      console.error('  3. Check your internet/VPN connection');
      console.error('  4. The API might be processing - wait a few minutes and check your speedrun page\n');
    }
    process.exit(1);
  }
}

// Run the script
triggerRerankDirect();



