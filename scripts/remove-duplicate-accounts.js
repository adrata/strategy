#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicateAccounts() {
  try {
    console.log('🔍 Starting duplicate account removal...');
    await prisma.$connect();

    const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';

    // Get all accounts for the workspace
    const allAccounts = await prisma.accounts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      },
      select: { 
        id: true, 
        name: true, 
        assignedUserId: true, 
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' } // Oldest first
    });

    console.log(`📊 Total accounts in workspace: ${allAccounts.length}`);

    // Group accounts by name
    const accountsByName = {};
    allAccounts.forEach(acc => {
      if (!accountsByName[acc.name]) {
        accountsByName[acc.name] = [];
      }
      accountsByName[acc.name].push(acc);
    });

    // Find duplicates
    const duplicates = Object.entries(accountsByName).filter(([name, accounts]) => accounts.length > 1);
    console.log(`🔍 Found ${duplicates.length} duplicate account names`);

    let totalRemoved = 0;
    let totalKept = 0;

    // Process each duplicate group
    for (const [name, accounts] of duplicates) {
      console.log(`\n🔍 Processing: ${name} (${accounts.length} copies)`);
      
      // Sort by creation date, newest first
      const sortedAccounts = accounts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Keep the newest one, remove the rest
      const toKeep = sortedAccounts[0];
      const toRemove = sortedAccounts.slice(1);
      
      console.log(`   ✅ Keeping: ${toKeep.id} (created: ${toKeep.createdAt.toISOString()})`);
      console.log(`   🗑️  Removing: ${toRemove.length} duplicates`);
      
      // Remove duplicates
      for (const account of toRemove) {
        await prisma.accounts.update({
          where: { id: account.id },
          data: { 
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });
        totalRemoved++;
      }
      
      totalKept++;
    }

    // Verify final counts
    const finalAccounts = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });

    const finalDanoAccounts = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: '01K1VBYYV7TRPY04NW4TW4XWRB',
        deletedAt: null
      }
    });

    console.log(`\n✅ Duplicate removal completed!`);
    console.log(`📊 Accounts removed: ${totalRemoved}`);
    console.log(`📊 Accounts kept: ${totalKept}`);
    console.log(`📊 Final total accounts: ${finalAccounts}`);
    console.log(`📊 Final Dano accounts: ${finalDanoAccounts}`);

    if (finalDanoAccounts <= 150) {
      console.log(`\n🎯 SUCCESS: Dano now has ${finalDanoAccounts} accounts (target: ≤150)`);
    } else {
      console.log(`\n⚠️  WARNING: Dano still has ${finalDanoAccounts} accounts (target: ≤150)`);
    }

  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  removeDuplicateAccounts();
}
