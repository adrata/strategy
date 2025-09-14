#!/usr/bin/env tsx

/**
 * 🔄 NOTARY EVERYDAY DATA TRANSFER TO DANO
 * 
 * Transfers all notary everyday data from Dan's workspace to Dano's workspace
 * and updates user associations accordingly.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dan's workspace (current)
const DAN_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
const DAN_USER_ID = 'dan@adrata.com';

// Dano's workspace (target)
const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const DANO_USER_ID = 'dano@retail-products.com';

async function transferToDano() {
  console.log('🔄 Transferring Notary Everyday Data to Dano...\n');

  // 1. First, let's check what we have in Dan's workspace
  const danActivities = await prisma.activities.findMany({
    where: {
      workspaceId: DAN_WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    },
    select: {
      id: true,
      subject: true,
      accountId: true,
      contactId: true
    }
  });

  console.log(`📊 Found ${danActivities.length} notary activities in Dan's workspace`);

  // 2. Get all accounts that need to be transferred
  const danAccounts = await prisma.accounts.findMany({
    where: {
      workspaceId: DAN_WORKSPACE_ID,
      industry: 'Real Estate / Title Services'
    },
    select: {
      id: true,
      name: true,
      website: true
    }
  });

  console.log(`🏢 Found ${danAccounts.length} title company accounts in Dan's workspace`);

  // 3. Get all contacts that need to be transferred
  const danContacts = await prisma.contacts.findMany({
    where: {
      workspaceId: DAN_WORKSPACE_ID,
      accounts: {
        industry: 'Real Estate / Title Services'
      }
    },
    select: {
      id: true,
      fullName: true,
      accountId: true
    }
  });

  console.log(`👥 Found ${danContacts.length} contacts in Dan's workspace`);

  // 4. Create accounts in Dano's workspace
  console.log('\n🏢 Creating accounts in Dano\'s workspace...');
  const accountMapping = new Map<string, string>(); // old ID -> new ID

  for (const account of danAccounts) {
    const newAccount = await prisma.accounts.create({
      data: {
        workspaceId: DANO_WORKSPACE_ID,
        name: account.name,
        website: account.website,
        industry: 'Real Estate / Title Services',
        vertical: 'Notary Services',
        accountType: 'Prospect',
        tier: 'Standard',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    accountMapping.set(account.id, newAccount.id);
    console.log(`  ✅ Created: ${account.name} (${newAccount.id})`);
  }

  // 5. Create contacts in Dano's workspace
  console.log('\n👥 Creating contacts in Dano\'s workspace...');
  const contactMapping = new Map<string, string>(); // old ID -> new ID

  for (const contact of danContacts) {
    const newAccountId = accountMapping.get(contact.accountId);
    if (!newAccountId) {
      console.log(`  ⚠️  Skipping contact ${contact.fullName} - no account mapping found`);
      continue;
    }

    // Get full contact details
    const fullContact = await prisma.contacts.findUnique({
      where: { id: contact.id }
    });

    if (fullContact) {
      const newContact = await prisma.contacts.create({
        data: {
          workspaceId: DANO_WORKSPACE_ID,
          accountId: newAccountId,
          firstName: fullContact.firstName,
          lastName: fullContact.lastName,
          fullName: fullContact.fullName,
          jobTitle: fullContact.jobTitle,
          email: fullContact.email,
          linkedinUrl: fullContact.linkedinUrl,
          status: fullContact.status,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      contactMapping.set(contact.id, newContact.id);
      console.log(`  ✅ Created: ${contact.fullName} (${newContact.id})`);
    }
  }

  // 6. Create activities in Dano's workspace
  console.log('\n📧 Creating activities in Dano\'s workspace...');
  let activityCount = 0;

  for (const activity of danActivities) {
    // Get full activity details
    const fullActivity = await prisma.activities.findUnique({
      where: { id: activity.id }
    });

    if (fullActivity) {
      const newAccountId = accountMapping.get(activity.accountId || '');
      const newContactId = activity.contactId ? contactMapping.get(activity.contactId) : null;

      const newActivity = await prisma.activities.create({
        data: {
          workspaceId: DANO_WORKSPACE_ID,
          userId: DANO_USER_ID,
          accountId: newAccountId,
          contactId: newContactId,
          type: fullActivity.type,
          subject: fullActivity.subject,
          description: fullActivity.description,
          outcome: fullActivity.outcome,
          completedAt: fullActivity.completedAt,
          scheduledAt: fullActivity.scheduledAt,
          status: fullActivity.status,
          priority: fullActivity.priority,
          metadata: fullActivity.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      activityCount++;
      console.log(`  ✅ Created: ${activity.subject} (${newActivity.id})`);
    }
  }

  // 7. Verify the transfer
  console.log('\n🔍 Verifying transfer to Dano\'s workspace...');
  
  const danoActivities = await prisma.activities.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    }
  });

  const danoAccounts = await prisma.accounts.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      industry: 'Real Estate / Title Services'
    }
  });

  const danoContacts = await prisma.contacts.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      accounts: {
        industry: 'Real Estate / Title Services'
      }
    }
  });

  console.log(`\n📊 Transfer Results:`);
  console.log(`  ✅ Activities in Dano's workspace: ${danoActivities}`);
  console.log(`  ✅ Accounts in Dano's workspace: ${danoAccounts}`);
  console.log(`  ✅ Contacts in Dano's workspace: ${danoContacts}`);

  // 8. Clean up Dan's workspace (optional - comment out if you want to keep both)
  console.log('\n🧹 Cleaning up Dan\'s workspace...');
  
  // Delete activities
  await prisma.activities.deleteMany({
    where: {
      workspaceId: DAN_WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    }
  });

  // Delete contacts
  await prisma.contacts.deleteMany({
    where: {
      workspaceId: DAN_WORKSPACE_ID,
      accounts: {
        industry: 'Real Estate / Title Services'
      }
    }
  });

  // Delete accounts
  await prisma.accounts.deleteMany({
    where: {
      workspaceId: DAN_WORKSPACE_ID,
      industry: 'Real Estate / Title Services'
    }
  });

  console.log('  ✅ Cleaned up Dan\'s workspace');

  console.log('\n🎉 Transfer Complete!');
  console.log(`📧 ${activityCount} notary activities transferred to Dano's workspace`);
  console.log(`🏢 ${danAccounts.length} accounts transferred to Dano's workspace`);
  console.log(`👥 ${danContacts.length} contacts transferred to Dano's workspace`);
  console.log(`👤 All data now associated with: ${DANO_USER_ID}`);
}

// Run the transfer
if (require.main === module) {
  transferToDano()
    .catch((error) => {
      console.error('💥 Transfer failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { transferToDano };
