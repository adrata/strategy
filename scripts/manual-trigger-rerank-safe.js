#!/usr/bin/env node

/**
 * Safe Manual Trigger Re-rank Script
 * 
 * Manually triggers speedrun re-ranking with proper error handling
 * and authentication to avoid connection errors.
 * 
 * Usage:
 *   node scripts/manual-trigger-rerank-safe.js [user-email]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get API URL from environment or use localhost for dev
const API_URL = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
const USE_LOCAL = !process.env.NEXTAUTH_URL && !process.env.VERCEL_URL;

async function manualTriggerRerankSafe() {
  console.log('🔄 Safe Manual Trigger: Speedrun Re-ranking');
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`🔧 Mode: ${USE_LOCAL ? 'Local Development' : 'Production'}\n`);

  try {
    // Get user email from command line or use first active user
    const userEmail = process.argv[2];
    
    let user;
    if (userEmail) {
      console.log(`🎯 Looking for user: ${userEmail}`);
      user = await prisma.users.findFirst({
        where: {
          email: userEmail
        }
      });
      
      if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
      }
    } else {
      console.log('🔍 Finding first active user...');
      user = await prisma.users.findFirst({
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
        throw new Error('No user found. Please specify a user email: node scripts/manual-trigger-rerank-safe.js user@example.com');
      }
    }

    // Get workspace ID from user's activeWorkspaceId or find their first workspace
    let workspaceId = user.activeWorkspaceId;
    
    if (!workspaceId) {
      console.log('🔍 Finding workspace for user...');
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

    console.log(`✅ Found user: ${user.email} (${user.name || 'No name'})`);
    console.log(`✅ Workspace ID: ${workspaceId}`);
    console.log(`✅ User ID: ${userId}\n`);

    // Check how many people will be affected by the filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const [totalPeople, excludedPeople] = await Promise.all([
      prisma.people.count({
        where: {
          workspaceId,
          isActive: true,
          mainSellerId: userId,
          deletedAt: null
        }
      }),
      prisma.people.count({
        where: {
          workspaceId,
          isActive: true,
          mainSellerId: userId,
          deletedAt: null,
          lastActionDate: {
            gte: yesterday // Contacted yesterday or today
          }
        }
      })
    ]);

    console.log('📊 Pre-ranking Statistics:');
    console.log(`   Total people: ${totalPeople}`);
    console.log(`   Will be excluded (contacted yesterday/today): ${excludedPeople}`);
    console.log(`   Will be ranked: ${totalPeople - excludedPeople}\n`);

    // Trigger re-ranking with proper headers and error handling
    console.log('🔄 Triggering re-ranking...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
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
          trigger: 'manual-safe-trigger',
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

      // Verify the results
      console.log('🔍 Verifying results...');
      
      const verifyController = new AbortController();
      const verifyTimeout = setTimeout(() => verifyController.abort(), 10000); // 10 second timeout
      
      try {
        const verifyResponse = await fetch(`${API_URL}/api/v1/speedrun?limit=10`, {
          headers: USE_LOCAL ? {} : {
            'Cookie': process.env.AUTH_COOKIE || ''
          },
          signal: verifyController.signal
        });

        clearTimeout(verifyTimeout);

        if (verifyResponse.ok) {
          const verifyResult = await verifyResponse.json();
          if (verifyResult.success && verifyResult.data && verifyResult.data.length > 0) {
            console.log('\n📋 Top 10 Speedrun Records:');
            verifyResult.data.slice(0, 10).forEach((record, index) => {
              const lastAction = record.lastActionDate 
                ? new Date(record.lastActionDate).toLocaleDateString()
                : 'Never';
              const daysAgo = record.lastActionDate 
                ? Math.floor((now - new Date(record.lastActionDate)) / (1000 * 60 * 60 * 24))
                : 'N/A';
              
              console.log(`   ${index + 1}. Rank ${record.rank || record.displayRank}: ${record.name}`);
              console.log(`      Last action: ${lastAction} (${daysAgo} days ago)`);
              console.log(`      Company: ${record.company?.name || 'N/A'}\n`);
            });
            
            // Check if anyone contacted yesterday/today is in the list
            const recentlyContacted = verifyResult.data.filter(r => {
              if (!r.lastActionDate) return false;
              const actionDate = new Date(r.lastActionDate);
              return actionDate >= yesterday;
            });
            
            if (recentlyContacted.length > 0) {
              console.log(`⚠️  Warning: ${recentlyContacted.length} recently contacted people still in top 10`);
              console.log('   This might indicate the filter needs more time to propagate.\n');
            } else {
              console.log('✅ Filter working correctly - no recently contacted people in top 10!\n');
            }
          }
        } else {
          console.log('⚠️  Could not verify results (this is okay if you\'re not authenticated)\n');
        }
      } catch (verifyError) {
        if (verifyError.name === 'AbortError') {
          console.log('⚠️  Verification timed out (this is okay)\n');
        } else {
          console.log(`⚠️  Verification failed: ${verifyError.message}\n`);
        }
      }

      console.log('🎉 Re-ranking complete!');
      console.log('💡 The new filter is now active - people contacted today/yesterday are excluded.');
      console.log('💡 Refresh your speedrun page to see the updated rankings.\n');

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds. Check your connection and try again.');
      } else if (fetchError.message.includes('ECONNREFUSED') || fetchError.message.includes('ENOTFOUND')) {
        throw new Error(`Connection failed. Check your internet/VPN and that ${API_URL} is accessible.`);
      } else {
        throw fetchError;
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('  1. Check that the API URL is accessible:', API_URL);
    console.error('  2. Verify you have the correct database connection');
    console.error('  3. Ensure the user has an active workspace');
    console.error('  4. Check your internet/VPN connection');
    console.error('  5. Try running: node scripts/manual-trigger-rerank-safe.js your-email@example.com\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
manualTriggerRerankSafe();

