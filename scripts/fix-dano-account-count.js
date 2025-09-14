#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDanoAccountCount() {
  try {
    console.log('🔍 Starting Dano account count fix...');
    await prisma.$connect();

    const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';
    const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
    const TARGET_COUNT = 150;

    // Get current count
    const currentCount = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });

    console.log(`📊 Current accounts assigned to Dano: ${currentCount}`);
    console.log(`🎯 Target count: ${TARGET_COUNT}`);

    if (currentCount <= TARGET_COUNT) {
      console.log('✅ Dano already has the correct number of accounts!');
      return;
    }

    const accountsToUnassign = currentCount - TARGET_COUNT;
    console.log(`🔧 Need to unassign ${accountsToUnassign} accounts`);

    // Get Dano's accounts, ordered by creation date (oldest first)
    const danoAccounts = await prisma.accounts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'asc' } // Oldest first
    });

    console.log(`\n🔍 Unassigning ${accountsToUnassign} oldest accounts from Dano:`);

    // Unassign the oldest accounts
    for (let i = 0; i < accountsToUnassign; i++) {
      const account = danoAccounts[i];
      console.log(`   🗑️  Unassigning: ${account.name} (created: ${account.createdAt.toISOString()})`);
      
      await prisma.accounts.update({
        where: { id: account.id },
        data: { 
          assignedUserId: null,
          updatedAt: new Date()
        }
      });
    }

    // Verify final count
    const finalCount = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });

    console.log(`\n✅ Account count fix completed!`);
    console.log(`📊 Final accounts assigned to Dano: ${finalCount}`);
    console.log(`🎯 Target achieved: ${finalCount === TARGET_COUNT ? 'YES' : 'NO'}`);

    if (finalCount === TARGET_COUNT) {
      console.log(`\n🎯 SUCCESS: Dano now has exactly ${TARGET_COUNT} accounts!`);
    } else {
      console.log(`\n⚠️  WARNING: Dano has ${finalCount} accounts (target: ${TARGET_COUNT})`);
    }

  } catch (error) {
    console.error('❌ Error fixing account count:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDanoAccountCount();
}
