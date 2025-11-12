#!/usr/bin/env node

/**
 * Manual Trigger Re-rank Script
 * 
 * Manually triggers speedrun re-ranking with the new filtering logic
 * (excludes people contacted today or yesterday)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get API URL from environment or use localhost for dev
const API_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
const USE_LOCAL = !process.env.NEXTAUTH_URL && !process.env.VERCEL_URL;

async function manualTriggerRerank() {
  console.log('🔄 Manual Trigger: Speedrun Re-ranking');
  console.log(`📍 API URL: ${API_URL}\n`);

  try {
    // Get the current user (you can modify this to get a specific user)
    // For now, let's get the first active user with a workspace
    const user = await prisma.users.findFirst({
      where: {
        email: {
          contains: '@'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!user) {
      throw new Error('No user found. Please specify a user email or ensure users exist in the database.');
    }

    // Get workspace ID from user's activeWorkspaceId or find their first workspace
    let workspaceId = user.activeWorkspaceId;
    
    if (!workspaceId) {
      // Try to find a workspace for this user
      const workspace = await prisma.workspaces.findFirst({
        where: {
          users: {
            some: {
              id: user.id
            }
          }
        }
      });
      workspaceId = workspace?.id;
    }
    
    const userId = user.id;

    if (!workspaceId) {
      throw new Error(`User ${user.email} has no active workspace.`);
    }

    console.log(`👤 User: ${user.email} (${user.name || 'No name'})`);
    console.log(`🏢 Workspace ID: ${workspaceId}`);
    console.log(`🆔 User ID: ${userId}\n`);

    // Check how many people will be affected
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const totalPeople = await prisma.people.count({
      where: {
        workspaceId,
        isActive: true,
        mainSellerId: userId,
        deletedAt: null
      }
    });

    const contactedTodayOrYesterday = await prisma.people.count({
      where: {
        workspaceId,
        isActive: true,
        mainSellerId: userId,
        deletedAt: null,
        lastActionDate: {
          gte: yesterday
        }
      }
    });

    const willBeRanked = await prisma.people.count({
      where: {
        workspaceId,
        isActive: true,
        mainSellerId: userId,
        deletedAt: null,
        OR: [
          { lastActionDate: null },
          { lastActionDate: { lt: yesterday } }
        ]
      }
    });

    console.log('📊 Pre-re-rank Statistics:');
    console.log(`   Total people: ${totalPeople}`);
    console.log(`   Contacted today/yesterday: ${contactedTodayOrYesterday}`);
    console.log(`   Will be ranked (excluding today/yesterday): ${willBeRanked}`);
    console.log(`   Will be excluded: ${totalPeople - willBeRanked}\n`);

    // Trigger re-ranking
    console.log('🔄 Triggering re-ranking...');
    
    const rerankUrl = `${API_URL}/api/v1/speedrun/re-rank`;
    const headers = {
      'Content-Type': 'application/json',
      'x-workspace-id': workspaceId,
      'x-user-id': userId
    };

    if (USE_LOCAL) {
      console.log('   ⚠️  Using local API - make sure dev server is running!\n');
    }

    const response = await fetch(rerankUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        completedCount: 0,
        trigger: 'manual-trigger',
        timestamp: new Date().toISOString(),
        isDailyReset: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Re-ranking failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Re-ranking failed: ${result.error || 'Unknown error'}`);
    }

    console.log('✅ Re-ranking completed successfully!');
    console.log(`   Batch number: ${result.data?.batchNumber || 'N/A'}`);
    console.log(`   Records in batch: ${result.data?.newBatch?.length || 'N/A'}\n`);

    // Verify the results
    console.log('🔍 Verifying results...');
    
    const verifyResponse = await fetch(`${API_URL}/api/v1/speedrun?limit=10`, {
      headers: USE_LOCAL ? {} : {
        'Cookie': process.env.AUTH_COOKIE || ''
      }
    });

    if (verifyResponse.ok) {
      const verifyResult = await verifyResponse.json();
      if (verifyResult.success && verifyResult.data && verifyResult.data.length > 0) {
        console.log('\n📋 Top 10 Speedrun Records:');
        verifyResult.data.slice(0, 10).forEach((record, index) => {
          const lastAction = record.lastActionDate 
            ? new Date(record.lastActionDate).toLocaleDateString()
            : 'Never';
          console.log(`   ${index + 1}. Rank ${record.rank || record.displayRank}: ${record.name}`);
          console.log(`      Last action: ${lastAction}`);
          console.log(`      Company: ${record.company?.name || 'N/A'}\n`);
        });
      }
    }

    console.log('\n🎉 Re-ranking complete!');
    console.log('💡 The new filter is now active - people contacted today/yesterday are excluded.');
    console.log('💡 Refresh your speedrun page to see the updated rankings.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('  1. Make sure the API server is running (if using localhost)');
    console.error('  2. Verify workspace and user IDs are correct');
    console.error('  3. Check API logs for more details');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Allow specifying user email as argument
const userEmail = process.argv[2];

if (userEmail) {
  console.log(`🎯 Targeting user: ${userEmail}\n`);
  // Modify the query to use the specified email
  manualTriggerRerank().then(() => {
    // Override user lookup
    prisma.users.findFirst({
      where: { email: userEmail }
    }).then(user => {
      if (!user) {
        console.error(`❌ User with email ${userEmail} not found`);
        process.exit(1);
      }
      // Continue with that user...
    });
  });
} else {
  manualTriggerRerank();
}

