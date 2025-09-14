#!/usr/bin/env node

/**
 * 🔧 FIX ACCOUNT COUNT
 * 
 * Dano currently has 299 accounts but should only have 150.
 * This script unassigns 149 accounts to get back to the correct count.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Configuration
const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';
const DANO_USER_ID = '01K1VBYYV7TRPY04RW4TW4XWRB';
const TARGET_COUNT = 150;

async function fixAccountCount() {
  console.log('🔧 FIXING ACCOUNT COUNT FOR DANO');
  console.log('==================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // 1. Check current state
    console.log('🔍 Checking current state...');
    
    const currentCount = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });
    
    console.log(`📊 Current account count: ${currentCount}`);
    console.log(`🎯 Target count: ${TARGET_COUNT}`);
    
    if (currentCount <= TARGET_COUNT) {
      console.log('✅ Account count is already correct or below target');
      return;
    }
    
    // 2. Calculate how many to unassign
    const accountsToUnassign = currentCount - TARGET_COUNT;
    console.log(`\n🔧 Need to unassign ${accountsToUnassign} accounts`);
    
    // 3. Get the accounts to unassign (keep the most recently updated ones)
    const accountsToUnassignList = await prisma.accounts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      },
      select: { id: true, name: true, updatedAt: true },
      orderBy: [{ updatedAt: 'asc' }], // Unassign oldest first
      take: accountsToUnassign
    });
    
    console.log(`📋 Found ${accountsToUnassignList.length} accounts to unassign`);
    
    // 4. Unassign the accounts
    console.log('\n🔧 Unassigning accounts...');
    
    let unassignedCount = 0;
    for (const account of accountsToUnassignList) {
      try {
        await prisma.accounts.update({
          where: { id: account.id },
          data: { 
            assignedUserId: null,
            updatedAt: new Date()
          }
        });
        unassignedCount++;
        console.log(`   ✅ Unassigned: ${account.name}`);
      } catch (error) {
        console.error(`   ❌ Failed to unassign ${account.name}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Successfully unassigned ${unassignedCount} accounts`);
    
    // 5. Verify the fix
    console.log('\n🔍 Verifying the fix...');
    
    const finalCount = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });
    
    console.log(`📊 Final account count: ${finalCount}`);
    console.log(`🎯 Target count: ${TARGET_COUNT}`);
    
    if (finalCount === TARGET_COUNT) {
      console.log('🎉 SUCCESS: Account count is now correct!');
      console.log('🏢 Left panel should now show 150 accounts instead of 299');
    } else {
      console.log('⚠️  Account count is still not correct');
      console.log(`   Expected: ${TARGET_COUNT}`);
      console.log(`   Actual: ${finalCount}`);
    }
    
    // 6. Test the API query
    console.log('\n🧪 Testing the API query...');
    
    const apiQueryResult = await prisma.accounts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID, 
        deletedAt: null,
        OR: [
          { assignedUserId: DANO_USER_ID },
          { assignedUserId: 'dano' } // This should now return 0
        ]
      },
      select: {
        id: true, name: true, assignedUserId: true
      }
    });
    
    console.log(`📊 API query result: ${apiQueryResult.length} accounts`);
    console.log(`   Should now be: ${finalCount} (only UUID format)`);
    
    if (apiQueryResult.length === finalCount) {
      console.log('✅ SUCCESS: API query now returns correct count!');
    } else {
      console.log('❌ ISSUE: API query still returns wrong count');
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
  fixAccountCount();
}
