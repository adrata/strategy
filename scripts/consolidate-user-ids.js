#!/usr/bin/env node

/**
 * 🔧 CONSOLIDATE USER ID FORMATS
 * 
 * Fixes the duplicate user ID issue where accounts have both:
 * - 'dano' (string format) - 149 accounts
 * - '01K1VBYYV7TRPY04NW4TW4XWRB' (UUID format) - 150 accounts
 * 
 * This consolidates everything to use the UUID format for a total of 150 accounts.
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
const CORRECT_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
const OLD_USER_ID = 'dano';

async function consolidateUserIds() {
  console.log('🔧 CONSOLIDATING USER ID FORMATS');
  console.log('==================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // 1. Check current state
    console.log('🔍 Checking current state...');
    
    const accountsWithStringId = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: OLD_USER_ID,
        deletedAt: null
      }
    });
    
    const accountsWithUUIDId = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: CORRECT_USER_ID,
        deletedAt: null
      }
    });
    
    console.log(`📊 Current account assignments:`);
    console.log(`   String ID (${OLD_USER_ID}): ${accountsWithStringId}`);
    console.log(`   UUID ID (${CORRECT_USER_ID}): ${accountsWithUUIDId}`);
    console.log(`   Total: ${accountsWithStringId + accountsWithUUIDId}`);
    
    // 2. Update all accounts with string user ID to use UUID
    console.log('\n🔧 Updating accounts with string user ID...');
    
    if (accountsWithStringId > 0) {
      const updateResult = await prisma.accounts.updateMany({
        where: { 
          workspaceId: NOTARY_WORKSPACE_ID,
          assignedUserId: OLD_USER_ID,
          deletedAt: null
        },
        data: { 
          assignedUserId: CORRECT_USER_ID,
          updatedAt: new Date()
        }
      });
      
      console.log(`   ✅ Updated ${updateResult.count} accounts from '${OLD_USER_ID}' to '${CORRECT_USER_ID}'`);
    } else {
      console.log(`   ✅ No accounts found with string user ID '${OLD_USER_ID}'`);
    }
    
    // 3. Verify the fix
    console.log('\n🔍 Verifying the fix...');
    
    const finalAccountsWithUUIDId = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: CORRECT_USER_ID,
        deletedAt: null
      }
    });
    
    const finalAccountsWithStringId = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: OLD_USER_ID,
        deletedAt: null
      }
    });
    
    console.log(`📊 Final account assignments:`);
    console.log(`   String ID (${OLD_USER_ID}): ${finalAccountsWithStringId}`);
    console.log(`   UUID ID (${CORRECT_USER_ID}): ${finalAccountsWithUUIDId}`);
    console.log(`   Total: ${finalAccountsWithStringId + finalAccountsWithUUIDId}`);
    
    // 4. Test the exact query that the API uses
    console.log('\n🧪 Testing the exact API query...');
    
    const apiQueryResult = await prisma.accounts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID, 
        deletedAt: null,
        OR: [
          { assignedUserId: CORRECT_USER_ID },
          { assignedUserId: OLD_USER_ID }
        ]
      },
      select: {
        id: true, name: true, assignedUserId: true
      }
    });
    
    console.log(`📊 API query result:`);
    console.log(`   Total accounts: ${apiQueryResult.length}`);
    console.log(`   Should now be: ${finalAccountsWithUUIDId} (only UUID format)`);
    
    if (apiQueryResult.length === finalAccountsWithUUIDId) {
      console.log('✅ SUCCESS: API query now returns correct count!');
    } else {
      console.log('❌ ISSUE: API query still returns wrong count');
    }
    
    // 5. Final report
    console.log('\n' + '='.repeat(60));
    console.log('📊 USER ID CONSOLIDATION COMPLETE');
    console.log('='.repeat(60));
    
    if (finalAccountsWithStringId === 0 && finalAccountsWithUUIDId === 150) {
      console.log('🎉 SUCCESS: All accounts now use UUID format');
      console.log(`🎯 Dano now has exactly ${finalAccountsWithUUIDId} accounts`);
      console.log('🏢 Left panel should now show 150 accounts instead of 299');
    } else {
      console.log('⚠️  Some issues may remain');
      console.log(`   Expected: 150 accounts with UUID format`);
      console.log(`   Actual: ${finalAccountsWithUUIDId} accounts with UUID format`);
      console.log(`   Remaining string format: ${finalAccountsWithStringId}`);
    }
    
  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the consolidation
if (import.meta.url === `file://${process.argv[1]}`) {
  consolidateUserIds();
}
