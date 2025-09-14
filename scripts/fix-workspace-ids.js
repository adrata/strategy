#!/usr/bin/env node

/**
 * 🔧 FIX WORKSPACE IDS
 * 
 * Fixes NULL workspaceId values in the accounts table
 * This is needed because the Prisma schema requires workspaceId but the database has NULL values
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Known workspace IDs
const WORKSPACE_IDS = {
  'Retail Product Solutions': '01K1VBYV8ETM2RCQA4GNN9EG72',
  'Notary Everyday': 'cmezxb1ez0001pc94yry3ntjk'
};

async function fixWorkspaceIds() {
  console.log('🔧 FIXING WORKSPACE IDS');
  console.log('========================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Check current state
    const accountsWithNullWorkspace = await prisma.accounts.findMany({
      where: { workspaceId: null },
      select: { id: true, name: true, assignedUserId: true }
    });
    
    console.log(`📊 Found ${accountsWithNullWorkspace.length} accounts with NULL workspaceId`);
    
    if (accountsWithNullWorkspace.length === 0) {
      console.log('✅ No accounts with NULL workspaceId found');
      return;
    }
    
    // Group accounts by assigned user to determine workspace
    const accountsByUser = {};
    accountsWithNullWorkspace.forEach(account => {
      const userId = account.assignedUserId || 'unassigned';
      if (!accountsByUser[userId]) {
        accountsByUser[userId] = [];
      }
      accountsByUser[userId].push(account);
    });
    
    console.log('\n📋 Accounts by user:');
    Object.entries(accountsByUser).forEach(([userId, accounts]) => {
      console.log(`   ${userId}: ${accounts.length} accounts`);
    });
    
    // Fix workspace IDs based on assigned user
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const [userId, accounts] of Object.entries(accountsByUser)) {
      let workspaceId;
      
      // Determine workspace based on user
      if (userId === '01K1VBYYV7TRPY04NW4TW4XWRB') {
        // Dano - check if this is Retail Product Solutions or Notary Everyday
        // For now, assign to Retail Product Solutions (the working one)
        workspaceId = WORKSPACE_IDS['Retail Product Solutions'];
        console.log(`\n🎯 Fixing ${accounts.length} accounts for Dano (${userId}) -> ${workspaceId}`);
      } else if (userId === 'dano') {
        // Dano (string format) - assign to Notary Everyday
        workspaceId = WORKSPACE_IDS['Notary Everyday'];
        console.log(`\n🎯 Fixing ${accounts.length} accounts for dano (${userId}) -> ${workspaceId}`);
      } else {
        // Unassigned or other users - assign to Retail Product Solutions as default
        workspaceId = WORKSPACE_IDS['Retail Product Solutions'];
        console.log(`\n🎯 Fixing ${accounts.length} accounts for ${userId} -> ${workspaceId} (default)`);
      }
      
      // Update accounts in batches
      const batchSize = 50;
      for (let i = 0; i < accounts.length; i += batchSize) {
        const batch = accounts.slice(i, i + batchSize);
        
        try {
          const result = await prisma.accounts.updateMany({
            where: {
              id: { in: batch.map(a => a.id) }
            },
            data: {
              workspaceId: workspaceId
            }
          });
          
          fixedCount += result.count;
          console.log(`   ✅ Updated batch ${Math.floor(i/batchSize) + 1}: ${result.count} accounts`);
          
        } catch (error) {
          errorCount += batch.length;
          console.error(`   ❌ Error updating batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FIX COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully fixed: ${fixedCount} accounts`);
    console.log(`❌ Errors: ${errorCount} accounts`);
    
    // Verify the fix
    const remainingNullWorkspace = await prisma.accounts.findMany({
      where: { workspaceId: null },
      select: { id: true, name: true }
    });
    
    console.log(`\n🔍 Verification: ${remainingNullWorkspace.length} accounts still have NULL workspaceId`);
    
    if (remainingNullWorkspace.length > 0) {
      console.log('⚠️ Some accounts still have NULL workspaceId. Manual review may be needed.');
    } else {
      console.log('✅ All accounts now have proper workspaceId values!');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (import.meta.url === `file://${process.argv[1]}`) {
  fixWorkspaceIds();
}
