#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function alignAccountsWithContacts() {
  try {
    console.log('🔍 Starting account-contact alignment for Dano...');
    await prisma.$connect();

    const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';
    const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
    const TARGET_ACCOUNT_COUNT = 150;

    // Step 1: Get all contacts assigned to Dano
    const danoContacts = await prisma.contacts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      },
      select: { 
        id: true, 
        fullName: true, 
        accountId: true,
        accounts: { 
          select: { 
            id: true, 
            name: true, 
            assignedUserId: true 
          } 
        }
      }
    });

    console.log(`📊 Dano has ${danoContacts.length} contacts`);

    // Step 2: Identify accounts that have contacts assigned to Dano
    const accountsWithDanoContacts = new Map();
    
    danoContacts.forEach(contact => {
      if (contact.accountId && contact.accounts) {
        const accountId = contact.accountId;
        if (!accountsWithDanoContacts.has(accountId)) {
          accountsWithDanoContacts.set(accountId, {
            id: accountId,
            name: contact.accounts.name,
            contactCount: 0,
            contacts: []
          });
        }
        const account = accountsWithDanoContacts.get(accountId);
        account.contactCount++;
        account.contacts.push(contact.fullName);
      }
    });

    console.log(`📊 Found ${accountsWithDanoContacts.size} accounts with Dano's contacts`);

    // Step 3: Sort accounts by contact count (most contacts first)
    const sortedAccounts = Array.from(accountsWithDanoContacts.values())
      .sort((a, b) => b.contactCount - a.contactCount);

    // Step 4: Take top 150 accounts (or all if less than 150)
    const targetAccounts = sortedAccounts.slice(0, TARGET_ACCOUNT_COUNT);
    console.log(`🎯 Will assign ${targetAccounts.length} accounts to Dano`);

    // Step 5: Show top accounts with most contacts
    console.log('\n🔍 Top accounts with most Dano contacts:');
    targetAccounts.slice(0, 10).forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.name} (${account.contactCount} contacts)`);
    });

    // Step 6: Unassign all current accounts from Dano
    console.log('\n🔄 Unassigning all current accounts from Dano...');
    await prisma.accounts.updateMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      },
      data: { 
        assignedUserId: null,
        updatedAt: new Date()
      }
    });

    // Step 7: Assign target accounts to Dano
    console.log('\n✅ Assigning target accounts to Dano...');
    for (const account of targetAccounts) {
      await prisma.accounts.update({
        where: { id: account.id },
        data: { 
          assignedUserId: DANO_USER_ID,
          updatedAt: new Date()
        }
      });
      console.log(`   ✅ Assigned: ${account.name} (${account.contactCount} contacts)`);
    }

    // Step 8: Verify final counts
    const finalAccountCount = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });

    const finalContactCount = await prisma.contacts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });

    console.log(`\n🎯 Alignment completed!`);
    console.log(`📊 Final accounts assigned to Dano: ${finalAccountCount}`);
    console.log(`📊 Final contacts assigned to Dano: ${finalContactCount}`);
    console.log(`🎯 Target achieved: ${finalAccountCount === TARGET_ACCOUNT_COUNT ? 'YES' : 'NO'}`);

    if (finalAccountCount === TARGET_ACCOUNT_COUNT) {
      console.log(`\n🎯 SUCCESS: Dano now has exactly ${TARGET_ACCOUNT_COUNT} accounts with his contacts!`);
    } else {
      console.log(`\n⚠️  WARNING: Dano has ${finalAccountCount} accounts (target: ${TARGET_ACCOUNT_COUNT})`);
    }

  } catch (error) {
    console.error('❌ Error aligning accounts with contacts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  alignAccountsWithContacts();
}
