#!/usr/bin/env tsx

/**
 * 🔄 SYNC NOTARY ACTIVITIES TO EXISTING RECORDS
 * 
 * Ensures the 19 notary email activities are properly connected
 * to the existing leads, contacts, and accounts in Dano's workspace.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NOTARY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

async function syncNotaryActivitiesToRecords() {
  console.log('🔄 Syncing Notary Activities to Existing Records...\n');

  // Get the 19 notary activities I added
  const notaryActivities = await prisma.activities.findMany({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      type: { startsWith: 'notary_' }
    },
    select: {
      id: true,
      subject: true,
      accountId: true,
      contactId: true,
      description: true
    }
  });

  console.log(`📧 Found ${notaryActivities.length} notary activities to sync`);

  let syncedCount = 0;

  for (const activity of notaryActivities) {
    console.log(`\n🔄 Syncing: ${activity.subject}`);

    // Extract company name from subject
    const companyName = activity.subject.split(' - ')[1];
    if (!companyName) {
      console.log(`  ⚠️  Could not extract company name from: ${activity.subject}`);
      continue;
    }

    // Find matching account
    const matchingAccount = await prisma.accounts.findFirst({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        name: {
          contains: companyName,
          mode: 'insensitive'
        }
      },
      select: { id: true, name: true }
    });

    if (matchingAccount) {
      console.log(`  ✅ Found matching account: ${matchingAccount.name}`);

      // Update activity to link to the correct account
      await prisma.activities.update({
        where: { id: activity.id },
        data: { 
          accountId: matchingAccount.id,
          updatedAt: new Date()
        }
      });

      // Find matching contact if we have contact info in description
      const description = activity.description || '';
      const emailMatch = description.match(/Email: ([^\n]+)/);
      const nameMatch = description.match(/Contact: ([^\n]+)/);

      if (emailMatch || nameMatch) {
        const email = emailMatch ? emailMatch[1].trim() : null;
        const contactName = nameMatch ? nameMatch[1].trim() : null;

        let matchingContact = null;

        if (email) {
          matchingContact = await prisma.contacts.findFirst({
            where: {
              workspaceId: NOTARY_WORKSPACE_ID,
              assignedUserId: DANO_USER_ID,
              email: email
            },
            select: { id: true, fullName: true, email: true }
          });
        }

        if (!matchingContact && contactName) {
          matchingContact = await prisma.contacts.findFirst({
            where: {
              workspaceId: NOTARY_WORKSPACE_ID,
              assignedUserId: DANO_USER_ID,
              fullName: {
                contains: contactName,
                mode: 'insensitive'
              }
            },
            select: { id: true, fullName: true, email: true }
          });
        }

        if (matchingContact) {
          console.log(`  ✅ Found matching contact: ${matchingContact.fullName} (${matchingContact.email})`);

          // Update activity to link to the correct contact
          await prisma.activities.update({
            where: { id: activity.id },
            data: { 
              contactId: matchingContact.id,
              updatedAt: new Date()
            }
          });
        } else {
          console.log(`  ⚠️  No matching contact found for: ${contactName || email}`);
        }
      }

      syncedCount++;
    } else {
      console.log(`  ❌ No matching account found for: ${companyName}`);
    }
  }

  console.log(`\n🎉 Sync Complete!`);
  console.log(`  ✅ Synced ${syncedCount} out of ${notaryActivities.length} activities`);

  // Verify final status
  const finalActivities = await prisma.activities.findMany({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      type: { startsWith: 'notary_' }
    },
    select: {
      subject: true,
      accountId: true,
      contactId: true
    }
  });

  const withAccounts = finalActivities.filter(a => a.accountId).length;
  const withContacts = finalActivities.filter(a => a.contactId).length;

  console.log(`\n📊 Final Status:`);
  console.log(`  • Activities with accounts: ${withAccounts}/${finalActivities.length}`);
  console.log(`  • Activities with contacts: ${withContacts}/${finalActivities.length}`);

  // Show sample of synced activities
  console.log(`\n📋 Sample Synced Activities:`);
  const sampleActivities = finalActivities.slice(0, 5);
  sampleActivities.forEach(activity => {
    const hasAccount = activity.accountId ? '✅' : '❌';
    const hasContact = activity.contactId ? '✅' : '❌';
    console.log(`  • ${activity.subject} - Account: ${hasAccount}, Contact: ${hasContact}`);
  });
}

// Run the sync
if (require.main === module) {
  syncNotaryActivitiesToRecords()
    .catch((error) => {
      console.error('💥 Sync failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { syncNotaryActivitiesToRecords };
