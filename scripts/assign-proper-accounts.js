#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignProperAccounts() {
  try {
    console.log('🔍 Starting to assign proper accounts to Dano...');
    await prisma.$connect();

    const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';
    const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
    const TARGET_ACCOUNT_COUNT = 150;

    // Step 1: Unassign the 37 filler accounts (accounts with 0 contacts)
    console.log('🔄 Unassigning filler accounts with 0 contacts...');
    
    const fillerAccounts = await prisma.accounts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      },
      select: { 
        id: true, 
        name: true,
        _count: {
          select: { contacts: true }
        }
      }
    });

    const accountsToUnassign = fillerAccounts.filter(acc => acc._count.contacts === 0);
    console.log(`📊 Found ${accountsToUnassign.length} accounts with 0 contacts to unassign`);

    for (const account of accountsToUnassign) {
      await prisma.accounts.update({
        where: { id: account.id },
        data: { 
          assignedUserId: null,
          updatedAt: new Date()
        }
      });
      console.log(`   🗑️  Unassigned: ${account.name} (0 contacts)`);
    }

    // Step 2: Find Florida/Arizona title companies with contacts
    console.log('\n🔍 Finding Florida/Arizona title companies with contacts...');
    
    const flAzTitleCompanies = await prisma.accounts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: null,
        deletedAt: null,
        OR: [
          { name: { contains: 'Florida', mode: 'insensitive' } },
          { name: { contains: 'Arizona', mode: 'insensitive' } },
          { name: { contains: 'Title', mode: 'insensitive' } },
          { name: { contains: 'Escrow', mode: 'insensitive' } },
          { name: { contains: 'Closing', mode: 'insensitive' } }
        ]
      },
      select: { 
        id: true, 
        name: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Found ${flAzTitleCompanies.length} Florida/Arizona title companies`);

    // Step 3: Assign these companies to Dano (up to target count)
    const currentCount = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });

    const accountsNeeded = TARGET_ACCOUNT_COUNT - currentCount;
    console.log(`\n🎯 Need to assign ${accountsNeeded} more accounts to reach ${TARGET_ACCOUNT_COUNT}`);

    const companiesToAssign = flAzTitleCompanies.slice(0, accountsNeeded);
    
    console.log('\n✅ Assigning Florida/Arizona title companies to Dano:');
    for (const company of companiesToAssign) {
      await prisma.accounts.update({
        where: { id: company.id },
        data: { 
          assignedUserId: DANO_USER_ID,
          updatedAt: new Date()
        }
      });
      console.log(`   ✅ Assigned: ${company.name}`);
    }

    // Step 4: Verify final count
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
    console.error('❌ Error assigning proper accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  assignProperAccounts();
}
