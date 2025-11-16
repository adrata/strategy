#!/usr/bin/env node

/**
 * Trigger Re-Rank for TOP Engineering Plus
 * 
 * Runs the enhanced re-rank API for Victoria Leland in TOP Engineering Plus workspace
 * 
 * Usage:
 *   node scripts/trigger-rerank-top-engineering-plus.js
 */

require('dotenv').config();

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const VICTORIA_EMAIL = 'vleland@topengineersplus.com';

// Use production API URL or localhost for development
const API_URL = process.env.API_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function triggerRerankTopEngineeringPlus() {
  console.log('🔄 Triggering Re-Rank for TOP Engineering Plus');
  console.log('='.repeat(70));
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`✅ Workspace ID: ${TOP_ENGINEERING_PLUS_WORKSPACE_ID}`);
  console.log(`✅ User Email: ${VICTORIA_EMAIL}\n`);

  try {
    // First, find Victoria's user ID
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    
    const victoria = await prisma.users.findFirst({
      where: {
        email: VICTORIA_EMAIL
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!victoria) {
      console.error('❌ Victoria Leland user not found!');
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log(`✅ Found Victoria: ${victoria.name} (${victoria.email})`);
    console.log(`   User ID: ${victoria.id}\n`);

    await prisma.$disconnect();

    console.log('🔄 Triggering re-ranking with enhanced algorithm...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
    
    const startTime = Date.now();
    
    const response = await fetch(`${API_URL}/api/v1/speedrun/re-rank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        'x-user-id': victoria.id
      },
      body: JSON.stringify({
        completedCount: 0,
        trigger: 'manual-top-engineering-plus-enhanced',
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
      console.log('\n📋 Top 10 ranked records:');
      result.data.newBatch.slice(0, 10).forEach((record, index) => {
        console.log(`   ${index + 1}. Rank ${record.globalRank || record.rank}: ${record.name || record.fullName} (${record.status || 'N/A'})`);
      });
    }

    console.log('\n🎉 Enhanced re-ranking complete!');
    console.log('💡 The enhanced algorithm now factors in:');
    console.log('   - Opportunity value (high-value deals rank higher)');
    console.log('   - Deal stage (late-stage opportunities rank higher)');
    console.log('   - Next action urgency (overdue actions get priority)');
    console.log('   - Priority field (HIGH priority contacts rank higher)');
    console.log('💡 Refresh your speedrun page to see the updated rankings.\n');

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('\n❌ Error: Request timed out after 3 minutes.');
      console.error('   The re-ranking might still be processing. Check your speedrun page in a few minutes.\n');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND') || error.message.includes('fetch failed')) {
      console.error('\n❌ Error: Connection failed');
      console.error(`   Could not reach ${API_URL}`);
      console.error('   Make sure the development server is running: npm run dev\n');
    } else {
      console.error('\n❌ Error:', error.message);
      console.error('\n🔍 Troubleshooting:');
      console.error(`  1. Check that the API URL is accessible: ${API_URL}`);
      console.error('  2. Verify workspace ID and user ID are correct');
      console.error('  3. Make sure the development server is running');
      console.error('  4. The API might be processing - wait a few minutes and check your speedrun page\n');
    }
    process.exit(1);
  }
}

// Run the script
triggerRerankTopEngineeringPlus();

