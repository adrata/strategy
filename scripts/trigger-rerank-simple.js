#!/usr/bin/env node

/**
 * Simple Manual Trigger Re-rank Script
 * 
 * Manually triggers speedrun re-ranking via API endpoint only.
 * No Prisma queries - just calls the API directly.
 * 
 * Usage:
 *   node scripts/trigger-rerank-simple.js [workspace-id] [user-id]
 *   node scripts/trigger-rerank-simple.js  # Will prompt for IDs
 */

const readline = require('readline');

// Get API URL from environment or use localhost for dev
const API_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || process.env.API_URL || 'http://localhost:3000';
const USE_LOCAL = !process.env.NEXTAUTH_URL && !process.env.VERCEL_URL && !process.env.API_URL;

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function triggerRerankSimple() {
  console.log('🔄 Simple Manual Trigger: Speedrun Re-ranking');
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`🔧 Mode: ${USE_LOCAL ? 'Local Development' : 'Production'}\n`);

  try {
    // Get workspace and user IDs from command line or prompt
    let workspaceId = process.argv[2];
    let userId = process.argv[3];

    if (!workspaceId) {
      workspaceId = await askQuestion('Enter Workspace ID: ');
    }

    if (!userId) {
      userId = await askQuestion('Enter User ID: ');
    }

    if (!workspaceId || !userId) {
      throw new Error('Workspace ID and User ID are required');
    }

    console.log(`✅ Workspace ID: ${workspaceId}`);
    console.log(`✅ User ID: ${userId}\n`);

    // Trigger re-ranking with proper headers and error handling
    console.log('🔄 Triggering re-ranking...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      const response = await fetch(`${API_URL}/api/v1/speedrun/re-rank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
          'x-user-id': userId
        },
        body: JSON.stringify({
          completedCount: 0,
          trigger: 'manual-simple-trigger',
          timestamp: new Date().toISOString(),
          isDailyReset: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Re-ranking failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage += `\n   Error: ${errorJson.error || errorText}`;
        } catch {
          errorMessage += `\n   Response: ${errorText.substring(0, 200)}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`Re-ranking failed: ${result.error || 'Unknown error'}`);
      }

      console.log('✅ Re-ranking completed successfully!');
      console.log(`   Batch number: ${result.data?.batchNumber || 'N/A'}`);
      console.log(`   Records in batch: ${result.data?.newBatch?.length || 'N/A'}\n`);

      console.log('🎉 Re-ranking complete!');
      console.log('💡 The new filter is now active - people contacted today/yesterday are excluded.');
      console.log('💡 Refresh your speedrun page to see the updated rankings.\n');

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 60 seconds. Check your connection and try again.');
      } else if (fetchError.message.includes('ECONNREFUSED') || fetchError.message.includes('ENOTFOUND')) {
        throw new Error(`Connection failed. Check your internet/VPN and that ${API_URL} is accessible.\n\nIf using localhost, make sure your dev server is running: npm run dev`);
      } else {
        throw fetchError;
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('  1. Check that the API URL is accessible:', API_URL);
    console.error('  2. Verify workspace ID and user ID are correct');
    console.error('  3. Check your internet/VPN connection');
    if (USE_LOCAL) {
      console.error('  4. Make sure your dev server is running: npm run dev');
    }
    console.error('  5. Usage: node scripts/trigger-rerank-simple.js [workspace-id] [user-id]\n');
    process.exit(1);
  }
}

// Run the script
triggerRerankSimple();

