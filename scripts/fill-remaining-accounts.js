#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fillRemainingAccounts() {
  try {
    console.log('🔍 Starting to fill remaining accounts for Dano...');
    await prisma.$connect();

    const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';
    const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
    const TARGET_ACCOUNT_COUNT = 150;

    // Check current count
    const currentCount = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });

    console.log(`📊 Current accounts assigned to Dano: ${currentCount}`);
    console.log(`🎯 Target count: ${TARGET_ACCOUNT_COUNT}`);

    if (currentCount >= TARGET_ACCOUNT_COUNT) {
      console.log('✅ Dano already has enough accounts!');
      return;
    }

    const accountsNeeded = TARGET_ACCOUNT_COUNT - currentCount;
    console.log(`🔧 Need to assign ${accountsNeeded} more accounts`);

    // Find unassigned accounts that could be assigned to Dano
    const unassignedAccounts = await prisma.accounts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: null,
        deletedAt: null
      },
      select: { 
        id: true, 
        name: true, 
        createdAt: true,
        _count: {
          select: { contacts: true }
        }
      },
      orderBy: { createdAt: 'desc' } // Newest first
    });

    console.log(`📊 Found ${unassignedAccounts.length} unassigned accounts`);

    // Sort by contact count (accounts with more contacts first)
    const sortedUnassigned = unassignedAccounts.sort((a, b) => 
      (b._count.contacts || 0) - (a._count.contacts || 0)
    );

    // Take the accounts with the most contacts
    const accountsToAssign = sortedUnassigned.slice(0, accountsNeeded);

    console.log(`\n🔍 Assigning ${accountsToAssign.length} accounts with most contacts:`);

    // Assign accounts to Dano
    for (const account of accountsToAssign) {
      await prisma.accounts.update({
        where: { id: account.id },
        data: { 
          assignedUserId: DANO_USER_ID,
          updatedAt: new Date()
        }
      });
      console.log(`   ✅ Assigned: ${account.name} (${account._count.contacts || 0} contacts)`);
    }

    // Verify final count
    const finalCount = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });

    console.log(`\n🎯 Account assignment completed!`);
    console.log(`📊 Final accounts assigned to Dano: ${finalCount}`);
    console.log(`🎯 Target achieved: ${finalCount === TARGET_ACCOUNT_COUNT ? 'YES' : 'NO'}`);

    if (finalCount === TARGET_ACCOUNT_COUNT) {
      console.log(`\n🎯 SUCCESS: Dano now has exactly ${TARGET_ACCOUNT_COUNT} accounts!`);
    } else {
      console.log(`\n⚠️  WARNING: Dano has ${finalCount} accounts (target: ${TARGET_ACCOUNT_COUNT})`);
    }

  } catch (error) {
    console.error('❌ Error filling remaining accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fillRemainingAccounts();
}
